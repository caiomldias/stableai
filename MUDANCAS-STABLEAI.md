# Mudanças do StableAI

## Resumo

O StableAI foi preparado para publicação pública e avaliação técnica. O aplicativo continua sendo um assistente e organizador financeiro pessoal: ele não movimenta dinheiro, não faz PIX, não paga boletos e não executa ordens de investimento.

## Segurança

- Auditoria realizada em 29 commits e 284 blobs do histórico Git.
- Nenhum segredo real foi encontrado no histórico.
- O único arquivo de ambiente versionado é `.env.example`, com valores vazios.
- O `service_role` continua restrito ao servidor.
- As rotas continuam filtrando os dados pelo `user.id` autenticado.
- A propriedade do item Pluggy é validada antes da sincronização.
- Linhas digitáveis de boletos são cifradas antes de serem persistidas.
- A CSP não permite mais conexão direta do navegador com `api.openai.com`.
- Foi mantido `unsafe-inline` somente em `style-src`, necessário para estilos dinâmicos; `script-src` usa nonce e `strict-dynamic`.
- Secret scanning e secret scanning push protection foram habilitados no GitHub.

> As credenciais Pluggy compartilhadas anteriormente não estão no Git, mas devem ser rotacionadas antes do uso em produção.

## Experiência do usuário

- O botão **Entrar como convidado** foi transformado em ação primária e colocado logo após o formulário de login.
- O modo convidado usa dados fictícios e permite explorar o app sem banco conectado.
- Conexões bancárias, configurações de perfil e personalização ficam bloqueadas com cadeados no modo convidado.
- O fluxo de sair/trocar de conta permanece disponível.

## Documentação e identidade

- O README principal foi reescrito para apresentar:
  - problema do produto;
  - funcionalidades;
  - arquitetura Mermaid;
  - decisões técnicas;
  - tecnologias utilizadas;
  - configuração local e Supabase;
  - segurança e CSP;
  - limitações conhecidas;
  - comandos de qualidade.
- Foi adicionado `docs/screenshot-main.png` com uma captura da tela pública do app.
- Foi adicionada a licença MIT em `LICENSE`.
- O README de `desenvolvimento-pessoal-fiap/projetos/stableai` agora aponta para o repositório principal.

## Qualidade e automação

Foi criado `.github/workflows/ci.yml`, executado em push e pull request, com:

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

Resultado da validação local:

- Typecheck: aprovado
- ESLint: aprovado
- Vitest: 7 arquivos e 18 testes aprovados
- Build Next.js: aprovado
- CI remoto: aprovado

## Higiene do repositório

- `.env*` passou a ser ignorado, mantendo apenas `.env.example` versionado.
- `*.tsbuildinfo` passou a ser ignorado.
- `tsconfig.tsbuildinfo` foi removido do controle de versão.
- O arquivo local `StableAI Mobile App Design.zip` não foi incluído no commit.

## GitHub

- Repositório: <https://github.com/caiomldias/stableai>
- Status: público
- Homepage configurada: <https://app.stableai.workers.dev/>
- Descrição e tópicos técnicos configurados.
- StableAI fixado como primeiro projeto no perfil GitHub.
- `desenvolvimento-pessoal-fiap` fixado como segundo projeto.
- PR aberto: <https://github.com/caiomldias/stableai/pull/2>

## Commits desta etapa

- `fd8e633` — `docs: preparar repositorio para avaliacao tecnica`
- `d8325be` — `docs: apontar StableAI para repositorio principal`

## Pontos de evolução

1. Substituir o rate limiting em memória por um mecanismo distribuído da Cloudflare.
2. Adicionar retries, backoff e observabilidade detalhada para sincronizações Pluggy.
3. Evoluir o modelo de dados financeiro caso o app passe a ter muitos usuários.

