
from typing import Dict
from google import genai
import os
import json

class AgentOptimizer:
    """Mecanismo de Reinforcement Learning from Human Feedback (RLHF)."""
    
    def __init__(self):
        self.ai_client = genai.Client(api_key=os.environ.get("API_KEY"))
        self.model = 'gemini-3-pro-preview'

    async def process_negative_feedback(self, conversation_id: str, message_text: str, correction: str):
        """
        Analisa o erro do agente e gera uma diretriz de correção permanente.
        """
        prompt = f"""
        O agente cometeu um erro na conversa {conversation_id}.
        
        MENSAGEM ERRADA DO AGENTE: "{message_text}"
        CORREÇÃO DO SUPERVISOR: "{correction}"
        
        TAREFA: Gere uma "Diretriz de Comportamento" curta para que o agente não repita esse erro. 
        Seja específico e direto.
        """
        
        response = await self.ai_client.models.generate_content(
            model=self.model,
            contents=prompt
        )
        
        lesson = response.text.strip()
        
        # Simulação de persistência na tabela 'agent_lessons'
        # Em produção: await db.execute("INSERT INTO agent_lessons ...")
        print(f"OTIMIZAÇÃO: Nova lição aprendida: {lesson}")
        return lesson

    async def get_active_lessons(self) -> str:
        """Recupera lições acumuladas para injetar no System Prompt."""
        # Simulação de busca no banco
        return "- Nunca ofereça desconto de 50% sem autorização do gerente.\n- Sempre confirme se o cliente quer borda recheada em pizzas grandes."

optimizer = AgentOptimizer()
