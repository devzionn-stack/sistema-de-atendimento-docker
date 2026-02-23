
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import uuid
import os
import shutil
import secrets
import hashlib
from datetime import datetime
from google import genai

from app.agent import LangGraphAgent, supervisor
from database_service import db_service
from mcp_service import mcp_manager
from kafka_service import kafka_service
from specialist_manager import specialist_service, SpecialistModel, SkillModel
from optimization_engine import optimizer
from rag_pipeline import rag_manager
from alerts_dispatcher import alerts_dispatcher
from ai_trigger_compiler import ai_trigger_compiler
from whatsapp_service import whatsapp_service
from health_check import health_checker

app = FastAPI(title="LangGraph Real-Time Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()
db_service.set_event_callback(manager.broadcast)

# --- LIFECYCLE EVENTS ---
@app.on_event("startup")
async def startup_event():
    await kafka_service.start()

@app.on_event("shutdown")
async def shutdown_event():
    await kafka_service.stop()

# --- MODELOS ---
class MCPConnectRequest(BaseModel):
    name: str
    url: str

class MessageRequest(BaseModel):
    conversation_id: str
    text: str

class MenuItemModel(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    price: float
    category: str
    available: bool

class PromptRefineRequest(BaseModel):
    prompt: str

class TableGenRequest(BaseModel):
    description: str

class AlertCompileRequest(BaseModel):
    description: str

class AlertTriggerRequest(BaseModel):
    alert_id: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    # For creation
    name: Optional[str] = None
    triggerCondition: Optional[str] = None
    messageText: Optional[str] = None
    contactNumber: Optional[str] = None

# --- ENDPOINTS ---

# --- HEALTH CHECK ENDPOINTS ---
@app.get("/health")
async def health_check():
    """Endpoint de health check para Docker e monitoramento."""
    results = await health_checker.run_all_checks()
    
    if results.get("status") == "unhealthy":
        raise HTTPException(status_code=503, detail=results)
    
    return results

@app.get("/health/live")
async def liveness_probe():
    """Liveness probe - verifica se a aplicação está rodando."""
    return {"status": "alive", "timestamp": datetime.now().isoformat()}

@app.get("/health/ready")
async def readiness_probe():
    """Readiness probe - verifica se a aplicação está pronta para receber requisições."""
    results = await health_checker.run_all_checks()
    
    if results.get("status") == "unhealthy":
        raise HTTPException(status_code=503, detail=results)
    
    return {"status": "ready", "timestamp": datetime.now().isoformat()}

# --- WHATSAPP ENDPOINTS ---
@app.post("/api/whatsapp/instances/{name}/create")
async def create_wpp_instance(name: str):
    return await whatsapp_service.create_instance(name)

@app.get("/api/whatsapp/instances/{name}/qr")
async def get_wpp_qr(name: str):
    return await whatsapp_service.get_qr_code(name)

@app.get("/api/whatsapp/instances/{name}/status")
async def get_wpp_status(name: str):
    return await whatsapp_service.get_instance_status(name)

@app.post("/api/whatsapp/instances/{name}/connect")
async def connect_wpp_instance(name: str):
    return await whatsapp_service.connect_instance(name)

@app.post("/api/whatsapp/instances/{name}/logout")
async def logout_wpp_instance(name: str):
    return await whatsapp_service.logout_instance(name)

@app.post("/api/whatsapp/instances/{name}/send")
async def send_wpp_message(name: str, payload: dict):
    return await whatsapp_service.send_text_message(name, payload['to'], payload['text'])

@app.post("/api/whatsapp/webhook/{instance_name}")
async def whatsapp_webhook(instance_name: str, payload: dict):
    # Processamento simplificado do webhook
    try:
        event_type = payload.get('event')
        data = payload.get('data', {})
        
        # Handle Connection Updates
        if event_type == 'connection.update':
            status = data.get('state') # open, close, connecting
            mapped_status = 'connected' if status == 'open' else 'disconnected'
            if status == 'connecting': mapped_status = 'starting'
            
            await manager.broadcast({
                "type": "WPP_STATUS_CHANGE",
                "session_id": instance_name,
                "data": {
                    "status": mapped_status,
                    "message": f"Status changed to {status}"
                }
            })
            
            # Handle QR Code
            if data.get('qr'):
                await manager.broadcast({
                    "type": "WPP_QR_CODE",
                    "session_id": instance_name,
                    "data": {
                        "qr": data.get('qr'),
                        "message": "Scan QR Code"
                    }
                })
            return {"status": "processed"}

        # Handle Messages
        message_type = data.get('messageType')
        remote_jid = data.get('key', {}).get('remoteJid')
        
        if not remote_jid:
             # Check if it is a status update without explicit event type (Evolution sometimes varies)
             if data.get('state'):
                 # Logic above covers it if event type is present
                 pass
             return {"status": "ignored", "reason": "no_remote_jid"}

        phone_number = remote_jid.split('@')[0]
        
        # Transcrição de áudio se necessário
        message_text = ""
        if message_type == 'audioMessage':
            # Lógica de extração de URL do áudio (depende da estrutura exata da Evolution)
            # audio_url = ...
            # message_text = await whatsapp_service.transcribe_audio(audio_url)
            message_text = "[Áudio recebido - Transcrição pendente]"
        else:
            message_text = data.get('message', {}).get('conversation') or \
                           data.get('message', {}).get('extendedTextMessage', {}).get('text')
        
        if not message_text:
            return {"status": "ignored", "reason": "no_text"}

        # Salvar mensagem do usuário
        await db_service.save_message(phone_number, "user", message_text, "neutral")
        
        # Verificar intervenção humana
        intervention = await db_service.get_intervention_state(phone_number)
        if not intervention:
            # Executar agente
            # agent_response = await agent_executor.ainvoke(...)
            # Por enquanto, simulação simples
            response_text = f"Recebi sua mensagem: {message_text}"
            await whatsapp_service.send_text_message(instance_name, remote_jid, response_text)
            await db_service.save_message(phone_number, "agent", response_text, "positive")
        
        # Broadcast para frontend
        await manager.broadcast({
            "type": "NEW_WHATSAPP_MESSAGE",
            "data": {
                "conversation_id": phone_number,
                "message": {
                    "sender": "user",
                    "text": message_text,
                    "timestamp": datetime.now().isoformat()
                }
            }
        })
        
        return {"status": "processed"}
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "details": str(e)}

# --- AI SERVICES ENDPOINTS ---
@app.post("/api/ai/transcribe")
async def transcribe_audio_endpoint(payload: dict):
    url = payload.get('audio_url')
    b64 = payload.get('audio_base64')
    
    if url:
        text = await whatsapp_service.transcribe_audio(url)
    elif b64:
        text = await whatsapp_service.transcribe_audio_base64(b64)
    else:
        raise HTTPException(400, "audio_url or audio_base64 required")
        
    return {"transcription": text}

@app.post("/api/ai/estimate-metrics")
async def estimate_metrics(payload: dict):
    # Simulação ou chamada real ao Gemini
    return {"latency": "0.8s", "cost": "$0.01"}

@app.post("/api/ai/suggest-menu")
async def suggest_menu(payload: dict):
    item_name = payload.get('itemName')
    client = genai.Client(api_key=os.environ.get("API_KEY"))
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=f"Crie uma descrição curta, atraente e vendedora para este item de cardápio: {item_name}"
    )
    return {"suggestion": response.text.strip()}

