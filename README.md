# Meu Korte

Plataforma angolana de marcação de cortes de cabelo com barbeiros. Em Luanda,
o cliente escolhe o barbeiro, escolhe a hora e é atendido no salão ou em casa.

Esta é a **versão do MVP, sem backend**: os barbeiros estão em ficheiros TS, as
marcações e as avaliações ficam no `localStorage` do telemóvel de cada cliente e
a confirmação é feita por WhatsApp. Serve para validar a procura durante os 90
dias de teste, antes de se construir o backend em Django.

O contexto permanente do projecto está em [`CLAUDE.md`](./CLAUDE.md).

## Arrancar

```bash
npm install
npm run dev          # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Serve o build de produção |
| `npm run lint` | ESLint |
| `npm test` | Testes (Vitest) |
| `npm run test:watch` | Testes em modo contínuo |

## Estrutura

```
src/
├── app/                      Rotas (App Router). URLs em português.
│   ├── page.tsx              /                   página inicial
│   ├── barbeiros/            /barbeiros          lista, com filtros
│   │   └── [id]/             /barbeiros/[slug]   perfil (generateStaticParams)
│   ├── marcar/               /marcar             fluxo de marcação
│   ├── minhas-marcacoes/     consultar, cancelar, avaliar
│   ├── painel-barbeiro/      demonstração, atrás de PIN
│   ├── admin/                demonstração, atrás de PIN
│   ├── sitemap.ts            robots.ts, not-found.tsx, error.tsx
│   └── globals.css           design tokens (@theme)
├── components/
│   ├── ui/                   Button, Card, Modal, Toast, StatusBadge, Rating, PinGate
│   ├── layout/               Header, Footer, WhatsAppButton
│   ├── home/                 Faq
│   ├── barbers/              BarberCard, BarberList, BarberFilters, BarberReviews
│   └── booking/              BookingFlow, MyBookings, ReviewForm, BarberPanel, AdminPanel
├── config/business.ts        ⚠️ preços, taxas, regras e contactos — TODOS provisórios
├── data/barbers.ts           4 barbeiros de demonstração
├── services/                 acesso a dados; imita uma API DRF
│   ├── storage.ts            o único sítio que conhece o localStorage
│   ├── barbersService.ts
│   ├── bookingsService.ts    inclui getAvailableSlots (com testes)
│   └── reviewsService.ts
├── types/index.ts            contrato da futura API
├── hooks/                    useLocalBookings, useIsClient
└── lib/                      format (Kz, telemóvel, datas), whatsapp, image
```

### Regras de arquitectura

O objectivo é que a passagem para **Django + DRF + PostgreSQL** toque só em
`src/services/`:

- Os componentes **nunca** acedem a JSON nem ao `localStorage` — passam sempre
  pelos serviços, que são funções `async` com respostas no formato do DRF.
- `src/types/` define o contrato da futura API.
- Os preços e as regras **nunca** são escritos nos componentes: vêm de
  `src/config/business.ts`.
- `localStorage` só é lido depois da montagem, através do hook `useIsClient` ou
  de `useLocalBookings`, nunca durante o render.

## Deploy no Vercel

O projecto é Next nativo, **sem `output: 'export'`** — o Vercel trata de tudo.

1. Põe o código num repositório Git (GitHub, GitLab ou Bitbucket).
2. Em [vercel.com/new](https://vercel.com/new), importa o repositório. O Vercel
   detecta o Next.js sozinho: *framework* Next.js, build `npm run build`, sem
   nada para configurar à mão.
3. Define a variável de ambiente, em **Settings → Environment Variables**:

   | Variável | Valor | Para quê |
   |---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://meukorte.ao` | URL absoluto nas imagens de Open Graph e no `sitemap.xml` |

   Sem esta variável o site funciona na mesma: usa o `VERCEL_URL` do deploy, ou
   `https://meukorte.ao` como último recurso. Mas com o domínio definitivo as
   partilhas no WhatsApp e no Instagram ficam certas.
4. **Deploy.** Cada `git push` passa a gerar um novo deploy.
5. Em **Settings → Domains**, liga o domínio próprio.

### Confirmar depois do deploy

- [ ] `/sitemap.xml` e `/robots.txt` respondem e apontam para o domínio certo.
- [ ] Partilhar o link no WhatsApp mostra a imagem `og.jpg`.
- [ ] O botão do WhatsApp abre a conversa com o número certo.
- [ ] No build, as páginas públicas aparecem como `○ (Static)` ou `● (SSG)`.

## ⚠️ Antes do lançamento: valores por confirmar

**Todos** os valores abaixo estão em `src/config/business.ts` marcados com
`// PROVISÓRIO — confirmar`. São decisões que a secção 8 do plano do MVP deixa
em aberto e que **têm de ser confirmadas com o negócio antes de o site ir para
o ar** — neste momento o site mostra-as ao cliente como se fossem definitivas.

Para as encontrar todas:

```bash
grep -n "PROVISÓRIO" src/config/business.ts
```

### Zona e formato

