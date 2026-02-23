
from typing import Dict
from google import genai
from google.genai import types
import os

class SentimentAnalyzer:
    """Analisa o tom emocional e a urgência das conversas."""
    
    def __init__(self):
        self.client = genai.Client(api_key=os.environ.get("API_KEY"))
        self.model_name = "gemini-3-flash-preview"

    def analyze(self, text: str) -> Dict:
        """
        Retorna um dicionário com score de sentimento, urgência e tom.
        """
        prompt = f"""
        Analise a seguinte mensagem de um cliente de pizzaria:
        "{text}"
        
        Retorne um JSON com:
        - sentiment: (positive, neutral, negative)
        - score: (0 a 1.0)
        - urgency: (low, medium, high)
        - customer_mood: (ex: irritado, satisfeito, curioso, apressado)
        """
        
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        
        import json
        return json.loads(response.text)

sentiment_engine = SentimentAnalyzer()
