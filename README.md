# LangGraph WhatsApp Agent Dashboard

## Visão Geral
Este sistema automatiza o atendimento comercial de uma pizzaria via WhatsApp usando LangGraph, Gemini AI, MCP, RAG com pgvector e Kafka.

## Arquitetura
```
[WhatsApp (Evolution API)] <--> [FastAPI Backend] <--> [LangGraph Agent]
                                      |
                                      +--> [PostgreSQL (pgvector)]
                                      +--> [Kafka (Opcional)]
                                      +--> [MCP Servers]
                                      |
[React Frontend] <--(WebSocket)-------+
```

## Pré-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ com extensão `vector`
- Evolution API (Docker)

## Instalação

1. **Clone o repositório**
   ```bash
   git clone ...
   cd ...
   ```

2. **Backend Setup**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   npm install
   ```

4. **Configuração**
   Copie `.env.example` para `.env` e preencha as variáveis.
   ```bash
   cp .env.example .env
   ```

5. **Banco de Dados**
   Certifique-se que o PostgreSQL está rodando e a extensão vector instalada.
   O sistema criará as tabelas automaticamente na inicialização.

## Execução

1. **Backend**
   ```bash
   uvicorn main:app --reload
   ```

2. **Frontend**
   ```bash
   npm run dev
   ```

## Configuração do WhatsApp
1. Instale a Evolution API via Docker.
2. Configure o Webhook na Evolution API apontando para:
   `POST http://seu-servidor/api/whatsapp/webhook/{instance_name}`
3. No Dashboard, crie uma nova sessão e escaneie o QR Code.

## Endpoints Principais

- `GET /api/menu`: Cardápio
- `POST /api/agent/chat`: Chat direto com o agente
- `POST /api/whatsapp/webhook/{instance}`: Webhook do WhatsApp
- `POST /api/ai/transcribe`: Transcrição de áudio
- `GET /api/stats`: Estatísticas do Dashboard

## Features
- **LangGraph Agent**: Agente conversacional com ferramentas dinâmicas.
- **RAG**: Busca semântica em documentos PDF/TXT.
- **MCP**: Integração com ferramentas externas via Model Context Protocol.
- **WhatsApp**: Integração completa via Evolution API.
- **Dashboard**: Monitoramento em tempo real com React.
