
import { LLMConfig } from "../types";

export class ApiService {
  private static get isProd(): boolean {
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1';
  }

  private static get baseUrl(): string {
    return this.isProd ? '/api' : 'http://localhost:8000/api';
  }
  
  private static getWSUrl(): string {
    const isSecure = window.location.protocol === 'https:';
    const protocol = isSecure ? 'wss:' : 'ws:';
    const host = this.isProd ? window.location.host : 'localhost:8000';
    return `${protocol}//${host}/ws`;
  }
    
  private static socket: WebSocket | null = null;
  private static listeners: ((data: any) => void)[] = [];

  static connectSocket(clientId: string = 'admin_dash') {
    if (this.socket?.readyState === WebSocket.OPEN) return;
    
    try {
      const url = `${this.getWSUrl()}/${clientId}`;
      console.log('[ApiService] WebSocket handshake:', url);
      
      this.socket = new WebSocket(url);
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach(fn => fn(data));
        } catch (e) {
          console.error('[ApiService] JSON Parse Error', e);
        }
      };

      this.socket.onclose = () => {
        console.warn('[ApiService] Socket closed. Reconnecting...');
        this.socket = null;
        setTimeout(() => this.connectSocket(clientId), 5000);
      };
    } catch (e) {
      console.error('[ApiService] WebSocket Construction Error', e);
    }
  }

  static subscribe(fn: (data: any) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  // --- Specialists & Skills ---
  static async getSpecialists() {
    const res = await fetch(`${this.baseUrl}/specialists`);
    return res.json();
  }

  static async createSpecialist(data: any) {
    const res = await fetch(`${this.baseUrl}/specialists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async updateSpecialist(id: string, data: any) {
    const res = await fetch(`${this.baseUrl}/specialists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async deleteSpecialist(id: string) {
    const res = await fetch(`${this.baseUrl}/specialists/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }

  static async getSkills() {
    const res = await fetch(`${this.baseUrl}/skills`);
    return res.json();
  }

  static async getOptimizationLessons() {
    const res = await fetch(`${this.baseUrl}/optimization/lessons`);
    return res.json();
  }

  // --- Menu Management ---
  static async getMenu() {
    const res = await fetch(`${this.baseUrl}/menu`);
    return res.json();
  }

  static async addMenuItem(item: any) {
    const res = await fetch(`${this.baseUrl}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.json();
  }

  static async deleteMenuItem(id: string) {
    const res = await fetch(`${this.baseUrl}/menu/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }

  // --- Knowledge Management ---
  static async getKnowledgeFiles() {
    const res = await fetch(`${this.baseUrl}/knowledge`);
    return res.json();
  }

  static async uploadKnowledgeFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${this.baseUrl}/knowledge/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  }

  static async deleteKnowledgeDocument(docId: string) {
    const res = await fetch(`${this.baseUrl}/knowledge/${docId}`, {
      method: 'DELETE',
    });
    return res.json();
  }

  // --- MCP & Other Existing ---
  static async getMCPServers() {
    const res = await fetch(`${this.baseUrl}/mcp/servers`);
    return res.json();
  }

  static async deleteMCPServer(serverId: string) {
    const res = await fetch(`${this.baseUrl}/mcp/servers/${serverId}`, {
      method: 'DELETE',
    });
    return res.json();
  }

  static async connectMCP(name: string, url: string) {
    const res = await fetch(`${this.baseUrl}/mcp/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url }),
    });
    return res.json();
  }

  static async syncMCPConnector(connectorId: string) {
    const res = await fetch(`${this.baseUrl}/mcp/connectors/${connectorId}/sync`, {
      method: 'POST',
    });
    return res.json();
  }

  static async getMCPLogs(connectorId: string) {
    const res = await fetch(`${this.baseUrl}/mcp/connectors/${connectorId}/logs`);
    return res.json();
  }

  static async fetchDashboardStats() {
    const res = await fetch(`${this.baseUrl}/stats`);
    return res.json();
  }

  static async fetchDrilldown(scope: string, id: string = 'root') {
    const res = await fetch(`${this.baseUrl}/analytics/drilldown?scope=${scope}&id=${id}`);
    return res.json();
  }

  static async sendMessage(conversation_id: string, text: string, attachments: any[] = []) {
    const res = await fetch(`${this.baseUrl}/conversations/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id, text, attachments }),
    });
    return res.json();
  }

  static async intervene(conversation_id: string, active: boolean) {
    const res = await fetch(`${this.baseUrl}/conversations/intervene`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id, active }),
    });
    return res.json();
  }

  static async sendFeedback(feedback: { conversation_id: string, message_id: string, is_positive: boolean, correction?: string }) {
    const res = await fetch(`${this.baseUrl}/conversations/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    return res.json();
  }

  // --- WhatsApp ---
  static async createWhatsAppInstance(name: string) {
    const res = await fetch(`${this.baseUrl}/whatsapp/instances/${name}/create`, { method: 'POST' });
    return res.json();
  }

  static async getWhatsAppQRCode(name: string) {
    const res = await fetch(`${this.baseUrl}/whatsapp/instances/${name}/qr`);
    return res.json();
  }

  static async connectWhatsAppInstance(name: string) {
    const res = await fetch(`${this.baseUrl}/whatsapp/instances/${name}/connect`, { method: 'POST' });
    return res.json();
  }

  static async getWhatsAppStatus(name: string) {
    const res = await fetch(`${this.baseUrl}/whatsapp/instances/${name}/status`);
    return res.json();
  }

  static async logoutWhatsAppInstance(name: string) {
    const res = await fetch(`${this.baseUrl}/whatsapp/instances/${name}/logout`, { method: 'POST' });
    return res.json();
  }

  static async sendWhatsAppMessage(instance: string, to: string, text: string) {
    const res = await fetch(`${this.baseUrl}/whatsapp/instances/${instance}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, text }),
    });
    return res.json();
  }

  static async generateWppToken(session_id: string, secret: string) {
    const res = await fetch(`${this.baseUrl}/whatsapp/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, secret }),
    });
    return res.json();
  }

  static async regenerateWppToken(session_id: string) {
    const res = await fetch(`${this.baseUrl}/whatsapp/sessions/${session_id}/regenerate-token`, {
        method: 'POST'
    });
    return res.json();
  }

  static async compileTrigger(description: string) {
    const res = await fetch(`${this.baseUrl}/alerts/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    return res.json();
  }

  static async triggerAlert(alertData: any) {
    const res = await fetch(`${this.baseUrl}/alerts/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData),
    });
    return res.json();
  }

  // --- Reports ---
  static async deleteReport(reportId: string) {
    const res = await fetch(`${this.baseUrl}/reports/${reportId}`, {
      method: 'DELETE',
    });
    return res.json();
  }

  static async applyAISuggestion(suggestionId: string) {
    const res = await fetch(`${this.baseUrl}/reports/ai-suggestion/${suggestionId}`, {
      method: 'POST',
    });
    return res.json();
  }

  // --- Prompts ---
  static async refinePromptWithAI(prompt: string) {
    const res = await fetch(`${this.baseUrl}/prompts/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data.refined_prompt;
  }

  // --- Database ---
  static async generateTableWithAI(description: string) {
    const res = await fetch(`${this.baseUrl}/database/generate-table`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    return res.json();
  }

  // --- LLM Config ---
  static async addLLMProvider(config: LLMConfig) {
    // Mocking adding provider locally or backend
    return config;
  }

  // --- Analytics ---
  static async getAnalytics() {
    const res = await fetch(`${this.baseUrl}/analytics`);
    return res.json();
  }

  // --- AI Services ---
  static async transcribeAudio(audio: { url?: string, base64?: string }) {
    const res = await fetch(`${this.baseUrl}/ai/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_url: audio.url, audio_base64: audio.base64 }),
    });
    return res.json();
  }

  static async estimateLLMMetrics(provider: string, model: string) {
    const res = await fetch(`${this.baseUrl}/ai/estimate-metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, model }),
    });
    return res.json();
  }

  static async suggestMenuDescription(itemName: string) {
    const res = await fetch(`${this.baseUrl}/ai/suggest-menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemName }),
    });
    return res.json();
  }

  static async analyzeSentiment(messages: any[]) {
    const res = await fetch(`${this.baseUrl}/ai/analyze-sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    return res.json();
  }

  static async generateTriggerCondition(description: string) {
    const res = await fetch(`${this.baseUrl}/ai/generate-trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    return res.json();
  }

  static async summarizeInsights(data: any) {
    const res = await fetch(`${this.baseUrl}/ai/summarize-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    return res.json();
  }

  static async calculateBanRisk(stats: any) {
    const res = await fetch(`${this.baseUrl}/ai/ban-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats }),
    });
    return res.json();
  }

  static async predictNextIntent(history: string) {
    const res = await fetch(`${this.baseUrl}/ai/predict-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history }),
    });
    return res.json();
  }

  static async saveLLMConfig(config: LLMConfig) {
    const res = await fetch(`${this.baseUrl}/llm/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  }
}
