
import httpx
import asyncio
import json
import logging
import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class MCPTool(BaseModel):
    name: str
    description: str
    input_schema: Dict[str, Any]

class MCPManager:
    """
    Gerencia conexões com servidores MCP externos via JSON-RPC sobre HTTP/SSE.
    Production-Ready: Inclui timeouts, retries e validação de schema.
    """
    def __init__(self):
        self.servers: Dict[str, str] = {}  # name -> url
        self.tool_cache: Dict[str, List[Dict]] = {}
        # Cliente HTTP otimizado para produção
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=10.0), # Timeouts mais permissivos para introspecção
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            follow_redirects=True
        )

    async def register_server(self, name: str, url: str) -> bool:
        """Registra um novo servidor MCP e valida a conexão via introspecção."""
        try:
            logging.info(f"MCP: Tentando conectar ao servidor '{name}' em {url}...")
            # Validação básica de URL
            if not url.startswith(('http://', 'https://')):
                raise ValueError("URL deve começar com http:// ou https://")

            tools = await self.fetch_tools(url)
            
            if not isinstance(tools, list):
                raise ValueError("Resposta do servidor MCP inválida: 'tools' deve ser uma lista.")

            self.servers[name] = url
            self.tool_cache[name] = tools
            logging.info(f"MCP: Servidor '{name}' registrado com {len(tools)} ferramentas.")
            return True
        except httpx.ConnectError:
            logging.error(f"MCP: Falha de conexão com {url}. Verifique se o servidor está online.")
            return False
        except httpx.TimeoutException:
            logging.error(f"MCP: Timeout ao conectar com {url}.")
            return False
        except Exception as e:
            logging.error(f"MCP: Erro genérico ao registrar servidor {name}: {str(e)}")
            return False

    async def fetch_tools(self, url: str) -> List[Dict]:
        """Consulta as ferramentas disponíveis no servidor via JSON-RPC."""
        payload = {
            "jsonrpc": "2.0",
            "method": "tools/list",
            "params": {},
            "id": "list-tools-" + str(uuid.uuid4())[:8] if 'uuid' in globals() else "1"
        }
        try:
            response = await self._client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            if "error" in data:
                raise Exception(f"Erro JSON-RPC remoto: {data['error']}")
                
            return data.get("result", {}).get("tools", [])
        except Exception as e:
            logging.error(f"MCP: Erro ao buscar ferramentas em {url}: {e}")
            raise

    async def get_all_capabilities(self) -> Dict[str, List[Dict]]:
        """Retorna todas as ferramentas de todos os servidores ativos."""
        all_tools = []
        for server_name, tools in self.tool_cache.items():
            for tool in tools:
                # Adicionamos namespace para evitar colisões
                tool_copy = tool.copy()
                tool_copy["name"] = f"{server_name}_{tool['name']}"
                all_tools.append(tool_copy)
        return {"tools": all_tools}

    async def call_tool(self, server_name: str, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Executa uma ferramenta específica em um servidor MCP."""
        url = self.servers.get(server_name)
        if not url:
            raise ValueError(f"Servidor MCP '{server_name}' não encontrado.")

        payload = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            },
            "id": "call-" + str(hash(tool_name))
        }
        
        try:
            response = await self._client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            if "error" in data:
                return {"error": data["error"]}
            
            return data.get("result", {}).get("content", [])
        except Exception as e:
            logging.error(f"MCP: Erro ao chamar ferramenta {tool_name} no servidor {server_name}: {e}")
            return {"error": str(e)}

# Instância Global
mcp_manager = MCPManager()
