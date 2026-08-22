# Product Spec: StableAI

## 1. Resumo

StableAI é um assistente e organizador financeiro pessoal instalável em Android e iOS. O produto conecta contas bancárias pela Pluggy, consolida gastos, cartões, investimentos e boletos disponíveis, e ajuda o usuário a controlar cobranças pessoais, cofrinhos, metas de compra e desejos.

O aplicativo não movimenta dinheiro, não paga boletos e não executa investimentos. Seu papel é organizar, explicar e lembrar.

## 2. Público-alvo

- Primeira versão: uso pessoal do proprietário.
- Evolução prevista: múltiplos usuários independentes, cada um com dados isolados.
- Usuários brasileiros que utilizam bancos tradicionais, bancos digitais e contas em BRL ou USD.

## 3. Problema

Informações financeiras ficam espalhadas entre bancos, cartões, corretoras, boletos e anotações pessoais. Também é difícil separar uma compra própria de uma compra feita para outra pessoa, acompanhar quem deve pagar, planejar uma compra e entender o impacto de cada decisão no orçamento.

## 4. Objetivos

- Consolidar seis meses de dados financeiros em uma visão simples.
- Identificar gastos por PIX, cartão, boleto e recorrência.
- Mostrar receitas, despesas, saldos e gráficos úteis.
- Organizar valores de cartão que devem ser cobrados de terceiros.
- Mostrar investimentos recuperados pela Pluggy.
- Criar cofrinhos virtuais, metas e desejos.
- Oferecer orientação matemática e orientação por IA com consentimento.
- Sincronizar os dados bancários diariamente.
- Funcionar como PWA instalável em Android e iOS, incluindo iPhone 16.

## 5. Não objetivos

- Pagar boletos, fazer PIX ou movimentar dinheiro.
- Comprar, vender ou recomendar ativos financeiros.
- Substituir um contador, planejador financeiro ou consultor de investimentos.
- Alterar o dado original recebido do banco.
- Garantir a localização de todos os boletos DDA quando o conector bancário não fornecer esses dados.
- Publicar em App Store ou Google Play no primeiro MVP. O MVP será instalável pelo navegador.

## 6. Escopo do MVP

### Conta e acesso

- Cadastro e login por e-mail e senha.
- Login com Google.
- Login por celular com código de uso único.
- Login com Facebook.
- Recuperação de conta e encerramento de sessão.
- Estrutura de dados preparada para múltiplos usuários.

### Conexões financeiras

- Fluxo Pluggy Connect no aplicativo.
- Suporte condicionado à cobertura da Pluggy para Nubank, Mercado Pago, PicPay, Itaú, Santander, Banco do Brasil e Sicoob.
- Ambiente sandbox durante o desenvolvimento.
- Ativação de produção após validação.
- Sincronização diária e botão de atualização manual.
- Histórico inicial de seis meses.
- Confirmação do usuário antes de apagar ou manter dados ao desconectar uma instituição.

### Dashboard

- Saldo consolidado.
- Receitas e despesas do período.
- Total em BRL e USD, sem misturar moedas sem conversão explícita.
- Gastos por categoria e meio de pagamento.
- Próximos vencimentos e cobranças pendentes.
- Estado da última sincronização.

### Gastos

- Filtros para PIX, cartão, boleto, recorrentes e demais transações.
- Categoria automática e edição local da categoria.
- Nota, etiquetas e sinalização de gasto compartilhado.
- Registro bancário original preservado e imutável.
- Camada de ajustes do usuário armazenada separadamente.

### Contas recorrentes

- Detecção automática a partir de pelo menos três ocorrências semelhantes.
- Confirmação ou rejeição pelo usuário.
- Previsão do próximo vencimento.
- Lembretes configuráveis.

### Boletos e DDA

- Exibir boletos identificados em transações e `paymentData` quando o conector fornecer os campos.
- Exibir linha digitável, valor, beneficiário e datas quando disponíveis.
- Área de boletos pendentes, pagos e vencidos.
- Cadastro manual como alternativa quando o banco não fornecer DDA.
- Não realizar pagamentos.
- Informar claramente quando a instituição conectada não oferece cobertura de boleto ou DDA.

