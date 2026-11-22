'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { isFlowRoute } from './routes';
import { CalendarIcon } from '@/components/ui/Icons';

/**
 * Cabeçalho, como nas referências.
 *
 * Tem duas formas, e cada uma tem a sua superfície:
 *   - completa (`full`): páginas públicas. CLARA — logótipo escuro, navegação
 *     com o item actual sublinhado a dourado, "Entrar" e o CTA dourado.
 *   - estreita (`slim`): dentro dos fluxos de agendamento. ESCURA — só o
 *     logótipo claro e o ícone da conta, para não competir com o passo em
 *     curso. Força `data-surface="dark"` para não herdar os tokens da página.
 */

const LINKS = [
  { href: '/', label: 'Início' },
  { href: '/#servicos', label: 'Serviços' },
  { href: '/barbeiros', label: 'Barbeiros' },
  { href: '/#como-funciona', label: 'Como funciona' },
] as const;

export function Header({ variant }: { variant?: 'full' | 'slim' }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // A rota decide, salvo quando quem usa o cabeçalho impõe a forma.
  const shape = variant ?? (isFlowRoute(pathname) ? 'slim' : 'full');

  // Fecha o menu ao mudar de página. Ajustado durante o render — com um efeito,
  // o menu ficaria aberto por cima da página nova durante um render.
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href.replace('/#', '/'));

  if (shape === 'slim') {
    return (
      <header data-surface="dark" className="sticky top-0 z-40 bg-ink">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo variant="light" />
          <Link
            href="/conta"
            className="flex size-10 items-center justify-center rounded-md text-white/70 transition-colors hover:text-white"
            aria-label="A minha conta"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6">
        <Logo />

        <nav className="hidden lg:block" aria-label="Principal">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`relative block px-3 py-2 text-[15px] font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-accent after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gold'
                      : 'text-text hover:text-accent'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/conta"
            className="rounded-md px-3 py-2 text-[15px] font-medium text-text transition-colors hover:text-accent"
          >
            Entrar
          </Link>
          <Link
            href="/agendar"
            className="inline-flex min-h-[46px] items-center gap-2 rounded-lg bg-gold px-5 text-[15px] font-bold text-ink shadow-gold transition-transform hover:scale-[1.03]"
          >
            <CalendarIcon className="size-5" />
            Agendar agora
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          className="-mr-2 flex size-11 items-center justify-center rounded-md text-text lg:hidden"
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div id="menu-mobile" className="border-t border-border bg-surface lg:hidden">
          <nav aria-label="Principal" className="mx-auto max-w-6xl px-4 py-3">
            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    className={`flex min-h-[48px] items-center rounded-md px-3 text-base font-medium ${
                      isActive(link.href) ? 'bg-selected text-accent' : 'text-text'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/conta" className="flex min-h-[48px] items-center rounded-md px-3 text-base font-medium text-text">
                  Entrar
                </Link>
              </li>
              <li className="mt-2">
                <Link
                  href="/agendar"
                  className="flex min-h-[50px] items-center justify-center gap-2 rounded-lg bg-gold px-4 font-bold text-ink"
                >
                  <CalendarIcon className="size-5" />
                  Agendar agora
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
