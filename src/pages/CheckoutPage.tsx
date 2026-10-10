import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  WHATSAPP,
  PHONE,
  ADRESA,
  LIVRARE_COST,
  LIVRARE_GRATIS_PESTE,
  COMANDA_MINIMA,
} from '../config';
import { formatPriceNumber, formatQuantity } from '../utils/text';

interface OrderData {
  orderId: string;
  nume: string;
  telefon: string;
  modPrimire: 'ridicare' | 'livrare';
  adresa: string;
  detaliiAdresa: string;
  interfon: string;
  localitate: string;
  dataDorita: 'azi' | 'maine' | 'alta';
  dataPersonalizata: string;
  intervalOrar: string;
  modPlata: 'numerar' | 'card';
  observatii: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
    lineTotal: number;
    soldByWeight: boolean;
  }>;
  subtotal: number;
  deliveryCost: number;
  total: number;
  createdAt: string;
}

const LAST_ORDER_KEY = 'carnion_last_order';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, hasWeightedProducts, clearCart } = useCart();
  const navigate = useNavigate();

  // Stare formular
  const [nume, setNume] = useState('');
  const [telefon, setTelefon] = useState('');
  const [modPrimire, setModPrimire] = useState<'ridicare' | 'livrare'>('ridicare');
  const [adresa, setAdresa] = useState('');
  const [detaliiAdresa, setDetaliiAdresa] = useState('');
  const [interfon, setInterfon] = useState('');
  const [localitate, setLocalitate] = useState('Chiajna (Militari Residence)');
  const [dataDorita, setDataDorita] = useState<'azi' | 'maine' | 'alta'>('azi');
  const [dataPersonalizata, setDataPersonalizata] = useState('');
  const [intervalOrar, setIntervalOrar] = useState('10–12');
  const [modPlata, setModPlata] = useState<'numerar' | 'card'>('numerar');
  const [observatii, setObservatii] = useState('');
  const [gdprAccepted, setGdprAccepted] = useState(false);

  // Erori validare
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Stare finalizare comandă
  const [submittedOrder, setSubmittedOrder] = useState<OrderData | null>(() => {
    // Dacă utilizatorul revine pe pagină, verifică dacă există o comandă recentă salvată
    try {
      const saved = localStorage.getItem(LAST_ORDER_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignoră
    }
    return null;
  });

  const [isOrderSubmittedNow, setIsOrderSubmittedNow] = useState(false);

  // Calcul cost livrare
  const deliveryCost =
    modPrimire === 'livrare'
      ? LIVRARE_GRATIS_PESTE > 0 && subtotal >= LIVRARE_GRATIS_PESTE
        ? 0
        : LIVRARE_COST
      : 0;

  const totalFinal = Math.round((subtotal + deliveryCost) * 100) / 100;

  // Generare număr comandă format: CN-AAAALLZZ-XXXX
  const generateOrderId = (): string => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `CN-${yyyy}${mm}${dd}-${rand}`;
  };

  // Validare telefon românesc (07xxxxxxxx sau +407xxxxxxxx)
  const validatePhone = (val: string): boolean => {
    const clean = val.replace(/[\s\-\.\(\)]/g, '');
    return /^(07\d{8}|\+407\d{8}|00407\d{8})$/.test(clean);
  };

  const handleValidation = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!nume.trim()) {
      errs.nume = 'Te rugăm să introduci numele complet.';
    } else if (nume.trim().length < 3) {
      errs.nume = 'Numele trebuie să aibă cel puțin 3 caractere.';
    }

    if (!telefon.trim()) {
      errs.telefon = 'Numărul de telefon este obligatoriu.';
    } else if (!validatePhone(telefon)) {
      errs.telefon = 'Introdu un număr valid de telefon (ex: 0763 675 641).';
    }

    if (modPrimire === 'livrare') {
      if (!adresa.trim()) {
        errs.adresa = 'Adresa de livrare (stradă, număr) este obligatorie.';
      }
      if (!localitate.trim()) {
        errs.localitate = 'Te rugăm să specifici localitatea / cartierul.';
      }
    }

    if (dataDorita === 'alta' && !dataPersonalizata) {
      errs.dataPersonalizata = 'Te rugăm să alegi data dorită.';
    }

    if (!gdprAccepted) {
      errs.gdpr = 'Acordul pentru procesarea datelor este obligatoriu.';
    }

    if (COMANDA_MINIMA > 0 && subtotal < COMANDA_MINIMA) {
      errs.minOrder = `Comanda minimă este de ${formatPriceNumber(COMANDA_MINIMA)} lei.`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Generare text WhatsApp conform specificației
  const buildWhatsAppMessage = (order: OrderData): string => {
    const dateText =
      order.dataDorita === 'azi'
        ? 'Azi'
        : order.dataDorita === 'maine'
        ? 'Mâine'
        : order.dataPersonalizata;

    const deliveryText =
      order.modPrimire === 'ridicare'
        ? `Ridicare din magazin (${ADRESA})`
        : `Livrare la adresă: ${order.adresa}${
            order.detaliiAdresa ? `, ${order.detaliiAdresa}` : ''
          }${order.interfon ? `, interfon: ${order.interfon}` : ''}, ${order.localitate}`;

    const paymentText =
      order.modPlata === 'numerar'
        ? 'Numerar la livrare / ridicare'
        : 'Card la livrare / ridicare';

    const itemsText = order.items
      .map(
        (it) =>
          `• ${it.name} — ${formatQuantity(it.quantity, it.unit)} × ${formatPriceNumber(
            it.price
          )} = ~${formatPriceNumber(it.lineTotal)} lei`
      )
      .join('\n');

    let msg = `*Comandă nouă CARNION* 🥩\n`;
    msg += `Nr: ${order.orderId}\n`;
    msg += `*Client:* ${order.nume} · ${order.telefon}\n`;
    msg += `*Primire:* ${deliveryText}\n`;
    msg += `*Data / ora dorită:* ${dateText}, interval ${order.intervalOrar}\n`;
    msg += `*Plată:* ${paymentText}\n`;
    msg += `————\n`;
    msg += `${itemsText}\n`;
    msg += `————\n`;
    if (order.deliveryCost > 0) {
      msg += `*Cost livrare:* ${formatPriceNumber(order.deliveryCost)} lei\n`;
    }
    msg += `*Total estimat:* ~${formatPriceNumber(order.total)} lei (final după cântărire)\n`;
    msg += `*Observații:* ${order.observatii.trim() || 'Fără mențiuni speciale'}`;

    return msg;
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!handleValidation()) {
      // Scroll la primul element cu eroare
      const firstError = document.querySelector('.input-error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const orderId = generateOrderId();
    const orderItems = items.map((it) => ({
      name: it.product.name,
      quantity: it.quantity,
      unit: it.product.unit,
      price: it.product.price,
      lineTotal: Math.round(it.product.price * it.quantity * 100) / 100,
      soldByWeight: it.product.soldByWeight,
    }));

    const newOrder: OrderData = {
      orderId,
      nume: nume.trim(),
      telefon: telefon.trim(),
      modPrimire,
      adresa: adresa.trim(),
      detaliiAdresa: detaliiAdresa.trim(),
      interfon: interfon.trim(),
      localitate: localitate.trim(),
      dataDorita,
      dataPersonalizata,
      intervalOrar,
      modPlata,
      observatii: observatii.trim(),
      items: orderItems,
      subtotal,
      deliveryCost,
      total: totalFinal,
      createdAt: new Date().toISOString(),
    };

    // Salvare în localStorage ca să poată fi retrimisă
    try {
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(newOrder));
    } catch (err) {
      console.warn('Eroare la salvarea comenzii:', err);
    }

    // Mesaj formatat WhatsApp
    const rawMessage = buildWhatsAppMessage(newOrder);
    const cleanPhone = WHATSAPP.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawMessage)}`;

    // Golire coș
    clearCart();

    // Setare stare confirmare
    setSubmittedOrder(newOrder);
    setIsOrderSubmittedNow(true);

    // Deschidere WhatsApp într-o filă nouă
    window.open(waUrl, '_blank');
  };

  // Dacă utilizatorul este în starea de confirmare (comanda tocmai trimisă)
  if (submittedOrder && (isOrderSubmittedNow || items.length === 0)) {
    const rawMessage = buildWhatsAppMessage(submittedOrder);
    const cleanPhone = WHATSAPP.replace(/\D/g, '');
    const reopenWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawMessage)}`;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8 animate-in fade-in duration-200">
        <div className="bg-[#171412] border border-[#C9A55C]/40 rounded-2xl p-6 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-3xl flex items-center justify-center mx-auto">
            ✓
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A55C]">
              Comandă pregătită cu succes
            </span>
            <h1 className="font-serif-title text-2xl sm:text-4xl font-extrabold text-[#F3EBDD]">
              Mulțumim! Comanda ta a fost pregătită pentru WhatsApp
            </h1>
            <p className="text-sm text-[#A89B8C] max-w-lg mx-auto pt-1">
              Dacă aplicația WhatsApp nu s-a deschis automat, apasă butonul de mai jos pentru a trimite detaliile direct către carmangerie.
            </p>
          </div>

          {/* Număr comandă */}
          <div className="inline-block bg-[#0E0C0A] border border-[#2B2521] px-5 py-2.5 rounded-xl font-mono text-sm sm:text-base font-bold text-[#C9A55C]">
            Număr comandă: {submittedOrder.orderId}
          </div>

          {/* Butoane acțiune WhatsApp & Apel */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={reopenWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.487-8.413z" />
              </svg>
              <span>Deschide din nou WhatsApp</span>
            </a>

            <a
              href="tel:+40763675641"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#1F1B18] hover:bg-[#2B2521] border border-[#2B2521] text-[#F3EBDD] font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>📞 Sună acum</span>
            </a>
          </div>

          {/* Sumar comandă recentă */}
          <div className="pt-6 border-t border-[#2B2521] text-left space-y-3">
            <h3 className="font-serif-title text-base font-bold text-[#F3EBDD]">
              Rezumatul comenzii tale
            </h3>
            <div className="bg-[#0E0C0A] p-4 rounded-xl border border-[#2B2521] space-y-2 text-xs">
              <div className="flex justify-between text-[#A89B8C]">
                <span>Client:</span>
                <strong className="text-[#F3EBDD]">{submittedOrder.nume} ({submittedOrder.telefon})</strong>
              </div>
              <div className="flex justify-between text-[#A89B8C]">
                <span>Mod primire:</span>
                <span className="text-[#F3EBDD]">
                  {submittedOrder.modPrimire === 'ridicare' ? 'Ridicare magazin' : `Livrare la: ${submittedOrder.adresa}`}
                </span>
              </div>
              <div className="flex justify-between text-[#A89B8C]">
                <span>Interval:</span>
                <span className="text-[#F3EBDD]">
                  {submittedOrder.dataDorita === 'azi' ? 'Azi' : submittedOrder.dataDorita === 'maine' ? 'Mâine' : submittedOrder.dataPersonalizata}, {submittedOrder.intervalOrar}
                </span>
              </div>
              <div className="flex justify-between text-[#A89B8C]">
                <span>Plată:</span>
                <span className="text-[#F3EBDD]">
                  {submittedOrder.modPlata === 'numerar' ? 'Numerar' : 'Card'} la primire
                </span>
              </div>

              <div className="pt-2 border-t border-[#2B2521] space-y-1">
                {submittedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[#A89B8C]">
                    <span className="truncate pr-2">• {it.name} ({formatQuantity(it.quantity, it.unit)})</span>
                    <span className="font-mono text-[#F3EBDD] shrink-0">~{formatPriceNumber(it.lineTotal)} lei</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#2B2521] flex justify-between font-bold text-sm text-[#F3EBDD]">
                <span>Total estimat:</span>
                <span className="font-mono text-[#B3202A]">~{formatPriceNumber(submittedOrder.total)} lei</span>
              </div>
            </div>

            <p className="text-[11px] text-[#A89B8C] italic">
              * Notă: Un măcelar din carmangeria CARNION va prelua mesajul tău de pe WhatsApp, va pregăti piesele de carne și îți va confirma greutatea exactă și comanda.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/produse"
              onClick={() => {
                setSubmittedOrder(null);
                setIsOrderSubmittedNow(false);
              }}
              className="text-xs text-[#C9A55C] hover:underline"
            >
              ← Plasează o comandă nouă din catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dacă coșul este gol
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#171412] border border-[#2B2521] text-3xl flex items-center justify-center mx-auto text-[#A89B8C]">
          🛒
        </div>
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#F3EBDD]">
            Coșul tău este gol
          </h1>
          <p className="text-xs sm:text-sm text-[#A89B8C] mt-2 max-w-md mx-auto">
            Pentru a finaliza o comandă, te rugăm să adaugi mai întâi produsele dorite din vitrina sau catalogul carmangeriei CARNION.
          </p>
        </div>
        <Link
          to="/produse"
          className="inline-block px-7 py-3.5 bg-[#B3202A] hover:bg-[#961720] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
        >
          Descoperă produsele din vitrină
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
      {/* Antet pagină */}
      <div className="border-b border-[#2B2521] pb-6">
        <nav className="flex items-center gap-2 text-xs text-[#A89B8C] mb-2" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#F3EBDD] transition-colors">
            Acasă
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/produse" className="hover:text-[#F3EBDD] transition-colors">
            Catalog
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#C9A55C] font-semibold">Finalizare comandă</span>
        </nav>
        <h1 className="font-serif-title text-2xl sm:text-4xl font-extrabold text-[#F3EBDD]">
          Finalizare Comandă
        </h1>
        <p className="text-xs sm:text-sm text-[#A89B8C] mt-1">
          Completează datele de livrare sau ridicare. Comanda ta va fi transmisă instant pe WhatsApp către carmangeria CARNION.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Coloana Stângă: Formular */}
        <form onSubmit={handleSubmitOrder} className="lg:col-span-7 space-y-8">
          {/* 1. Date de contact */}
          <div className="bg-[#171412] border border-[#2B2521] rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="font-serif-title text-base sm:text-lg font-bold text-[#F3EBDD] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#B3202A]/20 text-[#C9A55C] text-xs flex items-center justify-center font-mono">
                1
              </span>
              Date de Contact
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#F3EBDD] mb-1">
                  Nume complet *
                </label>
                <input
                  type="text"
                  value={nume}
                  onChange={(e) => {
                    setNume(e.target.value);
                    if (errors.nume) setErrors((prev) => ({ ...prev, nume: '' }));
                  }}
                  placeholder="ex: Ion Popescu"
                  className={`w-full bg-[#0E0C0A] text-[#F3EBDD] text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border ${
                    errors.nume ? 'border-[#B3202A] input-error' : 'border-[#2B2521]'
                  } focus:border-[#C9A55C] focus:outline-none transition-colors`}
                />
                {errors.nume && (
                  <p className="text-[11px] text-[#B3202A] mt-1">{errors.nume}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F3EBDD] mb-1">
                  Telefon mobil *
                </label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => {
                    setTelefon(e.target.value);
                    if (errors.telefon) setErrors((prev) => ({ ...prev, telefon: '' }));
                  }}
                  placeholder="ex: 0763 675 641"
                  className={`w-full bg-[#0E0C0A] text-[#F3EBDD] text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border ${
                    errors.telefon ? 'border-[#B3202A] input-error' : 'border-[#2B2521]'
                  } focus:border-[#C9A55C] focus:outline-none transition-colors font-mono`}
                />
                {errors.telefon && (
                  <p className="text-[11px] text-[#B3202A] mt-1">{errors.telefon}</p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Mod de primire & adresă */}
          <div className="bg-[#171412] border border-[#2B2521] rounded-2xl p-5 sm:p-6 space-y-5">
            <h2 className="font-serif-title text-base sm:text-lg font-bold text-[#F3EBDD] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#B3202A]/20 text-[#C9A55C] text-xs flex items-center justify-center font-mono">
                2
              </span>
              Mod de Primire
            </h2>

            {/* Opțiuni Radio Primire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  modPrimire === 'ridicare'
                    ? 'bg-[#1F1B18] border-[#C9A55C] text-[#F3EBDD]'
                    : 'bg-[#0E0C0A] border-[#2B2521] text-[#A89B8C] hover:border-[#2B2521]/80'
                }`}
              >
                <input
                  type="radio"
                  name="modPrimire"
                  value="ridicare"
                  checked={modPrimire === 'ridicare'}
                  onChange={() => setModPrimire('ridicare')}
                  className="mt-1 accent-[#B3202A]"
                />
                <div>
                  <strong className="block text-sm text-[#F3EBDD]">Ridic din magazin</strong>
                  <span className="text-xs text-[#A89B8C]">
                    Gratuit · Chiajna, zona Militari Residence
                  </span>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  modPrimire === 'livrare'
                    ? 'bg-[#1F1B18] border-[#C9A55C] text-[#F3EBDD]'
                    : 'bg-[#0E0C0A] border-[#2B2521] text-[#A89B8C] hover:border-[#2B2521]/80'
                }`}
              >
                <input
                  type="radio"
                  name="modPrimire"
                  value="livrare"
                  checked={modPrimire === 'livrare'}
                  onChange={() => setModPrimire('livrare')}
                  className="mt-1 accent-[#B3202A]"
                />
                <div>
                  <strong className="block text-sm text-[#F3EBDD]">Livrare la adresă</strong>
                  <span className="text-xs text-[#A89B8C]">
                    {LIVRARE_COST === 0
                      ? 'Livrare gratuită (zonă locală)'
                      : `${formatPriceNumber(LIVRARE_COST)} lei`}
                  </span>
                </div>
              </label>
            </div>

            {/* Câmpuri specifice livrării */}
            {modPrimire === 'livrare' && (
              <div className="space-y-4 pt-3 border-t border-[#2B2521] animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#F3EBDD] mb-1">
                      Adresă (stradă și număr) *
                    </label>
                    <input
                      type="text"
                      value={adresa}
                      onChange={(e) => {
                        setAdresa(e.target.value);
                        if (errors.adresa) setErrors((prev) => ({ ...prev, adresa: '' }));
                      }}
                      placeholder="ex: Str. Tineretului nr. 24"
                      className={`w-full bg-[#0E0C0A] text-[#F3EBDD] text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border ${
                        errors.adresa ? 'border-[#B3202A] input-error' : 'border-[#2B2521]'
                      } focus:border-[#C9A55C] focus:outline-none transition-colors`}
                    />
                    {errors.adresa && (
                      <p className="text-[11px] text-[#B3202A] mt-1">{errors.adresa}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#F3EBDD] mb-1">
                      Localitate / Cartier *
                    </label>
                    <input
                      type="text"
                      value={localitate}
                      onChange={(e) => setLocalitate(e.target.value)}
                      placeholder="Chiajna, Militari Residence"
                      className="w-full bg-[#0E0C0A] text-[#F3EBDD] text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#2B2521] focus:border-[#C9A55C] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#F3EBDD] mb-1">
                      Bloc / Scară / Etaj / Apartament
                    </label>
                    <input
                      type="text"
                      value={detaliiAdresa}
                      onChange={(e) => setDetaliiAdresa(e.target.value)}
                      placeholder="ex: Bl. 3, Sc. A, Ap. 14"
                      className="w-full bg-[#0E0C0A] text-[#F3EBDD] text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#2B2521] focus:border-[#C9A55C] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#F3EBDD] mb-1">
                      Cod interfon (opțional)
                    </label>
                    <input
                      type="text"
                      value={interfon}
                      onChange={(e) => setInterfon(e.target.value)}
                      placeholder="ex: 14 sau cheie"
                      className="w-full bg-[#0E0C0A] text-[#F3EBDD] text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#2B2521] focus:border-[#C9A55C] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Data și intervalul orar dorit */}
          <div className="bg-[#171412] border border-[#2B2521] rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="font-serif-title text-base sm:text-lg font-bold text-[#F3EBDD] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#B3202A]/20 text-[#C9A55C] text-xs flex items-center justify-center font-mono">
                3
              </span>
              Data & Intervalul Orar Dorit
            </h2>

            {/* Selector Dată */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#F3EBDD]">
                Data dorită pentru pregătire / livrare:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDataDorita('azi')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    dataDorita === 'azi'
                      ? 'bg-[#B3202A] text-white border-[#B3202A]'
                      : 'bg-[#0E0C0A] text-[#F3EBDD] border-[#2B2521] hover:border-[#C9A55C]/40'
                  }`}
                >
                  Azi
                </button>
                <button
                  type="button"
                  onClick={() => setDataDorita('maine')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    dataDorita === 'maine'
                      ? 'bg-[#B3202A] text-white border-[#B3202A]'
                      : 'bg-[#0E0C0A] text-[#F3EBDD] border-[#2B2521] hover:border-[#C9A55C]/40'
                  }`}
                >
                  Mâine
                </button>
                <button
                  type="button"
                  onClick={() => setDataDorita('alta')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    dataDorita === 'alta'
                      ? 'bg-[#B3202A] text-white border-[#B3202A]'
                      : 'bg-[#0E0C0A] text-[#F3EBDD] border-[#2B2521] hover:border-[#C9A55C]/40'
                  }`}
                >
                  Altă dată
                </button>
              </div>

              {dataDorita === 'alta' && (
                <div className="pt-2">
                  <input
                    type="date"
                    value={dataPersonalizata}
                    onChange={(e) => {
                      setDataPersonalizata(e.target.value);
                      if (errors.dataPersonalizata)
                        setErrors((prev) => ({ ...prev, dataPersonalizata: '' }));
                    }}
                    className={`w-full sm:w-60 bg-[#0E0C0A] text-[#F3EBDD] text-xs px-3.5 py-2 rounded-xl border ${
                      errors.dataPersonalizata
                        ? 'border-[#B3202A] input-error'
                        : 'border-[#2B2521]'
                    } focus:border-[#C9A55C] focus:outline-none`}
                  />
                  {errors.dataPersonalizata && (
                    <p className="text-[11px] text-[#B3202A] mt-1">{errors.dataPersonalizata}</p>
                  )}
                </div>
              )}
            </div>

            {/* Interval Orar */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-[#F3EBDD]">
                Interval orar preferat:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['08–10', '10–12', '12–14', '14–16'].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setIntervalOrar(slot)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      intervalOrar === slot
                        ? 'bg-[#C9A55C] text-[#0E0C0A] border-[#C9A55C] font-bold shadow'
                        : 'bg-[#0E0C0A] text-[#F3EBDD] border-[#2B2521] hover:border-[#C9A55C]/40'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Mod de Plată & Observații */}
          <div className="bg-[#171412] border border-[#2B2521] rounded-2xl p-5 sm:p-6 space-y-5">
            <h2 className="font-serif-title text-base sm:text-lg font-bold text-[#F3EBDD] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#B3202A]/20 text-[#C9A55C] text-xs flex items-center justify-center font-mono">
                4
              </span>
              Mod de Plată & Mențiuni
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  modPlata === 'numerar'
                    ? 'bg-[#1F1B18] border-[#C9A55C] text-[#F3EBDD]'
                    : 'bg-[#0E0C0A] border-[#2B2521] text-[#A89B8C]'
                }`}
              >
                <input
                  type="radio"
                  name="modPlata"
                  value="numerar"
                  checked={modPlata === 'numerar'}
                  onChange={() => setModPlata('numerar')}
                  className="mt-1 accent-[#B3202A]"
                />
                <div>
                  <strong className="block text-sm text-[#F3EBDD]">Numerar</strong>
                  <span className="text-xs text-[#A89B8C]">
                    La livrare sau la ridicarea din magazin
                  </span>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  modPlata === 'card'
                    ? 'bg-[#1F1B18] border-[#C9A55C] text-[#F3EBDD]'
                    : 'bg-[#0E0C0A] border-[#2B2521] text-[#A89B8C]'
                }`}
              >
                <input
                  type="radio"
                  name="modPlata"
                  value="card"
                  checked={modPlata === 'card'}
                  onChange={() => setModPlata('card')}
                  className="mt-1 accent-[#B3202A]"
                />
                <div>
                  <strong className="block text-sm text-[#F3EBDD]">Card bancar</strong>
                  <span className="text-xs text-[#A89B8C]">
                    POS la livrare sau la casa carmangeriei
                  </span>
                </div>
              </label>
            </div>

            {/* Observații măcelar */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#F3EBDD]">
                Observații / Tăieri speciale pentru măcelar (opțional):
              </label>
              <textarea
                value={observatii}
                onChange={(e) => setObservatii(e.target.value)}
                rows={3}
                placeholder="ex: vă rugăm tăiat în porții de 200 g, carne mai slabă fără grăsime, împachetat separat..."
                className="w-full bg-[#0E0C0A] text-[#F3EBDD] text-xs sm:text-sm p-3 rounded-xl border border-[#2B2521] focus:border-[#C9A55C] focus:outline-none transition-colors"
              />
            </div>

            {/* Acord GDPR obligatoriu */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gdprAccepted}
                  onChange={(e) => {
                    setGdprAccepted(e.target.checked);
                    if (errors.gdpr) setErrors((prev) => ({ ...prev, gdpr: '' }));
                  }}
                  className="mt-1 w-4 h-4 rounded accent-[#B3202A] cursor-pointer"
                />
                <span className="text-xs text-[#A89B8C] leading-snug">
                  Sunt de acord cu prelucrarea datelor cu caracter personal în scopul procesării comenzii conform{' '}
                  <Link to="/confidentialitate" target="_blank" className="text-[#C9A55C] hover:underline">
                    politicii de confidențialitate
                  </Link>
                  . *
                </span>
              </label>
              {errors.gdpr && (
                <p className="text-[11px] text-[#B3202A] mt-1 pl-7">{errors.gdpr}</p>
              )}
            </div>
          </div>

          {/* Buton Submit Mobil (pe desktop e în sidebar) */}
          <div className="lg:hidden">
            <button
              type="submit"
              className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#25D366]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.487-8.413z" />
              </svg>
              <span>Trimite comanda pe WhatsApp</span>
            </button>
          </div>
        </form>

        {/* Coloana Dreaptă: Rezumat comandă lateral (Sticky pe desktop) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="bg-[#171412] border border-[#2B2521] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2521]">
              <h2 className="font-serif-title text-base sm:text-lg font-bold text-[#F3EBDD]">
                Rezumat Comandă ({items.length})
              </h2>
              <Link to="/produse" className="text-xs text-[#C9A55C] hover:underline">
                Editează
              </Link>
            </div>

            {/* Lista produselor */}
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 divide-y divide-[#2B2521]/60">
              {items.map(({ product, quantity }) => {
                const lineTotal = Math.round(product.price * quantity * 100) / 100;
                return (
                  <div key={product.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#F3EBDD] truncate">{product.name}</p>
                      <p className="text-[11px] text-[#A89B8C]">
                        {formatQuantity(quantity, product.unit)} × {formatPriceNumber(product.price)} lei
                      </p>
                    </div>
                    <span className="font-mono font-bold text-[#F3EBDD] shrink-0">
                      ~ {formatPriceNumber(lineTotal)} lei
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Totaluri */}
            <div className="pt-4 border-t border-[#2B2521] space-y-2 text-xs">
              <div className="flex justify-between text-[#A89B8C]">
                <span>Subtotal produse:</span>
                <span className="font-mono text-[#F3EBDD]">~ {formatPriceNumber(subtotal)} lei</span>
              </div>

              {modPrimire === 'livrare' && (
                <div className="flex justify-between text-[#A89B8C]">
                  <span>Cost livrare:</span>
                  <span className="font-mono text-[#F3EBDD]">
                    {deliveryCost === 0 ? 'Gratuit' : `${formatPriceNumber(deliveryCost)} lei`}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#2B2521] flex items-baseline justify-between">
                <div>
                  <strong className="text-sm sm:text-base text-[#F3EBDD] block">Total estimat:</strong>
                  <span className="text-[11px] text-[#A89B8C]">TVA inclus</span>
                </div>
                <div className="text-right">
                  <span className="font-serif-title text-xl sm:text-2xl font-bold text-[#B3202A] font-mono">
                    ~ {formatPriceNumber(totalFinal)} lei
                  </span>
                </div>
              </div>

              {/* Notă obligatorie de cântărire */}
              <p className="text-[11px] text-[#A89B8C] leading-snug italic pt-1">
                {hasWeightedProducts
                  ? 'Prețul final se stabilește după cântărire.'
                  : 'Preț final estimat. Se verifică la pregătirea comenzii.'}
              </p>
            </div>

            {/* Buton Submit Desktop */}
            <div className="hidden lg:block pt-2">
              <button
                type="button"
                onClick={handleSubmitOrder}
                className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#25D366]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.487-8.413z" />
                </svg>
                <span>Trimite comanda pe WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Card Asistență / Telefon */}
          <div className="bg-[#171412] border border-[#2B2521] rounded-xl p-4 flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-[#F3EBDD]">Ai nevoie de ajutor cu comanda?</p>
              <p className="text-[#A89B8C]">Sună măcelăria CARNION direct</p>
            </div>
            <a
              href={`tel:${PHONE.replace(/\s+/g, '')}`}
              className="px-3 py-1.5 rounded-lg bg-[#1F1B18] border border-[#2B2521] text-[#C9A55C] font-mono font-bold hover:bg-[#2B2521] transition-colors"
            >
              {PHONE}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