### Cartão emprestado

- Selecionar uma compra do cartão.
- Informar o nome da pessoa a cobrar.
- Informar o valor devido, inclusive valor parcial.
- Registrar vencimento, parcelas, observação e status.
- Marcar manualmente como pago.
- Mostrar total por pessoa e cobranças vencidas.

### Investimentos

- Lista de investimentos recuperados pela Pluggy.
- Instituição, tipo, nome, saldo, valor aplicado e lucro quando disponíveis.
- Total por moeda e por instituição.
- Nenhuma recomendação automática de compra ou venda.

### Cofrinhos e metas

- Cofrinhos virtuais, sem movimentação bancária.
- Nome, ícone, valor-alvo, valor reservado e moeda.
- Aportes manuais.
- Meta de compra calculada pelo valor do item e capacidade de aporte por dia, semana ou mês.
- Previsão de prazo e data estimada de conclusão.
- Recalcular quando preço ou aporte mudar.

### Lista de desejos

- Adicionar URL de produto.
- Buscar título, imagem e preço quando a página permitir.
- Permitir correção manual de qualquer dado importado.
- Escolher contribuição diária, semanal ou mensal.
- Criar uma meta a partir do desejo.
- Lembretes configuráveis.

### Instrutor financeiro

- Modo matemático local para prazos, aportes e cenários.
- Modo IA para explicar gastos e sugerir ações organizacionais.
- Consentimento explícito antes de enviar dados à IA.
- Enviar dados agregados e mínimos, sem CPF, credenciais bancárias, linha digitável ou identificadores da Pluggy.
- Respostas apresentadas como orientação educacional, não como aconselhamento de investimento.

## 7. Histórias de usuário

- Como usuário, quero conectar um banco para visualizar meus dados sem digitá-los manualmente.
- Como usuário, quero ver quanto gastei por PIX, cartão, boleto e recorrências.
- Como usuário, quero corrigir a categoria de um gasto sem alterar o dado bancário original.
- Como usuário, quero marcar uma compra como feita para minha mãe e lembrar quanto devo cobrar.
- Como usuário, quero ver meus investimentos reunidos em um só lugar.
- Como usuário, quero separar virtualmente uma parte do meu dinheiro em um cofrinho.
- Como usuário, quero saber quantos meses levarei para comprar um item guardando um valor fixo.
- Como usuário, quero colar o link de um produto e transformar esse desejo em uma meta.
- Como usuário, quero receber lembretes antes de vencimentos e datas de aporte.
- Como usuário, quero escolher se meus dados antigos serão apagados ao desconectar um banco.

## 8. Fluxos principais

### Primeiro acesso

1. Criar conta ou entrar com um provedor.
2. Aceitar termos e política de privacidade.
3. Escolher moeda principal.
4. Abrir Pluggy Connect.
5. Conectar instituição e conceder consentimento.
6. Aguardar sincronização.
7. Abrir o dashboard com estados de carregamento e cobertura.

### Classificar um gasto

1. Abrir Gastos.
2. Filtrar ou buscar a transação.
3. Abrir detalhes.
4. Alterar categoria, nota ou etiqueta.
5. Salvar ajuste local.

### Registrar cartão emprestado

1. Abrir uma transação de cartão.
2. Tocar em `Alguém precisa me pagar`.
3. Informar nome, valor e vencimento.
4. Acompanhar em Cobranças.
5. Marcar manualmente como pago.

### Planejar uma compra

1. Informar nome, preço e moeda.
2. Informar quanto pode guardar e a frequência.
3. Receber prazo e data estimada.
4. Criar cofrinho ou desejo.
5. Registrar aportes e acompanhar o progresso.

### Desconectar banco

1. Abrir a instituição.
2. Solicitar desconexão.
3. Escolher entre apagar os dados importados ou manter o histórico.
4. Confirmar novamente quando a opção for apagar.

## 9. Telas e navegação

### Navegação inferior no celular