| Valor | Actual | Decisão em aberto |
|---|---|---|
| `PILOT_AREA.district` | Talatona | Qual é a zona inicial de teste? |
| `PILOT_AREA.homeServiceAreas` | 5 zonas | Onde há mesmo atendimento ao domicílio? |
| `SERVICE_FORMATS.salon` / `.home` | ambos `true` | Salão, domicílio ou os dois? |

### Preços (Kwanzas)

| Valor | Actual | Nota |
|---|---|---|
| `PRICING.standardCut` | 5 000 Kz | Preço de um corte normal |
| `PRICING.cutAndBeard` | 7 500 Kz | |
| `PRICING.beard` | 3 000 Kz | |
| `PRICING.kidsCut` | 4 000 Kz | |
| `PRICING.lineUp` | 2 500 Kz | Aparece no hero como "a partir de" |
| `PRICING.homeServiceFee` | 2 500 Kz | **Haverá taxa de deslocação?** |

### Receita

| Valor | Actual | Decisão em aberto |
|---|---|---|
| `PLANS.member.price` | 18 000 Kz/mês | Preço da subscrição de membro |
| `PLANS.member.includedCuts` | 4 | Cortes incluídos por mês |
| `COMMISSION.rate` | 15% | Comissão, subscrição ou ambos? |
| `PAYMENT.moment` | `on_service` | Paga ao marcar ou no fim do serviço? |
| `PAYMENT.methods` | Multicaixa Express, Transferência, Numerário | Confirmar métodos |

### Cancelamentos e atrasos

| Valor | Actual | Decisão em aberto |
|---|---|---|
| `CANCELLATION.minHoursBefore` | 2 h | Antecedência mínima para cancelar |
| `CANCELLATION.lateToleranceMinutes` | 15 min | Tolerância de atraso |
| `CANCELLATION.noShowPenalty` | `false` | Há penalização por falta? |

### Contactos

| Valor | Actual | Nota |
|---|---|---|
| `CONTACT.whatsappNumber` | `244936327119` | ✅ Confirmado — é por aqui que passam as marcações |
| `CONTACT.whatsappDisplay` | +244 936 327 119 | ✅ Confirmado |
| `CONTACT.email` | ola@meukorte.ao | |
| `CONTACT.instagram` / `.tiktok` | `meukorte` | Confirmar os nomes de utilizador |

### Marcação

| Valor | Actual | Nota |
|---|---|---|
| `SLOT_INTERVAL_MINUTES` | 30 | Intervalo da grelha de horários |
| `MIN_BOOKING_NOTICE_HOURS` | 1 h | Antecedência mínima para marcar |
| `BOOKING_WINDOW_DAYS` | 30 | Até quando se pode marcar (a interface mostra 14 dias) |

### Segurança

| Valor | Actual | Nota |
|---|---|---|
| `DEMO_PIN` | `2024` | ⚠️ **Não é segurança.** Ver abaixo. |

## Outras coisas a saber

### O PIN dos painéis não protege nada

`/painel-barbeiro` e `/admin` estão atrás de um PIN verificado no navegador. O
PIN está no JavaScript enviado ao cliente e qualquer pessoa o lê. Só serve para
esconder as demonstrações de visitantes casuais enquanto não há autenticação a
sério. **Nunca pôr dados reais de clientes nestes painéis** antes do Django.
Ambas as rotas têm `noindex` e estão no `Disallow` do `robots.txt`.

### Os dados ficam no dispositivo

Marcações e avaliações vivem no `localStorage` do navegador de cada cliente.
Não são partilhadas entre dispositivos nem entre clientes, e perdem-se se o
utilizador limpar os dados do navegador. A página `/minhas-marcacoes` diz isto
ao cliente. Os indicadores do `/admin` só contam o que existe naquele
dispositivo — servem para demonstrar o painel, não para medir o negócio.

### Fotografias

As fotos em `public/barbers/` são **imagens provisórias** geradas com as
iniciais de cada barbeiro. Substituir por fotografias reais (quadradas, pelo
menos 800×800) antes do lançamento. O mesmo para `public/og.jpg`, que é o que
aparece quando o link é partilhado no WhatsApp e no Instagram.

## Fase seguinte: Django + DRF + PostgreSQL

A aplicação foi escrita a pensar nesta passagem:

1. Criar os modelos a partir de `src/types/index.ts`.
2. Expor `/api/barbers/`, `/api/bookings/` e `/api/reviews/`, com a paginação
   por omissão do DRF (`count` / `next` / `previous` / `results`) — é o formato
   que os serviços já devolvem.
3. Trocar o corpo das funções em `src/services/` por `fetch`. As assinaturas e
   os tipos não mudam, por isso **nenhum componente precisa de ser alterado**.
4. Passar `getAvailableSlots` para o servidor, dentro de uma transacção: só aí é
   que deixa de haver a possibilidade de duas pessoas marcarem a mesma hora ao
   mesmo tempo. A lógica e os testes em `bookingsService.test.ts` servem de
   especificação.
5. Substituir o `PinGate` por autenticação a sério, com sessão e permissões.
6. Passar as fotos das avaliações de data URL para `ImageField` (ver o
   comentário em `src/lib/image.ts`).
