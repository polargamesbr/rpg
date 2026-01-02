# RPG Game - Sistema MVC

Sistema de RPG web desenvolvido em PHP 8 com arquitetura MVC, MariaDB, autenticação (sessões + JWT) e sistema completo de criação de personagens.

## Estrutura do Projeto

```
rpg/
├── app/                    # Código da aplicação
│   ├── Controllers/       # Controladores MVC
│   ├── Models/            # Modelos de dados
│   ├── Services/          # Serviços (Auth, UUID, etc)
│   └── Middleware/        # Middlewares
├── config/                # Configurações
├── public/               # Ponto de entrada (web root)
│   ├── index.php         # Router principal
│   └── assets/           # Assets estáticos
├── views/                 # Views (templates)
├── migrations/            # Scripts de migração do banco
└── ui/                   # UI de referência (mantida)
```

## Requisitos

- PHP 8.0 ou superior
- MariaDB/MySQL (porta 3307)
- Composer
- Servidor web (Apache/Nginx) com mod_rewrite

## Instalação

1. **Clone o repositório ou navegue até a pasta do projeto**

2. **Instale as dependências do Composer:**
```bash
composer install
```

3. **Configure o arquivo .env:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
DB_HOST=localhost
DB_PORT=3307
DB_NAME=rpg
DB_USER=root
DB_PASS=sua_senha

APP_URL=http://localhost/rpg/public
APP_ENV=development
APP_DEBUG=true

JWT_SECRET=seu-secret-key-aqui-mude-em-producao
SESSION_LIFETIME=7200
```

4. **Execute as migrations:**
```bash
php migrations/run_migrations.php
```

5. **Configure o servidor web:**

**Apache (.htaccess já configurado):**
- Certifique-se de que o mod_rewrite está habilitado
- O DocumentRoot deve apontar para a pasta `public/`

**Nginx:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /caminho/para/rpg/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

## Rotas Disponíveis

- `GET /` - Homepage
- `GET /login` - Página de login
- `POST /login` - Processar login
- `GET /register` - Página de cadastro
- `POST /register` - Processar cadastro
- `GET /logout` - Logout
- `GET /character/create` - Criar personagem (etapa 1: nome)
- `GET /character/select-class` - Selecionar classe (etapa 2)
- `POST /character/store` - Salvar personagem
- `GET /game` - Entrar no jogo (temporário)

## Estrutura do Banco de Dados

### Tabela `users`
- `id` - BIGINT (PK, AUTO_INCREMENT)
- `uuid` - CHAR(36) (UNIQUE, UUID v4)
- `username` - VARCHAR(50) (UNIQUE)
- `email` - VARCHAR(255) (UNIQUE)
- `password_hash` - VARCHAR(255)
- `created_at`, `updated_at` - TIMESTAMP

### Tabela `characters`
- `id` - BIGINT (PK, AUTO_INCREMENT)
- `uuid` - CHAR(36) (UNIQUE, UUID v4)
- `user_id` - BIGINT (FK para users.id)
- `name` - VARCHAR(50)
- `class` - ENUM (Espadachim, Arqueiro, Mago, Ladrão, Acolito, Ferreiro)
- `gender` - ENUM (male, female)
- `level` - INT (default: 1)
- `str`, `agi`, `vit`, `int`, `dex`, `luk` - INT (atributos)
- `hp`, `max_hp`, `mana`, `max_mana` - INT
- `xp`, `gold` - INT
- `created_at`, `updated_at` - TIMESTAMP

## Classes Disponíveis

1. **Espadachim** (Stormhaven) - Força/Vitalidade
2. **Arqueiro** (Eldervale) - Agilidade/Precisão
3. **Mago** (Aetherys) - Inteligência/Magia
4. **Ladrão** (Dunrath) - Agilidade/Furtividade
5. **Acolito** (Lumenfall) - Inteligência/Support
6. **Ferreiro** (Brumaférrea) - Força/Crafting

## Segurança

- Passwords hasheados com bcrypt (`password_hash`)
- Prepared statements em todas as queries (PDO)
- UUID v4 para IDs públicos (não sequenciais)
- Validação de inputs
- Sanitização de outputs nas views

## Próximos Passos

- [ ] Implementar sistema de jogo completo
- [ ] Sistema de combate integrado
- [ ] Sistema de inventário
- [ ] Sistema de quests
- [ ] Sistema de crafting
- [ ] API REST para futuras integrações

## Notas

- A pasta `ui/` é mantida como referência de design
- Todos os assets foram copiados para `public/assets/`
- O sistema usa UUID v4 para evitar exposição de IDs sequenciais
