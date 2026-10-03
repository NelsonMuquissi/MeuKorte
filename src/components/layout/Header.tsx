'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';

/**
 * Cabeçalho, como no template: barra escura com logótipo, navegação,
 * "Entrar" e o CTA dourado.
 *
 * O cabeçalho é SEMPRE escuro, mesmo por cima das páginas de superfície clara
 * — é assim nos nove ecrãs do template. Por isso força `data-surface` escuro
 * dentro de si, para que os tokens não sejam herdados de uma página clara.
 *
 * Tem duas formas:
 *   - completa (`full`): home e páginas públicas, com navegação e CTA;
 *   - estreita (`slim`): dentro do fluxo de agendamento, só logótipo e ícones,
 *     para não competir com o passo em curso.
 */

const LINKS = [
  { href: '/', label: 'Início' },
  { href: '/#servicos', label: 'Serviços' },
  { href: '/barbeiros', label: 'Barbeiros' },
  { href: '/#como-funciona', label: 'Como funciona' },
] as const;

export function Header({ variant = 'full' }: { variant?: 'full' | 'slim' }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

  if (variant === 'slim') {
    return (
      <header data-surface="dark" className="sticky top-0 z-40 border-b border-white/10 bg-ink">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
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
    <header data-surface="dark" className="sticky top-0 z-40 border-b border-white/10 bg-ink">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden lg:block" aria-label="Principal">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(link.href) ? 'text-gold' : 'text-white/70 hover:text-white'
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
            className="rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Entrar
          </Link>
          <Link
            href="/marcar"
            className="inline-flex min-h-[42px] items-center rounded-md bg-gold px-5 text-sm font-bold text-ink transition-transform hover:scale-[1.03]"
          >
            Agendar agora
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          className="-mr-2 flex size-11 items-center justify-center rounded-md text-white lg:hidden"
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
        <div id="menu-mobile" className="border-t border-white/10 bg-ink lg:hidden">
          <nav aria-label="Principal" className="mx-auto max-w-6xl px-4 py-3">
            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    className={`flex min-h-[48px] items-center rounded-md px-3 text-base font-medium ${
                      isActive(link.href) ? 'bg-white/5 text-gold' : 'text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/conta" className="flex min-h-[48px] items-center rounded-md px-3 text-base font-medium text-white">
                  Entrar
                </Link>
              </li>
              <li className="mt-2">
                <Link
                  href="/marcar"
                  className="flex min-h-[50px] items-center justify-center rounded-md bg-gold px-4 font-bold text-ink"
                >
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