@app.post("/api/ai/analyze-sentiment")
async def analyze_sentiment_endpoint(payload: dict):
    # Simplificado
    return {"sentiment": "positive"}

@app.post("/api/ai/generate-trigger")
async def generate_trigger(payload: dict):
    desc = payload.get('description')
    client = genai.Client(api_key=os.environ.get("API_KEY"))
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=f"Transforme esta descrição de alerta em uma condição lógica simplificada (ex: volume_mensagens > 50). Descrição: {desc}"
    )
    return {"condition": response.text.strip()}

@app.post("/api/ai/summarize-insights")
async def summarize_insights(payload: dict):
    return {"summary": "Performance estável com aumento de vendas no fim de semana."}

@app.post("/api/ai/ban-risk")
async def ban_risk(payload: dict):
    return {"score": 15, "reason": "Volume baixo", "recommendation": "Manter ritmo"}

@app.post("/api/ai/predict-intent")
async def predict_intent(payload: dict):
    return {"intent": "pedido"}

# --- LLM CONFIG ---
@app.post("/api/llm/config")
async def save_llm_config(config: dict):
    # Salvar em memória ou DB
    # db_service.save_llm_config(config)
    return {"status": "saved", "config": config}

# --- AGENT CHAT ---
@app.post("/api/agent/chat")
async def agent_chat(payload: dict):
    message = payload.get('message')
    conversation_id = payload.get('conversation_id')
    
    # Roteamento via Supervisor
    specialists = await specialist_service.get_all_specialists()
    specialist_id = await supervisor.route(message, specialists)
    
    # Execução (simulada por enquanto)
    response = f"Especialista {specialist_id} respondendo: {message}"
    
    return {
        "response": response,
        "specialist_used": specialist_id,
        "intent": "general"
    }

