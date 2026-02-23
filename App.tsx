
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DashboardHome from './components/DashboardHome';
import ConversationLogs from './components/ConversationLogs';
import MenuManagement from './components/MenuManagement';
import Analytics from './components/Analytics';
import WhatsAppIntegration from './components/WhatsAppIntegration';
import CRMLeads from './components/CRMLeads';
import PromptEditor from './components/PromptEditor';
import KnowledgeManager from './components/KnowledgeManager';
import StaffAlerts from './components/StaffAlerts';
import InsightsPanel from './components/InsightsPanel';
import LLMManager from './components/LLMManager';
import ReportsManager from './components/ReportsManager';
import DatabaseSchema from './components/DatabaseSchema';
import MCPHub from './components/MCPHub';
import MCPConnector from './components/MCPConnector';
import MCPAddServer from './components/MCPAddServer';
import LiveAssistant from './components/LiveAssistant';
import AgentBuilder from './components/AgentBuilder';
import ProductForm from './components/ProductForm';
import OptimizationLog from './components/OptimizationLog';
import DatabaseGenerator from './components/DatabaseGenerator';
import AgentCreator from './components/AgentCreator';
import { AppTab } from './types';
import { ApiService } from './services/apiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);

  useEffect(() => {
    // Inicializa conexão real-time com o backend
    ApiService.connectSocket();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.DASHBOARD: return <DashboardHome setActiveTab={setActiveTab} />;
      case AppTab.CONVERSATIONS: return <ConversationLogs />;
      case AppTab.MENU: return <MenuManagement />;
      case AppTab.WHATSAPP: return <WhatsAppIntegration />;
      case AppTab.CRM: return <CRMLeads />;
      case AppTab.KNOWLEDGE: return <KnowledgeManager />;
      case AppTab.STAFF: return <StaffAlerts />;
      case AppTab.INSIGHTS: return <InsightsPanel />;
      case AppTab.LLM_CONFIG: return <LLMManager />;
      case AppTab.REPORTS: return <ReportsManager />;
      case AppTab.DATABASE: return <DatabaseSchema onCreateClick={() => setActiveTab(AppTab.DATABASE_GENERATE)} />;
      case AppTab.PROMPT_EDITOR: return <PromptEditor />;
      case AppTab.MCP_HUB: return <MCPHub onAddClick={() => setActiveTab(AppTab.MCP_ADD)} />;
      case AppTab.MCP_CONNECTOR: return <MCPConnector onAddClick={() => setActiveTab(AppTab.MCP_ADD)} />;
      case AppTab.MCP_ADD: return <MCPAddServer onBack={() => setActiveTab(AppTab.MCP_CONNECTOR)} />;
      case AppTab.LIVE_ASSISTANT: return <LiveAssistant />;
      case AppTab.MULTI_AGENTS: return <AgentBuilder onCreateClick={() => setActiveTab(AppTab.NEW_AGENT_FORM)} />;
      
      // Rotas dedicadas (órfãs)
      case AppTab.NEW_PRODUCT_FORM: return <ProductForm onCancel={() => setActiveTab(AppTab.MENU)} />;
      case AppTab.OPTIMIZATION_LOG: return <OptimizationLog />;
      case AppTab.DATABASE_GENERATE: return <DatabaseGenerator onCancel={() => setActiveTab(AppTab.DATABASE)} />;
      case AppTab.NEW_AGENT_FORM: return <AgentCreator onCancel={() => setActiveTab(AppTab.MULTI_AGENTS)} />;
      
      default: return <DashboardHome setActiveTab={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-[1600px] mx-auto pb-12">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
