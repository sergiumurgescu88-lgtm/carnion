import React from 'react';
import { Link } from 'react-router-dom';
import CarnionLogo from './CarnionLogo';
import {
  WHATSAPP,
  PHONE,
  PROGRAM,
  ADRESA,
  ZONE_LIVRARE,
  getWhatsAppUrl,
} from '../config';

export const Footer: React.FC = () => {
  const whatsappUrl = getWhatsAppUrl();

  return (
    <footer className="bg-[#0A0807] border-t border-[#2B2521] text-[#F3EBDD] mt-16">
      {/* Zona principală footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Coloana 1: Logo & Slogan */}
          <div className="space-y-4">
            <CarnionLogo size="md" showSubtitle={true} />
            <p className="text-xs text-[#A89B8C] leading-relaxed">
              Carmangerie profesională și măcelărie artizanală în Chiajna, zona Militari Residence. Carne proaspătă atent selecționată, tranșată manual și mezeluri preparate după rețete autentice românești.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-[#C9A55C] text-sm">★★★★★</span>
              <span className="text-xs text-[#A89B8C]">Calitate garantată la fiecare tăiere</span>
            </div>
          </div>

          {/* Coloana 2: Program & Contact */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-base font-bold text-[#F3EBDD] border-b border-[#2B2521] pb-2">
              Program & Contact
            </h4>
            <div className="space-y-2.5 text-xs text-[#A89B8C]">
              <div>
                <p className="text-[#C9A55C] font-semibold uppercase tracking-wider text-[11px]">
                  Program magazin:
                </p>
                <p className="text-[#F3EBDD] font-medium text-sm mt-0.5">{PROGRAM}</p>
                <p className="text-[11px] text-[#A89B8C]">Duminică: Închis</p>
              </div>

              <div>
                <p className="text-[#C9A55C] font-semibold uppercase tracking-wider text-[11px]">
                  Telefon comenzi:
                </p>
                <a
                  href={`tel:${PHONE.replace(/\s+/g, '')}`}
                  className="text-[#F3EBDD] hover:text-[#C9A55C] font-mono text-sm block mt-0.5 transition-colors"
                >
                  {PHONE}
                </a>
              </div>

              <div>
                <p className="text-[#C9A55C] font-semibold uppercase tracking-wider text-[11px]">
                  WhatsApp direct:
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] hover:underline font-mono text-sm block mt-0.5"
                >
                  +{WHATSAPP}
                </a>
              </div>
            </div>
          </div>

          {/* Coloana 3: Adresă & Livrare */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-base font-bold text-[#F3EBDD] border-b border-[#2B2521] pb-2">
              Locație & Ridicare
            </h4>
            <div className="space-y-2.5 text-xs text-[#A89B8C]">
              <div>
                <p className="text-[#C9A55C] font-semibold uppercase tracking-wider text-[11px]">
                  Adresă carmangerie:
                </p>
                <p className="text-[#F3EBDD] font-medium mt-0.5">
                  {ADRESA}
                </p>
              </div>

              <div>
                <p className="text-[#C9A55C] font-semibold uppercase tracking-wider text-[11px]">
                  Zone de acoperire:
                </p>
                <p className="text-[#F3EBDD] mt-0.5">{ZONE_LIVRARE}</p>
              </div>

              <div className="pt-1">
                <a
                  href="https://maps.google.com/?q=Militari+Residence+Chiajna+Ilfov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#C9A55C] hover:text-[#DFC07D] transition-colors"
                >
                  <span>Deschide în Google Maps</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* Coloana 4: Navigare rapidă categorii */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-base font-bold text-[#F3EBDD] border-b border-[#2B2521] pb-2">
              Categorii Principale
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link
                  to="/categorie/vita"
                  className="text-[#A89B8C] hover:text-[#C9A55C] transition-colors flex items-center justify-between"
                >
                  <span>Carne Vită proaspătă</span>
                  <span className="text-[11px] text-[#A89B8C]/60">20 produse</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/categorie/porc"
                  className="text-[#A89B8C] hover:text-[#C9A55C] transition-colors flex items-center justify-between"
                >
                  <span>Carne Porc proaspătă</span>
                  <span className="text-[11px] text-[#A89B8C]/60">22 produse</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/categorie/pui"
                  className="text-[#A89B8C] hover:text-[#C9A55C] transition-colors flex items-center justify-between"
                >
                  <span>Carne Pui</span>
                  <span className="text-[11px] text-[#A89B8C]/60">8 produse</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/categorie/mezeluri-si-afumaturi"
                  className="text-[#A89B8C] hover:text-[#C9A55C] transition-colors flex items-center justify-between"
                >
                  <span>Mezeluri & afumături</span>
                  <span className="text-[11px] text-[#A89B8C]/60">28 produse</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/categorie/lactate-branzeturi-si-oua"
                  className="text-[#A89B8C] hover:text-[#C9A55C] transition-colors flex items-center justify-between"
                >
                  <span>Lactate & brânzeturi</span>
                  <span className="text-[11px] text-[#A89B8C]/60">44 produse</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/produse"
                  className="text-[#C9A55C] font-semibold hover:underline block pt-1"
                >
                  Vezi tot catalogul (264 produse) →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Link-uri Utile & Legale */}
        <div className="mt-8 pt-6 border-t border-[#2B2521]/60 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#A89B8C]">
          <Link to="/despre" className="hover:text-[#F3EBDD] transition-colors">
            Despre Carmangerie
          </Link>
          <span aria-hidden="true" className="text-[#2B2521]">·</span>
          <Link to="/livrare-si-plata" className="hover:text-[#F3EBDD] transition-colors">
            Livrare & Plată
          </Link>
          <span aria-hidden="true" className="text-[#2B2521]">·</span>
          <Link to="/contact" className="hover:text-[#F3EBDD] transition-colors">
            Contact
          </Link>
          <span aria-hidden="true" className="text-[#2B2521]">·</span>
          <Link to="/termeni" className="hover:text-[#F3EBDD] transition-colors">
            Termeni și Condiții
          </Link>
          <span aria-hidden="true" className="text-[#2B2521]">·</span>
          <Link to="/confidentialitate" className="hover:text-[#F3EBDD] transition-colors">
            Confidențialitate (GDPR)
          </Link>
        </div>

        {/* Separator și copyright */}
        <div className="mt-6 pt-6 border-t border-[#2B2521] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A89B8C]">
          <p>© 2026 CARNION. Toate drepturile rezervate.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Chiajna (Ilfov), zona Militari Residence</span>
            <span aria-hidden="true">·</span>
            <span>Carne aleasă. Gust adevărat.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
