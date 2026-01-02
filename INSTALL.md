# Instruções de Instalação Rápida

## 1. Instalar Dependências

```bash
composer install
```

## 2. Configurar Banco de Dados

Edite o arquivo `.env` (copie de `.env.example` se necessário):

```env
DB_HOST=localhost
DB_PORT=3307
DB_NAME=rpg
DB_USER=root
DB_PASS=sua_senha_aqui
```

## 3. Executar Migrations

```bash
php migrations/run_migrations.php
```

Isso criará as tabelas `users` e `characters` no banco de dados `rpg`.

## 4. Configurar Servidor Web

### Apache (WAMP/XAMPP)
- O `.htaccess` já está configurado
- Certifique-se de que o DocumentRoot aponte para a pasta `public/`
- Acesse: `http://localhost/rpg/public`

### Nginx
Configure o server block para apontar para `public/` e use o try_files como mostrado no README.md

## 5. Testar

1. Acesse `http://localhost/rpg/public`
2. Clique em "Cadastrar"
3. Crie uma conta
4. Crie seu personagem

## Estrutura de URLs

- `/` - Homepage
- `/login` - Login
- `/register` - Cadastro
- `/character/create` - Criar personagem (nome)
- `/character/select-class` - Escolher classe

## Troubleshooting

### Erro de conexão com banco
- Verifique se o MariaDB está rodando na porta 3307
- Confirme as credenciais no `.env`

### Página 404
- Verifique se o mod_rewrite está habilitado (Apache)
- Confirme que o DocumentRoot aponta para `public/`

### Assets não carregam
- Verifique se a pasta `public/assets/` existe e tem os arquivos
- Confirme os caminhos nas views (devem ser relativos: `assets/img/...`)

