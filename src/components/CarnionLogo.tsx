import React from 'react';

interface CarnionLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const CarnionLogo: React.FC<CarnionLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  // Dimensions based on size
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-24 w-24',
    xl: 'h-36 w-36',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Vintage Butcher Emblem Image */}
      <div className={`relative shrink-0 overflow-hidden rounded-full border border-[#C9A55C]/30 bg-[#171412] p-0.5 shadow-md shadow-black/40 ${sizeClasses[size]}`}>
        <img
          src="/src/assets/images/carnion_logo_1791611769237.jpg"
          alt="CARNION Carmangerie Logo"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover rounded-full"
          onError={(e) => {
            // Elegant SVG fallback if image fails to render
            const target = e.currentTarget;
            target.style.display = 'none';
            if (target.parentElement) {
              const fallback = target.parentElement.querySelector('.logo-svg-fallback');
              if (fallback) (fallback as HTMLElement).style.display = 'flex';
            }
          }}
        />
        {/* SVG Fallback */}
        <div
          className="logo-svg-fallback hidden absolute inset-0 items-center justify-center bg-[#171412] text-[#F3EBDD] p-1 text-center font-serif text-[10px]"
          style={{ display: 'none' }}
        >
          <span className="font-bold tracking-wider">CARNION</span>
        </div>
      </div>

      {/* Brand Typography Lockup */}
      <div className="flex flex-col justify-center leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="font-serif-title text-xl sm:text-2xl font-bold tracking-wider text-[#F3EBDD] uppercase">
            CARNION
          </span>
          <span className="text-[#C9A55C] text-xs">★</span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] sm:text-xs font-medium tracking-wide text-[#C9A55C] uppercase">
            Carne aleasă. Gust adevărat.
          </span>
        )}
      </div>
    </div>
  );
};

export default CarnionLogo;
