"""
Health check utilities para monitorar a saúde da aplicação.
Previne crash loops verificando dependências críticas.
"""

import os
import asyncio
from typing import Dict, Any
import asyncpg
from datetime import datetime

class HealthChecker:
    def __init__(self):
        self.db_pool = None
        self.checks = {}

    async def check_database(self) -> Dict[str, Any]:
        """Verifica conexão com PostgreSQL."""
        try:
            db_url = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/pizzaria_db")
            
            # Tenta criar conexão
            conn = await asyncpg.connect(db_url, timeout=5)
            
            # Testa query simples
            result = await conn.fetchval("SELECT 1")
            await conn.close()
            
            return {
                "status": "healthy",
                "service": "postgresql",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "service": "postgresql",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def check_redis(self) -> Dict[str, Any]:
        """Verifica conexão com Redis (opcional)."""
        try:
            import redis.asyncio as redis
            
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            client = redis.from_url(redis_url, decode_responses=True)
            
            # Testa conexão
            await client.ping()
            await client.close()
            
            return {
                "status": "healthy",
                "service": "redis",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "degraded",
                "service": "redis",
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "note": "Redis é opcional - sistema continua funcionando"
            }

    async def check_kafka(self) -> Dict[str, Any]:
        """Verifica conexão com Kafka (opcional)."""
        try:
            from aiokafka import AIOKafkaProducer
            
            kafka_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092").split(",")
            producer = AIOKafkaProducer(bootstrap_servers=kafka_servers, request_timeout_ms=5000)
            
            await producer.start()
            await producer.stop()
            
            return {
                "status": "healthy",
                "service": "kafka",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "degraded",
                "service": "kafka",
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "note": "Kafka é opcional - sistema opera em fallback mode"
            }

    async def run_all_checks(self) -> Dict[str, Any]:
        """Executa todos os health checks."""
        results = {
            "timestamp": datetime.now().isoformat(),
            "services": {}
        }
        
        # Checks críticos (devem passar)
        critical_checks = [
            ("database", self.check_database()),
        ]
        
        # Checks opcionais (podem falhar)
        optional_checks = [
            ("redis", self.check_redis()),
            ("kafka", self.check_kafka()),
        ]
        
        # Executar checks críticos
        for name, check_coro in critical_checks:
            try:
                result = await asyncio.wait_for(check_coro, timeout=10)
                results["services"][name] = result
                
                if result["status"] == "unhealthy":
                    results["status"] = "unhealthy"
                    results["reason"] = f"Critical service {name} is unhealthy"
                    return results
            except asyncio.TimeoutError:
                results["services"][name] = {
                    "status": "unhealthy",
                    "service": name,
                    "error": "Check timeout",
                    "timestamp": datetime.now().isoformat()
                }
                results["status"] = "unhealthy"
                results["reason"] = f"Critical service {name} check timeout"
                return results
            except Exception as e:
                results["services"][name] = {
                    "status": "unhealthy",
                    "service": name,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }
                results["status"] = "unhealthy"
                results["reason"] = f"Critical service {name} check failed"
                return results
        
        # Executar checks opcionais
        for name, check_coro in optional_checks:
            try:
                result = await asyncio.wait_for(check_coro, timeout=10)
                results["services"][name] = result
            except Exception as e:
                results["services"][name] = {
                    "status": "degraded",
                    "service": name,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }
        
        # Status geral
        if "status" not in results:
            results["status"] = "healthy"
        
        return results


# Instância global
health_checker = HealthChecker()
