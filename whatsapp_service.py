import os
import httpx
import base64
from typing import Dict, List, Optional
from google import genai

class EvolutionAPIService:
    def __init__(self):
        self.base_url = os.getenv("EVOLUTION_API_URL", "http://localhost:8080")
        self.api_key = os.getenv("EVOLUTION_API_KEY", "")
        self.headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }

    async def _request(self, method: str, endpoint: str, data: dict = None) -> dict:
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}/{endpoint}"
                response = await client.request(method, url, headers=self.headers, json=data, timeout=30.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                print(f"Evolution API Error: {e.response.text}")
                return {"error": str(e), "details": e.response.text}
            except Exception as e:
                print(f"Request Error: {str(e)}")
                return {"error": str(e)}

    async def create_instance(self, instance_name: str) -> dict:
        return await self._request("POST", "instance/create", {
            "instanceName": instance_name,
            "qrcode": True,
            "integration": "WHATSAPP-BAILEYS"
        })

    async def get_qr_code(self, instance_name: str) -> dict:
        # Evolution API returns QR in base64 in the instance connect response usually
        # But let's assume a specific endpoint or re-call connect
        return await self.connect_instance(instance_name)

    async def connect_instance(self, instance_name: str) -> dict:
        return await self._request("GET", f"instance/connect/{instance_name}")

    async def get_instance_status(self, instance_name: str) -> dict:
        return await self._request("GET", f"instance/connectionState/{instance_name}")

    async def logout_instance(self, instance_name: str) -> dict:
        return await self._request("DELETE", f"instance/logout/{instance_name}")

    async def send_text_message(self, instance_name: str, to: str, text: str) -> dict:
        return await self._request("POST", f"message/sendText/{instance_name}", {
            "number": to,
            "text": text
        })

    async def send_list_message(self, instance_name: str, to: str, title: str, items: list) -> dict:
        # Evolution API format for lists
        # This is a simplified implementation
        return await self._request("POST", f"message/sendList/{instance_name}", {
            "number": to,
            "title": title,
            "description": "Selecione uma opção",
            "buttonText": "Abrir Menu",
            "sections": [{"title": "Opções", "rows": items}]
        })

    async def send_button_message(self, instance_name: str, to: str, text: str, buttons: list) -> dict:
        return await self._request("POST", f"message/sendButtons/{instance_name}", {
            "number": to,
            "title": "Atenção",
            "description": text,
            "buttons": buttons
        })

    async def transcribe_audio(self, audio_url: str) -> str:
        """Baixa o áudio e transcreve usando Gemini multimodal."""
        try:
            # 1. Baixar o áudio
            async with httpx.AsyncClient() as client:
                # Se for URL da Evolution, pode precisar de headers de auth
                headers = self.headers if self.base_url in audio_url else {}
                resp = await client.get(audio_url, headers=headers)
                resp.raise_for_status()
                audio_data = resp.content

            # 2. Converter para base64
            b64_audio = base64.b64encode(audio_data).decode('utf-8')

            return await self.transcribe_audio_base64(b64_audio)
        except Exception as e:
            print(f"Transcription error: {e}")
            return "[Erro na transcrição de áudio]"

    async def transcribe_audio_base64(self, b64_audio: str) -> str:
        """Transcreve áudio em base64 usando Gemini multimodal."""
        try:
            client = genai.Client(api_key=os.environ.get("API_KEY"))
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=[
                    {'mime_type': 'audio/mp3', 'data': b64_audio},
                    "Transcreva este áudio de WhatsApp para texto em português. Retorne APENAS a transcrição."
                ]
            )
            return response.text.strip()
        except Exception as e:
            print(f"Base64 Transcription error: {e}")
            return "[Erro na transcrição de áudio]"

whatsapp_service = EvolutionAPIService()
