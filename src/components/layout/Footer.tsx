import Link from 'next/link';
import { Logo } from './Logo';
import { CONTACT, PILOT_AREA } from '@/config/business';
import { generalWhatsappLink } from '@/lib/whatsapp';

/** Rodapé. Sempre escuro, como o cabeçalho. Server Component. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer data-surface="dark" className="border-t border-white/10 bg-ink">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo size="full" asLink={false} />
            <p className="mt-4 max-w-xs text-sm text-text-muted">
              Cortes, barba e estilo com qualidade profissional, no conforto da
              tua casa ou no salão.
            </p>
          </div>

          <nav aria-labelledby="footer-nav">
            <h2 id="footer-nav" className="text-sm font-bold text-text">Navegar</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { href: '/barbeiros', label: 'Barbeiros' },
                { href: '/marcar', label: 'Agendar agora' },
                { href: '/conta', label: 'A minha conta' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-text-muted transition-colors hover:text-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-bold text-text">Contacto</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={generalWhatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted transition-colors hover:text-gold"
                >
                  WhatsApp {CONTACT.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="text-text-muted transition-colors hover:text-gold">
                  {CONTACT.email}
                </a>
              </li>
              <li className="text-text-muted">
                {PILOT_AREA.district}, {PILOT_AREA.city}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-text">Redes</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={`https://instagram.com/${CONTACT.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted transition-colors hover:text-gold"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={`https://tiktok.com/@${CONTACT.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted transition-colors hover:text-gold"
                >
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-text-muted">
          © {year} Meu Korte · Luanda, Angola
        </p>
      </div>
    </footer>
  );
}
