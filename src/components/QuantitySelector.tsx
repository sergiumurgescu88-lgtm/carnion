import React from 'react';

interface QuantitySelectorProps {
  soldByWeight: boolean;
  value: number;
  onChange: (val: number) => void;
  compact?: boolean;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  soldByWeight,
  value,
  onChange,
  compact = false,
}) => {
  // Logică pentru produse vândute la greutate (kg)
  if (soldByWeight) {
    const handleDecrement = () => {
      const next = Math.max(0.25, Math.round((value - 0.5) * 100) / 100);
      onChange(next);
    };

    const handleIncrement = () => {
      const next = Math.round((value + 0.5) * 100) / 100;
      onChange(next);
    };

    const handleDirectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (isNaN(val)) {
        onChange(0.25);
      } else {
        onChange(Math.max(0.25, Math.round(val * 100) / 100));
      }
    };

    const quickChips = [0.5, 1, 2];

    return (
      <div className="w-full space-y-2">
        {/* Butoane rapide chip-uri 0.5 kg, 1 kg, 2 kg */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#A89B8C] font-medium mr-1 hidden sm:inline">
            Rapid:
          </span>
          {quickChips.map((chip) => {
            const isActive = Math.abs(value - chip) < 0.01;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => onChange(chip)}
                className={`px-2.5 py-1 text-xs font-medium rounded border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#B3202A] text-white border-[#B3202A] shadow-sm'
                    : 'bg-[#1F1B18] text-[#F3EBDD] border-[#2B2521] hover:border-[#C9A55C]/40'
                }`}
              >
                {chip === 0.5 ? '0,5 kg' : `${chip} kg`}
              </button>
            );
          })}
        </div>

        {/* Stepper principal + Input manual */}
        <div className="flex items-center gap-1.5 bg-[#1F1B18] p-1 rounded-lg border border-[#2B2521]">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={value <= 0.25}
            className="w-8 h-8 rounded flex items-center justify-center bg-[#171412] text-[#F3EBDD] hover:bg-[#2B2521] disabled:opacity-30 disabled:cursor-not-allowed border border-[#2B2521] font-semibold text-base transition-colors"
            aria-label="Scade cantitatea cu 0.5 kg"
          >
            –
          </button>

          <div className="flex-1 flex items-center justify-center gap-1 px-1">
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={value}
              onChange={handleDirectChange}
              className="w-16 text-center bg-transparent text-[#F3EBDD] font-bold text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Cantitate în kilograme"
            />
            <span className="text-xs text-[#A89B8C] font-medium">kg</span>
          </div>

          <button
            type="button"
            onClick={handleIncrement}
            className="w-8 h-8 rounded flex items-center justify-center bg-[#171412] text-[#F3EBDD] hover:bg-[#2B2521] border border-[#2B2521] font-semibold text-base transition-colors"
            aria-label="Crește cantitatea cu 0.5 kg"
          >
            +
          </button>
        </div>

        {/* Notă obligatorie pentru produse la kilogram */}
        <p className="text-[11px] text-[#A89B8C] leading-snug italic">
          Preț estimat — se cântărește exact la pregătirea comenzii
        </p>
      </div>
    );
  }

  // Logică pentru produse la bucată
  const handleDecrement = () => {
    onChange(Math.max(1, value - 1));
  };

  const handleIncrement = () => {
    onChange(value + 1);
  };

  const handleDirectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onChange(isNaN(val) || val < 1 ? 1 : val);
  };

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center gap-1.5 bg-[#1F1B18] p-1 rounded-lg border border-[#2B2521]">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= 1}
          className="w-8 h-8 rounded flex items-center justify-center bg-[#171412] text-[#F3EBDD] hover:bg-[#2B2521] disabled:opacity-30 disabled:cursor-not-allowed border border-[#2B2521] font-semibold text-base transition-colors"
          aria-label="Scade cantitatea cu 1 bucată"
        >
          –
        </button>

        <div className="flex-1 flex items-center justify-center gap-1 px-1">
          <input
            type="number"
            min="1"
            step="1"
            value={value}
            onChange={handleDirectChange}
            className="w-16 text-center bg-transparent text-[#F3EBDD] font-bold text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Cantitate în bucăți"
          />
          <span className="text-xs text-[#A89B8C] font-medium">buc</span>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          className="w-8 h-8 rounded flex items-center justify-center bg-[#171412] text-[#F3EBDD] hover:bg-[#2B2521] border border-[#2B2521] font-semibold text-base transition-colors"
          aria-label="Crește cantitatea cu 1 bucată"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default QuantitySelector;
