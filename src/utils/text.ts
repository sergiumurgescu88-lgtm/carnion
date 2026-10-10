/**
 * Utilitare pentru text și formatare prețuri
 */

/**
 * Normalizează textul pentru căutare insensibilă la diacritice și majuscule.
 * De exemplu, "ceafa" va găsi "Ceafă", "muschi" va găsi "Mușchi", "carnati" găsește "Cârnați".
 */
export function normalizeForSearch(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ș|ş/g, 's')
    .replace(/ț|ţ/g, 't')
    .trim();
}

/**
 * Formatează prețul în format românesc cu 2 zecimale (virgulă în loc de punct)
 * Exemplu: 59.9 -> "59,90"
 */
export function formatPriceNumber(price: number): string {
  return price.toLocaleString('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formatează prețul complet cu monedă și unitate
 * Exemplu: "59,90 lei / kg" sau "9,90 lei / buc"
 */
export function formatPriceWithUnit(price: number, unit: string): string {
  return `${formatPriceNumber(price)} lei / ${unit}`;
}

/**
 * Formatează cantitatea selectată (ex: "0,5 kg", "1,25 kg", "2 buc")
 */
export function formatQuantity(quantity: number, unit: string): string {
  const formatted = quantity.toLocaleString('ro-RO', {
    minimumFractionDigits: quantity % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${unit}`;
}
