import { CONTACT } from '@/config/business';
import { generalWhatsappLink } from '@/lib/whatsapp';

/**
 * Botão flutuante do WhatsApp.
 *
 * O atendimento do Meu Korte é por WhatsApp Business, por isso o botão está
 * presente em todas as páginas. É um `<a>` normal, sem JavaScript, por isso pode
 * ficar num Server Component.
 *
 * Fica à esquerda em ecrãs pequenos para não ficar por cima do polegar quando se
 * desliza a página, e sobe o suficiente para não tapar nada.
 */
export function WhatsAppButton() {
  return (
    <a
      href={generalWhatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Falar connosco pelo WhatsApp, ${CONTACT.whatsappDisplay}`}
      className="fixed bottom-5 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-black shadow-lg transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.71.63.72.23 1.37.2 1.89.12.58-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23z" />
      </svg>
    </a>
  );
}
