import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import productsData from '../data/products.json';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { normalizeForSearch } from '../utils/text';

type SortOption = 'recomandate' | 'alfabetic-asc' | 'alfabetic-desc' | 'pret-asc' | 'pret-desc';

export const CatalogPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { categories, products } = productsData as {
    categories: Category[];
    products: Product[];
  };

  // Căutare din URL sau local
  const urlQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [sortBy, setSortBy] = useState<SortOption>('recomandate');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sincronizare dacă se schimbă URL query
  useEffect(() => {
    setSearchTerm(urlQuery);
  }, [urlQuery]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // Găsirea categoriei curente
  const currentCategory = useMemo(() => {
    if (!slug) return null;
    return categories.find((c) => c.slug === slug) || null;
  }, [slug, categories]);

  // Filtrare și sortare
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filtru pe categorie
    if (slug) {
      result = result.filter((p) => p.categorySlug === slug);
    }

    // Filtru căutare instantanee (fără diacritice, ignoră majuscule)
    if (searchTerm.trim()) {
      const normalizedQuery = normalizeForSearch(searchTerm);
      result = result.filter((p) => {
        const normName = normalizeForSearch(p.name);
        const normCategory = normalizeForSearch(p.category);
        return normName.includes(normalizedQuery) || normCategory.includes(normalizedQuery);
      });
    }

    // Sortare
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'alfabetic-asc':
          return a.name.localeCompare(b.name, 'ro');
        case 'alfabetic-desc':
          return b.name.localeCompare(a.name, 'ro');
        case 'pret-asc':
          return a.price - b.price;
        case 'pret-desc':
          return b.price - a.price;
        case 'recomandate':
        default:
          return 0; // ordinea nativă din carmangerie
      }
    });
  }, [products, slug, searchTerm, sortBy]);

  const resetFilters = () => {
    setSearchTerm('');
    setSearchParams({});
    if (slug) {
      navigate('/produse');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
      {/* Header Catalog */}
      <div className="border-b border-[#2B2521] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {/* Breadcrumb unboxed */}
          <nav className="flex items-center gap-2 text-xs text-[#A89B8C] mb-2" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-[#F3EBDD] transition-colors">
              Acasă
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/produse" className="hover:text-[#F3EBDD] transition-colors">
              Catalog
            </Link>
            {currentCategory && (
              <>
                <span aria-hidden="true">/</span>
                <span className="text-[#C9A55C] font-semibold">{currentCategory.name}</span>
              </>
            )}
          </nav>

          <h1 className="font-serif-title text-2xl sm:text-4xl font-extrabold text-[#F3EBDD]">
            {currentCategory ? currentCategory.name : 'Toate Produsele'}
          </h1>
          <p className="text-xs sm:text-sm text-[#A89B8C] mt-1">
            {currentCategory
              ? `Descoperă selecția de ${currentCategory.name.toLowerCase()} de la carmangeria CARNION.`
              : 'Selecție completă de carne proaspătă, mezeluri artizanale și produse de băcănie.'}
          </p>
        </div>

        {/* Buton filtrare mobil & contor */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#171412] border border-[#2B2521] text-xs font-semibold text-[#F3EBDD] hover:border-[#C9A55C]"
          >
            <svg
              className="w-4 h-4 text-[#C9A55C]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>Categorii ({categories.length})</span>
          </button>

          <span className="text-xs font-mono text-[#A89B8C]">
            <strong className="text-[#F3EBDD]">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'produs' : 'produse'}
          </span>
        </div>
      </div>

      {/* Control bară orizontală: Căutare instantanee + Sortare */}
      <div className="bg-[#171412] border border-[#2B2521] p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        {/* Căutare instantanee */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Căutare rapidă (ex: ceafa, muschi, mici)..."
            className="w-full bg-[#0E0C0A] text-[#F3EBDD] text-xs sm:text-sm pl-9 pr-8 py-2 rounded-lg border border-[#2B2521] focus:border-[#C9A55C] focus:outline-none transition-colors placeholder:text-[#A89B8C]"
          />
          <svg
            className="w-4 h-4 text-[#A89B8C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A89B8C] hover:text-[#F3EBDD] text-sm font-bold"
              aria-label="Șterge căutarea"
            >
              ×
            </button>
          )}
        </div>

        {/* Sortare */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="sort-select" className="text-xs text-[#A89B8C] font-medium whitespace-nowrap">
            Sortează:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-[#0E0C0A] text-[#F3EBDD] text-xs px-3 py-2 rounded-lg border border-[#2B2521] focus:border-[#C9A55C] focus:outline-none cursor-pointer"
          >
            <option value="recomandate">Recomandate</option>
            <option value="alfabetic-asc">Alfabetic: A → Z</option>
            <option value="alfabetic-desc">Alfabetic: Z → A</option>
            <option value="pret-asc">Preț: crescător</option>
            <option value="pret-desc">Preț: descrescător</option>
          </select>
        </div>
      </div>

      {/* Grid Principal: Bară laterală categorii (desktop) + Grilă produse */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Bară laterală Desktop */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 bg-[#171412] border border-[#2B2521] rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#2B2521]">
            <h3 className="font-serif-title text-sm font-bold text-[#F3EBDD] uppercase tracking-wider">
              Categorii
            </h3>
            {slug && (
              <Link
                to="/produse"
                className="text-[11px] text-[#C9A55C] hover:underline"
              >
                Toate
              </Link>
            )}
          </div>

          <div className="space-y-1 text-xs">
            {/* Link Toate */}
            <Link
              to="/produse"
              className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                !slug
                  ? 'bg-[#B3202A] text-white font-bold'
                  : 'text-[#F3EBDD] hover:bg-[#1F1B18]'
              }`}
            >
              <span>Toate produsele</span>
              <span className="font-mono text-[11px] opacity-80">{products.length}</span>
            </Link>

            {/* Categorii individuale */}
            {categories.map((cat) => {
              const isActive = slug === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  to={`/categorie/${cat.slug}`}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#B3202A] text-white font-bold'
                      : 'text-[#F3EBDD] hover:bg-[#1F1B18]'
                  }`}
                >
                  <span className="truncate pr-2">{cat.name}</span>
                  <span className="font-mono text-[11px] text-[#A89B8C]">
                    {cat.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Zona de conținut produse */}
        <main className="lg:col-span-9 space-y-6">
          {/* Rezultate căutare / filtru activ */}
          {(searchTerm || slug) && (
            <div className="flex items-center justify-between text-xs text-[#A89B8C] bg-[#171412]/60 px-3 py-2 rounded-lg border border-[#2B2521]">
              <div className="flex items-center gap-2 truncate">
                <span>Filtru activ:</span>
                {slug && (
                  <span className="text-[#C9A55C] font-semibold">
                    {currentCategory?.name || slug}
                  </span>
                )}
                {slug && searchTerm && <span>·</span>}
                {searchTerm && (
                  <span>
                    căutare «<strong className="text-[#F3EBDD]">{searchTerm}</strong>»
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[#B3202A] hover:underline whitespace-nowrap ml-2 font-medium"
              >
                Șterge filtrele
              </button>
            </div>
          )}

          {/* Grila de produse */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            /* Stare de căutare fără rezultate */
            <div className="bg-[#171412] border border-[#2B2521] rounded-xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1F1B18] border border-[#2B2521] text-[#A89B8C] flex items-center justify-center mx-auto text-2xl">
                🔍
              </div>
              <div>
                <h3 className="font-serif-title text-xl font-bold text-[#F3EBDD]">
                  Nu am găsit produse
                </h3>
                <p className="text-xs text-[#A89B8C] mt-1 max-w-sm mx-auto">
                  Nu există rezultate pentru criteriile selectate. Încearcă o altă denumire sau resetează filtrele.
                </p>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2.5 bg-[#B3202A] hover:bg-[#961720] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors"
              >
                Resetează căutarea
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Panou Mobil de Filtrare (Modal/Drawer) */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative ml-auto w-full max-w-xs bg-[#171412] border-l border-[#2B2521] h-full overflow-y-auto p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#2B2521] mb-4">
                <h3 className="font-serif-title text-base font-bold text-[#F3EBDD]">
                  Alege Categoria
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 text-[#A89B8C] hover:text-[#F3EBDD] text-lg font-bold"
                  aria-label="Închide panoul"
                >
                  ×
                </button>
              </div>

              <div className="space-y-1 text-xs">
                <Link
                  to="/produse"
                  onClick={() => setMobileFilterOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${
                    !slug
                      ? 'bg-[#B3202A] text-white font-bold'
                      : 'text-[#F3EBDD] hover:bg-[#1F1B18]'
                  }`}
                >
                  <span>Toate produsele</span>
                  <span className="font-mono text-[11px] opacity-80">{products.length}</span>
                </Link>

                {categories.map((cat) => {
                  const isActive = slug === cat.slug;
                  return (
                    <Link
                      key={cat.slug}
                      to={`/categorie/${cat.slug}`}
                      onClick={() => setMobileFilterOpen(false)}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${
                        isActive
                          ? 'bg-[#B3202A] text-white font-bold'
                          : 'text-[#F3EBDD] hover:bg-[#1F1B18]'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="font-mono text-[11px] text-[#A89B8C]">
                        {cat.count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-[#2B2521] mt-6">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 bg-[#B3202A] text-white font-semibold text-xs uppercase tracking-wider rounded-lg"
              >
                Vezi produsele ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
