/**
 * Compressão de imagens no navegador.
 *
 * As fotos dos cortes são guardadas como data URL dentro do `localStorage`, que
 * tem um limite baixo — tipicamente 5 MB para toda a origem. Uma foto de telemóvel
 * tem facilmente 4 MB, e em base64 ocupa mais um terço, por isso teria de ser
 * comprimida de qualquer forma.
 *
 * FASE DJANGO: isto desaparece. A foto passa a ser enviada em `multipart/form-data`
 * para um `ImageField`, o servidor guarda o ficheiro e a API devolve só o URL.
 * O redimensionamento continua a valer a pena do lado do cliente, para poupar
 * dados móveis, mas deixa de haver limite de armazenamento e deixa de ser preciso
 * converter para base64.
 */

/** Lado maior da imagem depois de redimensionada, em pixéis. */
const MAX_DIMENSION = 1200;

/** Limite do resultado, em bytes. Acima disto a qualidade volta a descer. */
const MAX_BYTES = 400_000;

/** Qualidades tentadas, da melhor para a pior. */
const QUALITY_STEPS = [0.8, 0.65, 0.5, 0.35] as const;

export class ImageError extends Error {}

/**
 * Lê, redimensiona e comprime uma imagem, devolvendo uma data URL em JPEG.
 *
 * @throws {ImageError} se o ficheiro não for imagem ou não for possível comprimir
 *         o suficiente.
 */
export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ImageError('O ficheiro tem de ser uma imagem.');
  }

  // Limite de entrada, antes de carregar o ficheiro para memória.
  if (file.size > 15_000_000) {
    throw new ImageError('A imagem é demasiado grande. Escolhe uma com menos de 15 MB.');
  }

  const bitmap = await loadBitmap(file);

  // Mantém a proporção, limitando apenas o lado maior.
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('Não foi possível processar a imagem.');
  ctx.drawImage(bitmap, 0, 0, width, height);

  if ('close' in bitmap) bitmap.close();

  // Baixa a qualidade por degraus até o resultado caber no limite.
  for (const quality of QUALITY_STEPS) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrlBytes(dataUrl) <= MAX_BYTES) return dataUrl;
  }

  throw new ImageError('Não foi possível comprimir a imagem o suficiente. Tenta outra.');
}

/**
 * Carrega o ficheiro como bitmap.
 *
 * Usa `createImageBitmap` quando existe, porque descodifica fora da thread
 * principal e não bloqueia a interface. O `<img>` é o recurso para navegadores
 * mais antigos.
 */
async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* segue para o recurso abaixo */
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('Não foi possível abrir a imagem.'));
    };
    img.src = url;
  });
}

/** Tamanho real, em bytes, do conteúdo de uma data URL base64. */
function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  // Cada 4 caracteres de base64 valem 3 bytes; o preenchimento final não conta.
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}
