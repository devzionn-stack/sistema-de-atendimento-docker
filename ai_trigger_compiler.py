
from google import genai
from google.genai import types
import os
import json
import logging

class TriggerEngine:
    """
    Motor de processamento de gatilhos. 
    Responsável por validar e executar a lógica dos alertas configurados.
    """
    def __init__(self):
        self.active_triggers = []

    def register_trigger(self, trigger_data: dict):
        self.active_triggers.append(trigger_data)
        logging.info(f"TRIGGER_ENGINE: Novo gatilho registrado: {trigger_data.get('human_friendly_logic')}")

    def evaluate_condition(self, entity: str, current_value: float, trigger: dict) -> bool:
        """Avalia se uma condição de gatilho foi atingida."""
        if trigger.get('entity') != entity:
            return False
            
        op = trigger.get('operator')
        threshold = trigger.get('value')
        
        if op == '<': return current_value < threshold
        if op == '>': return current_value > threshold
        if op == '==': return current_value == threshold
        if op == '>=': return current_value >= threshold
        if op == '<=': return current_value <= threshold
        return False

async def ai_trigger_compiler(natural_language_description: str) -> dict:
    """
    Função principal que utiliza IA para traduzir descrições humanas em 
    objetos de configuração de gatilhos estruturados.
    """
    client = genai.Client(api_key=os.environ.get("API_KEY"))
    model_name = "gemini-3-flash-preview"

    prompt = f"""
    Converta a seguinte descrição de alerta de pizzaria em um objeto JSON de configuração.
    
    ENTIDADES PERMITIDAS: [inventory, orders, sentiment, wait_time, lead_conversion]
    OPERADORES: [<, >, ==, >=, <=]

    DESCRIÇÃO: "{natural_language_description}"

    Retorne APENAS o JSON com:
    - entity: (string) a categoria técnica
    - operator: (string) o símbolo do operador
    - value: (number) o valor numérico de corte
    - human_friendly_logic: (string) representação curta (ex: "Estoque < 5kg")
    - explanation: (string) explicação amigável do que o alerta faz.
    """

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        logging.error(f"Erro na compilação do gatilho: {str(e)}")
        return {
            "entity": "error",
            "human_friendly_logic": "Falha na interpretação IA",
            "explanation": "Não foi possível processar a descrição fornecida."
        }

# Instância global para uso no backend
trigger_engine = TriggerEngine()
