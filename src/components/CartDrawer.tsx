import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPriceNumber, formatQuantity } from '../utils/text';
import { COMANDA_MINIMA, LIVRARE_GRATIS_PESTE } from '../config';
import { useApprovedImages } from '../utils/imageDb';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    hasWeightedProducts,
  } = useCart();
  const approvedImages = useApprovedImages();

  const navigate = useNavigate();

  // Închidere la tasta Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Blocare scroll body când panoul este deschis
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const handleGoToCheckout = () => {
    closeDrawer();
    navigate('/comanda');
  };

  // Calcul bară progres livrare gratuită
  const freeShippingProgress =
    LIVRARE_GRATIS_PESTE > 0
      ? Math.min(100, Math.round((subtotal / LIVRARE_GRATIS_PESTE) * 100))
      : 0;
  const remainingForFreeShipping =
    LIVRARE_GRATIS_PESTE > 0 ? Math.max(0, LIVRARE_GRATIS_PESTE - subtotal) : 0;

  // Verificare comandă minimă
  const isBelowMinOrder = COMANDA_MINIMA > 0 && subtotal < COMANDA_MINIMA;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop întunecat */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Sertar glisant din dreapta */}
      <div className="relative w-full max-w-md bg-[#171412] border-l border-[#2B2521] h-full flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-250">
        {/* Antet Coș */}
        <div className="p-4 sm:p-5 border-b border-[#2B2521] flex items-center justify-between bg-[#120F0D]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🥩</span>
            <div>
              <h2 className="font-serif-title text-lg sm:text-xl font-bold text-[#F3EBDD]">
                Coșul tău
              </h2>
              <p className="text-[11px] text-[#A89B8C]">
                {items.length === 1 ? '1 produs selectat' : `${items.length} produse selectate`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="w-8 h-8 rounded-lg bg-[#1F1B18] border border-[#2B2521] text-[#A89B8C] hover:text-[#F3EBDD] hover:border-[#C9A55C]/40 flex items-center justify-center transition-colors text-lg"
            aria-label="Închide coșul"
          >
            ×
          </button>
        </div>

        {/* Conținut listă produse */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Bara de progres pentru livrare gratuită dacă pragul este setat */}
          {LIVRARE_GRATIS_PESTE > 0 && (
            <div className="bg-[#1F1B18] border border-[#2B2521] p-3 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                {remainingForFreeShipping > 0 ? (
                  <span className="text-[#A89B8C]">
                    Mai adaugă <strong className="text-[#C9A55C] font-mono">{formatPriceNumber(remainingForFreeShipping)} lei</strong> pentru livrare gratuită!
                  </span>
                ) : (
                  <span className="text-[#25D366] font-semibold flex items-center gap-1">
                    ✓ Felicitări! Ai livrare gratuită!
                  </span>
                )}
                <span className="text-[11px] font-mono text-[#A89B8C]">{freeShippingProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#0E0C0A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C9A55C] to-[#25D366] transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Alertă comandă minimă dacă e cazul */}
          {isBelowMinOrder && (
            <div className="p-3 bg-[#B3202A]/15 border border-[#B3202A]/40 rounded-xl text-xs text-[#F3EBDD] flex items-start gap-2">
              <span className="text-[#B3202A] text-sm leading-none mt-0.5">⚠</span>
              <span>
                Comanda minimă acceptată este de <strong>{formatPriceNumber(COMANDA_MINIMA)} lei</strong>. Mai adaugă produse în valoare de <strong>{formatPriceNumber(COMANDA_MINIMA - subtotal)} lei</strong>.
              </span>
            </div>
          )}

          {/* Listă elemente coș */}
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map(({ product, quantity }) => {
                const lineTotal = Math.round(product.price * quantity * 100) / 100;

                const handleMinus = () => {
                  if (product.soldByWeight) {
                    const next = Math.max(0.25, Math.round((quantity - 0.5) * 100) / 100);
                    updateQuantity(product.id, next);
                  } else {
                    updateQuantity(product.id, quantity - 1);
                  }
                };

                const handlePlus = () => {
                  if (product.soldByWeight) {
                    const next = Math.round((quantity + 0.5) * 100) / 100;
                    updateQuantity(product.id, next);
                  } else {
                    updateQuantity(product.id, quantity + 1);
                  }
                };

                return (
                  <div
                    key={product.id}
                    className="bg-[#1F1B18] border border-[#2B2521] rounded-xl p-3 flex gap-3 items-center justify-between"
                  >
                    {/* Poză mică sau placeholder grafic / Monogramă */}
                    <div className="w-12 h-12 rounded-lg bg-[#120F0D] border border-[#2B2521] flex items-center justify-center shrink-0 overflow-hidden relative">
                      {(() => {
                        const currentImg = approvedImages[product.id] || product.image;
                        return currentImg ? (
                          <img
                            src={currentImg}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="font-serif-title font-bold text-sm text-[#C9A55C]">
                            {product.category.slice(0, 2).toUpperCase()}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Detalii produs */}
                    <div className="flex-1 min-w-0 pr-1">
                      <Link
                        to={`/produs/${product.id}`}
                        onClick={closeDrawer}
                        className="text-xs sm:text-sm font-semibold text-[#F3EBDD] hover:text-[#C9A55C] transition-colors block truncate"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[11px] text-[#A89B8C]">
                        {formatPriceNumber(product.price)} lei / {product.unit}
                      </p>

                      {/* Stepper cantitate compact */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center bg-[#120F0D] border border-[#2B2521] rounded-lg">
                          <button
                            type="button"
                            onClick={handleMinus}
                            disabled={product.soldByWeight ? quantity <= 0.25 : quantity <= 1}
                            className="w-6 h-6 flex items-center justify-center text-[#F3EBDD] hover:bg-[#2B2521] disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors"
                            aria-label="Scade cantitatea"
                          >
                            –
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-[#F3EBDD]">
                            {formatQuantity(quantity, product.unit)}
                          </span>
                          <button
                            type="button"
                            onClick={handlePlus}
                            className="w-6 h-6 flex items-center justify-center text-[#F3EBDD] hover:bg-[#2B2521] text-xs transition-colors"
                            aria-label="Crește cantitatea"
                          >
                            +
                          </button>
                        </div>

                        {/* Buton ștergere produs */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="p-1 text-[#A89B8C] hover:text-[#B3202A] transition-colors text-xs"
                          title="Elimină din coș"
                          aria-label={`Elimină ${product.name} din coș`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.7}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Preț pe linie */}
                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-bold font-mono text-[#F3EBDD]">
                        ~ {formatPriceNumber(lineTotal)} lei
                      </span>
                      {product.soldByWeight && (
                        <span className="block text-[10px] text-[#A89B8C]">estimat</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Coș gol */
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1F1B18] border border-[#2B2521] text-[#A89B8C] flex items-center justify-center mx-auto text-2xl">
                🛒
              </div>
              <div>
                <h3 className="font-serif-title text-base font-bold text-[#F3EBDD]">
                  Coșul tău este gol
                </h3>
                <p className="text-xs text-[#A89B8C] mt-1 max-w-xs mx-auto">
                  Nu ai adăugat încă niciun produs. Explorează vitrina carmangeriei CARNION.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  navigate('/produse');
                }}
                className="px-5 py-2.5 bg-[#B3202A] hover:bg-[#961720] text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Vezi vitrina de produse
              </button>
            </div>
          )}
        </div>

        {/* Subsol Coș: Totaluri și Buton Comandă */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#2B2521] bg-[#120F0D] space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between text-sm sm:text-base">
                <span className="text-[#A89B8C] font-medium">Total estimat:</span>
                <span className="font-serif-title text-lg sm:text-xl font-bold text-[#B3202A] font-mono">
                  ~ {formatPriceNumber(subtotal)} lei
                  <span className="text-xs font-normal text-[#A89B8C] ml-1">(estimat)</span>
                </span>
              </div>

              {/* Notă obligatorie pentru cântărire */}
              <p className="text-[11px] text-[#A89B8C] leading-tight italic">
                {hasWeightedProducts
                  ? 'Prețul final se stabilește după cântărire.'
                  : 'Preț final estimat. Se verifică la pregătirea comenzii.'}
              </p>
            </div>

            {/* Butoane acțiune */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoToCheckout}
                disabled={isBelowMinOrder}
                className="w-full py-3.5 px-4 bg-[#B3202A] hover:bg-[#961720] disabled:bg-[#3D352E] disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#B3202A]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continuă comanda</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="w-full py-2 text-center text-xs text-[#A89B8C] hover:text-[#B3202A] transition-colors cursor-pointer"
              >
                Golește coșul
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
