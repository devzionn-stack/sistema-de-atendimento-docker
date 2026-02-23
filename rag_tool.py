
from langchain_core.tools import tool
from typing import List, Dict, Optional
import json
from database_service import db_service

@tool
async def query_menu_database(query: Optional[str] = None) -> str:
    """
    Consulta o banco de dados oficial de pizzas, sabores, ingredientes e preços atuais.
    Use sempre que o cliente perguntar 'o que tem no cardápio', 'quais os sabores' ou 'qual o preço'.
    """
    # Simulação de consulta SQL direta
    pizzas = [
        {"name": "Margherita", "price": 45.0, "ingredients": ["Molho", "Mussarela", "Manjericão"]},
        {"name": "Pepperoni", "price": 52.0, "ingredients": ["Molho", "Mussarela", "Pepperoni"]},
        {"name": "Calabresa", "price": 48.0, "ingredients": ["Molho", "Mussarela", "Calabresa", "Cebola"]}
    ]
    return json.dumps({"status": "success", "source": "official_database", "menu": pizzas}, ensure_ascii=False)

@tool
async def search_knowledge_base(query: str) -> str:
    """
    Pesquisa na base de conhecimento semântica (RAG) por documentos, FAQs, manuais e políticas.
    Retorna os trechos mais relevantes do manual de operação ou PDFs indexados.
    """
    try:
        results = await db_service.search_rag(query, limit=4)
        
        if not results:
            return json.dumps({
                "status": "empty",
                "message": "Nenhuma informação relevante encontrada nos documentos."
            }, ensure_ascii=False)

        formatted_results = []
        for r in results:
            formatted_results.append({
                "source": r.get('metadata', {}).get('source', 'unknown'),
                "content": r.get('content', '')[:500] + "..." # Truncar para não estourar contexto
            })

        return json.dumps({
            "status": "success",
            "query": query,
            "relevant_chunks": formatted_results
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})

@tool
def process_payment_pix(amount: float, order_description: str) -> str:
    """Gera um link de pagamento PIX para o cliente finalizar o pedido."""
    payment_link = f"https://payment.pizzaria.com/checkout/{int(amount*100)}"
    return json.dumps({"status": "success", "payment_link": payment_link, "message": "Link gerado."})

@tool
def manage_inventory_stock(item_name: str, action: str, quantity: float) -> str:
    """Consulta ou atualiza o estoque de ingredientes."""
    return f"Operação {action} em {item_name} concluída."

@tool
def delegate_task_to_staff(staff_name: str, task_desc: str, priority: str = "medium") -> str:
    """Delega tarefas para humanos no staff."""
    return f"Tarefa '{task_desc}' atribuída a {staff_name}."

@tool
def generate_and_send_receipt(order_id: str) -> str:
    """Gera o link do recibo PDF para o cliente."""
    return f"Recibo gerado: https://pizzaria.com/receipts/{order_id}.pdf"

@tool
async def search_menu(query: str) -> str:
    """
    Busca itens específicos no cardápio da pizzaria.
    Use para responder perguntas sobre preços, disponibilidade e descrição de pizzas.
    Input: nome ou categoria do item desejado (ex: 'margherita', 'pizzas especiais', 'bebidas')
    """
    menu = await db_service.get_menu()
    # Filtra por nome ou categoria (case-insensitive)
    results = [
        item for item in menu
        if query.lower() in item['name'].lower() 
        or query.lower() in item['category'].lower()
        or query.lower() in str(item.get('description', '')).lower()
    ]
    if not results:
        return "Nenhum item encontrado no cardápio para essa busca."
    
    formatted = "\n".join([
        f"• {item['name']} ({item['category']}) — R$ {float(item['price']):.2f}\n  {item.get('description', '')}\n  Disponível: {'Sim' if item.get('available', True) else 'Não'}"
        for item in results
    ])
    return f"Itens encontrados no cardápio:\n{formatted}"

tools = [
    search_menu,
    query_menu_database,
    search_knowledge_base,
    process_payment_pix, 
    manage_inventory_stock, 
    delegate_task_to_staff,
    generate_and_send_receipt
]
