/**
 * Estilos de corte e de barba.
 *
 * São o passo 2 do fluxo, tal como no template: o cliente escolhe o serviço,
 * depois o estilo, e só então o barbeiro. Ter o estilo registado no agendamento
 * poupa a conversa de "como é que querias o corte?" à porta de casa.
 *
 * As fotografias são provisórias — ver a lista no README.
 * Na fase Django isto passa a uma tabela, para o administrador poder acrescentar
 * estilos sem tocar no código.
 */

import type { Style } from '@/types';

export const haircutStyles: Style[] = [
  {
    id: 'classico',
    name: 'Clássico',
    description: 'Discreto e sempre em ordem',
    photo: '/images/style-classico.jpg',
    category: 'corte',
  },
  {
    id: 'degrade',
    name: 'Degradê',
    description: 'Moderno e versátil',
    photo: '/images/style-degrade.jpg',
    category: 'corte',
  },
  {
    id: 'degrade-baixo',
    name: 'Degradê baixo',
    description: 'Elegante e discreto',
    photo: '/images/style-degrade-baixo.jpg',
    category: 'corte',
  },
  {
    id: 'afro',
    name: 'Afro',
    description: 'Volume com forma definida',
    photo: '/images/style-afro.jpg',
    category: 'corte',
  },
  {
    id: 'social',
    name: 'Corte social',
    description: 'Simples e profissional',
    photo: '/images/style-social.jpg',
    category: 'corte',
  },
  {
    id: 'undercut',
    name: 'Undercut',
    description: 'Contraste marcado',
    photo: '/images/style-undercut.jpg',
    category: 'corte',
  },
];

export const beardStyles: Style[] = [
  {
    id: 'barba-curta',
    name: 'Barba curta',
    description: 'Aparada e alinhada',
    photo: '/images/beard-curta.jpg',
    category: 'barba',
  },
  {
    id: 'barba-media',
    name: 'Barba média',
    description: 'Com volume, mas desenhada',
    photo: '/images/beard-media.jpg',
    category: 'barba',
  },
  {
    id: 'barba-cheia',
    name: 'Barba cheia',
    description: 'Cheia, com acabamento',
    photo: '/images/beard-cheia.jpg',
    category: 'barba',
  },
];

export const allStyles: Style[] = [...haircutStyles, ...beardStyles];

export function getStyleById(id: string): Style | undefined {
  return allStyles.find((s) => s.id === id);
}
