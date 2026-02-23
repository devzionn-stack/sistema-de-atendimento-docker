
import React from 'react';
import { 
  LayoutDashboard, MessageSquare, UtensilsCrossed, 
  Settings, BarChart3, Users, Clock, Smile, 
  Smartphone, ShieldAlert, BookOpen, Send, Lightbulb,
  Cpu, FileSpreadsheet, Database, MessageSquareCode,
  Link2, Mic2, Activity, Network, Users2, Bot, Brain
} from 'lucide-react';
import { AppTab, Conversation, MenuItem, Lead, LLMConfig, ReportSchedule, AgentProfile, AgentSkill } from './types';

// Navegação Agrupada para UX melhorada
export const NAV_GROUPS = [
  {
    id: 'ops',
    label: 'Operacional',
    items: [AppTab.DASHBOARD, AppTab.CONVERSATIONS, AppTab.LIVE_ASSISTANT, AppTab.MENU, AppTab.CRM]
  },
  {
    id: 'intelligence',
    label: 'Inteligência Artificial',
    items: [AppTab.MULTI_AGENTS, AppTab.PROMPT_EDITOR, AppTab.OPTIMIZATION_LOG, AppTab.KNOWLEDGE, AppTab.INSIGHTS]
  },
  {
    id: 'connect',
    label: 'Conectividade',
    items: [AppTab.MCP_CONNECTOR, AppTab.WHATSAPP, AppTab.STAFF]
  },
  {
    id: 'system',
    label: 'Sistema',
    items: [AppTab.LLM_CONFIG, AppTab.DATABASE, AppTab.REPORTS]
  }
];

export const NAV_ITEMS_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  [AppTab.DASHBOARD]: { label: 'Visão Geral', icon: <LayoutDashboard size={20} /> },
  [AppTab.CONVERSATIONS]: { label: 'Conversas', icon: <MessageSquare size={20} /> },
  [AppTab.LIVE_ASSISTANT]: { label: 'Assistente Live', icon: <Mic2 size={20} /> },
  [AppTab.MULTI_AGENTS]: { label: 'Agentes & Skills', icon: <Users2 size={20} /> },
  [AppTab.MCP_CONNECTOR]: { label: 'MCP Connector', icon: <Network size={20} /> },
  [AppTab.MCP_HUB]: { label: 'MCP Hub (Legacy)', icon: <Link2 size={20} /> },
  [AppTab.MENU]: { label: 'Cardápio', icon: <UtensilsCrossed size={20} /> },
  [AppTab.CRM]: { label: 'CRM & Leads', icon: <BarChart3 size={20} /> },
  [AppTab.PROMPT_EDITOR]: { label: 'Prompt Tuner', icon: <MessageSquareCode size={20} /> },
  [AppTab.KNOWLEDGE]: { label: 'Base RAG', icon: <BookOpen size={20} /> },
  [AppTab.INSIGHTS]: { label: 'Insights IA', icon: <Lightbulb size={20} /> },
  [AppTab.WHATSAPP]: { label: 'WhatsApp Status', icon: <Smartphone size={20} /> },
  [AppTab.STAFF]: { label: 'Alertas', icon: <Send size={20} /> },
  [AppTab.LLM_CONFIG]: { label: 'Config. LLM', icon: <Cpu size={20} /> },
  [AppTab.DATABASE]: { label: 'Banco de Dados', icon: <Database size={20} /> },
  [AppTab.REPORTS]: { label: 'Relatórios', icon: <FileSpreadsheet size={20} /> },
  [AppTab.OPTIMIZATION_LOG]: { label: 'Aprendizado (RLHF)', icon: <Brain size={20} /> },
};

// Mock Data for Multi-Agents
export const MOCK_AGENTS: AgentProfile[] = [
  {
    id: 'a1',
    name: 'Bella (Vendas)',
    role: 'Sales Specialist',
    color: 'bg-indigo-600',
    active: true,
    temperature: 0.7,
    skills: ['s1', 's2', 's3', 's5'],
    systemPrompt: 'Você é Bella, especialista em vendas da pizzaria. Seu foco é fechar pedidos, sugerir bordas recheadas e upsell de bebidas.'
  },
  {
    id: 'a2',
    name: 'Luigi (Suporte)',
    role: 'Customer Success',
    color: 'bg-emerald-600',
    active: true,
    temperature: 0.4,
    skills: ['s4', 's6', 's7'],
    systemPrompt: 'Você é Luigi, focado em resolver problemas de entrega, reclamações e dúvidas sobre ingredientes. Seja empático e resolutivo.'
  }
];

export const MOCK_SKILLS: AgentSkill[] = [
  { id: 's1', name: 'Consultar Cardápio', description: 'Acesso leitura DB Produtos', type: 'tool', icon: 'UtensilsCrossed' },
  { id: 's2', name: 'Verificar Estoque', description: 'MCP: ERP Connector', type: 'mcp', icon: 'Box' },
  { id: 's3', name: 'Gerar PIX', description: 'Integração Gateway Pagto', type: 'tool', icon: 'QrCode' },
  { id: 's4', name: 'Rastrear Motoboy', description: 'MCP: Logistics API', type: 'mcp', icon: 'MapPin' },
  { id: 's5', name: 'Recomendação IA', description: 'Engine de Upsell Preditivo', type: 'rag', icon: 'Sparkles' },
  { id: 's6', name: 'Consultar Manual', description: 'RAG: Políticas da Empresa', type: 'rag', icon: 'Book' },
  { id: 's7', name: 'Escalar Humano', description: 'Transbordo para Staff', type: 'tool', icon: 'Headphones' },
];

