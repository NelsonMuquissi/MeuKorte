/**
 * Estilos de corte e a preferência de barba.
 *
 * São o passo do "Estilo" do fluxo, como nas referências de Novembro de 2026
 * (`Korte. Estilo de Corte Premium.png`): quatro cortes com fotografia, um
 * "Outro estilo" que o cliente descreve por palavras, e — quando o serviço
 * leva barba — a preferência "Desenhar barba".
 *
 * Ter o estilo registado no agendamento poupa a conversa de "como é que
 * queria o corte?" à porta de casa.
 *
 * Na fase Django isto passa a uma tabela, para o administrador poder acrescentar
 * estilos sem tocar no código.
 */

import type { Style } from '@/types';

export const haircutStyles: Style[] = [
  {
    id: 'degrade-fade',
    name: 'Degradê (Fade)',
    description: 'Transição suave e moderna.',
    photo: '/images/estilo-degrade-fade.jpg',
    category: 'corte',
  },
  {
    id: 'dois-tempos',
    name: 'Dois Tempos',
    description: 'Clássico e versátil.',
    photo: '/images/estilo-dois-tempos.jpg',
    category: 'corte',
  },
  {
    id: 'taper-fade',
    name: 'Taper Fade',
    description: 'Natural e elegante.',
    photo: '/images/estilo-taper-fade.jpg',
    category: 'corte',
  },
  {
    id: 'escovilho',
    name: 'Escovilho',
    description: 'Autêntico e cheio de personalidade.',
    photo: '/images/estilo-escovilho.jpg',
    category: 'corte',
  },
];

/**
 * A preferência de barba. É uma só, e é opcional: quem escolhe "Corte + Barba"
 * já tem a barba tratada; "Desenhar barba" diz ao barbeiro que quer o contorno
 * desenhado, e não só aparado.
 */
export const beardDesign: Style = {
  id: 'desenhar-barba',
  name: 'Desenhar barba',
  description: 'Indique esta preferência para personalizar o acabamento da barba.',
  photo: '/images/estilo-desenhar-barba.jpg',
  category: 'barba',
};

/** O id reservado do "Outro estilo", descrito por palavras pelo cliente. */
export const OTHER_STYLE_ID = 'outro';

export const allStyles: Style[] = [...haircutStyles, beardDesign];

export function getStyleById(id: string): Style | undefined {
  return allStyles.find((s) => s.id === id);
}