- Início
- Gastos
- Planejar
- Investimentos
- Mais

### Telas

- Entrada, cadastro e recuperação.
- Onboarding e conexão bancária.
- Dashboard.
- Gastos e detalhes de transação.
- Contas recorrentes.
- Boletos.
- Cartões e faturas.
- Cobranças pessoais.
- Investimentos.
- Cofrinhos.
- Planejador de compra.
- Lista de desejos.
- Instrutor financeiro.
- Notificações.
- Conexões e configurações.
- Privacidade, exportação e exclusão de dados.

## 10. Modelo de dados

| Entidade | Campos principais |
| --- | --- |
| User | id, nome, e-mail, telefone, moeda principal, fuso, preferências |
| InstitutionConnection | id, userId, pluggyItemId, instituição, status, última sincronização |
| Account | id, userId, connectionId, pluggyAccountId, tipo, moeda, saldo |
| Transaction | id, userId, accountId, pluggyTransactionId, data, descrição, valor, moeda, tipo, categoria original, metadados de pagamento |
| TransactionOverride | transactionId, categoria local, nota, etiquetas |
| RecurringPayment | id, userId, descrição, valor médio, frequência, próxima data, confirmado |
| Boleto | id, userId, transactionId opcional, origem, linha digitável criptografada, valor, vencimento, status |
| SharedExpense | id, userId, transactionId, pessoa, valor devido, vencimento, parcelas, nota, status |
| Investment | id, userId, connectionId, pluggyInvestmentId, tipo, moeda, saldo, lucro, metadados |
| Vault | id, userId, nome, ícone, moeda, meta, reservado |
| VaultContribution | id, vaultId, valor, data, nota |
| PurchaseGoal | id, userId, nome, preço, moeda, aporte, frequência, data estimada, status |
| WishlistItem | id, userId, url, título, imagem, preço, moeda, dados manuais |
| NotificationPreference | userId, tipo, canal, antecedência, ativo |
| AuditEvent | id, userId, ação, alvo, data, metadados seguros |

Todas as tabelas com dados pessoais devem possuir `userId` e políticas de isolamento por usuário.

## 11. Requisitos funcionais

- RF01: conectar e atualizar instituições pelo Pluggy Connect.
- RF02: importar contas, transações e investimentos cobertos.
- RF03: classificar PIX, cartão, boleto e recorrências.
- RF04: permitir ajustes locais sem alterar a fonte bancária.
- RF05: detectar recorrências e exigir confirmação.
- RF06: mostrar boletos disponíveis e aceitar cadastro manual.
- RF07: controlar cobranças associadas a compras no cartão.
- RF08: manter investimentos separados por moeda.
- RF09: calcular metas por aporte diário, semanal ou mensal.
- RF10: extrair dados de links com fallback manual.
- RF11: enviar lembretes configuráveis.
- RF12: fornecer análise matemática e análise por IA com consentimento.
- RF13: solicitar decisão de retenção ao desconectar uma instituição.
- RF14: exportar e excluir dados do usuário.

## 12. Requisitos não funcionais

- PWA instalável e responsiva em Safari iOS e Chrome Android.
- Layout otimizado para o iPhone 16, respeitando safe areas e `100dvh`.
- WCAG 2.2 AA para contraste, teclado, foco e formulários.
- TLS em todo tráfego.
- Credenciais da Pluggy e da IA somente no servidor.
- Dados sensíveis criptografados em trânsito e em repouso.
- Isolamento de usuário por Row Level Security.
- Logs sem CPF, tokens, linhas digitáveis ou conteúdo bancário completo.
- Valores monetários armazenados como inteiros na menor unidade da moeda.
- Datas armazenadas em UTC e exibidas em `America/Sao_Paulo` por padrão.
- Idempotência na importação e sincronização.
- Estados de carregamento, vazio, erro, ausência de cobertura e dados desatualizados.
- Metas de desempenho: LCP abaixo de 2,5 s, INP abaixo de 200 ms e CLS abaixo de 0,1 na interface principal.

## 13. Integrações

### Pluggy

