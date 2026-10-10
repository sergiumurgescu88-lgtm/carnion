import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatPriceNumber, formatPriceWithUnit } from '../utils/text';
import { getProductWhatsAppUrl } from '../config';
import { useCart } from '../context/CartContext';
import QuantitySelector from './QuantitySelector';

import { useApprovedImages } from '../utils/imageDb';

interface ProductCardProps {
  product: Product;
}

// Iconițe sau inițiale specifice categoriei pentru placeholder-ul grafic
function getCategorySymbol(categorySlug: string): string {
  switch (categorySlug) {
    case 'vita':
      return 'V';
    case 'porc':
      return 'P';
    case 'pui':
      return 'PU';
    case 'oaie-si-miel':
      return 'O';
    case 'carnati-proaspeti':
      return 'C';
    case 'mezeluri-si-afumaturi':
      return 'M';
    case 'lactate-branzeturi-si-oua':
      return 'L';
    case 'muraturi-si-conserve':
      return 'MC';
    case 'bacanie-si-condimente':
      return 'B';
    case 'paine-si-panificatie':
      return 'PA';
    case 'bauturi':
      return 'BT';
    case 'dulciuri':
      return 'D';
    default:
      return 'C';
  }
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const approvedImages = useApprovedImages();

  const [quantity, setQuantity] = useState<number>(product.soldByWeight ? 1.0 : 1);
  const [justAdded, setJustAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const estimatedTotal = Math.round(product.price * quantity * 100) / 100;
  const whatsappUrl = getProductWhatsAppUrl(product.name);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const currentImage = approvedImages[product.id] || product.image;
  const hasImage = Boolean(currentImage) && !imageError;

  return (
    <article className="group bg-[#171412] border border-[#2B2521] hover:border-[#C9A55C]/40 rounded-xl overflow-hidden flex flex-col transition-all duration-200 shadow-lg shadow-black/40 hover:shadow-black/70">
      {/* Zona vizuală cu poză (4:3, object-cover) sau placeholder elegant */}
      <Link
        to={`/produs/${product.id}`}
        className="relative block aspect-[4/3] bg-gradient-to-b from-[#1F1B18] to-[#120F0D] overflow-hidden border-b border-[#2B2521] group-hover:scale-[1.01] transition-transform duration-200"
      >
        {/* Poză reală dacă este disponibilă */}
        {hasImage ? (
          <>
            <img
              src={currentImage}
              alt={product.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120F0D] via-transparent to-black/30 pointer-events-none" />
          </>
        ) : (
          /* Placeholder elegant cu monogramă și fundal întunecat */
          <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 relative">
            <div className="absolute inset-2 border border-[#C9A55C]/15 rounded pointer-events-none" />

            <div className="w-14 h-14 rounded-full border border-[#C9A55C]/30 bg-[#0E0C0A]/80 flex items-center justify-center mb-1 shadow-inner">
              <span className="font-serif-title text-xl font-bold text-[#F3EBDD]">
                {getCategorySymbol(product.categorySlug)}
              </span>
            </div>

            <span className="text-[11px] text-[#A89B8C] font-mono tracking-wider">
              CARNION CHIAJNA
            </span>

            {/* Mențiune discretă cerută pentru produsele cu imageMode='generate' fără poză încă */}
            {product.imageMode === 'generate' && (
              <span className="text-[10px] text-[#C9A55C]/80 mt-1 font-medium italic">
                în curând fotografie
              </span>
            )}
          </div>
        )}

        {/* Categorie ca text curat */}
        <div className="absolute top-3 left-3 z-10 text-[11px] font-semibold tracking-wider uppercase text-[#C9A55C] bg-[#120F0D]/75 backdrop-blur-xs px-2 py-0.5 rounded">
          {product.category}
        </div>

        {/* Indicator tip vânzare */}
        <div className="absolute bottom-3 right-3 text-[11px] text-[#A89B8C] bg-[#120F0D]/75 backdrop-blur-xs px-2 py-0.5 rounded z-10">
          {product.soldByWeight ? 'la cântar' : 'la bucată'}
        </div>
      </Link>

      {/* Corpul cardului */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Titlu și preț */}
        <div>
          <Link
            to={`/produs/${product.id}`}
            className="block group-hover:text-[#C9A55C] transition-colors"
          >
            <h3 className="font-serif-title text-lg font-bold text-[#F3EBDD] leading-snug line-clamp-2 min-h-[3rem]">
              {product.name}
            </h3>
          </Link>

          {/* Preț unitar */}
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-xl font-extrabold text-[#B3202A] tracking-tight font-mono">
                {formatPriceNumber(product.price)}
              </span>
              <span className="text-xs font-semibold text-[#F3EBDD] ml-1">
                lei / {product.unit}
              </span>
            </div>
            {/* Total estimat pentru cantitate dacă diferă de 1 */}
            {quantity !== 1 && (
              <span className="text-xs text-[#A89B8C] font-mono">
                Estimat: <strong className="text-[#F3EBDD]">{formatPriceNumber(estimatedTotal)} lei</strong>
              </span>
            )}
          </div>
        </div>

        {/* Selector cantitate */}
        <div className="pt-2 border-t border-[#2B2521]">
          <QuantitySelector
            soldByWeight={product.soldByWeight}
            value={quantity}
            onChange={setQuantity}
            compact
          />
        </div>

        {/* Butoane acțiune */}
        <div className="pt-2 flex items-center gap-2">
          {/* Buton Adaugă în coș */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-xs tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md min-h-[44px] ${
              justAdded
                ? 'bg-[#25D366] text-white hover:bg-[#20bd5a]'
                : 'bg-[#B3202A] text-white hover:bg-[#961720] active:scale-[0.98]'
            }`}
          >
            <svg
              className="w-4 h-4 shrink-0"
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
            <span>{justAdded ? 'Adăugat!' : 'Adaugă în coș'}</span>
          </button>

          {/* Buton mic Întreabă pe WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Întreabă pe WhatsApp despre ${product.name}`}
            className="w-11 h-11 shrink-0 rounded-lg bg-[#1F1B18] border border-[#2B2521] hover:border-[#25D366] text-[#25D366] flex items-center justify-center transition-all hover:bg-[#25D366]/10 cursor-pointer"
            aria-label={`Întreabă pe WhatsApp despre ${product.name}`}
          >
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.487-8.413z" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