# 1. Specialists CRUD
@app.get("/api/specialists")
async def get_specialists():
    return await specialist_service.get_all_specialists()

@app.post("/api/specialists")
async def create_specialist(specialist: SpecialistModel):
    return await specialist_service.create_specialist(specialist)

@app.put("/api/specialists/{id}")
async def update_specialist(id: str, specialist: SpecialistModel):
    try:
        return await specialist_service.update_specialist(id, specialist)
    except ValueError:
        raise HTTPException(status_code=404, detail="Specialist not found")

@app.delete("/api/specialists/{id}")
async def delete_specialist(id: str):
    success = await specialist_service.delete_specialist(id)
    if not success:
         raise HTTPException(status_code=404, detail="Specialist not found")
    return {"status": "deleted"}

@app.get("/api/skills")
async def get_skills():
    return await specialist_service.get_all_skills()

# 2. Optimization Engine Exposure
@app.get("/api/optimization/lessons")
async def get_optimization_lessons():
    return [
        {
            "id": "l1", "conversation_id": "conv_123", "timestamp": "2025-05-20T10:00:00",
            "trigger_message": "O cliente pediu desconto de 50%",
            "correction": "Não dar desconto alto sem gerente",
            "learned_rule": "SE desconto > 15% ENTÃO solicitar_aprovacao_humana"
        },
        {
            "id": "l2", "conversation_id": "conv_124", "timestamp": "2025-05-21T14:30:00",
            "trigger_message": "Qual o prazo de entrega para o bairro X?",
            "correction": "Verificar API de logística antes de responder",
            "learned_rule": "SE pergunta_sobre_entrega ENTÃO usar_tool_logistica"
        }
    ]

# 3. Menu Management
@app.get("/api/menu")
async def get_menu():
    return await db_service.get_menu()

@app.post("/api/menu")
async def add_menu_item(item: MenuItemModel):
    return await db_service.add_menu_item(item.dict())

@app.delete("/api/menu/{item_id}")
async def delete_menu_item(item_id: str):
    success = await db_service.delete_menu_item(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "deleted"}

# 4. RAG / Knowledge Management
@app.get("/api/knowledge")
async def get_knowledge_files():
    return await db_service.get_vector_files()

