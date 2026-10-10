/**
 * Configurația principală CARNION — Toate setările de business se modifică aici
 */

// Numărul de WhatsApp pentru comenzi și suport (format internațional fără +, ex: 407...)
export const WHATSAPP = "40763675641";

// Numărul de telefon afișat pentru apeluri directe
export const PHONE = "0763 675 641";

// Programul de lucru al carmangeriei
export const PROGRAM = "Luni–Sâmbătă, 07:00–17:00";

// Adresa fizică
export const ADRESA = "Chiajna, Ilfov (zona Militari Residence)";

// Costul de livrare standard (în RON)
// DE COMPLETAT: Stabilit la 0 până la stabilirea tarifelor de curierat/livrare proprie
export const LIVRARE_COST = 0;

// Pragul peste care livrarea devine gratuită (în RON)
// DE COMPLETAT: Momentan 0
export const LIVRARE_GRATIS_PESTE = 0;

// Valoarea comenzii minime acceptate (în RON)
// DE COMPLETAT: Momentan 0
export const COMANDA_MINIMA = 0;

// Zonele acoperite pentru livrare
// DE COMPLETAT: Urmează a fi detaliate străzile și cartierele deservite
export const ZONE_LIVRARE = "Chiajna, Militari Residence, Roșu, Dudu (de completat lista detaliată)";

// Mesaj implicit general pentru WhatsApp
export const DEFAULT_WHATSAPP_MESSAGE = "Bună ziua! Aș dori informații despre produsele CARNION.";

// Helper pentru generarea link-ului direct WhatsApp
export function getWhatsAppUrl(text: string = DEFAULT_WHATSAPP_MESSAGE): string {
  const cleanPhone = WHATSAPP.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

// Helper pentru întrebare despre un produs anume
export function getProductWhatsAppUrl(productName: string): string {
  return getWhatsAppUrl(`Bună ziua! Mă interesează: ${productName}.`);
}
