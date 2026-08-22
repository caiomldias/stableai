# StableAI

Assistente e organizador financeiro pessoal instalável em Android e iOS.

## Executar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000` e escolha **Explorar demonstração**. O modo demonstração funciona sem credenciais e salva alterações no próprio navegador.

## Configurar contas reais

1. Crie um projeto no Supabase.
2. Execute [001_initial.sql](./supabase/migrations/001_initial.sql) no SQL Editor.
3. Ative e configure E-mail, Telefone, Google e Facebook em Authentication.
4. Copie as URLs e chaves do Supabase para `.env.local`.
5. Copie um novo Client ID e Client Secret da Pluggy para `.env.local`.
6. Defina `NEXT_PUBLIC_APP_URL`, `PLUGGY_WEBHOOK_SECRET` e `CRON_SECRET`.
7. Para o instrutor por IA, defina `OPENAI_API_KEY`. O app usa `gpt-5.6-luna` por padrão e aceita `OPENAI_MODEL` para alteração.
8. Para lembretes por e-mail, defina `RESEND_API_KEY` e `NOTIFICATION_FROM_EMAIL`. O envio só ocorre depois que o usuário ativar E-mail nos ajustes.

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, `PLUGGY_CLIENT_SECRET`, `CRON_SECRET` ou `OPENAI_API_KEY` em variáveis com prefixo `NEXT_PUBLIC_`.

## Pluggy

- O widget é aberto no navegador com um Connect Token temporário.
- A chave da API e o Client Secret existem somente no servidor.
- Webhooks atualizam uma conexão depois de eventos da instituição.
- O cron em `vercel.json` reconcilia todas as conexões diariamente.
- Dados de boleto e DDA aparecem apenas quando o conector oferece `paymentData`. O cadastro manual é o fallback.

Use o Sandbox Pluggy durante o desenvolvimento. O widget inclui sandbox automaticamente fora de produção.

## Instalar no celular

### iPhone

Abra o domínio no Safari, toque em **Compartilhar** e escolha **Adicionar à Tela de Início**.

### Android

Abra o domínio no Chrome, toque no menu e escolha **Instalar app**.

O service worker é registrado em builds de produção.

## Verificações

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Segurança

- APIs financeiras exigem um token Supabase válido.
- O banco usa Row Level Security e também verifica o usuário em cada rota.
- Dados bancários originais são preservados. Categorias e cobranças ficam em uma camada local.
- O endpoint de metadados bloqueia IPs privados, limita redirects, tamanho e tempo da resposta.
- O modo IA recebe apenas agregados financeiros e usa `store: false`.
- Desconectar uma instituição exige escolher entre manter ou apagar o histórico.

Antes de usar produção, regenere qualquer segredo que já tenha sido enviado por chat ou copiado para um local inseguro.
