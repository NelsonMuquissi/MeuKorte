'use client';

import Link from 'next/link';
import { Home, CalendarClock, User, Crown, Support, SignOut } from '@/components/ui/Icons';
import { generalWhatsappLink } from '@/lib/whatsapp';

/**
 * Navegação da área do cliente — a barra lateral do ecrã 9 do template.
 *
 * É escura dentro de uma página clara, como no template. Funciona porque
 * `[data-surface="dark"]` volta a declarar os tokens escuros; sem isso herdaria
 * os claros e ficava texto quase preto sobre fundo preto.
 *
 * No telemóvel uma barra lateral não cabe, por isso vira uma tira horizontal
 * que se desliza. É a mesma lista, na mesma ordem.
 *
 * O template tem ainda "Métodos de pagamento". Não está aqui porque não há nada
 * para gerir: não se paga no site, paga-se ao barbeiro no fim do serviço
 * (`PAYMENT.moment`). Um item de menu que abre um ecrã vazio é pior do que não
 * existir. Volta quando houver pagamento online.
 */

export type AccountSection = 'resumo' | 'agendamentos' | 'dados';

const SECTIONS = [
  { id: 'resumo' as const, label: 'Início', Icon: Home },
  { id: 'agendamentos' as const, label: 'Os meus agendamentos', Icon: CalendarClock },
  { id: 'dados' as const, label: 'Os meus dados', Icon: User },
];

export function AccountNav({
  active,
  onChange,
  onSignOut,
}: {
  active: AccountSection;
  onChange: (section: AccountSection) => void;
  onSignOut: () => void;
}) {
  return (
    <nav
      data-surface="dark"
      aria-label="Área do cliente"
      className="relative rounded-lg bg-ink p-2 lg:sticky lg:top-20 lg:self-start lg:p-3"
    >
      {/* No telemóvel a tira desliza, e seis itens não cabem. O esbatimento à
          direita é o que diz que há mais — sem ele a lista parece acabar no
          segundo item. Desaparece no desktop, onde a lista é vertical. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-2 right-2 w-10 rounded-r-md bg-gradient-to-l from-ink to-transparent lg:hidden"
      />
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {SECTIONS.map(({ id, label, Icon }) => (
          <li key={id} className="shrink-0 lg:shrink">
            <button
              type="button"
              onClick={() => onChange(id)}
              aria-current={active === id ? 'page' : undefined}
              className={`flex min-h-[44px] w-full items-center gap-2.5 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ${
                active === id
                  ? 'bg-gold font-bold text-ink'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="size-[18px] shrink-0" />
              {label}
            </button>
          </li>
        ))}

        {/* Fora dos separadores: levam para outro lado, não mudam de secção. */}
        <li className="shrink-0 lg:shrink lg:pt-2">
          <Link
            href="/#planos"
            className="flex min-h-[44px] w-full items-center gap-2.5 whitespace-nowrap rounded-md px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Crown className="size-[18px] shrink-0" />
            Planos de assinatura
          </Link>
        </li>
        <li className="shrink-0 lg:shrink">
          <a
            href={generalWhatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] w-full items-center gap-2.5 whitespace-nowrap rounded-md px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Support className="size-[18px] shrink-0" />
            Suporte
          </a>
        </li>

        <li className="shrink-0 lg:mt-2 lg:shrink lg:border-t lg:border-white/10 lg:pt-2">
          <button
            type="button"
            onClick={onSignOut}
            className="flex min-h-[44px] w-full items-center gap-2.5 whitespace-nowrap rounded-md px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <SignOut className="size-[18px] shrink-0" />
            Sair
          </button>
        </li>
      </ul>
    </nav>
  );
}
