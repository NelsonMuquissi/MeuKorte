# Meu Korte

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

**Fluxo de marcação.** Cliente entra → escolhe barbeiro → escolhe serviço e horário →
confirma → barbeiro recebe o pedido → aceita ou rejeita → cliente recebe confirmação →
serviço é realizado → cliente avalia.

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
- Os tipos em `src/types/` (`Barber`, `Service`, `Booking`, `Review`, `BookingStatus`)
  definem o contrato da futura API. As respostas dos serviços seguem o formato do DRF.

## Referência de design

**Os templates em `docs/template/` são a fonte de verdade** para layout, fluxo e
componentes. Quando houver dúvida sobre como algo deve ser apresentado, a
resposta está no template, não no gosto de quem implementa.

| Ficheiro | O que é |
|---|---|
| `image1.png` | Logótipo: monograma MK prateado, "MEUKORTE", assinatura "O teu barbeiro, à tua maneira" |
| `image2.jpeg` | Template 1 |
| `image3.jpeg` | **Template 2 — a base.** Nove ecrãs: home, fluxo de agendamento completo e área do cliente |

As imagens estavam embebidas no `Projecto - Meu Korte.docx` e foram extraídas
para `docs/template/`.

**"Barbearia Online" e "BarberPro" são placeholders** que aparecem nos
templates. A marca é **Meu Korte** e o logótipo é o de `image1.png`.

### Duas superfícies

O produto tem dois registos visuais, e cada ecrã pertence a um deles:

- **Escura** — home, hero, "como funciona", planos, banners, ecrã de
  confirmação, cabeçalho e barra lateral. Fundo `#12171B`.
- **Clara** — todo o fluxo de agendamento e a área do cliente. Fundo branco,
  cards com borda subtil, botão primário preto "Continuar →".

O **dourado `#F9CE97`** é acento: CTA principal, item seleccionado (borda
dourada + visto), ícones e números de passo. **Nunca é cor de estado**, e
**nunca é texto sobre fundo claro** (1,47:1 — ilegível).

### Terminologia

Na interface diz-se **"agendamento"**, como nos templates. No código mantém-se
`booking`.

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
  superfícies (escura e clara) — ver "Referência de design".
- **Mobile-first**: a maioria dos utilizadores usa telemóvel. Verificar a 360px.
- Texto da interface em **português de Angola**: "telemóvel", "actualizar",
  "ecrã", "contacto". Nunca "celular", "atualizar".
- Na interface diz-se **"agendamento"**, seguindo os templates. No código o tipo
  continua a chamar-se `Booking`.
- Moeda **Kwanza**, formato `5 000 Kz` (espaço como separador de milhares).
- Telefones **+244**. `<html lang="pt-AO">`.
- **Código, nomes de ficheiros e componentes em inglês; rotas (URLs) em português.**

## Rotas

| Rota | Conteúdo |
|---|---|
| `/` | Página inicial — recebe o tráfego do Instagram e do TikTok |
| `/barbeiros` | Lista de barbeiros, com filtros |
| `/barbeiros/[id]` | Perfil do barbeiro (`generateStaticParams`) |
| `/marcar` | Fluxo de marcação (aceita `?barbeiro=id`) |
| `/conta` | Área do cliente: perfil, próximos e histórico |
| `/minhas-marcacoes` | Redirecciona para `/conta` |
| `/painel-barbeiro` | Área do barbeiro (demo, atrás de PIN, `noindex`) |
| `/admin` | Painel administrativo (demo, atrás de PIN, `noindex`) |

## Decisões em aberto

Zona piloto, preços, formato (salão/domicílio/ambos), taxa de deslocação, comissão,
momento do pagamento e regras de cancelamento **ainda não estão definidos**.

Ficam todos em `src/config/business.ts` com valores **provisórios**, cada um com o
comentário `// PROVISÓRIO — confirmar`.

**Nunca escrever preços ou regras directamente nos componentes.**
