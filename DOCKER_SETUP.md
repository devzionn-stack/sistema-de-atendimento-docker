# Sistema de Atendimento - Docker Setup Guide

Este guia descreve como configurar e fazer deploy do Sistema de Atendimento usando Docker e Docker Compose.

## Arquitetura

O sistema é composto pelos seguintes serviços containerizados:

- **Frontend (Nginx)**: Serve a aplicação React e faz proxy para o backend
- **Backend (FastAPI)**: API principal com Uvicorn
- **PostgreSQL**: Banco de dados com extensão pgvector para RAG
- **Redis**: Cache e sessões (opcional)
- **Kafka + Zookeeper**: Message queue para processamento assíncrono (opcional, com fallback)

## Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Git

## Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone https://github.com/devzionn-stack/Sistema-de-Atendimento.git
cd Sistema-de-Atendimento
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
nano .env
```

**Variáveis críticas a configurar:**

```env
# Database
DB_USER=atendimento
DB_PASSWORD=sua_senha_segura_aqui
DB_NAME=pizzaria_db

# Redis
REDIS_PASSWORD=sua_senha_segura_aqui

# API Keys (obrigatórios para IA)
GEMINI_API_KEY=sua_chave_gemini
OPENAI_API_KEY=sua_chave_openai (opcional)
GROQ_API_KEY=sua_chave_groq (opcional)

# WhatsApp
EVOLUTION_API_URL=http://seu_servidor_evolution
EVOLUTION_API_KEY=sua_chave_evolution

# Ambiente
ENVIRONMENT=production
DEBUG=false
```

### 3. Build das Imagens Docker

```bash
# Build de todas as imagens
docker-compose build

# Ou build específico
docker-compose build backend
docker-compose build frontend
```

### 4. Iniciar os Serviços

```bash
# Iniciar em background
docker-compose up -d

# Ou com logs visíveis
docker-compose up

# Apenas serviços específicos
docker-compose up -d postgres redis backend
```

### 5. Verificar Status

```bash
# Ver status dos containers
docker-compose ps

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Health check
curl http://localhost/health
curl http://localhost/health/live
curl http://localhost/health/ready
```

## Acessar a Aplicação

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **WebSocket**: ws://localhost/ws

## Gerenciamento de Dados

### Backup do Banco de Dados

```bash
# Criar backup
docker-compose exec postgres pg_dump -U atendimento pizzaria_db > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U atendimento pizzaria_db < backup.sql
```

### Acessar PostgreSQL Diretamente

```bash
docker-compose exec postgres psql -U atendimento -d pizzaria_db
```

### Acessar Redis CLI

```bash
docker-compose exec redis redis-cli -a sua_senha_redis
```

## Troubleshooting

### Crash Loop no Backend

**Sintomas**: Container backend reiniciando constantemente

**Soluções**:
1. Verificar logs: `docker-compose logs backend`
2. Verificar conexão com PostgreSQL: `docker-compose logs postgres`
3. Verificar variáveis de ambiente: `docker-compose config`
4. Aguardar inicialização do PostgreSQL: pode levar 30-40 segundos

### Erro de Conexão com Banco de Dados

```
ERROR: could not connect to server: Connection refused
```

**Solução**:
```bash
# Reiniciar PostgreSQL
docker-compose restart postgres

# Aguardar health check passar
docker-compose ps
```

### Kafka não conecta

**Nota**: Kafka é opcional. O sistema opera em fallback mode se Kafka não estiver disponível.

```bash
# Verificar se Kafka está saudável
docker-compose logs kafka
docker-compose logs zookeeper
```

### Frontend não carrega

```bash
# Verificar logs do Nginx
docker-compose logs frontend

# Verificar se backend está respondendo
curl http://localhost/api/health
```

## Deploy na Hostinger VPS

### Via Gerenciador Docker da Hostinger

1. **Fazer push para GitHub**:
```bash
git add .
git commit -m "Add Docker configuration"
git push origin main
```

2. **No painel Hostinger**:
   - Ir para "Gerenciador Docker"
   - Conectar repositório GitHub
   - Selecionar branch `main`
   - Configurar variáveis de ambiente no painel
   - Fazer deploy

3. **Configurar domínio**:
   - Apontar DNS para IP do VPS
   - Configurar SSL/TLS no painel Hostinger

### Manual via SSH

```bash
# Conectar ao VPS
ssh usuario@seu_vps_ip

# Clonar repositório
git clone https://github.com/devzionn-stack/Sistema-de-Atendimento.git
cd Sistema-de-Atendimento

# Configurar .env
nano .env

# Iniciar containers
docker-compose up -d

# Verificar status
docker-compose ps
```

## Monitoramento

### Health Checks

O sistema possui 3 endpoints de health check:

- `GET /health` - Verifica todas as dependências (DB, Redis, Kafka)
- `GET /health/live` - Verifica se a aplicação está rodando
- `GET /health/ready` - Verifica se a aplicação está pronta para requisições

### Logs

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Ver últimas 100 linhas
docker-compose logs --tail=100 backend
```

## Parar e Limpar

```bash
# Parar containers (mantém dados)
docker-compose stop

# Parar e remover containers
docker-compose down

# Remover tudo incluindo volumes (CUIDADO - deleta dados!)
docker-compose down -v
```

## Performance e Otimizações

### Limpar Imagens Não Utilizadas

```bash
docker image prune -a
docker system prune -a
```

### Aumentar Recursos

Editar `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Segurança

- ✅ Senhas aleatórias no `.env`
- ✅ HTTPS/SSL recomendado (configurar no Nginx)
- ✅ Firewall: abrir apenas portas 80 e 443
- ✅ Backups regulares do PostgreSQL
- ✅ Monitoramento de logs
- ✅ Health checks automáticos

## Suporte

Para problemas ou dúvidas:
1. Verificar logs: `docker-compose logs`
2. Consultar documentação do FastAPI: https://fastapi.tiangolo.com
3. Consultar documentação do Docker Compose: https://docs.docker.com/compose

---

**Última atualização**: 2026-02-23
