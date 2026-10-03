import Link from 'next/link';
import { CONTACT, PILOT_AREA } from '@/config/business';
import { generalWhatsappLink } from '@/lib/whatsapp';

/** Rodapé. Server Component — não tem interactividade nenhuma. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl tracking-wide">
              MEU<span className="text-primary">KORTE</span>
            </p>
            <p className="mt-3 max-w-xs text-sm text-text-muted">
              Marca o teu corte com o barbeiro que quiseres, à hora que te der jeito.
              No salão ou em tua casa.
            </p>
          </div>

          <nav aria-labelledby="footer-nav">
            <h2 id="footer-nav" className="text-sm tracking-wider text-text">
              Navegar
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/barbeiros" className="text-text-muted transition-colors hover:text-primary">
                  Barbeiros
                </Link>
              </li>
              <li>
                <Link href="/marcar" className="text-text-muted transition-colors hover:text-primary">
                  Marcar corte
                </Link>
              </li>
              <li>
                <Link href="/minhas-marcacoes" className="text-text-muted transition-colors hover:text-primary">
                  As minhas marcações
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm tracking-wider text-text">Contacto</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={generalWhatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted transition-colors hover:text-primary"
                >
                  WhatsApp {CONTACT.whatsappDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-text-muted transition-colors hover:text-primary"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li className="text-text-muted">
                {PILOT_AREA.district}, {PILOT_AREA.city}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm tracking-wider text-text">Redes</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={`https://instagram.com/${CONTACT.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted transition-colors hover:text-primary"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={`https://tiktok.com/@${CONTACT.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted transition-colors hover:text-primary"
                >
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-xs text-text-muted">
          © {year} Meu Korte · Luanda, Angola
        </p>
      </div>
    </footer>
  );
}
