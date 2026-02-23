
import asyncio
import json
import logging
import os
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from mcp_service import mcp_manager
from database_service import db_service

logger = logging.getLogger("KafkaService")

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC_MCP_OPERATIONS = "mcp_operations"

class KafkaService:
    def __init__(self):
        self.producer = None
        self.consumer = None
        self.is_running = False
        self.loop = None

    async def start(self):
        """Inicializa conexões Kafka. Se falhar, loga aviso e opera em modo fallback."""
        self.loop = asyncio.get_event_loop()
        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                loop=self.loop
            )
            await self.producer.start()
            
            self.consumer = AIOKafkaConsumer(
                TOPIC_MCP_OPERATIONS,
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                group_id="mcp_worker_group",
                loop=self.loop
            )
            await self.consumer.start()
            self.is_running = True
            
            # Inicia o loop de consumo em background
            asyncio.create_task(self.consume_messages())
            logger.info(f"Kafka Connected to {KAFKA_BOOTSTRAP_SERVERS}")
        except Exception as e:
            logger.warning(f"Kafka Connection Failed: {e}. Falling back to synchronous mode.")
            self.is_running = False

    async def stop(self):
        if self.producer:
            await self.producer.stop()
        if self.consumer:
            await self.consumer.stop()

    async def produce_mcp_event(self, action: str, payload: dict):
        """Publica evento no Kafka ou processa diretamente se Kafka offline."""
        message = {"action": action, "payload": payload}
        
        if self.is_running and self.producer:
            try:
                await self.producer.send_and_wait(
                    TOPIC_MCP_OPERATIONS, 
                    json.dumps(message).encode('utf-8')
                )
                logger.info(f"Event produced to Kafka: {action}")
            except Exception as e:
                logger.error(f"Kafka Produce Error: {e}")
                # Fallback em caso de erro no envio
                await self.process_message(message)
        else:
            # Modo Fallback (Síncrono/Local)
            logger.info("Processing locally (Kafka unavailable)")
            await self.process_message(message)

    async def consume_messages(self):
        """Loop de consumo de mensagens."""
        try:
            async for msg in self.consumer:
                try:
                    data = json.loads(msg.value.decode('utf-8'))
                    logger.info(f"Consuming Kafka message: {data.get('action')}")
                    await self.process_message(data)
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
        except Exception as e:
            logger.error(f"Kafka Consumer Loop Error: {e}")

    async def process_message(self, message: dict):
        """Lógica de negócio centralizada (Processor)."""
        action = message.get("action")
        payload = message.get("payload", {})

        if action == "CONNECT_SERVER":
            await self._handle_connect_server(payload)

    async def _handle_connect_server(self, payload: dict):
        name = payload.get("name")
        url = payload.get("url")
        
        try:
            # 1. Tenta Handshake (Pode ser demorado)
            success = await mcp_manager.register_server(name, url)
            
            if success:
                # 2. Persiste e Notifica Sucesso
                server_record = await db_service.register_mcp_server(name, url)
                # O register_mcp_server já emite o broadcast 'MCP_NEW_SERVER'
                
                # Emite evento específico de conclusão de transação para o UI
                await db_service._emit("MCP_CONNECTION_RESULT", {
                    "status": "success",
                    "name": name,
                    "server": server_record
                })
            else:
                raise Exception("Handshake validation failed")

        except Exception as e:
            logger.error(f"MCP Connection Worker Error: {e}")
            # 3. Notifica Erro
            await db_service._emit("MCP_CONNECTION_RESULT", {
                "status": "error",
                "name": name,
                "error": str(e)
            })

kafka_service = KafkaService()
