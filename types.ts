
export enum Sentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  ingredients?: string[];
  interactiveType?: 'list' | 'button' | 'catalog';
}

export interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  sentiment?: Sentiment;
  feedback?: 'positive' | 'negative';
  mediaUrl?: string;
  mediaType?: 'pdf' | 'video' | 'image';
}

export interface Conversation {
  id: string;
  phoneNumber: string;
  userName: string;
  messages: Message[];
  lastInteraction: string;
  status: 'active' | 'archived';
  sentimentSummary?: Sentiment;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  CONVERSATIONS = 'conversations',
  MENU = 'menu',
  WHATSAPP = 'whatsapp',
  CRM = 'crm',
  KNOWLEDGE = 'knowledge',
  STAFF = 'staff',
  INSIGHTS = 'insights',
  LLM_CONFIG = 'llm_config',
  REPORTS = 'reports',
  DATABASE = 'database',
  PROMPT_EDITOR = 'prompt_editor',
  MCP_HUB = 'mcp_hub',
  MCP_ADD = 'mcp_add',
  MCP_CONNECTOR = 'mcp_connector',
  LIVE_ASSISTANT = 'live_assistant',
  MULTI_AGENTS = 'multi_agents',
  // Novas Tabs
  NEW_PRODUCT_FORM = 'new_product_form',
  OPTIMIZATION_LOG = 'optimization_log',
  DATABASE_GENERATE = 'database_generate',
  NEW_AGENT_FORM = 'new_agent_form'
}

export interface NavGroup {
  id: string;
  label: string;
  items: string[]; // IDs das tabs
}

export interface Specialist {
  id: string;
  name: string;
  role: string;
  description: string;
  status: 'active' | 'inactive';
  system_prompt: string;
  temperature: number;
  skills: string[]; // IDs das skills
  color: string;
  icon: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'tool' | 'mcp' | 'rag';
  config?: any;
}

export interface AgentLesson {
  id: string;
  conversation_id: string;
  trigger_message: string;
  correction: string;
  learned_rule: string;
  timestamp: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  role: string; 
  color: string;
  systemPrompt: string;
  temperature: number;
  active: boolean;
  skills: string[]; 
}

export interface AgentSkill {
    id: string;
    name: string;
    description: string;
    type: 'tool' | 'mcp' | 'rag';
    icon: string;
}

export interface MCPTool {
  name: string;
  description: string;
  isActive: boolean;
}

export interface MCPServerData {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline' | 'error' | 'syncing';
  latency: number;
  tools: MCPTool[];
  lastPing: string;
}

export interface MCPLog {
  id: string;
  timestamp: string;
  server: string;
  action: string;
  status: 'info' | 'success' | 'error';
  payload?: string;
}

export interface MCPConnector {
  id: string;
  name: string;
  type: 'postgres' | 'google_sheets' | 'local_file' | 'shopify' | 'custom_mcp';
  status: 'connected' | 'error' | 'pending';
  lastSync: string;
  url?: string;
}

export interface LLMConfig {
  provider: 'gemini' | 'groq' | 'openai';
  apiKey: string;
  model: string;
  isActive: boolean;
}

export interface BanRiskMetrics {
  score: number;
  reason: string;
  recommendation: string;
}

export type SessionStatus = 'disconnected' | 'starting' | 'qr_ready' | 'scanning' | 'authenticated' | 'connected' | 'error';

export interface WppSession {
  id: string;
  name: string;
  status: SessionStatus;
  qrCode: string | null;
  apiToken: string | null;
  latency: number;
  logs: any[];
}

export interface Lead {
  id: string;
  userName: string;
  phoneNumber: string;
  lastIntent: string;
  potential: 'high' | 'medium' | 'low';
  status: string;
}

export interface AlertConfig {
  id: string;
  name: string;
  contactNumber: string;
  messageText: string;
  triggerCondition: string;
  isActive: boolean;
}

export interface KnowledgeItem {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  status: 'indexed' | 'processing' | 'error';
  tokenCount: number;
}

export interface ReportSchedule {
  id: string;
  type: string;
  frequency: string;
  destination: string;
  nextRun: string;
}
