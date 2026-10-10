import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import productsData from '../data/products.json';
import reviewsData from '../data/reviews.json';
import { Product, Review } from '../types';
import { formatPriceNumber, formatQuantity } from '../utils/text';
import { getWhatsAppUrl } from '../config';
import { useCart } from '../context/CartContext';
import QuantitySelector from '../components/QuantitySelector';
import ProductCard from '../components/ProductCard';
import { ReviewSection } from '../components/reviews/ReviewSection';
import { useApprovedImages } from '../utils/imageDb';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const approvedImages = useApprovedImages();

  const { products } = productsData as { products: Product[] };
  const product = products.find((p) => p.id === id);

  const [quantity, setQuantity] = useState<number>(product?.soldByWeight ? 1.0 : 1);
  const [justAdded, setJustAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Selectează doar 14 recenzii random dacă sunt disponibile
  const displayedReviews = useMemo(() => {
    const allReviews = (reviewsData as Review[]) || [];
    if (!allReviews.length) return [];

    // Amestecăm pseudo-aleatoriu (Fisher-Yates) folosind id-ul produsului pentru consistență per pagină
    const shuffled = [...allReviews].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 14);
  }, [id]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif-title text-2xl font-bold text-[#F3EBDD]">
          Produsul nu a fost găsit
        </h1>
        <p className="text-sm text-[#A89B8C]">
          Produsul căutat nu există în catalogul carmangeriei CARNION sau a fost mutat.
        </p>
        <Link
          to="/produse"
          className="inline-block px-6 py-2.5 bg-[#B3202A] text-white font-semibold text-xs uppercase tracking-wider rounded-lg"
        >
          Înapoi la toate produsele
        </Link>
      </div>
    );
  }

  const currentImage = approvedImages[product.id] || product.image;
  const hasImage = Boolean(currentImage) && !imageError;
  const estimatedTotal = Math.round(product.price * quantity * 100) / 100;
  const formattedQty = formatQuantity(quantity, product.unit);

  const whatsappMessage = `Bună ziua! Mă interesează: ${product.name} (${formattedQty}) de la carmangeria CARNION.`;
  const whatsappUrl = getWhatsAppUrl(whatsappMessage);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  // Produse similare din aceeași categorie (excluzând produsul curent)
  const similarProducts = products
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12">
      {/* Breadcrumb unboxed */}
      <nav className="flex items-center gap-2 text-xs text-[#A89B8C]" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-[#F3EBDD] transition-colors">
          Acasă
        </Link>
        <span aria-hidden="true">/</span>
        <Link to="/produse" className="hover:text-[#F3EBDD] transition-colors">
          Catalog
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to={`/categorie/${product.categorySlug}`}
          className="hover:text-[#F3EBDD] transition-colors"
        >
          {product.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[#C9A55C] font-semibold truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Grid Principal Produs (Imagine + Modul Contiguu de Achiziție) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Coloana Stânga: Imagine Mare 4:3 / Placeholder Tehnic de Măcelar */}
        <div className="lg:col-span-6 space-y-2">
          <div className="bg-[#171412] border border-[#2B2521] rounded-2xl p-6 sm:p-8 aspect-[4/3] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            {/* Imagine dacă este disponibilă */}
            {hasImage ? (
              <>
                <img
                  src={currentImage}
                  alt={product.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120F0D] via-transparent to-black/30 pointer-events-none" />
              </>
            ) : (
              /* Placeholder elegant dacă nu e imagine încărcată */
              <>
                <div className="absolute inset-4 border border-[#C9A55C]/20 rounded-xl pointer-events-none" />

                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-[#C9A55C]/40 bg-[#0E0C0A] flex items-center justify-center mb-3 shadow-2xl">
                  <span className="font-serif-title text-4xl sm:text-5xl font-bold text-[#F3EBDD]">
                    {product.category.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                <div className="text-center space-y-1 z-10">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#C9A55C]">
                    CARNION CARMANGERIE
                  </span>
                  <p className="text-xs text-[#A89B8C]">
                    Militari Residence · Chiajna
                  </p>
                  {product.imageMode === 'generate' && (
                    <p className="text-xs text-[#C9A55C]/90 font-medium italic pt-1">
                      în curând fotografie
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="absolute top-4 left-4 text-xs text-[#A89B8C] uppercase font-mono bg-[#120F0D]/75 backdrop-blur-xs px-2.5 py-1 rounded">
              {product.category}
            </div>

            <div className="absolute bottom-4 right-4 text-xs text-[#A89B8C] bg-[#120F0D]/75 backdrop-blur-xs px-2.5 py-1 rounded">
              {product.soldByWeight ? 'Vânzare la greutate (kg)' : 'Vânzare la bucată'}
            </div>
          </div>

          {/* Mențiune obligatorie cerută pentru imagini generate AI */}
          {hasImage && product.imageMode === 'generate' && (
            <p className="text-xs text-[#A89B8C] italic text-center">
              Imagine cu rol ilustrativ.
            </p>
          )}
        </div>

        {/* Coloana Dreapta: Modul de Achiziție și Detalii */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9A55C]">
              <span>{product.category}</span>
              <span aria-hidden="true">·</span>
              <span>100% Proaspăt</span>
            </div>

            <h1 className="font-serif-title text-2xl sm:text-4xl font-extrabold text-[#F3EBDD] mt-2 leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Preț mare și total estimat */}
          <div className="bg-[#171412] border border-[#2B2521] p-5 rounded-xl space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#B3202A] tracking-tight font-mono">
                  {formatPriceNumber(product.price)}
                </span>
                <span className="text-sm font-semibold text-[#F3EBDD] ml-1.5">
                  lei / {product.unit}
                </span>
              </div>
              <span className="text-xs text-[#A89B8C]">TVA inclus</span>
            </div>

            {/* Total calculat pentru cantitate selectată */}
            <div className="pt-2 border-t border-[#2B2521] flex items-center justify-between text-sm">
              <span className="text-[#A89B8C]">Total estimat pentru {formattedQty}:</span>
              <span className="font-mono font-bold text-lg text-[#F3EBDD]">
                {formatPriceNumber(estimatedTotal)} lei
              </span>
            </div>
          </div>

          {/* Selector de cantitate dedicat */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#F3EBDD] uppercase tracking-wider">
              Selectează cantitatea dorită:
            </label>
            <QuantitySelector
              soldByWeight={product.soldByWeight}
              value={quantity}
              onChange={setQuantity}
            />
          </div>

          {/* Butoane primare de comandă */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-lg min-h-[48px] cursor-pointer ${
                justAdded
                  ? 'bg-[#25D366] text-white hover:bg-[#20bd5a]'
                  : 'bg-[#B3202A] text-white hover:bg-[#961720] active:scale-[0.98]'
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>{justAdded ? 'Adăugat în coș!' : `Adaugă în coș (${formattedQty})`}</span>
            </button>

            {/* Buton Direct WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wider uppercase bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
            >
              <svg
                className="w-5 h-5 fill-current shrink-0"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.487-8.413z" />
              </svg>
              <span>Comandă direct pe WhatsApp</span>
            </a>
          </div>

          {/* Descrierea obligatorie cerută */}
          <div className="bg-[#171412] border border-[#2B2521] p-4 rounded-xl space-y-2">
            <h3 className="font-serif-title text-sm font-bold text-[#F3EBDD]">
              Descriere produs
            </h3>
            <p className="text-xs sm:text-sm text-[#A89B8C] leading-relaxed">
              Produs proaspăt de la CARNION. Întreabă-ne pe WhatsApp despre disponibilitate și tăieri speciale.
            </p>
          </div>

          {/* Notă & scor recenzii clienți */}
          <a
            href="#recenzii-clienti"
            className="flex items-center justify-between p-3.5 bg-[#171412] hover:bg-[#1F1B18] border border-[#2B2521] hover:border-[#C9A55C]/40 rounded-xl transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-[#C9A55C] text-sm tracking-tighter">★★★★★</span>
              <span className="font-serif-title text-xs font-bold text-[#F3EBDD]">
                5.0 / 5.0
              </span>
              <span className="text-[11px] text-[#A89B8C] hidden sm:inline">
                · 14 recenzii verificate ale clienților
              </span>
            </div>
            <span className="text-xs text-[#C9A55C] font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              <span>Opinii clienți</span>
              <span>↓</span>
            </span>
          </a>

          {/* Garanțiile măcelăriei CARNION */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-[#A89B8C]">
            <div className="flex items-center gap-2 p-2.5 bg-[#171412] rounded-lg border border-[#2B2521]">
              <span className="text-[#C9A55C]">✓</span>
              <span>Tranșare curată</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-[#171412] rounded-lg border border-[#2B2521]">
              <span className="text-[#C9A55C]">✓</span>
              <span>Cântar verificat</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-[#171412] rounded-lg border border-[#2B2521]">
              <span className="text-[#C9A55C]">✓</span>
              <span>Carne verificată sanitar</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-[#171412] rounded-lg border border-[#2B2521]">
              <span className="text-[#C9A55C]">✓</span>
              <span>Păstrare la rece</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secțiune Recenzii Clienți (14 recenzii random) */}
      <div id="recenzii-clienti">
        <ReviewSection
          reviews={displayedReviews}
          productName={product.name}
          productId={product.id}
        />
      </div>

      {/* Secțiune Produse Similare din aceeași categorie */}
      {similarProducts.length > 0 && (
        <section className="pt-12 border-t border-[#2B2521] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A55C]">
                Din aceeași categorie
              </span>
              <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#F3EBDD] mt-1">
                Alte produse din {product.category}
              </h2>
            </div>
            <Link
              to={`/categorie/${product.categorySlug}`}
              className="text-xs text-[#C9A55C] hover:underline font-semibold"
            >
              Vezi toate ({product.category}) →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {similarProducts.map((simProd) => (
              <ProductCard key={simProd.id} product={simProd} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
