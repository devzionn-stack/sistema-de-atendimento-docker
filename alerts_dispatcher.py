
import os
import httpx
import uuid
from datetime import datetime
from typing import List, Dict
from database_service import db_service

class AlertsDispatcher:
    """
    Gerencia o ciclo de vida dos alertas: Registro, Monitoramento e Disparo.
    Integrado com gateway WhatsApp (simulado) e Database Service.
    """
    
    def __init__(self):
        self.wpp_gateway_url = os.getenv("WPP_GATEWAY_URL", "http://localhost:3000")

    async def register_alert(self, name: str, trigger: str, message: str, contact: str) -> str:
        """Registra um novo alerta no sistema."""
        alert_id = str(uuid.uuid4())
        alert_config = {
            "id": alert_id,
            "name": name,
            "triggerCondition": trigger, # JSON string do trigger
            "messageText": message,
            "contactNumber": contact,
            "isActive": True,
            "createdAt": datetime.now().isoformat()
        }
        await db_service.save_staff_alert(alert_config)
        return alert_id

    async def get_all_alerts(self) -> List[Dict]:
        """Retorna todos os alertas registrados."""
        return await db_service.get_all_alerts()

    async def send_staff_alert(self, phone: str, title: str, message: str, priority: str = "medium"):
        """Envia a notificação formatada para o celular do colaborador."""
        
        # Formatação Visual para WhatsApp (Negritos e Emojis)
        header = "🚨 *ALERTA DE SISTEMA: {}*".format(title.upper())
        timestamp = "⏰ _Enviado em: {}_".format(datetime.now().strftime("%H:%M:%S"))
        
        formatted_body = f"{header}\n\n{message}\n\n{timestamp}"
        
        # Simulação de chamada externa ao driver WPPConnect
        print(f"DEBUG: Enviando WPP para {phone}:\n{formatted_body}")
        
        return {"status": "dispatched", "timestamp": datetime.now().isoformat()}

alerts_dispatcher = AlertsDispatcher()
