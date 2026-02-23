
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid

class SkillModel(BaseModel):
    id: str
    name: str
    description: str
    type: str # 'tool', 'mcp', 'rag'
    icon: str = 'Box'

class SpecialistModel(BaseModel):
    id: str
    name: str
    role: str
    description: str
    status: str # 'active', 'inactive'
    system_prompt: str
    temperature: float
    skills: List[str] # IDs das skills
    color: str
    icon: str

class SpecialistManager:
    def __init__(self):
        # In-memory storage simulado
        self._skills: Dict[str, SkillModel] = {
            "s1": SkillModel(id="s1", name="Consultar Cardápio", description="Acesso leitura DB Produtos", type="tool", icon="UtensilsCrossed"),
            "s2": SkillModel(id="s2", name="Verificar Estoque", description="MCP: ERP Connector", type="mcp", icon="Box"),
            "s3": SkillModel(id="s3", name="Gerar PIX", description="Integração Gateway Pagto", type="tool", icon="QrCode"),
            "s4": SkillModel(id="s4", name="Rastrear Motoboy", description="MCP: Logistics API", type="mcp", icon="MapPin"),
            "s5": SkillModel(id="s5", name="Recomendação IA", description="Engine de Upsell Preditivo", type="rag", icon="Sparkles"),
        }
        
        self._specialists: Dict[str, SpecialistModel] = {
            "a1": SpecialistModel(
                id="a1", 
                name="Bella (Vendas)", 
                role="Sales Specialist", 
                description="Especialista em fechamento de pedidos e upsell.",
                status="active",
                system_prompt="Você é Bella, foque em vendas.",
                temperature=0.7,
                skills=["s1", "s3", "s5"],
                color="bg-indigo-600",
                icon="Bot"
            ),
             "a2": SpecialistModel(
                id="a2", 
                name="Luigi (Suporte)", 
                role="Customer Success", 
                description="Resolução de problemas e dúvidas.",
                status="active",
                system_prompt="Você é Luigi, resolva problemas com empatia.",
                temperature=0.4,
                skills=["s4", "s1"],
                color="bg-emerald-600",
                icon="Headphones"
            )
        }

    async def get_all_specialists(self) -> List[SpecialistModel]:
        return list(self._specialists.values())

    async def get_specialist(self, specialist_id: str) -> Optional[SpecialistModel]:
        return self._specialists.get(specialist_id)

    async def create_specialist(self, data: SpecialistModel) -> SpecialistModel:
        if not data.id:
            data.id = str(uuid.uuid4())
        self._specialists[data.id] = data
        return data

    async def update_specialist(self, specialist_id: str, data: SpecialistModel) -> SpecialistModel:
        if specialist_id in self._specialists:
            self._specialists[specialist_id] = data
            return data
        raise ValueError("Specialist not found")

    async def delete_specialist(self, specialist_id: str):
        if specialist_id in self._specialists:
            del self._specialists[specialist_id]
            return True
        return False

    async def get_all_skills(self) -> List[SkillModel]:
        return list(self._skills.values())

specialist_service = SpecialistManager()
