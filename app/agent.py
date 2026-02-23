
import time
import operator
import json
import logging
from typing import TypedDict, Annotated, List, Literal, Union, Optional, Dict
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from system_prompt import get_compiled_prompt
from optimization_engine import optimizer
from database_service import db_service
from mcp_service import mcp_manager

# Definição do Estado do Agente
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    context_rag: str
    user_info: dict
    proactive_suggestion: str
    is_human_managed: bool
    thread_id: str

class LangGraphAgent:
    def __init__(self, model_name="gemini-3-flash-preview"):
        self.model = ChatGoogleGenerativeAI(model=model_name)
        
        # 1. Ferramentas estáticas iniciais
        import rag_tool
        self.base_tools = rag_tool.tools
        
        # O workflow é construído de forma que as ferramentas possam ser consultadas dinamicamente
        self.workflow = self._build_graph()

    async def _get_all_tools(self) -> List:
        """Agrega ferramentas base e ferramentas dinâmicas via MCP."""
        mcp_caps = await mcp_manager.get_all_capabilities()
        mcp_tools_defs = mcp_caps.get("tools", [])
        
        dynamic_tools = []
        for t_def in mcp_tools_defs:
            # Wrapper para transformar a definição MCP em uma ferramenta LangChain
            async def run_mcp_tool(arguments: Dict = None, tool_full_name=t_def["name"]):
                server_name, original_tool_name = tool_full_name.split("_", 1)
                return await mcp_manager.call_tool(server_name, original_tool_name, arguments or {})

            mcp_tool = tool(run_mcp_tool, name=t_def["name"])
            mcp_tool.description = t_def.get("description", "Ferramenta externa via MCP.")
            dynamic_tools.append(mcp_tool)
            
        return self.base_tools + dynamic_tools

    async def _retrieve_context(self, state: AgentState):
        last_user_message = next((m.content for m in reversed(state['messages']) if isinstance(m, HumanMessage)), None)
        context = "Nenhuma informação específica encontrada."
        if last_user_message:
            search_results = await db_service.search_rag(last_user_message, limit=3)
            if search_results:
                context = "\n".join(search_results)
        return {"context_rag": context}

    async def _call_model(self, state: AgentState):
        """Invocação do modelo com binding dinâmico de ferramentas."""
        if state.get('is_human_managed', False):
            return {"messages": [AIMessage(content="[CONTROLE HUMANO ATIVO]")]}

        # Carregar configuração ativa do LLM
        try:
            config = await db_service.get_active_llm_config()
            if config:
                provider = config['provider'].lower()
                model_name = config['model']
                api_key = config['apiKey']
                
                if provider == 'gemini':
                    self.model = ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key)
                elif provider == 'openai':
                    from langchain_openai import ChatOpenAI
                    self.model = ChatOpenAI(model=model_name, api_key=api_key)
                elif provider == 'groq':
                    from langchain_groq import ChatGroq
                    self.model = ChatGroq(model=model_name, api_key=api_key)
        except Exception as e:
            print(f"Error loading LLM config: {e}. Using default.")

        # Buscamos as ferramentas no momento da chamada para garantir atualização do MCP
        current_tools = await self._get_all_tools()
        model_with_tools = self.model.bind_tools(current_tools)

        messages = state['messages']
        if not any(isinstance(m, SystemMessage) for m in messages):
            user_name = state.get('user_info', {}).get('user_name', 'Cliente')
            lessons = await optimizer.get_active_lessons()
            system_content = get_compiled_prompt(
                context=state.get('context_rag', 'Nenhum contexto adicional.'),
                history="",
                lessons=lessons,
                user_name=user_name
            )
            messages = [SystemMessage(content=system_content)] + messages

        response = model_with_tools.invoke(messages)
        return {"messages": [response]}

    def _should_continue(self, state: AgentState) -> Literal["tools", END]:
        if state.get('is_human_managed', False):
            return END
        last_message = state['messages'][-1]
        if last_message.tool_calls:
            return "tools"
        return END

    async def _execute_tool(self, state: AgentState):
        """Executa ferramentas dinamicamente baseadas na chamada do modelo."""
        last_message = state['messages'][-1]
        if not isinstance(last_message, AIMessage) or not last_message.tool_calls:
            return {"messages": []}

        tool_calls = last_message.tool_calls
        results = []
        
        # 1. Obter todas as ferramentas disponíveis (estáticas + dinâmicas)
        all_tools = await self._get_all_tools()
        tool_map = {t.name: t for t in all_tools}

        for tool_call in tool_calls:
            tool_name = tool_call['name']
            tool_args = tool_call['args']
            tool_id = tool_call['id']
            
            if tool_name in tool_map:
                try:
                    tool_instance = tool_map[tool_name]
                    # Executa a ferramenta (pode ser síncrona ou assíncrona)
                    if hasattr(tool_instance, "ainvoke"):
                        output = await tool_instance.ainvoke(tool_args)
                    else:
                        output = tool_instance.invoke(tool_args)
                except Exception as e:
                    output = f"Erro ao executar ferramenta {tool_name}: {str(e)}"
            else:
                output = f"Ferramenta {tool_name} não encontrada."

            results.append(ToolMessage(content=str(output), tool_call_id=tool_id, name=tool_name))

        return {"messages": results}

    def _build_graph(self):
        graph = StateGraph(AgentState)
        
        graph.add_node("retrieve", self._retrieve_context)
        graph.add_node("agent", self._call_model)
        graph.add_node("tools", self._execute_tool)
        
        graph.set_entry_point("retrieve")
        graph.add_edge("retrieve", "agent")
        graph.add_conditional_edges("agent", self._should_continue, {"tools": "tools", END: END})
        graph.add_edge("tools", "agent")
        
        return graph.compile()

class SupervisorAgent:
    """
    Agente supervisor que analisa a intenção do usuário
    e delega para o especialista mais adequado.
    """
    
    async def route(self, message: str, specialists: list) -> str:
        """
        Usa Gemini para classificar a intenção e retornar o ID do especialista.
        Retorna o specialist_id mais adequado para a mensagem.
        """
        specialists_desc = "\n".join([f"- {s['id']}: {s['name']} — {s['description']}" for s in specialists])
        prompt = f"""Você é um supervisor de atendimento de pizzaria. 
Analise a mensagem do cliente e escolha o especialista mais adequado.

ESPECIALISTAS DISPONÍVEIS:
{specialists_desc}

MENSAGEM DO CLIENTE: {message}

Responda APENAS com o ID do especialista (ex: a1). Sem explicações."""
        
        try:
            from google import genai
            import os
            client = genai.Client(api_key=os.environ.get("API_KEY"))
            response = client.models.generate_content(model='gemini-2.0-flash', contents=prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Supervisor routing error: {e}")
            return specialists[0]['id'] if specialists else "default"
    
    async def execute(self, message: str, conversation_id: str) -> str:
        """
        Orquestra o fluxo completo.
        """
        # Implementação futura
        return "Supervisor execution placeholder"

agent_executor = LangGraphAgent().workflow
supervisor = SupervisorAgent()
