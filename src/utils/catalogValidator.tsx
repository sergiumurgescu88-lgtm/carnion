import React from 'react';
import productsData from '../data/products.json';
import { Product, Category } from '../types';

export interface CategoryValidation {
  name: string;
  slug: string;
  expected: number;
  actual: number;
  matches: boolean;
}

export interface CatalogValidationResult {
  isValid: boolean;
  totalProducts: number;
  expectedTotal: number;
  categories: CategoryValidation[];
  errorMessage?: string;
}

/**
 * Validează catalogul de produse CARNION
 * În development: scrie în consolă numărul total și cel pe categorii
 */
export function validateCatalog(): CatalogValidationResult {
  const { categories, products } = productsData as {
    categories: Category[];
    products: Product[];
  };

  const expectedTotal = 264;
  const actualTotal = products.length;

  const actualCategoryCounts: Record<string, number> = {};
  for (const p of products) {
    actualCategoryCounts[p.category] = (actualCategoryCounts[p.category] || 0) + 1;
  }

  const categoryValidations: CategoryValidation[] = categories.map((cat) => {
    const actual = actualCategoryCounts[cat.name] || 0;
    return {
      name: cat.name,
      slug: cat.slug,
      expected: cat.count,
      actual,
      matches: actual === cat.count,
    };
  });

  const allCategoriesMatch = categoryValidations.every((c) => c.matches);
  const totalMatches = actualTotal === expectedTotal;
  const isValid = totalMatches && allCategoriesMatch;

  // Logare doar în modul de dezvoltare
  if (import.meta.env.DEV) {
    console.group('%c[CARNION DEV] Verificare Integritate Catalog', 'color: #C9A55C; font-weight: bold;');
    console.log(`Total produse: ${actualTotal} / ${expectedTotal} ${totalMatches ? '✓ OK' : '✗ EROARE'}`);
    console.table(
      categoryValidations.map((c) => ({
        Categorie: c.name,
        'În fișier (actual)': c.actual,
        'Specificat (count)': c.expected,
        Status: c.matches ? '✓ OK' : '✗ NEPOTRIVIRE',
      }))
    );
    if (!isValid) {
      console.error(
        `[CARNION DEV] Catalog incomplet! Total: ${actualTotal} (așteptat ${expectedTotal}). Unele categorii nu coincid.`
      );
    }
    console.groupEnd();
  }

  let errorMessage: string | undefined;
  if (!isValid) {
    if (!totalMatches) {
      errorMessage = `Catalog incomplet: ${actualTotal} produse găsite (așteptat: ${expectedTotal}).`;
    } else {
      errorMessage = 'Catalog incomplet: numărul de produse pe unele categorii nu coincide cu specificația.';
    }
  }

  return {
    isValid,
    totalProducts: actualTotal,
    expectedTotal,
    categories: categoryValidations,
    errorMessage,
  };
}

// Banner de avertizare roșu pentru catalog incomplet
export const CatalogIncompleteBanner: React.FC = () => {
  const result = validateCatalog();

  if (result.isValid) return null;

  return (
    <aside
      aria-label="Avertisment catalog"
      className="bg-[#B3202A] text-white py-2 px-4 text-center font-bold text-xs sm:text-sm shadow-md sticky top-0 z-50 flex items-center justify-center gap-2"
    >
      <span>⚠</span>
      <span>{result.errorMessage || 'Catalog incomplet'}</span>
      <span className="font-mono text-xs opacity-90">({result.totalProducts} din {result.expectedTotal})</span>
    </aside>
  );
};

export default validateCatalog;
