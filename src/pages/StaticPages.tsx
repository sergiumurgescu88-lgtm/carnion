import React from 'react';
import { Link } from 'react-router-dom';
import {
  WHATSAPP,
  PHONE,
  PROGRAM,
  ADRESA,
  LIVRARE_COST,
  LIVRARE_GRATIS_PESTE,
  COMANDA_MINIMA,
  ZONE_LIVRARE,
  getWhatsAppUrl,
} from '../config';
import { formatPriceNumber } from '../utils/text';

// 1. PAGINA DESPRE CARNION (/despre)
export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-10">
      <div className="border-b border-[#2B2521] pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A55C]">
          Povestea noastră
        </span>
        <h1 className="font-serif-title text-3xl sm:text-5xl font-extrabold text-[#F3EBDD] mt-1">
          Despre CARNION
        </h1>
        <p className="text-sm text-[#A89B8C] mt-2">
          Carmangerie profesională și măcelărie de tradiție în Chiajna, zona Militari Residence.
        </p>
      </div>

      <div className="prose prose-invert max-w-none space-y-6 text-sm sm:text-base text-[#F3EBDD]/90 leading-relaxed">
        <p>
          La <strong>CARNION</strong>, credem cu tărie că o friptură excepțională sau un grătar memorabil încep întotdeauna cu o alegere fără compromis a cărnii. Am pornit din pasiunea pentru meșteșugul măcelăresc veritabil, într-o perioadă în care carnea industrială de supermarket a înlocuit gustul autentic și prospețimea directă.
        </p>

        <div className="bg-[#171412] border border-[#2B2521] p-6 rounded-2xl space-y-3 my-8">
          <h2 className="font-serif-title text-xl font-bold text-[#C9A55C]">
            Sloganul nostru: „Carne aleasă. Gust adevărat.”
          </h2>
          <p className="text-xs sm:text-sm text-[#A89B8C]">
            Fiecare bucată de vită, porc, pui sau oaie trece prin mâinile pricepute ale măcelarilor noștri. Tranșăm zilnic în laboratorul propriu pentru a vă garanta prospețimea desăvârșită la fiecare vizită sau comandă.
          </p>
        </div>

        <h3 className="font-serif-title text-xl font-bold text-[#F3EBDD] pt-4">
          De ce CARNION?
        </h3>
        <ul className="space-y-3 list-none pl-0 text-sm">
          <li className="flex items-start gap-3 bg-[#171412] p-3 rounded-xl border border-[#2B2521]">
            <span className="text-[#C9A55C] font-bold">1.</span>
            <div>
              <strong className="text-[#F3EBDD] block">Tranșare în laborator propriu:</strong>
              <span className="text-xs text-[#A89B8C]">
                Piesele de carne sunt pregătite la comandă sau expuse zilnic proaspete în vitrină, respectând toate normele sanitar-veterinare.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3 bg-[#171412] p-3 rounded-xl border border-[#2B2521]">
            <span className="text-[#C9A55C] font-bold">2.</span>
            <div>
              <strong className="text-[#F3EBDD] block">Rețete artizanale de mezeluri:</strong>
              <span className="text-xs text-[#A89B8C]">
                Cârnații proaspeți și mezelurile noastre conțin doar carne proaspătă și condimente curate, fără aditivi ascunși sau substituenți.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3 bg-[#171412] p-3 rounded-xl border border-[#2B2521]">
            <span className="text-[#C9A55C] font-bold">3.</span>
            <div>
              <strong className="text-[#F3EBDD] block">Relație directă și tăieri personalizate:</strong>
              <span className="text-xs text-[#A89B8C]">
                Ne poți scrie oricând pe WhatsApp pentru tăieturi speciale (antricoate cu grosime la cerere, porționare pentru friptură, feliere subțire).
              </span>
            </div>
          </li>
        </ul>
      </div>

      <div className="pt-6 border-t border-[#2B2521] flex flex-wrap gap-4">
        <Link
          to="/produse"
          className="px-6 py-3 bg-[#B3202A] hover:bg-[#961720] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
        >
          Explorează vitrina de produse
        </Link>
        <Link
          to="/contact"
          className="px-6 py-3 bg-[#1F1B18] hover:bg-[#2B2521] border border-[#2B2521] text-[#F3EBDD] text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors"
        >
          Contact & Locație
        </Link>
      </div>
    </div>
  );
};