- Usar Pluggy Connect para conexão e consentimento.
- Criar `connectToken` no backend.
- Nunca expor `CLIENT_SECRET` no navegador ou no aplicativo instalado.
- Armazenar o `itemId` por usuário no banco local.
- Consumir contas, transações, cartões, investimentos e dados de pagamento no backend.
- Receber webhooks assinados e executar sincronização diária de reconciliação.
- Respeitar paginação e limites de frequência do plano.

### Autenticação

- Supabase Auth para e-mail e senha, Google, telefone e Facebook.
- MFA fica fora do MVP, mas deve ser possível acrescentá-lo.

### IA

- API de modelo chamada somente no servidor.
- Prompt com dados agregados, consentidos e minimizados.
- Sem decisões automatizadas, movimentação financeira ou recomendação de ativos.

### Cotação BRL e USD

- Guardar moeda original de todos os valores.
- Buscar uma taxa diária BRL/USD de fonte oficial ou confiável.
- Mostrar a taxa e a data usada em totais convertidos.
- Permitir visualização sem conversão quando a taxa estiver indisponível.

### Metadados de desejos

- Buscar Open Graph e dados estruturados do URL no servidor.
- Bloquear endereços privados, redirecionamentos inseguros e respostas excessivas para evitar SSRF.
- Respeitar limites, timeout e política do site.
- Manter edição manual como fallback obrigatório.

### Notificações

- Notificações dentro do app no MVP.
- Push Web quando suportado e autorizado.
- E-mail como fallback para vencimentos importantes.

## 14. Direção visual

### Design read

Aplicativo financeiro de confiança para uso diário, com linguagem calma, clara e premium. O sistema prioriza leitura rápida no celular e evita decoração que concorra com os dados.

### Dials

- `DESIGN_VARIANCE: 4`
- `MOTION_INTENSITY: 3`
- `VISUAL_DENSITY: 6`

### Sistema de produto

- Base: Radix Themes, sem misturar com outro design system.
- Tipografia: Geist e Geist Mono para valores tabulares.
- Ícones: Phosphor com peso visual padronizado.
- Tema: escuro em toda a aplicação.
- Movimento: somente feedback de toque, transição de estado e abertura de conteúdo.
- Formas: cartões com raio de 16 px, campos com 12 px e botões em formato pill.
- Navegação: inferior no celular, lateral compacta em telas largas.

### Paleta semântica inicial

- Fundo principal azul-marinho profundo: `#071827`.
- Superfície: `#0D2538`.
- Superfície elevada: `#123149`.
- Azul-bebê de ação: `#7CCCF4`.
- Azul-bebê suave: `#B9E4FA`.
- Texto principal branco frio: `#F4F9FC`.
- Texto secundário: `#A8C0CF`.
- Bordas: `#24465C`.
- Erro: vermelho dessaturado acessível, reservado apenas para erro.
- Sucesso: verde dessaturado acessível, reservado apenas para estado positivo.

Azul-bebê é o único acento de marca. Verde e vermelho são usados apenas quando carregam significado financeiro ou de sistema.

### Representação por figuras

- PIX: símbolo de transferência da família Phosphor.
- Cartão: cartão de crédito.
- Boleto: código de barras ou documento.
- Recorrentes: setas circulares ou calendário recorrente.
- Investimentos: gráfico ascendente.
- Cofrinho: cofre ou porquinho.
- Planejamento: alvo.
- Desejos: coração ou sacola.
- Cobranças: pessoa com recibo.

Não serão usados emojis, SVGs desenhados manualmente, brilhos neon, excesso de glassmorphism ou animações contínuas.

## 15. Riscos e compensações

### Cobertura de DDA

A Pluggy fornece `paymentData` e metadados de boleto somente em conectores compatíveis. Isso não equivale a uma garantia de consulta nacional de todos os boletos emitidos no CPF. O MVP deve mostrar a cobertura real por instituição, importar o que estiver disponível e oferecer cadastro manual. Uma integração DDA dedicada só será adicionada quando houver fornecedor e contrato adequados.

