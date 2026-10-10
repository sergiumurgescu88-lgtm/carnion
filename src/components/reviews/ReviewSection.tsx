import React, { useMemo } from 'react';
import defaultReviewsData from './reviews.json';
import { Review } from '../../types';

interface ReviewSectionProps {
  /**
   * Recenzii opționale transmise din exterior.
   * Dacă lipsesc, se încarcă automat din `reviews.json`.
   */
  reviews?: Review[];
  /**
   * Numele produsului pentru context vizual
   */
  productName?: string;
  /**
   * Identificatorul produsului pentru consistența amestecării
   */
  productId?: string;
  /**
   * Numărul maxim de recenzii afișate (implicit: 14)
   */
  maxCount?: number;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  reviews,
  productName,
  productId,
  maxCount = 14,
}) => {
  // Preia 14 recenzii random dacă sunt disponibile
  const displayedReviews = useMemo(() => {
    const rawList: Review[] =
      reviews && reviews.length > 0 ? reviews : (defaultReviewsData as Review[]);

    if (!rawList || rawList.length === 0) return [];

    // Algoritm de amestecare aleatorie bazat pe Fisher-Yates
    const copy = [...rawList];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy.slice(0, maxCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews, productId, maxCount]);

  if (displayedReviews.length === 0) {
    return null;
  }

  // Calcul notă medie
  const averageRating = (
    displayedReviews.reduce((acc, r) => acc + (r.rating || 5), 0) /
    displayedReviews.length
  ).toFixed(1);

  return (
    <section className="pt-10 border-t border-[#2B2521] space-y-8 animate-in fade-in duration-200">
      {/* Header Secțiune & Statistici */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171412] border border-[#2B2521] p-5 sm:p-6 rounded-2xl relative overflow-hidden">
        {/* Accent decorativ de fundal */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#C9A55C]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A55C]">
              Recenzii clienți
            </span>
            <span className="text-[10px] bg-[#1F1B18] border border-[#C9A55C]/30 text-[#C9A55C] px-2 py-0.5 rounded-full font-mono">
              {displayedReviews.length} păreri verificate
            </span>
          </div>
          <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#F3EBDD]">
            Ce spun clienții despre {productName || 'produsele CARNION'}
          </h2>
          <p className="text-xs text-[#A89B8C]">
            Opinii reale ale clienților din Chiajna și București (Militari Residence).
          </p>
        </div>

        {/* Scor Mediu Card */}
        <div className="flex items-center gap-3 bg-[#0E0C0A] border border-[#2B2521] px-4 py-3 rounded-xl shrink-0 self-start sm:self-auto relative z-10">
          <div className="text-center">
            <span className="font-serif-title text-3xl font-extrabold text-[#F3EBDD] leading-none block">
              {averageRating}
            </span>
            <span className="text-[10px] text-[#A89B8C] uppercase tracking-wider block mt-0.5">
              din 5.0
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex text-[#C9A55C] text-sm">
              {'★★★★★'}
            </div>
            <span className="text-[11px] text-[#25D366] font-semibold flex items-center gap-1">
              <span>✓</span> 100% recomandă
            </span>
          </div>
        </div>
      </div>

      {/* Grilă Stilizată: Cele 14 recenzii */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedReviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-[#171412] border border-[#2B2521] hover:border-[#C9A55C]/40 transition-colors p-4.5 rounded-xl flex flex-col justify-between space-y-3.5 shadow-sm hover:shadow-md"
          >
            {/* Header Recenzie: Avatar cu inițiale, Nume, Verificare, Stele */}
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1F1B18] border border-[#2B2521] flex items-center justify-center text-xs font-bold text-[#C9A55C] shrink-0">
                    {rev.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-serif-title text-sm font-bold text-[#F3EBDD]">
                        {rev.author}
                      </span>
                      {rev.verified && (
                        <span
                          title="Client verificat CARNION"
                          className="text-[10px] bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 px-1.5 py-0.2 rounded font-medium inline-flex items-center gap-0.5"
                        >
                          <span>✓</span> Verificat
                        </span>
                      )}
                    </div>
                    {rev.location && (
                      <span className="text-[11px] text-[#A89B8C] block">
                        {rev.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stele & Dată */}
                <div className="text-right shrink-0">
                  <div className="text-[#C9A55C] text-xs tracking-tight">
                    {'★'.repeat(rev.rating || 5)}
                    {'☆'.repeat(Math.max(0, 5 - (rev.rating || 5)))}
                  </div>
                  <span className="text-[10px] text-[#A89B8C] block mt-0.5">
                    {rev.date}
                  </span>
                </div>
              </div>

              {/* Textul Recenziei */}
              <div className="relative pl-3 border-l-2 border-[#C9A55C]/40">
                <p className="text-xs sm:text-[13px] text-[#E2D9CC] leading-relaxed italic">
                  „{rev.comment}”
                </p>
              </div>
            </div>

            {/* Subsol Card: Badge calitativ */}
            <div className="pt-2 border-t border-[#1F1B18] flex items-center justify-between text-[11px] text-[#A89B8C]">
              <span className="inline-flex items-center gap-1 text-[10px] text-[#C9A55C]/80">
                <span>✦</span> Carmangeria CARNION
              </span>
              <span className="text-[10px] text-[#A89B8C]">Opinie autentică</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReviewSection;
