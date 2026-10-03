/**
 * Links para o WhatsApp.
 *
 * Enquanto não há backend, é o WhatsApp que faz a confirmação das marcações: o
 * cliente marca no site e é levado para uma conversa com a mensagem já escrita.
 * É também o canal de atendimento previsto no plano do MVP.
 */

import { CONTACT } from '@/config/business';
import type { Booking } from '@/types';
import { formatKz, formatDateLong, formatLocationType } from './format';

/** Monta um link `wa.me` com a mensagem já preenchida. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Mensagem genérica do botão flutuante e dos CTA de contacto. */
export function generalWhatsappLink(): string {
  return whatsappLink('Olá! Vim do site do Meu Korte e queria saber mais.');
}

/**
 * Mensagem de confirmação de uma marcação.
 *
 * Escrita para ser lida por uma pessoa do outro lado, não por um sistema: leva
 * tudo o que o barbeiro precisa de saber para confirmar ou recusar.
 */
export function bookingWhatsappLink(booking: Booking): string {
  const lines = [
    'Olá! Fiz uma marcação no Meu Korte:',
    '',
    `*Barbeiro:* ${booking.barberName}`,
    `*Serviço:* ${booking.serviceName}`,
    `*Dia:* ${formatDateLong(booking.date)}`,
    `*Hora:* ${booking.time}`,
    `*Onde:* ${formatLocationType(booking.locationType)}`,
  ];

  if (booking.locationType === 'domicilio' && booking.address) {
    lines.push(`*Morada:* ${booking.address}`);
  }

  lines.push(`*Total:* ${formatKz(booking.price)}`);
  lines.push('', `*Nome:* ${booking.clientName}`);
  lines.push(`*Telemóvel:* ${booking.clientPhone}`);

  if (booking.notes) {
    lines.push('', `*Observações:* ${booking.notes}`);
  }

  lines.push('', `Referência: ${booking.id.slice(0, 8)}`);

  return whatsappLink(lines.join('\n'));
}

/** Link para quem quer marcar com um barbeiro específico, vindo do perfil. */
export function barberWhatsappLink(barberName: string): string {
  return whatsappLink(`Olá! Queria marcar um corte com o ${barberName}.`);
}