// 2. PAGINA LIVRARE ȘI PLATĂ (/livrare-si-plata)
export const DeliveryPaymentPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-10">
      <div className="border-b border-[#2B2521] pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A55C]">
          Informații utile
        </span>
        <h1 className="font-serif-title text-3xl sm:text-5xl font-extrabold text-[#F3EBDD] mt-1">
          Livrare și Plată
        </h1>
        <p className="text-sm text-[#A89B8C] mt-2">
          Condițiile de livrare, ridicare din magazin și modalitățile de plată acceptate la CARNION.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Moduri primire */}
        <div className="bg-[#171412] border border-[#2B2521] rounded-2xl p-6 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-[#B3202A]/20 text-[#C9A55C] flex items-center justify-center text-xl">
            🏬
          </div>
          <h2 className="font-serif-title text-lg font-bold text-[#F3EBDD]">
            Ridicare din Carmangerie
          </h2>
          <div className="text-xs sm:text-sm text-[#A89B8C] space-y-2">
            <p>
              <strong>Cost:</strong> Gratuit pentru orice valoare.
            </p>
            <p>
              <strong>Locație:</strong> {ADRESA}.
            </p>
            <p>
              <strong>Program:</strong> {PROGRAM}.
            </p>
            <p className="text-[11px] pt-1">
              Comanzi pe WhatsApp sau prin site, iar comanda este tranșată, cântărită și pregătită la pachet pentru momentul sosirii tale.
            </p>
          </div>
        </div>

        <div className="bg-[#171412] border border-[#2B2521] rounded-2xl p-6 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-[#B3202A]/20 text-[#C9A55C] flex items-center justify-center text-xl">
            🚚
          </div>
          <h2 className="font-serif-title text-lg font-bold text-[#F3EBDD]">
            Livrare la Adresă
          </h2>
          <div className="text-xs sm:text-sm text-[#A89B8C] space-y-2">
            <p>
              <strong>Cost livrare standard:</strong>{' '}
              {LIVRARE_COST === 0 ? '0 lei (promoțional)' : `${formatPriceNumber(LIVRARE_COST)} lei`}
            </p>
            <p>
              <strong>Comandă minimă:</strong>{' '}
              {COMANDA_MINIMA === 0 ? 'Fără limită' : `${formatPriceNumber(COMANDA_MINIMA)} lei`}
            </p>
            {LIVRARE_GRATIS_PESTE > 0 && (
              <p>
                <strong>Livrare gratuită peste:</strong> {formatPriceNumber(LIVRARE_GRATIS_PESTE)} lei.
              </p>
            )}
            <p>
              <strong>Zone acoperite:</strong> {ZONE_LIVRARE}.
            </p>
          </div>
        </div>
      </div>

      {/* Regula cântăririi exacte */}
      <div className="bg-[#171412] border border-[#C9A55C]/30 p-6 rounded-2xl space-y-2">
        <h3 className="font-serif-title text-base font-bold text-[#C9A55C] flex items-center gap-2">
          <span>⚖</span> Cântărirea exactă a produselor din carne
        </h3>
        <p className="text-xs sm:text-sm text-[#A89B8C] leading-relaxed">
          Carnea tranșată manual nu poate fi debitată cu precizie matematică la gram. În magazinul online, totalul afișat este un <strong>preț estimat</strong>. Măcelarul cântărește bucata pregătită în momentul fasonării, iar bonul final reflectă greutatea netă exactă.
        </p>
      </div>

      {/* Modalități de plată */}
      <div className="space-y-4">
        <h3 className="font-serif-title text-xl font-bold text-[#F3EBDD]">
          Modalități de Plată
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-[#A89B8C]">
          <div className="bg-[#171412] border border-[#2B2521] p-4 rounded-xl">
            <strong className="text-[#F3EBDD] block text-sm mb-1">💵 Numerar (Cash)</strong>
            <span>Plata în numerar se face la ridicarea din carmangerie sau direct la curier/livrator în momentul predării comenzii.</span>
          </div>
          <div className="bg-[#171412] border border-[#2B2521] p-4 rounded-xl">
            <strong className="text-[#F3EBDD] block text-sm mb-1">💳 Card Bancar (POS)</strong>
            <span>Plata cu cardul la POS fizic este disponibilă la casa magazinului și la livrare (te rugăm să specifici plata cu cardul în comandă).</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. PAGINA TERMENI ȘI CONDIȚII (/termeni)
export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-8">
      <div className="border-b border-[#2B2521] pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A55C]">
          Legal
        </span>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-extrabold text-[#F3EBDD] mt-1">
          Termeni și Condiții
        </h1>
        <p className="text-xs text-[#A89B8C] mt-2">
          Ultima actualizare: Octombrie 2026 · Carmangeria CARNION
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-[#A89B8C] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif-title text-base font-bold text-[#F3EBDD]">
            1. Despre Serviciu
          </h2>
          <p>
            Platforma web CARNION prezintă oferta de produse proaspete din carmangeria noastră din Chiajna (Ilfov), zona Militari Residence. Comenzile plasate prin intermediul site-ului sunt transmise și confirmate direct prin intermediul aplicației WhatsApp către echipa noastră.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif-title text-base font-bold text-[#F3EBDD]">
            2. Prețuri și Cântărire
          </h2>
          <p>
            Toate prețurile afișate pe site includ TVA conform legislației române în vigoare. Pentru produsele vândute la kilogram, prețul din coș reprezintă o valoare estimată în funcție de cantitatea dorită. Prețul final de achiziție este stabilit conform greutății înregistrate pe cântarul omologat metrologic la pregătirea comenzii.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif-title text-base font-bold text-[#F3EBDD]">
            3. Produse Perisabile și Politica de Retur
          </h2>
          <p>
            Conform Ordonanței de Urgență nr. 34/2014 privind drepturile consumatorilor, produsele alimentare proaspete și perisabile (carne proaspătă, preparate din carne, produse refrigerate) sunt exceptate de la dreptul de retragere / retur de 14 zile din motive de igienă și protecție a sănătății. În cazul oricărei neconformități constatate la recepție, vă rugăm să ne semnalați imediat situația la fața locului sau prin WhatsApp la {PHONE}.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif-title text-base font-bold text-[#F3EBDD]">
            4. Preluarea și Livrarea Comenzilor
          </h2>
          <p>
            Pregătirea comenzilor se face în funcție de disponibilitatea zilnică a stocului proaspăt. În caz de epuizare a unui produs specific, măcelarul vă va propune o alternativă echivalentă pe WhatsApp înainte de livrare.
          </p>
        </section>
      </div>
    </div>
  );
};

// 4. PAGINA CONFIDENȚIALITATE GDPR (/confidentialitate)
export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-8">
      <div className="border-b border-[#2B2521] pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A55C]">
          Protecția Datelor
        </span>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-extrabold text-[#F3EBDD] mt-1">
          Politica de Confidențialitate (GDPR)
        </h1>
        <p className="text-xs text-[#A89B8C] mt-2">
          Conform Regulamentului (UE) 2016/679 privind protecția datelor cu caracter personal
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-[#A89B8C] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif-title text-base font-bold text-[#F3EBDD]">
            1. Datele Colectate
          </h2>
          <p>
            CARNION colectează doar datele strict necesare onorării comenzilor transmise de dumneavoastră: numele și prenumele, numărul de telefon, adresa de livrare și eventualele instrucțiuni speciale furnizate voluntar în formularul de comandă.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif-title text-base font-bold text-[#F3EBDD]">
            2. Scopul Prelucrării
          </h2>
          <p>
            Datele sunt utilizate exclusiv pentru pregătirea comenzii, confirmarea telefonică sau prin WhatsApp, livrarea la adresa specificată și emiterea documentelor fiscale conform legii. Nu vindem și nu înstrăinăm datele dumneavoastră către terți în scopuri de marketing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif-title text-base font-bold text-[#F3EBDD]">
            3. Drepturile Dumneavoastră
          </h2>
          <p>
            Aveți dreptul de acces, rectificare, ștergere a datelor sau restricționare a prelucrării. Pentru orice solicitare legată de datele personale, ne puteți contacta direct prin WhatsApp sau telefonic la {PHONE}.
          </p>
        </section>
      </div>
    </div>
  );
};

// 5. PAGINA CONTACT (/contact)
export const ContactPage: React.FC = () => {
  const whatsappUrl = getWhatsAppUrl('Bună ziua! Vă contactez pentru informații despre carmangeria CARNION.');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-12">
      <div className="border-b border-[#2B2521] pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A55C]">
          Suntem aici pentru tine
        </span>
        <h1 className="font-serif-title text-3xl sm:text-5xl font-extrabold text-[#F3EBDD] mt-1">
          Contact CARNION
        </h1>
        <p className="text-sm text-[#A89B8C] mt-2">
          Vino să ne cunoști în Chiajna (Militari Residence) sau scrie-ne direct pe WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Date de contact */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#171412] border border-[#2B2521] rounded-2xl p-6 space-y-5">
            <h2 className="font-serif-title text-lg font-bold text-[#F3EBDD]">
              Datele Carmangeriei
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-[#A89B8C]">
              <div className="flex items-start gap-3">
                <span className="text-lg text-[#C9A55C]">📍</span>
                <div>
                  <strong className="text-[#F3EBDD] block">Adresă fizică</strong>
                  <span>{ADRESA}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-lg text-[#C9A55C]">🕒</span>
                <div>
                  <strong className="text-[#F3EBDD] block">Program de lucru</strong>
                  <span className="text-[#F3EBDD] block">{PROGRAM}</span>
                  <span className="text-[11px] text-[#A89B8C]">Duminică: Închis</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-lg text-[#C9A55C]">📞</span>
                <div>
                  <strong className="text-[#F3EBDD] block">Telefon comenzi</strong>
                  <a
                    href={`tel:${PHONE.replace(/\s+/g, '')}`}
                    className="text-[#F3EBDD] hover:text-[#C9A55C] font-mono transition-colors"
                  >
                    {PHONE}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-lg text-[#25D366]">💬</span>
                <div>
                  <strong className="text-[#F3EBDD] block">WhatsApp Oficial</strong>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#25D366] hover:underline font-mono"
                  >
                    +{WHATSAPP}
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#2B2521] flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20"
              >
                <span>Scrie pe WhatsApp</span>
                <span>💬</span>
              </a>
              <a
                href={`tel:${PHONE.replace(/\s+/g, '')}`}
                className="flex-1 py-3 px-4 bg-[#1F1B18] hover:bg-[#2B2521] border border-[#2B2521] text-[#F3EBDD] font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Apelează acum</span>
                <span>📞</span>
              </a>
            </div>
          </div>
        </div>

        {/* Hartă Google Maps */}
        <div className="lg:col-span-7">
          <div className="bg-[#171412] border border-[#2B2521] rounded-2xl p-4 shadow-xl">
            <h2 className="font-serif-title text-base font-bold text-[#F3EBDD] mb-3 px-2">
              Cum ajungi la măcelărie
            </h2>
            <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-[#2B2521] bg-[#0E0C0A]">
              <iframe
                title="Harta CARNION Militari Residence"
                src="https://maps.google.com/maps?q=Militari%20Residence,%20Chiajna,%20Ilfov,%20Romania&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(110%)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