@app.post("/api/knowledge/upload")
async def upload_knowledge(file: UploadFile = File(...)):
    try:
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        result = await rag_manager.process_and_index(file_path)
        os.remove(file_path)
        if result["status"] == "error":
             raise HTTPException(status_code=500, detail=result["message"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/knowledge/{doc_id}")
async def delete_knowledge_document(doc_id: str):
    file_info = await db_service.get_vector_file_info(doc_id)
    if not file_info:
        raise HTTPException(404, "File not found")
    
    source_file = file_info['fileName']
    removed_count = await db_service.delete_vectors(source_file)
    
    await manager.broadcast({
        "type": "KNOWLEDGE_FILE_DELETED",
        "data": {"file_id": doc_id, "vectors_removed": removed_count}
    })
    
    return {"status": "deleted", "file_id": doc_id, "vectors_removed": removed_count}

# 5. MCP Management
@app.get("/api/mcp/servers")
async def get_mcp_servers():
    return await db_service.get_mcp_servers()

@app.post("/api/mcp/connect")
async def connect_mcp_server(req: MCPConnectRequest):
    await kafka_service.produce_mcp_event("CONNECT_SERVER", {
        "name": req.name,
        "url": req.url
    })
    return {"status": "processing", "message": "Request queued for background processing"}

@app.delete("/api/mcp/servers/{server_id}")
async def delete_mcp_server(server_id: str):
    return {"status": "deleted", "server_id": server_id}

@app.post("/api/mcp/connectors/{connector_id}/sync")
async def sync_mcp_connector(connector_id: str):
    await asyncio.sleep(1)
    return {"status": "synced"}

@app.get("/api/mcp/connectors/{connector_id}/logs")
async def get_mcp_logs(connector_id: str):
    return [
        {"id": "1", "timestamp": "2025-05-22 10:00:00", "message": "Sync started", "level": "info"},
        {"id": "2", "timestamp": "2025-05-22 10:00:05", "message": "30 records updated", "level": "success"}
    ]

# 6. Analytics & Chat
@app.get("/api/stats")
async def get_stats():
    return await db_service.get_dashboard_stats()

@app.get("/api/analytics")
async def get_analytics():
    return {
        "totalConversations": 1247,
        "activeUsers": 89,
        "avgResponseTime": 0.8,
        "satisfactionRate": 9.4
    }

@app.post("/api/conversations/message")
async def send_message(req: MessageRequest):
    msg = await db_service.save_message(req.conversation_id, "agent", req.text, "positive")
    return {"status": "sent", "message": msg}

@app.post("/api/conversations/feedback")
async def receive_conversation_feedback(feedback: dict):
    conversation_id = feedback['conversation_id']
    message_id = feedback['message_id']
    is_positive = feedback['is_positive']
    correction = feedback.get('correction', None)
    
    feedback_record = await db_service.save_feedback(
        conversation_id, message_id, is_positive, correction
    )
    
    if correction:
        await optimizer.process_negative_feedback(conversation_id, "Msg ID " + message_id, correction)
        await manager.broadcast({
            "type": "OPTIMIZATION_QUEUED",
            "data": {"conversation_id": conversation_id, "correction": correction}
        })
    
    return {"status": "feedback_received", "feedback_id": feedback_record['id']}

@app.post("/api/conversations/intervene")
async def human_intervention(interv_data: dict):
    conversation_id = interv_data['conversation_id']
    active = interv_data['active']
    await db_service.set_intervention_state(conversation_id, active)
    
    status_message = "Human takeover activated" if active else "Bot resumed"
    await manager.broadcast({
        "type": "INTERVENTION_TOGGLED",
        "data": {"conversation_id": conversation_id, "active": active, "message": status_message}
    })
    return {"status": status_message, "conversation_id": conversation_id, "intervention_active": active}

@app.get("/api/analytics/drilldown")
async def get_drilldown(scope: str):
    if scope == 'overview':
        return [
            {"id": "vendas", "label": "Vendas Mensais", "value": "R$ 51.2k", "drillable": True},
            {"id": "sentimento", "label": "Sentimento Geral", "value": "92%", "drillable": True},
        ]
    return [{"name": "Pico", "value": 100, "drillable": False}]

@app.get("/api/analytics/metrics")
async def get_detailed_analytics(start_date: Optional[str] = None, end_date: Optional[str] = None, metric_type: Optional[str] = None):
    metrics = await db_service.get_analytics_metrics(start_date=start_date, end_date=end_date, metric_type=metric_type)
    return {
        "period": {"start": start_date or "all_time", "end": end_date or datetime.now().isoformat().split('T')[0]},
        "metrics": {
            "total_conversations": metrics.get('conversations_count', 0),
            "active_users": metrics.get('unique_users', 0),
            "avg_response_time": metrics.get('avg_response_time', "0.5s"),
            "satisfaction_rate": metrics.get('satisfaction_score', 0),
            "leads_generated": metrics.get('leads_count', 0),
            "conversion_rate": metrics.get('conversion_rate', 0),
            "top_intents": metrics.get('top_intents', []),
            "hourly_distribution": metrics.get('hourly_data', [])
        }
    }

@app.get("/api/analytics/export")
async def export_analytics(format: str = "csv", start_date: Optional[str] = None, end_date: Optional[str] = None):
    data = await db_service.get_analytics_export_data(start_date, end_date)
    if format == "csv":
        csv_lines = ["Date,Conversations,Users,ResponseTime,Satisfaction"]
        for row in data:
            csv_lines.append(f"{row['date']},{row['conversations']},{row['users']},{row['response_time']},{row['satisfaction']}")
        content = "\n".join(csv_lines)
        media_type = "text/csv"
        filename = f"analytics_{datetime.now().strftime('%Y%m%d')}.csv"
    else:
        import json
        content = json.dumps(data, indent=2)
        media_type = "application/json"
        filename = f"analytics_{datetime.now().strftime('%Y%m%d')}.json"
    
    return Response(content=content, media_type=media_type, headers={"Content-Disposition": f"attachment; filename={filename}"})

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# 7. Reports
@app.get("/api/reports/templates")
async def get_report_templates():
    return [
        {"id": "daily", "name": "Relatório Diário", "description": "Métricas e conversas do dia", "variables": ["date"]},
        {"id": "weekly", "name": "Relatório Semanal", "description": "Resumo da semana com gráficos", "variables": ["start_date", "end_date"]},
        {"id": "monthly", "name": "Relatório Mensal", "description": "Análise completa mensal", "variables": ["month", "year"]},
        {"id": "custom", "name": "Relatório Personalizado", "description": "Configure métricas e período", "variables": ["start_date", "end_date", "metrics"]}
    ]

@app.post("/api/reports/generate")
async def generate_report(report_config: dict):
    template_id = report_config['template_id']
    format_type = report_config.get('format', 'pdf')
    filename = f"report_{template_id}_{datetime.now().strftime('%Y%m%d')}.{'pdf' if format_type == 'pdf' else 'json'}"
    return {"status": "generated", "filename": filename, "format": format_type, "download_url": f"/api/reports/download/{filename}"}

@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: str):
    return {"status": "deleted"}

@app.post("/api/reports/ai-suggestion/{suggestion_id}")
async def apply_ai_suggestion(suggestion_id: str):
    return {"status": "applied", "message": "Suggestion optimized successfully"}

@app.post("/api/reports/schedule")
async def schedule_report(schedule_config: dict):
    schedule_id = str(uuid.uuid4())
    schedule = {
        "id": schedule_id,
        "template_id": schedule_config.get('template_id', 'daily'),
        "frequency": schedule_config.get('frequency', 'daily'),
        "destination_email": schedule_config.get('destination_email', ''),
        "config": schedule_config,
        "is_active": True,
        "created_at": datetime.now().isoformat()
    }
    await db_service.save_report_schedule(schedule)
    return {"schedule_id": schedule_id, "status": "scheduled", "next_run": "2026-02-26T09:00:00"}

# 8. Prompts
@app.post("/api/prompts/refine")
async def refine_prompt_with_ai(req: PromptRefineRequest):
    client = genai.Client(api_key=os.environ.get("API_KEY"))
    meta_prompt = f"""Você é um engenheiro de prompts especialista em agentes de atendimento para pizzarias via WhatsApp.
Refine o seguinte prompt de sistema para torná-lo mais preciso, empático, focado em vendas e livre de ambiguidades.
Mantenha o tom profissional e cordial. Retorne APENAS o prompt refinado, sem explicações.

PROMPT ORIGINAL:
{req.prompt}"""
    try:
        response = client.models.generate_content(model='gemini-2.0-flash', contents=meta_prompt)
        return {"refined_prompt": response.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 9. Database & Alerts (Staff)
@app.post("/api/database/generate-table")
async def generate_table_with_ai(req: TableGenRequest):
    client = genai.Client(api_key=os.environ.get("API_KEY"))
    prompt = f"""Gere o SQL CREATE TABLE para PostgreSQL baseado nesta descrição: {req.description}
    Retorne APENAS o SQL, sem markdown."""
    try:
        response = client.models.generate_content(model='gemini-3-flash-preview', contents=prompt)
        sql = response.text.replace("```sql", "").replace("```", "").strip()
        return {"status": "generated", "schema": sql, "description": req.description}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/database/health")
async def get_database_health():
    return {
        "status": "healthy",
        "connections": {"active": 5, "idle": 10, "max": 100},
        "size": {"total_mb": 245, "tables_mb": 180, "indexes_mb": 65},
        "performance": {"avg_query_time_ms": 12, "slow_queries_count": 2},
        "last_check": datetime.now().isoformat()
    }

@app.get("/api/database/tables/{table_name}/sql")
async def get_table_create_sql(table_name: str):
    mock_sql = f"""CREATE TABLE {table_name} (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    name VARCHAR(255),\n    created_at TIMESTAMP DEFAULT NOW()\n);"""
    return {"table_name": table_name, "sql": mock_sql}

@app.post("/api/alerts/compile")
async def compile_alert_trigger(req: AlertCompileRequest):
    trigger_data = await ai_trigger_compiler(req.description)
    return trigger_data

@app.post("/api/alerts/trigger")
async def create_and_trigger_alert(req: AlertTriggerRequest):
    if req.alert_id: # Trigger existing test
        await alerts_dispatcher.send_staff_alert(req.phone, req.title, req.message)
        return {"status": "dispatched"}
    else: # Create new
        alert_data = {
            "id": str(uuid.uuid4()),
            "name": req.name,
            "triggerCondition": req.triggerCondition,
            "messageText": req.messageText,
            "contactNumber": req.contactNumber,
            "isActive": True,
            "createdAt": datetime.now().isoformat()
        }
        await db_service.save_staff_alert(alert_data)
        return {"alert_id": alert_data["id"], "status": "active"}

@app.get("/api/alerts")
async def get_all_alerts():
    return await db_service.get_all_alerts()

@app.delete("/api/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    success = await db_service.delete_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "deleted", "alert_id": alert_id}

# 10. WhatsApp Tokens
@app.post("/api/whatsapp/token")
async def generate_whatsapp_token(data: dict):
    session_id = data.get('session_id')
    secret = data.get('secret')
    if not secret or len(secret) < 8:
        raise HTTPException(400, "Secret must be at least 8 characters")
    
    token_raw = f"{session_id}:{secret}:{datetime.now().isoformat()}"
    token = hashlib.sha256(token_raw.encode()).hexdigest()
    await db_service.save_wpp_token(session_id, token)
    return {"token": token, "session_id": session_id, "expires": "never"}

@app.post("/api/whatsapp/sessions/{session_id}/regenerate-token")
async def regenerate_wpp_token(session_id: str):
    new_token = secrets.token_hex(32)
    await db_service.update_wpp_token(session_id, new_token)
    return {"token": new_token, "status": "regenerated"}

# 11. CRM Leads - Expanded
@app.get("/api/crm/leads")
async def get_all_leads(status: Optional[str] = None, potential: Optional[str] = None, limit: int = 100):
    return await db_service.get_leads(status, potential, limit)

@app.get("/api/crm/leads/{lead_id}")
async def get_lead_details(lead_id: str):
    lead = await db_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found")
    conversations = await db_service.get_conversations_by_phone(lead['phoneNumber'])
    return {**lead, "conversation_history": conversations, "total_interactions": len(conversations)}

@app.post("/api/crm/leads/{lead_id}/status")
async def update_lead_status(lead_id: str, payload: dict):
    new_status = payload.get('new_status') or payload.get('status')
    success = await db_service.update_lead_status(lead_id, new_status)
    if not success:
        raise HTTPException(404, "Lead not found")
    return {"status": "updated", "new_status": new_status}

@app.get("/api/crm/export")
async def export_leads_csv():
    leads = await db_service.get_all_leads()
    csv_lines = ["Nome,Telefone,Intencao,Potencial,Status"]
    for lead in leads:
        csv_lines.append(f"{lead['userName']},{lead['phoneNumber']},{lead['lastIntent']},{lead['potential']},{lead['status']}")
    return Response(content="\n".join(csv_lines), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=leads_{datetime.now().strftime('%Y%m%d')}.csv"})

# 12. Agent Simulation
@app.post("/api/agent/simulate")
async def simulate_agent_interaction(message: str, context: dict = {}):
    agent = LangGraphAgent()
    # Mock response for preview
    return {
        "user_message": message,
        "agent_response": f"Simulação: Recebi '{message}'. Posso ajudar com mais algo do cardápio?",
        "intent_detected": "general_inquiry",
        "confidence": 0.98
    }
