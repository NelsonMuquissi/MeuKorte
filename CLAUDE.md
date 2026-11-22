# Korte.

A marca é **Korte.** (com o ponto dourado). Até Novembro de 2026 chamava-se
"Meu Korte"; o nome antigo ainda aparece no domínio, no email e nas redes
(`business.ts`), à espera de confirmação.

Plataforma angolana de marcação de cortes de cabelo com barbeiros.

## Produto

**Problema.** Clientes perdem tempo à espera nas barbearias, a execução do corte demora,
não conseguem escolher o barbeiro de preferência e a maior parte das barbearias não tem
sistema de marcação.

**Solução.** Marcar um corte com o barbeiro preferido, no horário escolhido, com
possibilidade de atendimento ao domicílio. Serviço personalizado, rápido e com qualidade
padronizada.

**Público.**
1. Profissionais sem tempo, que procuram conveniência, confiança e qualidade.
2. Público masculino mais jovem, que valoriza conforto, conveniência e praticidade.

**Não é para.** Quem prefere atendimento espontâneo sem marcação, quem não usa
smartphone com frequência, quem já tem barbeiro fixo, e quem procura apenas o preço
mais baixo — o valor aqui está na conveniência e na poupança de tempo.

**Canais.** Instagram e TikTok. **Atendimento:** WhatsApp Business.

**Receita.** Comissão por marcação, subscrição de membro, corte avulso.

**Metas do MVP (90 dias).** 4 barbeiros parceiros · 100 utilizadores · 25+ marcações ·
90% de satisfação/recorrência.

**Duas jornadas, porque há duas perguntas.** Quem quer o barbeiro em casa pergunta
"quem me vai cortar?"; quem vai ao salão pergunta "qual é a casa mais perto de mim?".
A página inicial separa-as na secção "Os nossos serviços", logo abaixo do herói
(um card para cada), e cada uma começa onde o seu cliente começa:

| Jornada | Rota | Passos |
|---|---|---|
| **Domicílio** | `/agendar` | Serviço → Estilo → Barbeiro → Agendamento → Localização → Confirmação |
| **Salão** | `/salao` | Barbearia → Serviço → Estilo → Barbeiro e hora → Confirmação |

A jornada do salão é **sempre no salão**: o passo "No salão ou em sua casa?"
saiu a pedido do cliente. Os passos Serviço, Estilo e o resumo são as mesmas
peças nas duas jornadas (`src/components/booking/FlowParts.tsx`).

Na jornada do salão o **barbeiro é opcional**: há "qualquer um disponível", que
reúne as horas livres da casa inteira e só atribui o profissional na confirmação.
Com um único barbeiro elegível a opção não aparece — não abriria hora nenhuma a
mais.

Depois de confirmado, o resto é igual nas duas: o barbeiro recebe o pedido por
WhatsApp → aceita ou rejeita → cliente recebe confirmação → serviço é realizado →
cliente avalia.

## Fase actual: SEM BACKEND

- Dados de barbeiros e serviços em ficheiros TS em `src/data/`.
- Marcações e avaliações no `localStorage`.
- Confirmação de marcação via link `wa.me` com mensagem pré-preenchida.
- Deploy no Vercel (Next nativo, **sem** `output: 'export'`).

**Fase seguinte: Django + DRF + PostgreSQL.** Por isso, desde já:

- Todo o acesso a dados passa por `src/services/`, com funções `async` que imitam uma
  API REST. **Componentes nunca acedem directamente a JSON nem ao `localStorage`.**
- O armazenamento está isolado em `src/services/storage.ts`. Trocar o `localStorage` por
  `fetch` deve tocar apenas em `src/services/`.
- Os tipos em `src/types/` (`Barbershop`, `Barber`, `Service`, `Booking`, `Review`,
  `BookingStatus`) definem o contrato da futura API. A `Barbershop` é dona do
  horário de porta aberta: no salão, nenhum barbeiro atende fora dele.
  As respostas dos serviços seguem o formato do DRF.

## Referência de design

**As referências de Novembro de 2026 em `Novas_Referencias/` são a fonte de
verdade.** A pasta é **local e não entra no git** (está em `.git/info/exclude`).
Substituem os templates antigos de `docs/template/` onde se sobrepõem.

