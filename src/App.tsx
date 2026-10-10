/**
 * @license
 * CARNION — Magazin Online & Carmangerie Chiajna (Militari Residence)
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import {
  AboutPage,
  DeliveryPaymentPage,
  TermsPage,
  PrivacyPage,
  ContactPage,
} from './pages/StaticPages';
import { CatalogIncompleteBanner } from './utils/catalogValidator';
import AdminImagesPage from './pages/AdminImagesPage';

// Scroll to top automat la navigare între pagini
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-[#0E0C0A] text-[#F3EBDD] flex flex-col font-sans selection:bg-[#B3202A] selection:text-white">
          {/* Banner verificare integritate catalog dacă datele nu coincid */}
          <CatalogIncompleteBanner />

          {/* Header lipicios */}
          <Header />

          {/* Rutare pagini */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/produse" element={<CatalogPage />} />
              <Route path="/categorie/:slug" element={<CatalogPage />} />
              <Route path="/produs/:id" element={<ProductDetailPage />} />
              <Route path="/comanda" element={<CheckoutPage />} />
              <Route path="/despre" element={<AboutPage />} />
              <Route path="/livrare-si-plata" element={<DeliveryPaymentPage />} />
              <Route path="/termeni" element={<TermsPage />} />
              <Route path="/confidentialitate" element={<PrivacyPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* RUTA INTERNĂ ADMIN IMAGINI — VIZIBILĂ DOAR ÎN DEVELOPMENT */}
              {import.meta.env.DEV && (
                <Route path="/admin/imagini" element={<AdminImagesPage />} />
              )}

              {/* Fallback pentru rute necunoscute */}
              <Route path="*" element={<CatalogPage />} />
            </Routes>
          </main>

          {/* Panoul glisant Coș din dreapta */}
          <CartDrawer />

          {/* Footer site */}
          <Footer />

          {/* Buton plutitor WhatsApp pe toate paginile */}
          <WhatsAppFloatingButton />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}
