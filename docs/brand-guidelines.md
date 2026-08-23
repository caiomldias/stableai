# StableAI — brand guidelines

StableAI é um assistente financeiro pessoal: transforma contas, gastos e planos em decisões simples. A marca deve transmitir clareza, controle e um toque de magia — nunca promessa de enriquecimento ou aconselhamento financeiro regulado.

## Direção visual

**Leitura de design:** produto financeiro pessoal para uso diário, com linguagem escura, geométrica e confiável, combinando uma grade editorial com um mascote amigável.

**Princípios:**

- **Clareza antes de decoração:** regras e alinhamento organizam o conteúdo.
- **Mágica com responsabilidade:** o Gênio ajuda a entender e planejar; não movimenta dinheiro.
- **Uma cor de ação:** azul-céu é a ação primária e o foco de atenção.
- **Estrutura visível:** divisores de 2px e blocos quadrados dão ritmo ao dashboard.
- **Densidade respirável:** dados financeiros aparecem em grupos curtos, com espaço para leitura no celular.

## Paleta

Os tokens abaixo são a fonte de verdade em `app/globals.css`.

| Token | Hex | Uso |
| --- | --- | --- |
| `--navy-950` | `#071827` | Fundo principal, barra superior e navegação |
| `--navy-900` | `#0A1E2F` | Fundo auxiliar e estados de privacidade |
| `--navy-850` | `#0D2538` | Superfícies, painéis e cartões |
| `--navy-800` | `#123149` | Hover, controles selecionados e cartões de conta |
| `--navy-700` | `#24465C` | Divisores, bordas e linhas estruturais |
| `--baby-500` | `#7CCCF4` | Ação primária, links, foco e destaque |
| `--baby-300` | `#B9E4FA` | Hover claro e texto de apoio destacado |
| `--white-cold` | `#F4F9FC` | Texto principal e ícones sobre fundo escuro |
| `--text-muted` | `#A8C0CF` | Texto secundário, labels e metadados |
| `--success` | `#6FD3A2` | Pago, entrada, conectado e progresso positivo |
| `--warning` | `#F1C77C` | Atenção, boleto pendente e vencimento próximo |
| `--danger` | `#EF8C92` | Atraso, erro e ação destrutiva |

O azul-céu é o único acento de marca. Verde, amarelo e rosa são semânticos: só aparecem para comunicar estado financeiro. Não criar gradientes coloridos nem introduzir roxo como “cor de IA”.

## Tipografia

- **Família:** Archivo, carregada com `next/font` e aplicada por `--font-brand`.
- **Títulos:** peso 700–800, tracking levemente negativo, frases curtas.
- **Texto:** peso 400–600, altura de linha confortável.
- **Valores:** Geist Mono continua reservado para moedas, percentuais, códigos e números tabulares.
- **Labels:** caixa alta, 0,08–0,12em de espaçamento e cor `--text-muted`.

Não usar uma segunda família decorativa. Ênfase deve vir de peso, cor semântica ou `strong`, não de fonte diferente.

## Logo e mascote

O Gênio é um mascote original da StableAI, desenhado para representar uma ideia financeira que ganha forma. A versão raster transparente fica em [`public/stableai-genie.png`](../public/stableai-genie.png).

- Usar o mascote no login, na navegação e em momentos de orientação do assistente.
- Em tamanhos pequenos, manter enquadramento inteiro e fundo `--baby-500` ou `--navy-850`.
- Não esticar, recortar o rosto, trocar as cores ou aplicar sombra pesada.
- Não usar personagens, poses, roupas ou elementos identificáveis de outras franquias. A referência enviada serviu apenas para comunicar o arquétipo de “gênio”; a arte do produto é original.
- Tamanho mínimo recomendado: 24px para o ícone, 40–48px na navegação e 120px ou mais em onboarding/empty states.

O wordmark é `Stable` em `--white-cold` + `AI` em `--baby-500`. A assinatura opcional é **Seu gênio das finanças**.

## Geometria, espaçamento e elevação

- Raios estruturais: `0px`. Painéis, cartões, formulários, abas e botões têm cantos retos.
- Exceções documentadas: avatar e controles circulares continuam redondos; badges de estado podem ser pills.
- Divisor padrão: `2px solid var(--navy-700)`.
- Escala de espaçamento: 4, 8, 12, 16, 24 e 32px.
- Sombras são opcionais e discretas; superfícies principais preferem borda e contraste de fundo.
- No mobile, respeitar `safe-area-inset` e manter alvos de toque com pelo menos 44px.

## Componentes

### Ação primária

Fundo `--baby-500`, texto `--navy-950`, 2px de borda e label alinhado à esquerda quando o botão tiver largura de bloco. Hover usa `--baby-300`; pressed reduz levemente a escala.

### Ação secundária

Fundo transparente ou `--navy-800`, borda `--navy-700` e texto `--white-cold`. O foco usa o anel de 3px `--baby-500` já definido globalmente.

### Painéis e listas

Usar `--navy-850` como superfície, borda de 2px e separadores horizontais. Cards não devem virar uma coleção de caixas flutuantes: agrupar métricas com linhas e espaço negativo.

### Estados

- **Loading:** skeleton que preserva a forma do conteúdo.
- **Vazio:** ícone do módulo, uma explicação curta e uma única próxima ação.
- **Erro:** mensagem contextual próxima ao campo ou ação que falhou.
- **Convidado:** cadeado, explicação do recurso bloqueado e convite para criar uma conta.

## Voz do Gênio

O Gênio fala em português brasileiro, de forma direta, calorosa e útil. Ele pode usar uma metáfora curta (“sem deixar o cartão virar abóbora”), mas sempre mostra o número, a premissa e o próximo passo. Nunca promete retorno, culpa o usuário ou se apresenta como consultor financeiro.

Exemplo bom: “Com R$ 140 por mês, faltam cerca de 11 meses. Se guardar R$ 170, chega em setembro.”

## Acessibilidade e segurança visual

- Texto principal deve manter contraste alto sobre `--navy-950` e `--navy-850`.
- Não comunicar estado apenas por cor: combinar cor com texto ou ícone.
- Todos os controles precisam de `:focus-visible` e label visível.
- Valores podem ser ocultados pelo modo privacidade sem mudar o layout.
- Nunca exibir credenciais bancárias, CPF ou linha digitável completa em mensagens do Gênio.

## Aplicação no código

- Tokens e componentes globais: [`app/globals.css`](../app/globals.css)
- Fonte da marca: [`app/layout.tsx`](../app/layout.tsx)
- Mascote no login e na navegação: [`components/auth-screen.tsx`](../components/auth-screen.tsx) e [`components/finance-app.tsx`](../components/finance-app.tsx)
- O arquivo `StableAI Mobile App Design.zip` é a referência visual de protótipo; esta documentação é a versão operacional para o produto.
