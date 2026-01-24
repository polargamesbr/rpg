# 🎯 Simulação de Ataque - Teste de Segurança

Este diretório contém scripts que simulam tentativas de hack para demonstrar as vulnerabilidades do sistema atual e como a validação no servidor protege contra ataques.

## ⚠️ AVISO
Estes scripts são apenas para fins educacionais e testes de segurança. **NÃO use em produção ou contra sistemas reais sem autorização.**

## 📁 Estrutura

- `intercept-key.php` - Simula interceptar a chave de sessão
- `decrypt-payload.php` - Descriptografa um payload capturado
- `modify-payload.html` - Interface web para modificar payloads
- `hack-demo.js` - Script JavaScript que demonstra o ataque no navegador

## 🔓 Como Funciona o Ataque

### Passo 1: Interceptar a Chave
O atacante intercepta a requisição `POST /game/explore/get-key` que retorna:
```json
{
  "success": true,
  "token": "...",
  "key": "c98658f6172508ff299ab4664207d5ea3e63e0065fa46bd5ee13cb4f70c918a1"
}
```

### Passo 2: Capturar Payload Criptografado
O atacante captura o payload criptografado do Network tab:
```json
{
  "encrypted": "iXW03xrRORhEoBwz/wFXG/eFqLrSGUjRT99o4hZAVC/...",
  "iv": "5sLZnIf+sLnmwfO4VKCexw==",
  "tag": ""
}
```

### Passo 3: Descriptografar
Com a chave e o payload, o atacante pode descriptografar usando CryptoJS ou PHP.

### Passo 4: Modificar e Tentar Re-enviar
O atacante modifica os dados (ex: HP = 99999) e tenta re-criptografar e enviar.

### Passo 5: Servidor Rejeita
O servidor valida o estado usando `CombatValidator` e rejeita mudanças inválidas.

## 🛡️ Proteções Atuais

1. **Validação no Servidor** - `CombatValidator` valida HP/SP, turnos, inimigos
2. **Chave Única por Sessão** - Cada sessão tem sua própria chave
3. **Validação de Estado Esperado** - Servidor compara com estado anterior

## 🚀 Como Usar

1. Execute o jogo e capture uma requisição real
2. Copie a chave e o payload criptografado
3. Use os scripts para descriptografar e modificar
4. Tente re-enviar e veja o servidor rejeitar
