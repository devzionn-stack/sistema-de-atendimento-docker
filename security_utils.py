
import os
from cryptography.fernet import Fernet

class SecurityManager:
    """Gerencia a criptografia de dados sensíveis como API Keys."""
    
    def __init__(self):
        # Em produção, a chave deve vir de uma variável de ambiente (ENCRYPTION_KEY)
        self.key = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
        self.fernet = Fernet(self.key.encode())

    def encrypt_key(self, api_key: str) -> str:
        """Cifra a chave para armazenamento no PostgreSQL."""
        return self.fernet.encrypt(api_key.encode()).decode()

    def decrypt_key(self, encrypted_key: str) -> str:
        """Decifra a chave para uso em tempo de execução pelo LLM."""
        return self.fernet.decrypt(encrypted_key.encode()).decode()

security = SecurityManager()