export const STAT_CARDS = [
  { label: 'Conversas Ativas', value: '42', trend: '+12%', icon: <MessageSquare size={20} className="text-indigo-600" /> },
  { label: 'Conexões MCP', value: '5', trend: 'Estável', icon: <Link2 size={20} className="text-emerald-600" /> },
  { label: 'Tempo de Resposta', value: '0.4s', trend: '-0.3s', icon: <Activity size={20} className="text-orange-600" /> },
  { label: 'IA Accuracy', value: '98.4%', trend: '+2%', icon: <Smile size={20} className="text-pink-600" /> },
];

export const MOCK_MCP_CONNECTORS: any[] = [
  { id: '1', name: 'Planilha de Estoque Local', type: 'google_sheets', status: 'connected', lastSync: 'Há 5 min' },
  { id: '2', name: 'Banco de Dados ERP (Legacy)', type: 'postgres', status: 'connected', lastSync: 'Há 1 min' },
  { id: '3', name: 'Shopify Store (App)', type: 'shopify', status: 'error', lastSync: 'Falha na Autenticação' },
];

// Added MOCK_CONVERSATIONS for ConversationLogs.tsx
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    phoneNumber: '+55 11 99999-8888',
    userName: 'João Silva',
    messages: [
      { id: 'm1', sender: 'user', text: 'Olá, gostaria de pedir uma pizza.', timestamp: new Date().toISOString() },
      { id: 'm2', sender: 'agent', text: 'Claro! Qual sabor você prefere?', timestamp: new Date().toISOString() }
    ],
    lastInteraction: new Date().toISOString(),
    status: 'active'
  },
  {
    id: '2',
    phoneNumber: '+55 11 97777-6666',
    userName: 'Maria Souza',
    messages: [
      { id: 'm3', sender: 'user', text: 'Entrega na Rua das Flores?', timestamp: new Date().toISOString() }
    ],
    lastInteraction: new Date().toISOString(),
    status: 'active'
  }
];

// Added MOCK_MENU for MenuManagement.tsx
export const MOCK_MENU: MenuItem[] = [
  { id: 'p1', name: 'Margherita', description: 'Molho de tomate pelado, mussarela de búfala e manjericão fresco.', price: 45.0, category: 'Pizzas Clássicas', available: true },
  { id: 'p2', name: 'Pepperoni', description: 'Mussarela premium com fatias generosas de pepperoni italiano.', price: 52.0, category: 'Pizzas Especiais', available: true }
];

// Added MOCK_LEADS for CRMLeads.tsx
export const MOCK_LEADS: Lead[] = [
  { id: 'l1', userName: 'Carlos Mendes', phoneNumber: '+55 11 91234-5678', lastIntent: 'Pedido Grande', potential: 'high', status: 'Qualificado' },
  { id: 'l2', userName: 'Ana Rocha', phoneNumber: '+55 11 95555-4444', lastIntent: 'Dúvida Preço', potential: 'medium', status: 'Novo' }
];

// Added MOCK_LLM_PROVIDERS for LLMManager.tsx
export const MOCK_LLM_PROVIDERS: LLMConfig[] = [
  { provider: 'gemini', apiKey: 'SK-GEMINI-V3-ALPHA', model: 'gemini-3-flash-preview', isActive: true },
  { provider: 'groq', apiKey: 'SK-GROQ-LLAMA3-70B', model: 'llama-3.1-70b', isActive: false },
  { provider: 'openai', apiKey: 'SK-GPT-4O-MINI', model: 'gpt-4o-mini', isActive: false }
];

// Added MOCK_REPORT_SCHEDULES for ReportsManager.tsx
export const MOCK_REPORT_SCHEDULES: ReportSchedule[] = [
  { id: 'r1', type: 'Financeiro', frequency: 'Diário', destination: 'financeiro@bellanapoli.com', nextRun: 'Amanhã, 08:00' },
  { id: 'r2', type: 'Sentimento', frequency: 'Semanal', destination: 'marketing@bellanapoli.com', nextRun: 'Segunda, 09:00' }
];

// Added DB_SCHEMA for DatabaseSchema.tsx
export const DB_SCHEMA = [
  {
    name: 'conversations',
    columns: [
      { name: 'id', description: 'Identificador único da conversa', type: 'UUID' },
      { name: 'session_id', description: 'ID da sessão do WhatsApp', type: 'VARCHAR(255)' },
      { name: 'context_embedding', description: 'Vetor de contexto da IA', type: 'VECTOR(1536)' }
    ]
  },
  {
    name: 'menu_items',
    columns: [
      { name: 'id', description: 'Primary key', type: 'UUID' },
      { name: 'name', description: 'Nome do prato', type: 'TEXT' },
      { name: 'price', description: 'Valor unitário', type: 'NUMERIC' }
    ]
  },
  {
    name: 'vector_store',
    columns: [
      { name: 'id', description: 'ID do fragmento', type: 'UUID' },
      { name: 'content', description: 'Texto indexado para RAG', type: 'TEXT' },
      { name: 'embedding', description: 'Representação vetorial', type: 'VECTOR(1536)' }
    ]
  }
];
