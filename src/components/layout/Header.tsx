'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Cabeçalho com menu de hambúrguer no telemóvel.
 *
 * É um componente cliente porque precisa do estado do menu e de saber qual é a
 * rota actual para a marcar como activa.
 */

const LINKS = [
  { href: '/barbeiros', label: 'Barbeiros' },
  { href: '/marcar', label: 'Marcar' },
  { href: '/minhas-marcacoes', label: 'As minhas marcações' },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha o menu ao mudar de página; sem isto, ficaria aberto por cima da página
  // nova. Ajustado durante o render, que é o padrão do React para reagir a uma
  // mudança de valor — um efeito aqui deixaria o menu aberto por um render.
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setOpen(false);
  }

  // Impede a página de deslizar por baixo do menu aberto.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Escape fecha o menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-2xl tracking-wide text-text"
          aria-label="Meu Korte, página inicial"
        >
          MEU<span className="text-primary">KORTE</span>
        </Link>

        {/* Navegação em ecrãs grandes */}
        <nav className="hidden md:block" aria-label="Principal">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-primary'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="ml-2">
              <Link
                href="/marcar"
                className="inline-flex min-h-[40px] items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary/90"
              >
                Marcar corte
              </Link>
            </li>
          </ul>
        </nav>

        {/* Hambúrguer, só no telemóvel */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          className="-mr-2 flex size-11 items-center justify-center rounded-md text-text md:hidden"
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

      {/* Painel do menu no telemóvel */}
      {open && (
        <div
          id="menu-mobile"
          className="border-t border-border bg-surface md:hidden"
        >
          <nav aria-label="Principal" className="mx-auto max-w-6xl px-4 py-3">
            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    className={`flex min-h-[48px] items-center rounded-md px-3 text-base font-medium ${
                      isActive(link.href)
                        ? 'bg-surface-2 text-primary'
                        : 'text-text'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2">
                <Link
                  href="/marcar"
                  className="flex min-h-[48px] items-center justify-center rounded-md bg-primary px-4 font-semibold text-primary-ink"
                >
                  Marcar corte
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
