
from typing import List, Optional, Dict
from google import genai
import os
import json

class RecommendationEngine:
    """Motor de IA Preditiva para Vendas Proativas (Next Best Offer)."""
    
    def __init__(self):
        self.ai_client = genai.Client(api_key=os.environ.get("API_KEY"))
        self.model = 'gemini-3-flash-preview'

    async def analyze_and_suggest(self, last_message: str, history: List[str], menu_context: str) -> Optional[str]:
        """
        Usa o Gemini para raciocinar sobre o perfil do cliente e sugerir um Upsell.
        """
        prompt = f"""
        Como especialista em vendas da Pizzaria Bella Napoli, analise o perfil deste cliente:
        
        HISTÓRICO: {history[-5:]}
        ÚLTIMA MENSAGEM: "{last_message}"
        MENU DISPONÍVEL: {menu_context}
        
        OBJETIVO: Identificar a MELHOR recomendação (Upsell ou Cross-sell) para fechar o pedido ou aumentar o ticket médio.
        
        Retorne um JSON com:
        - recommendation: (texto curto da sugestão)
        - reason: (por que sugeriu isso?)
        - discount_code: (opcional, se detectar hesitação)
        """
        
        try:
            response = await self.ai_client.models.generate_content(
                model=self.model,
                contents=prompt,
                config={'response_mime_type': 'application/json'}
            )
            data = json.loads(response.text)
            return data.get('recommendation')
        except Exception as e:
            print(f"Erro no Motor de Recomendação: {e}")
            return None

recommender = RecommendationEngine()