### Disponibilidade dos bancos

A cobertura varia por instituição, tipo de conector, plano da Pluggy e produto. A tela de conexão deve explicar produtos suportados antes do consentimento.

### PWA no iOS

O aplicativo será instalável pelo Safari, mas notificações e tarefas em segundo plano têm limitações de plataforma. Sincronizações diárias devem ocorrer no servidor, não depender do aplicativo aberto.

### Autenticação ampla

Quatro métodos de login aumentam configuração e suporte. O MVP implementa os quatro solicitados, mas cada provedor exige credenciais, URLs de retorno e revisão próprias.

### IA e privacidade

Dados financeiros são sensíveis. O modo IA deve ser opcional, minimizado e transparente. O modo matemático continua disponível sem envio de dados a um modelo.

### Duas moedas

Somar BRL e USD sem uma taxa identificada gera resultados enganosos. A interface deve separar moedas por padrão e mostrar taxa e data sempre que converter.

## 16. Questões abertas para a implementação

- Confirmar o provedor e a conta usados para envio de e-mail.
- Criar credenciais OAuth de Google e Facebook.
- Escolher fornecedor de SMS para telefone, se o serviço de autenticação não cobrir a região desejada.
- Definir o provedor de IA e sua chave de servidor.
- Confirmar plano e cobertura efetiva da Pluggy para cada instituição.
- Decidir se push Web entra no primeiro lançamento ou em uma iteração logo depois.
- Definir domínio, hospedagem e textos legais antes de usar dados reais.

# MVP priorizado

## Entrega inicial

1. Conta, autenticação e isolamento por usuário.
2. PWA instalável, tema escuro e navegação principal.
3. Pluggy sandbox, contas, transações, cartões e investimentos.
4. Dashboard e filtros de gastos.
5. Ajustes locais, recorrências e cobranças pessoais.
6. Cofrinhos, metas e lista de desejos com fallback manual.
7. Boletos conforme cobertura e cadastro manual.
8. Notificações internas e e-mail.
9. Instrutor matemático e modo IA consentido.
10. Produção Pluggy, observabilidade, exportação e exclusão.

## Depois do MVP

- Aplicativos nativos publicados nas lojas, se as limitações da PWA justificarem.
- Compartilhamento ou envio de cobranças para terceiros.
- Conciliação automática do pagamento feito pela pessoa.
- DDA dedicado com fornecedor adicional.
- Orçamentos familiares e espaços compartilhados.
- Importação de notas fiscais.
- MFA para a conta StableAI.

# Decisões de arquitetura

## ADR 001: PWA com Next.js

### Status

Proposto.

### Contexto

O produto deve ser instalável em Android e iOS, oferecer interface rápida e executar operações seguras no servidor.

### Decisão

Usar Next.js com TypeScript e App Router. O app terá manifest, service worker, ícones instaláveis e layouts responsivos. Rotas de servidor cuidarão da Pluggy, IA, metadados de links e tarefas agendadas.

### Consequências

- Uma base atende Android, iOS e desktop.
- Não exige publicação em lojas no MVP.
- Recursos de sistema ficam limitados ao que cada navegador oferece.

## ADR 002: Supabase para autenticação e dados

### Status

Proposto.

### Contexto

O produto começa pessoal, mas deve suportar usuários futuros e quatro formas de login.

### Decisão

Usar Supabase Auth e PostgreSQL com Row Level Security. O backend Next.js usa uma credencial de serviço apenas onde for necessário.

### Consequências

- Login social, telefone e e-mail usam um provedor único.
- Isolamento por usuário é reforçado no banco.
- Configuração OAuth e SMS ainda é necessária.

## ADR 003: Pluggy somente pelo backend

### Status

Proposto.

### Contexto

As credenciais da Pluggy são sensíveis e o Connect Token tem escopo e validade limitados.

### Decisão

Gerar o Connect Token no servidor, abrir o widget no cliente e armazenar o `itemId` associado ao usuário. Toda leitura detalhada e sincronização passa pelo servidor.

### Consequências

