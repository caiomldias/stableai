# StableAI

Assistente e organizador financeiro pessoal instalável em Android e iOS.

## Projeto pessoal

Criei o StableAI para entender melhor para onde meu dinheiro vai e transformar minhas finanças em decisões simples. Ele reúne contas, gastos e planos em uma única interface, ajudando a acompanhar o presente e planejar compras futuras sem depender de várias planilhas ou aplicativos bancários.

O StableAI é somente um assistente e organizador: ele não movimenta dinheiro, não faz PIX e não paga boletos.

## Identidade visual

A direção visual, paleta, tipografia, uso do mascote e regras de componentes estão em [docs/brand-guidelines.md](./docs/brand-guidelines.md).

## O que ele faz

- Conecta instituições financeiras pela Pluggy e sincroniza contas diariamente.
- Organiza gastos por PIX, cartão, boleto, recorrência e categoria.
- Exibe gráficos, orçamentos mensais e lançamentos manuais em BRL ou USD.
- Mostra cartões, boletos disponíveis, contas recorrentes e investimentos.
- Registra compras emprestadas no cartão e lembra quem precisa pagar.
- Cria cofrinhos, metas de compra e listas de desejos com previsão de prazo.
- Oferece um instrutor financeiro por IA usando somente dados agregados.
- Envia lembretes opcionais no aplicativo, por e-mail ou notificação push.

## Como funciona

1. O usuário entra pelo Supabase Auth e escolhe uma instituição no Pluggy Connect.
2. As rotas seguras do Next.js consultam a Pluggy; credenciais bancárias nunca passam pelo StableAI.
3. Contas, transações, boletos compatíveis e investimentos são consolidados no PostgreSQL do Supabase.
4. A interface classifica os gastos e preserva ajustes pessoais, como categorias, metas e cobranças.
5. Um Cloudflare Worker executa a sincronização diária e processa os lembretes.
6. Quando acionada, a IA recebe apenas resumos financeiros, sem CPF, credenciais ou linhas digitáveis.

## Linguagens e tecnologias

| Área | Tecnologias |
| --- | --- |
| Aplicativo e APIs | TypeScript, Next.js 16, React 19 e Zod |
| Interface | CSS, Radix Themes, Phosphor Icons e Recharts |
| Banco e segurança | PostgreSQL/PLpgSQL, Supabase Auth e Row Level Security |
| Integração financeira | Pluggy Connect e API Pluggy |
| Infraestrutura | Cloudflare Workers, OpenNext e PWA/service worker |
| Qualidade | Vitest, ESLint e TypeScript typecheck |

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
