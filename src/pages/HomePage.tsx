import React from 'react';
import { Link } from 'react-router-dom';
import productsData from '../data/products.json';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import {
  PROGRAM,
  ADRESA,
  PHONE,
  WHATSAPP,
  getWhatsAppUrl,
} from '../config';

export const HomePage: React.FC = () => {
  const { categories, products } = productsData as {
    categories: Category[];
    products: Product[];
  };

  // 8 produse atent selecționate din vitrina de azi (carne proaspătă și mezeluri)
  const vitrinaIds = [
    'antricot-vita',
    'ceafa-porc-fara-os',
    'muschi-de-vita',
    'mici-vita-oaie',
    'carnati-plescoi',
    'babic-nea-popa',
    'cotlete-de-berbecut',
    'piept-pui-fara-os-fara-piele',
  ];

  const vitrinaProducts = vitrinaIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const whatsappHeroUrl = getWhatsAppUrl('Bună ziua! Aș dori să plasez o comandă de carne proaspătă la CARNION.');

  return (
    <div className="space-y-16 lg:space-y-24 pb-12">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#171412] via-[#0E0C0A] to-[#0E0C0A] border-b border-[#2B2521]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Coloana Text Hero */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Trust Tagline */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#C9A55C] bg-[#1F1B18] px-3.5 py-1.5 rounded-full border border-[#2B2521]">
                <span>Militari Residence · Chiajna</span>
                <span aria-hidden="true">·</span>
                <span>Carmangerie Profesională</span>
              </div>

              {/* Titlu Principal & Slogan */}
              <div className="space-y-2">
                <h1 className="font-serif-title text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#F3EBDD] tracking-tight leading-[1.15]">
                  Carne aleasă.{' '}
                  <span className="text-[#C9A55C] italic block sm:inline">
                    Gust adevărat.
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-[#A89B8C] max-w-xl mx-auto lg:mx-0 leading-relaxed pt-2">
                  Carmangeria CARNION vă aduce zilnic carne proaspătă de vită, porc, pui și oaie tranșată cu măiestrie, mici și cârnați artizanali preparați după rețete autentice românești.
                </p>
              </div>

              {/* Butoane Call-To-Action */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/produse"
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#B3202A] hover:bg-[#961720] text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-[#B3202A]/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Vezi produsele</span>
                  <span className="text-base">→</span>
                </Link>

                <a
                  href={whatsappHeroUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-[#25D366]/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.487-8.413z" />
                  </svg>
                  <span>Comandă pe WhatsApp</span>
                </a>
              </div>

              {/* Informații rapide de contact în Hero */}
              <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-[#A89B8C]">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#25D366]">●</span> Răspuns rapid pe WhatsApp
                </span>
                <span aria-hidden="true" className="text-[#2B2521]">·</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[#C9A55C]">⚖</span> Cântărire exactă la pregătire
                </span>
                <span aria-hidden="true" className="text-[#2B2521]">·</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[#C9A55C]">🔪</span> Tranșare zilnică
                </span>
              </div>
            </div>

            {/* Coloana Imagine Hero */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-[#C9A55C]/30 shadow-2xl shadow-black/80 aspect-[16/10] lg:aspect-square group">
                <img
                  src="/src/assets/images/butcher_craft_hero_1791611784169.jpg"
                  alt="Vitrina de carne CARNION Militari Residence"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0C0A]/90 via-[#0E0C0A]/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-[#171412]/90 backdrop-blur-sm rounded-xl border border-[#2B2521] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#F3EBDD]">Vitrină proaspătă zilnică</p>
                    <p className="text-[11px] text-[#A89B8C]">Tranșare atentă · Rețete artizanale</p>
                  </div>
                  <span className="text-xs text-[#C9A55C] font-semibold">264 produse</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BENZI CU CELE 4 PROMISIUNI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Promisiunea 1 */}
          <div className="bg-[#171412] border border-[#2B2521] p-4 sm:p-5 rounded-xl flex flex-col justify-between hover:border-[#C9A55C]/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#B3202A]/15 border border-[#B3202A]/30 flex items-center justify-center text-[#C9A55C] text-lg font-bold mb-3">
              ★
            </div>
            <div>
              <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#F3EBDD]">
                Calitate premium
              </h3>
              <p className="text-xs text-[#A89B8C] mt-1 leading-relaxed">
                Selecție riguroasă a fiecărei piese de carne de la crescători și producători verificați.
              </p>
            </div>
          </div>

          {/* Promisiunea 2 */}
          <div className="bg-[#171412] border border-[#2B2521] p-4 sm:p-5 rounded-xl flex flex-col justify-between hover:border-[#C9A55C]/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#B3202A]/15 border border-[#B3202A]/30 flex items-center justify-center text-[#C9A55C] text-lg font-bold mb-3">
              🔪
            </div>
            <div>
              <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#F3EBDD]">
                Măcelărie proprie
              </h3>
              <p className="text-xs text-[#A89B8C] mt-1 leading-relaxed">
                Tranșare manuală și fasonare profesională în laboratorul nostru din Chiajna.
              </p>
            </div>
          </div>

          {/* Promisiunea 3 */}
          <div className="bg-[#171412] border border-[#2B2521] p-4 sm:p-5 rounded-xl flex flex-col justify-between hover:border-[#C9A55C]/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#B3202A]/15 border border-[#B3202A]/30 flex items-center justify-center text-[#C9A55C] text-lg font-bold mb-3">
              🌿
            </div>
            <div>
              <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#F3EBDD]">
                Ingrediente naturale
              </h3>
              <p className="text-xs text-[#A89B8C] mt-1 leading-relaxed">
                Cârnați și mici fără aditivi ascunși, condimentați exclusiv cu mirodenii alese.
              </p>
            </div>
          </div>

          {/* Promisiunea 4 */}
          <div className="bg-[#171412] border border-[#2B2521] p-4 sm:p-5 rounded-xl flex flex-col justify-between hover:border-[#C9A55C]/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#B3202A]/15 border border-[#B3202A]/30 flex items-center justify-center text-[#C9A55C] text-lg font-bold mb-3">
              🇷🇴
            </div>
            <div>
              <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#F3EBDD]">
                100% românesc
              </h3>
              <p className="text-xs text-[#A89B8C] mt-1 leading-relaxed">
                Carne proaspătă din ferme românești, respectând gustul și tradițiile autentice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. GRILĂ CATEGORII PRINCIPALE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A55C]">
              Descoperă vitrina
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#F3EBDD] mt-1">
              Categoriile noastre
            </h2>
          </div>
          <Link
            to="/produse"
            className="text-xs text-[#C9A55C] hover:text-[#DFC07D] font-semibold flex items-center gap-1 group"
          >
            <span>Vezi toate cele 13 categorii</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/categorie/${cat.slug}`}
              className="group bg-[#171412] hover:bg-[#1F1B18] border border-[#2B2521] hover:border-[#C9A55C]/40 p-4 rounded-xl flex flex-col items-center text-center transition-all shadow-md hover:-translate-y-0.5"
            >
              {/* Monogramă elegantă */}
              <div className="w-12 h-12 rounded-full border border-[#C9A55C]/30 bg-[#0E0C0A] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <span className="font-serif-title text-base font-bold text-[#F3EBDD] group-hover:text-[#C9A55C] transition-colors">
                  {cat.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-[#F3EBDD] group-hover:text-[#C9A55C] transition-colors leading-tight line-clamp-2">
                {cat.name}
              </h3>
              <span className="text-[11px] text-[#A89B8C] mt-1.5">
                {cat.count} produse
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. DIN VITRINA DE AZI (8 PRODUSE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B3202A]">
              Recomandarea măcelarului
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#F3EBDD] mt-1">
              Din vitrina de azi
            </h2>
            <p className="text-xs text-[#A89B8C] mt-1">
              Carne proaspătă tăiată în carmangerie și specialități afumate gata de savurat.
            </p>
          </div>
          <Link
            to="/produse"
            className="text-xs text-[#C9A55C] hover:text-[#DFC07D] font-semibold flex items-center gap-1 group shrink-0"
          >
            <span>Vezi tot catalogul</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {vitrinaProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. SECȚIUNE PROGRAM + ADRESĂ + HARTĂ GOOGLE MAPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#171412] border border-[#2B2521] rounded-2xl overflow-hidden p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Informații carmangerie */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A55C]">
                  Te așteptăm la măcelărie
                </span>
                <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#F3EBDD] mt-1">
                  Locație & Program
                </h2>
                <p className="text-xs text-[#A89B8C] mt-2 leading-relaxed">
                  Vino direct în carmangeria CARNION pentru a alege bucata preferată sau comandă în avans pe WhatsApp pentru pregătire rapidă.
                </p>
              </div>

              <div className="space-y-4 text-xs border-y border-[#2B2521] py-4">
                <div className="flex items-start gap-3">
                  <span className="text-[#C9A55C] text-base mt-0.5">📍</span>
                  <div>
                    <strong className="text-[#F3EBDD] block text-sm">Adresă</strong>
                    <span className="text-[#A89B8C]">{ADRESA}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-[#C9A55C] text-base mt-0.5">🕒</span>
                  <div>
                    <strong className="text-[#F3EBDD] block text-sm">Program de funcționare</strong>
                    <span className="text-[#A89B8C] block">{PROGRAM}</span>
                    <span className="text-[#A89B8C] block text-[11px]">Duminică: Închis</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-[#C9A55C] text-base mt-0.5">📞</span>
                  <div>
                    <strong className="text-[#F3EBDD] block text-sm">Telefon & WhatsApp</strong>
                    <a
                      href={`tel:${PHONE.replace(/\s+/g, '')}`}
                      className="text-[#F3EBDD] hover:text-[#C9A55C] font-mono block transition-colors"
                    >
                      {PHONE}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={getWhatsAppUrl('Bună ziua! Doresc să vă întreb despre disponibilitatea produselor de azi.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>Scrie-ne pe WhatsApp</span>
                  <span>💬</span>
                </a>
                <a
                  href="https://maps.google.com/?q=Militari+Residence+Chiajna+Ilfov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-[#1F1B18] hover:bg-[#2B2521] border border-[#2B2521] text-[#F3EBDD] font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Deschide Harta</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Google Maps iFrame pentru Chiajna, Militari Residence */}
            <div className="lg:col-span-7">
              <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-[#2B2521] shadow-inner bg-[#0E0C0A] relative">
                <iframe
                  title="Harta CARNION Militari Residence Chiajna"
                  src="https://maps.google.com/maps?q=Militari%20Residence,%20Chiajna,%20Ilfov,%20Romania&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(110%)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