- O segredo nunca aparece no bundle do navegador.
- Webhooks e sincronização diária ficam centralizados.
- A aplicação precisa tratar renovação de API key, idempotência e limites de frequência.

## ADR 004: Fonte bancária imutável com ajustes locais

### Status

Proposto.

### Contexto

O usuário quer editar categorias e atribuir compras a terceiros, mas dados sincronizados podem mudar novamente.

### Decisão

Manter transações importadas imutáveis e guardar ajustes, notas e cobranças em tabelas locais relacionadas.

### Consequências

- Ressincronizações não apagam decisões do usuário.
- A interface precisa diferenciar dado bancário e anotação pessoal.

## ADR 005: IA opcional e minimizada

### Status

Proposto.

### Contexto

O usuário deseja cálculos objetivos e orientação por IA com dados financeiros sensíveis.

### Decisão

Executar cálculos determinísticos localmente. Chamar um modelo somente após consentimento e apenas com agregados necessários para a pergunta.

### Consequências

- Metas e cálculos continuam funcionando sem IA.
- O usuário entende quando dados serão processados externamente.
- O app precisa registrar consentimento e permitir revogação.

## ADR 006: Radix Themes para a interface de produto

### Status

Proposto.

### Contexto

`design-taste-frontend` não é indicado como sistema de dashboard. O app exige controles acessíveis, formulários, diálogos e navegação consistente.

### Decisão

Usar Radix Themes como único sistema de componentes, CSS variables para os tokens da marca e Phosphor Icons para as figuras. As regras relevantes de `design-taste-frontend` serão usadas para tipografia, contraste, paleta, forma, estados e acabamento.

### Consequências

- Componentes funcionais partem de uma base acessível.
- A interface não será o tema padrão da biblioteca.
- Não serão misturados Material, shadcn, Carbon ou Fluent.

# Plano de implementação

1. Criar o projeto Next.js TypeScript e a fundação PWA.
2. Configurar Radix Themes, tokens, Geist e Phosphor.
3. Configurar Supabase, autenticação e Row Level Security.
4. Criar o modelo de dados e migrações.
5. Implementar onboarding e Pluggy Connect em sandbox.
6. Implementar importação idempotente e webhooks.
7. Construir dashboard, gráficos, filtros e detalhes.
8. Implementar ajustes locais, recorrências, boletos e cobranças.
9. Implementar investimentos, cofrinhos, metas e desejos.
10. Implementar notificações e tarefas diárias.
11. Implementar instrutor matemático e modo IA.
12. Adicionar exportação, exclusão e retenção na desconexão.
13. Validar Android, iPhone 16, acessibilidade, Lighthouse e estados de falha.
14. Ativar produção da Pluggy após teste com sandbox.

# Critérios de aceite do MVP

- O app pode ser instalado pela tela inicial em Android e iOS.
- Um usuário não consegue ler dados de outro usuário.
- Nenhuma credencial sensível aparece no cliente, logs ou repositório.
- Uma conta sandbox da Pluggy pode ser conectada e sincronizada.
- O dashboard mostra seis meses de dados e separa BRL de USD.
- Gastos podem ser filtrados e anotados sem modificar a fonte.
- Uma compra pode gerar uma cobrança pessoal e ser marcada como paga.
- Investimentos importados aparecem separados por instituição e moeda.
- Uma meta de R$ 1.000 com aporte mensal de R$ 100 resulta em dez meses, sem considerar rendimento.
- Links de desejos têm fallback de edição manual.
- Ausência de cobertura DDA é comunicada claramente.
- IA nunca recebe CPF, segredo bancário, tokens ou linha digitável.
- Os fluxos principais passam em iPhone 16 e Android moderno.

# Handoff de implementação

Implemente este projeto usando esta Product Spec e os ADRs como fonte de verdade. Antes de codificar, inspecione o repositório e crie um plano curto. Mantenha as mudanças limitadas ao MVP, preserve segredos fora do código e use sandbox antes de dados reais. Execute testes relevantes, lint, typecheck, auditoria de acessibilidade e validação PWA antes de finalizar.
