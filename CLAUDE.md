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

## Regras Next.js

- App Router. **Server Components por defeito**; `"use client"` apenas onde há
  interactividade ou `localStorage`.
- O `localStorage` só é lido dentro de `useEffect` (ou do hook `useLocalBookings`),
  **nunca durante o render** — evita erros de hidratação.
- `next/image` para imagens, `next/font` para fontes, Metadata API para SEO.
- Rotas dinâmicas de barbeiros com `generateStaticParams`.
- As páginas públicas devem sair estáticas no output do `npm run build`.

## Convenções

- Tailwind com design tokens definidos no `globals.css` (`@theme`).
- **Mobile-first**: a maioria dos utilizadores usa telemóvel. Verificar a 360px.
- Texto da interface em **português de Angola**: "telemóvel", "marcação", "actualizar",
  "ecrã", "contacto". Nunca "celular", "agendamento", "atualizar".
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
| `/minhas-marcacoes` | Consultar, cancelar e avaliar |
| `/painel-barbeiro` | Área do barbeiro (demo, atrás de PIN, `noindex`) |
| `/admin` | Painel administrativo (demo, atrás de PIN, `noindex`) |

## Decisões em aberto

Zona piloto, preços, formato (salão/domicílio/ambos), taxa de deslocação, comissão,
momento do pagamento e regras de cancelamento **ainda não estão definidos**.

Ficam todos em `src/config/business.ts` com valores **provisórios**, cada um com o
comentário `// PROVISÓRIO — confirmar`.

**Nunca escrever preços ou regras directamente nos componentes.**