| Ficheiro em `Novas_Referencias/` | O que é |
|---|---|
| `Korte. Minimalist Gold-Dot Wordmark.png` | Logótipo "Korte." → `public/brand/korte*.png` |
| `Barber Landing Page Hero Design.png` | Herói da página inicial |
| `Serviços de Barbearia MeuKorte.png` | "Os nossos serviços": domicílio, salão e painel "confiança" |
| `Como Funciona_ Agendamento de Barbeiro.png` | "Como funciona" |
| `Meet Talatona's Best Barbers.png` | Cards dos barbeiros (home e `/barbeiros`) |
| `Modern Barber Booking Service Selection.png` | Passo "Serviço" |
| `Korte. Estilo de Corte Premium.png` | Passo "Estilo" |
| `Modern Barber Booking Confirmation.png` | "Tudo pronto!" (resumo) |
| `Agendamento de Barbeiro Confirmado.png` | Ecrã final |
| `FAQS.txt` | Texto das perguntas frequentes |
| `WhatsApp Image *.jpeg`, `Screenshot *.png` | Pedidos do cliente: o que está riscado a vermelho é para sair |

**Saiu, a pedido do cliente:** planos de assinatura, banner "Mais do que um
corte. É confiança." (escuro), frase debaixo do logótipo no rodapé, filtros da
lista de barbeiros, passo "Formato" do salão.

### Superfícies

- **Clara (por omissão)** — o site inteiro: fundo creme `#F7F5F2`, cards
  brancos com borda subtil.
- **Escura** (`data-surface="dark"`) — só o cabeçalho dos fluxos, o rodapé e a
  barra lateral da conta. Fundo `#12171B`.

O cabeçalho das páginas públicas é claro; nos fluxos (`/agendar`, `/salao`)
encolhe e fica escuro, com o logótipo branco.

### Cor

O **dourado `#C7914A`** (o ponto do logótipo) é preenchimento: CTA, item
seleccionado, stepper, ícones. **Nunca é cor de estado.**

- Texto sobre o dourado é a tinta escura (6,5:1). **Branco sobre dourado não**
  (2,8:1) — as referências mostram-no, mas não se lê.
- Dourado como **texto** sobre o claro usa-se `text-accent` (`#94622A`, 4,6:1),
  nunca `text-gold` (2,55:1). É o que pinta "onde estiver.", os rótulos dos
  passos e os preços dos cards.

### Terminologia e tom

Na interface diz-se **"agendamento"**. No código mantém-se `booking`.

O tom é **formal**, como nas referências e no texto do cliente: "o seu
barbeiro", "para si", "Escolha", "Agende". Não "o teu", "Escolhe".

## Regras Next.js

- App Router. **Server Components por defeito**; `"use client"` apenas onde há
  interactividade ou `localStorage`.
- O `localStorage` só é lido dentro de `useEffect` (ou do hook `useLocalBookings`),
  **nunca durante o render** — evita erros de hidratação.
- `next/image` para imagens, `next/font` para fontes, Metadata API para SEO.
- Rotas dinâmicas de barbeiros com `generateStaticParams`.
- As páginas públicas devem sair estáticas no output do `npm run build`.

## Convenções

- Tailwind com design tokens definidos no `globals.css` (`@theme`), em duas
  superfícies (clara por omissão, escura) — ver "Referência de design".
- **Mobile-first**: a maioria dos utilizadores usa telemóvel. Verificar a 360px.
- Texto da interface em **português de Angola**, tom formal: "telemóvel",
  "actualizar", "ecrã", "contacto". Nunca "celular", "atualizar".
- Moeda **Kwanza**, formato `5 000 Kz` (espaço como separador de milhares).
- Telefones **+244**. `<html lang="pt-AO">`.
- **Código, nomes de ficheiros e componentes em inglês; rotas (URLs) em português.**

## Rotas

| Rota | Conteúdo |
|---|---|
| `/` | Página inicial — recebe o tráfego do Instagram e do TikTok |
| `/barbeiros` | Lista de barbeiros |
| `/barbeiros/[id]` | Perfil do barbeiro (`generateStaticParams`) |
| `/agendar` | Jornada do domicílio (aceita `?barbeiro=id`) |
| `/salao` | Jornada do salão (aceita `?barbearia=id`) |
| `/marcar` | Redirecciona para `/agendar` |
| `/conta` | Área do cliente: perfil, próximos e histórico |
| `/minhas-marcacoes` | Redirecciona para `/conta` |
| `/painel-barbeiro` | Área do barbeiro (demo, atrás de PIN, `noindex`) |
| `/admin` | Painel administrativo (demo, atrás de PIN, `noindex`) |

## Decisões em aberto

Zona piloto, preços, formato (salão/domicílio/ambos), taxa de deslocação e
comissão **ainda não estão definidos**. O momento do pagamento, os métodos e as
regras de cancelamento (6 h, 15 min de tolerância) foram confirmados pelo
cliente nas FAQ de Novembro de 2026.

Ficam todos em `src/config/business.ts` com valores **provisórios**, cada um com o
comentário `// PROVISÓRIO — confirmar`.

**Nunca escrever preços ou regras directamente nos componentes.**

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
