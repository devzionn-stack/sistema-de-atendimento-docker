
-- Extensão para busca vetorial (RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- Histórico de Mensagens com Sentimento
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id VARCHAR(255) NOT NULL,
    sender VARCHAR(50) NOT NULL, -- 'user', 'agent', 'system'
    text TEXT NOT NULL,
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
    sentiment_score FLOAT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gestão de Leads e CRM
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    user_name VARCHAR(100),
    potential VARCHAR(10) DEFAULT 'low', -- 'high', 'medium', 'low'
    last_intent TEXT,
    conversion_status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Métricas Agregadas para o Dashboard (Cache)
CREATE TABLE dashboard_metrics (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de Performance
CREATE INDEX idx_messages_conv ON messages(conversation_id);
CREATE INDEX idx_leads_potential ON leads(potential);

-- Itens do Cardápio
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    category VARCHAR(100),
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Store Vetorial RAG (requer extensão vector já declarada)
CREATE TABLE IF NOT EXISTS vector_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(768),
    source_file VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vector_store_embedding ON vector_store USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Servidores MCP
CREATE TABLE IF NOT EXISTS mcp_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'connected',
    tools JSONB DEFAULT '[]',
    latency INTEGER DEFAULT 0,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agentes Especialistas
CREATE TABLE IF NOT EXISTS specialists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    system_prompt TEXT,
    temperature FLOAT DEFAULT 0.7,
    skills JSONB DEFAULT '[]',
    color VARCHAR(50),
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Skills dos Agentes
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20),
    icon VARCHAR(50),
    config JSONB DEFAULT '{}'
);

-- Tokens WhatsApp
CREATE TABLE IF NOT EXISTS wpp_tokens (
    session_id VARCHAR(100) PRIMARY KEY,
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP WITH TIME ZONE
);

-- Alertas de Staff
CREATE TABLE IF NOT EXISTS staff_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    trigger_condition TEXT,
    message_text TEXT,
    contact_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedbacks de Conversas
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id VARCHAR(255),
    message_id VARCHAR(255),
    is_positive BOOLEAN,
    correction TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agendamentos de Relatórios
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR(50),
    frequency VARCHAR(20),
    destination_email VARCHAR(255),
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Estados de Intervenção
CREATE TABLE IF NOT EXISTS intervention_states (
    conversation_id VARCHAR(255) PRIMARY KEY,
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- LLM Configs
CREATE TABLE IF NOT EXISTS llm_configs (
    provider VARCHAR(50) PRIMARY KEY,
    model VARCHAR(100),
    api_key TEXT,
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
