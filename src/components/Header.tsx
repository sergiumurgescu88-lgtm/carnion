import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CarnionLogo from './CarnionLogo';
import { useCart } from '../context/CartContext';
import { getWhatsAppUrl, PHONE, PROGRAM } from '../config';

export const Header: React.FC = () => {
  const { cartCount, openDrawer } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produse?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const whatsappUrl = getWhatsAppUrl();

  return (
    <header className="sticky top-0 z-40 bg-[#0E0C0A]/95 backdrop-blur-md border-b border-[#2B2521]">
      {/* Top micro banner pentru telefon & program carmangerie */}
      <div className="hidden md:block bg-[#171412] border-b border-[#2B2521]/60 py-1 text-xs text-[#A89B8C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#F3EBDD]">
              <span className="text-[#C9A55C]">📍</span> Chiajna, Ilfov (Militari Residence)
            </span>
            <span aria-hidden="true" className="text-[#2B2521]">|</span>
            <span>{PROGRAM}</span>
          </div>
          <div className="flex items-center gap-4">
            {import.meta.env.DEV && (
              <Link
                to="/admin/imagini"
                className="px-2 py-0.5 rounded bg-[#C9A55C]/15 border border-[#C9A55C]/40 text-[#C9A55C] hover:bg-[#C9A55C]/25 transition-colors font-medium text-[11px]"
              >
                ⚙ Admin Imagini AI (95)
              </Link>
            )}
            <a
              href={`tel:${PHONE.replace(/\s+/g, '')}`}
              className="text-[#F3EBDD] hover:text-[#C9A55C] transition-colors flex items-center gap-1 font-mono"
            >
              <span className="text-[#C9A55C]">📞</span> {PHONE}
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center shrink-0 focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <CarnionLogo size="sm" showSubtitle={false} />
          </Link>

          {/* Nav Links Desktop */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#F3EBDD]">
            <Link
              to="/"
              className={`hover:text-[#C9A55C] transition-colors ${
                location.pathname === '/' ? 'text-[#C9A55C] font-semibold' : ''
              }`}
            >
              Acasă
            </Link>
            <Link
              to="/produse"
              className={`hover:text-[#C9A55C] transition-colors ${
                location.pathname === '/produse' ? 'text-[#C9A55C] font-semibold' : ''
              }`}
            >
              Toate Produsele
            </Link>
            <Link
              to="/categorie/vita"
              className="hover:text-[#C9A55C] transition-colors"
            >
              Carne Vită
            </Link>
            <Link
              to="/categorie/porc"
              className="hover:text-[#C9A55C] transition-colors"
            >
              Carne Porc
            </Link>
            <Link
              to="/categorie/mezeluri-si-afumaturi"
              className="hover:text-[#C9A55C] transition-colors"
            >
              Mezeluri
            </Link>
            <Link
              to="/despre"
              className={`hover:text-[#C9A55C] transition-colors ${
                location.pathname === '/despre' ? 'text-[#C9A55C] font-semibold' : ''
              }`}
            >
              Despre
            </Link>
            <Link
              to="/livrare-si-plata"
              className={`hover:text-[#C9A55C] transition-colors ${
                location.pathname === '/livrare-si-plata' ? 'text-[#C9A55C] font-semibold' : ''
              }`}
            >
              Livrare & Plată
            </Link>
          </nav>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xs relative items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută pulpă, ceafă, mici..."
              className="w-full bg-[#171412] text-[#F3EBDD] text-xs pl-9 pr-3 py-2 rounded-lg border border-[#2B2521] focus:border-[#C9A55C] focus:outline-none transition-colors placeholder:text-[#A89B8C]"
            />
            <svg
              className="w-4 h-4 text-[#A89B8C] absolute left-3 pointer-events-none"
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
          </form>

          {/* Right Actions: Search Mobile, Cart Icon, WhatsApp button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Icon Trigger on Mobile */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 text-[#F3EBDD] hover:text-[#C9A55C] rounded-lg border border-[#2B2521] bg-[#171412]"
              aria-label="Deschide căutarea"
            >
              <svg
                className="w-5 h-5"
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
            </button>

            {/* Cart Icon with Number */}
            <button
              type="button"
              onClick={openDrawer}
              className="relative p-2 sm:px-3 sm:py-2 text-[#F3EBDD] hover:text-[#C9A55C] rounded-lg border border-[#2B2521] bg-[#171412] flex items-center gap-2 transition-colors cursor-pointer"
              title="Deschide coșul de cumpărături"
              aria-label={`Coș cu ${cartCount} produse`}
            >
              <svg
                className="w-5 h-5 text-[#F3EBDD]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span className="hidden sm:inline text-xs font-semibold">Coș</span>
              {/* Badge contor */}
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#B3202A] text-white text-xs font-bold font-mono">
                {cartCount}
              </span>
            </button>

            {/* WhatsApp CTA Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <svg
                className="w-4 h-4 fill-current shrink-0"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.487-8.413z" />
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Hamburger Button Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#F3EBDD] hover:text-[#C9A55C] rounded-lg border border-[#2B2521] bg-[#171412]"
              aria-label="Deschide meniul de navigare"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Search Input Drawer (Dropdown) */}
        {mobileSearchOpen && (
          <div className="md:hidden py-3 border-t border-[#2B2521] animate-in fade-in duration-150">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Caută produse în carmangerie..."
                autoFocus
                className="w-full bg-[#171412] text-[#F3EBDD] text-sm pl-10 pr-12 py-2.5 rounded-lg border border-[#C9A55C]/40 focus:border-[#C9A55C] focus:outline-none"
              />
              <svg
                className="w-5 h-5 text-[#A89B8C] absolute left-3 pointer-events-none"
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
              <button
                type="submit"
                className="absolute right-2 px-2.5 py-1 text-xs bg-[#B3202A] text-white rounded font-medium"
              >
                Caută
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Hamburger Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#171412] border-b border-[#2B2521] px-4 py-4 space-y-3 animate-in fade-in duration-150 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-[#1F1B18] text-[#F3EBDD] flex items-center justify-between"
            >
              <span>Acasă</span>
              <span className="text-[#C9A55C] text-xs">→</span>
            </Link>
            <Link
              to="/produse"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-[#1F1B18] text-[#F3EBDD] flex items-center justify-between font-semibold"
            >
              <span>Toate Produsele (Catalog)</span>
              <span className="text-[#C9A55C] text-xs">264 produse</span>
            </Link>

            <div className="pt-2 border-t border-[#2B2521]">
              <span className="text-xs text-[#A89B8C] font-semibold uppercase tracking-wider px-3 block mb-1">
                Categorii de Carne
              </span>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <Link
                  to="/categorie/vita"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD]"
                >
                  🥩 Vită (20)
                </Link>
                <Link
                  to="/categorie/porc"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD]"
                >
                  🥓 Porc (22)
                </Link>
                <Link
                  to="/categorie/pui"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD]"
                >
                  🍗 Pui (8)
                </Link>
                <Link
                  to="/categorie/oaie-si-miel"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD]"
                >
                  🍖 Oaie & miel (4)
                </Link>
                <Link
                  to="/categorie/carnati-proaspeti"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD]"
                >
                  🌭 Cârnați proaspeți (2)
                </Link>
                <Link
                  to="/categorie/mezeluri-si-afumaturi"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD]"
                >
                  🧆 Mezeluri (28)
                </Link>
              </div>
            </div>

            <div className="pt-2 border-t border-[#2B2521]">
              <span className="text-xs text-[#A89B8C] font-semibold uppercase tracking-wider px-3 block mb-1">
                Băcănie & Diverse
              </span>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <Link
                  to="/categorie/lactate-branzeturi-si-oua"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD]"
                >
                  🧀 Lactate & ouă
                </Link>
                <Link
                  to="/categorie/muraturi-si-conserve"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD]"
                >
                  🥒 Murături & conserve
                </Link>
                <Link
                  to="/categorie/bacanie-si-condimente"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD]"
                >
                  🧂 Condimente & paste
                </Link>
                <Link
                  to="/categorie/paine-si-panificatie"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD]"
                >
                  🥖 Pâine & chifle
                </Link>
                <Link
                  to="/categorie/bauturi"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD]"
                >
                  🍷 Băuturi & vinuri
                </Link>
                <Link
                  to="/categorie/dulciuri"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD]"
                >
                  🍫 Dulciuri
                </Link>
              </div>
            </div>

            <div className="pt-2 border-t border-[#2B2521] space-y-1 text-xs">
              <Link
                to="/despre"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD] block"
              >
                Despre Carmangerie
              </Link>
              <Link
                to="/livrare-si-plata"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD] block"
              >
                Livrare & Plată
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded hover:bg-[#1F1B18] text-[#F3EBDD] block"
              >
                Contact & Locație
              </Link>
            </div>

            <div className="pt-3 border-t border-[#2B2521] text-xs space-y-1 text-[#A89B8C] px-3">
              <p>📍 Chiajna, Ilfov (Militari Residence)</p>
              <p>🕒 {PROGRAM}</p>
              <p>📞 Tel: {PHONE}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
