import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import productsData from '../data/products.json';
import { Product } from '../types';
import {
  saveApprovedImage,
  deleteApprovedImage,
  getAllApprovedImages,
  getAllRawImageRecords,
  purgeProceduralImages,
  useApprovedImages,
} from '../utils/imageDb';
import { generateProductImageWithGemini } from '../services/geminiImageService';
import {
  generateProductImageWithKie,
  KieApiError,
  KieProfile,
  KieTechDetails,
  cleanPrompt,
  buildKieRequestBody,
  getWorkingNanoBananaConfig,
} from '../services/kieImageService';
import { downloadApprovedImagesZip } from '../utils/imageZip';

// Cel mai ieftin model de generare imagini Gemini din SDK-ul @google/genai
const GEMINI_IMAGE_MODEL_NAME = 'gemini-3.1-flash-lite-image';

// Modele implicite pe profiluri
const PROFILE_DEFAULT_MODELS: Record<KieProfile, string> = {
  'nano-banana-2': 'nano-banana-2',
  'seedream': 'bytedance/seedream-v4-text-to-image',
};

// Categorii de produse cu imageMode="generate" cerute în specificație
const CATEGORY_TABS = [
  'Toate',
  'Vită',
  'Porc',
  'Pui',
  'Oaie și miel',
  'Cârnați proaspeți',
  'Mezeluri și afumături',
  'Lactate/ouă',
] as const;

// Mapare pentru denumirea categoriei din fișierul products.json
const CATEGORY_MAP: Record<string, string> = {
  'Lactate/ouă': 'Lactate, brânzeturi și ouă',
};

// ID-urile celor 8 produse din secțiunea „Din vitrina de azi” de pe prima pagină
const VITRINA_IDS = [
  'antricot-vita',
  'ceafa-porc-fara-os',
  'muschi-de-vita',
  'mici-vita-oaie',
  'carnati-plescoi',
  'babic-nea-popa',
  'cotlete-de-berbecut',
  'piept-pui-fara-os-fara-piele',
];

type ImageProvider = 'kie' | 'gemini';

interface ItemState {
  product: Product;
  status: 'lipsa' | 'generata' | 'aprobata';
  previewUrl?: string;
  source?: 'kie' | 'gemini';
  error?: string;
  errorCode?: number;
  attempts: number;
  liveStatus?: string;
  techDetails?: KieTechDetails;
}

export const AdminImagesPage: React.FC = () => {
  const allProducts = (productsData as { products: Product[] }).products;
  // Toate produsele cu imageMode="generate" (95 produse)
  const generateProducts = allProducts.filter((p) => p.imageMode === 'generate');

  const approvedImagesFromDb = useApprovedImages();

  // 1. SELECTOR DE FURNIZOR: kie.ai (implicit) / Gemini
  const [provider, setProvider] = useState<ImageProvider>(() => {
    try {
      const saved = localStorage.getItem('carnion_image_provider');
      return saved === 'gemini' ? 'gemini' : 'kie';
    } catch {
      return 'kie';
    }
  });

  // 2. PROFIL MODEL kie.ai: nano-banana-2 (IMPLICIT) sau seedream
  const [kieProfile, setKieProfile] = useState<KieProfile>(() => {
    try {
      const saved = localStorage.getItem('carnion_kie_profile');
      return saved === 'seedream' ? 'seedream' : 'nano-banana-2';
    } catch {
      return 'nano-banana-2';
    }
  });

  // Model kie.ai editabil (se completează automat de profil, dar rămâne editabil)
  const [kieModel, setKieModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('carnion_kie_model');
      if (saved) return saved;
      return PROFILE_DEFAULT_MODELS[kieProfile] || 'nano-banana-2';
    } catch {
      return 'nano-banana-2';
    }
  });

  // Cheie kie.ai (salvată doar în localStorage cu try/catch)
  const [kieApiKey, setKieApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('carnion_kie_api_key') || '';
    } catch {
      return '';
    }
  });

  // Cheie Gemini API
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('carnion_gemini_api_key') || '';
    } catch {
      return '';
    }
  });

  const [showKeyPanel, setShowKeyPanel] = useState<boolean>(true);

  // Panou pliabil „Detalii tehnice” global / per produs
  const [expandedTechDetails, setExpandedTechDetails] = useState<Record<string, boolean>>({});

  // Contor cereri făcute în această sesiune
  const [sessionRequestsCount, setSessionRequestsCount] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('carnion_image_session_requests');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  // Mesaj alertă critică
  const [criticalNotice, setCriticalNotice] = useState<{
    title: string;
    description: string;
    isError: boolean;
  } | null>(null);

  // Raport purjare imagini procedurale la pornire
  const [purgedCountNotice, setPurgedCountNotice] = useState<number | null>(null);

  // Filtru categorie
  const [selectedCategory, setSelectedCategory] = useState<string>('Toate');

  // Stare produse
  const [items, setItems] = useState<Record<string, ItemState>>({});
  const [selectedPreview, setSelectedPreview] = useState<{
    product: Product;
    imageUrl: string;
    isApproved: boolean;
    source?: 'kie' | 'gemini';
  } | null>(null);

  // Căutare & Filtrare Status
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'toate' | 'lipsa' | 'generata' | 'aprobata'>('toate');

  // Proces de generare secvențială
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
    currentName: '',
    batchTitle: '',
    liveStep: '',
  });

  // Stare descărcare ZIP
  const [isZipExporting, setIsZipExporting] = useState(false);
  const [zipProgress, setZipProgress] = useState({ percent: 0, note: '' });

  const stopBatchRef = useRef(false);

  // Schimbare furnizor și salvare în localStorage
  const handleSelectProvider = (newProvider: ImageProvider) => {
    setProvider(newProvider);
    try {
      localStorage.setItem('carnion_image_provider', newProvider);
    } catch {
      // Ignoră
    }
  };

  // Schimbare profil model kie.ai: completează automat câmpul model, dar rămâne editabil
  const handleSelectKieProfile = (newProfile: KieProfile) => {
    setKieProfile(newProfile);
    const defModel = PROFILE_DEFAULT_MODELS[newProfile];
    setKieModel(defModel);
    try {
      localStorage.setItem('carnion_kie_profile', newProfile);
      localStorage.setItem('carnion_kie_model', defModel);
    } catch {
      // Ignoră
    }
  };

  // Salvare cheie kie.ai în localStorage
  const handleSaveKieKey = (key: string) => {
    setKieApiKey(key);
    try {
      if (key.trim()) {
        localStorage.setItem('carnion_kie_api_key', key.trim());
      } else {
        localStorage.removeItem('carnion_kie_api_key');
      }
    } catch {
      // Ignoră
    }
  };

  // Ștergere cheie kie.ai
  const handleClearKieKey = () => {
    setKieApiKey('');
    try {
      localStorage.removeItem('carnion_kie_api_key');
    } catch {
      // Ignoră
    }
  };

  // Salvare manuală model kie.ai
  const handleSaveKieModel = (model: string) => {
    setKieModel(model);
    try {
      localStorage.setItem('carnion_kie_model', model.trim());
    } catch {
      // Ignoră
    }
  };

  // Salvare cheie Gemini API
  const handleSaveGeminiKey = (key: string) => {
    setGeminiApiKey(key);
    try {
      if (key.trim()) {
        localStorage.setItem('carnion_gemini_api_key', key.trim());
      } else {
        localStorage.removeItem('carnion_gemini_api_key');
      }
    } catch {
      // Ignoră
    }
  };

  // Incrementare contor sesiune
  const incrementSessionCount = () => {
    setSessionRequestsCount((prev) => {
      const next = prev + 1;
      try {
        sessionStorage.setItem('carnion_image_session_requests', next.toString());
      } catch {
        // Ignoră
      }
      return next;
    });
  };

  const toggleTechDetails = (productId: string) => {
    setExpandedTechDetails((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Inițializare și curățare obligatorie a oricăror imagini procedurale din IndexedDB
  useEffect(() => {
    const initAndPurge = async () => {
      const purged = await purgeProceduralImages();
      if (purged > 0) {
        setPurgedCountNotice(purged);
      }

      const rawRecords = await getAllRawImageRecords();
      const recordsMap = new Map<string, { dataUrl: string; source: 'kie' | 'gemini' }>();

      for (const rec of rawRecords) {
        const isLegitSource = rec.source === 'kie' || rec.source === 'gemini';
        if (rec.status === 'approved' && rec.dataUrl && isLegitSource) {
          recordsMap.set(rec.id, {
            dataUrl: rec.dataUrl,
            source: rec.source as 'kie' | 'gemini',
          });
        }
      }

      const initialMap: Record<string, ItemState> = {};
      for (const p of generateProducts) {
        const found = recordsMap.get(p.id);
        initialMap[p.id] = {
          product: p,
          status: found ? 'aprobata' : 'lipsa',
          previewUrl: found ? found.dataUrl : undefined,
          source: found ? found.source : undefined,
          attempts: 0,
        };
      }

      setItems(initialMap);
    };

    initAndPurge();
  }, []);

  // Sincronizare când IndexedDB se actualizează
  useEffect(() => {
    const syncDb = async () => {
      const rawRecords = await getAllRawImageRecords();
      setItems((prev) => {
        const updated = { ...prev };
        for (const rec of rawRecords) {
          if (rec.status === 'approved' && rec.dataUrl && (rec.source === 'kie' || rec.source === 'gemini')) {
            if (updated[rec.id]) {
              updated[rec.id] = {
                ...updated[rec.id],
                status: 'aprobata',
                previewUrl: rec.dataUrl,
                source: rec.source as 'kie' | 'gemini',
                error: undefined,
              };
            }
          }
        }
        return updated;
      });
    };

    syncDb();
  }, [approvedImagesFromDb]);

  // Generare UNICĂ per produs
  const handleGenerateSingle = async (product: Product): Promise<string> => {
    const activeProvider = provider;

    if (activeProvider === 'kie') {
      const cleanKey = kieApiKey.trim();
      if (!cleanKey) {
        setItems((prev) => ({
          ...prev,
          [product.id]: {
            ...prev[product.id],
            status: 'lipsa',
            previewUrl: undefined,
            source: undefined,
            error: 'Lipsește cheia kie.ai. Introdu cheia în panoul de configurare.',
            errorCode: 401,
          },
        }));
        return '';
      }

      incrementSessionCount();

      setItems((prev) => ({
        ...prev,
        [product.id]: {
          ...prev[product.id],
          error: undefined,
          errorCode: undefined,
          liveStatus: `Se inițiază pe profilul ${kieProfile}...`,
          attempts: (prev[product.id]?.attempts || 0) + 1,
        },
      }));

      try {
        const result = await generateProductImageWithKie({
          prompt: product.imagePrompt || product.name,
          apiKey: cleanKey,
          profile: kieProfile,
          modelOverride: kieModel.trim() || undefined,
          onStatusUpdate: (statusText) => {
            setItems((prev) => ({
              ...prev,
              [product.id]: {
                ...prev[product.id],
                liveStatus: statusText,
              },
            }));
            if (isBatchRunning) {
              setBatchProgress((bp) => ({ ...bp, liveStep: statusText }));
            }
          },
          shouldStop: () => stopBatchRef.current,
        });

        // Succes: marcat ca generat cu sursa 'kie', stocăm detaliile tehnice
        setItems((prev) => ({
          ...prev,
          [product.id]: {
            ...prev[product.id],
            status: 'generata',
            previewUrl: result.imageUrl,
            source: 'kie',
            error: undefined,
            errorCode: undefined,
            liveStatus: undefined,
            techDetails: result.techDetails,
          },
        }));

        return result.imageUrl;
      } catch (err: any) {
        const isAuth = err.isAuthError || err.code === 401;
        const isCredits = err.isCreditsError || err.code === 402;
        const isRate = err.isRateLimit || err.code === 429;
        const errorCode = err.code;

        // Afișează textul real din body.msg al API-ului și codul
        let displayError = err.message || 'Lipsește cheia API / generarea a eșuat';

        if (isAuth) {
          displayError = `Cheie kie.ai invalidă (cod ${errorCode || 401})`;
          stopBatchRef.current = true;
          setIsBatchRunning(false);
          setCriticalNotice({
            title: 'Cheie kie.ai invalidă',
            description: 'Verifică cheia API introdusă în panoul de configurare.',
            isError: true,
          });
        } else if (isCredits) {
          displayError = `Credite kie.ai insuficiente. Reîncarcă contul (cod ${errorCode || 402})`;
          stopBatchRef.current = true;
          setIsBatchRunning(false);
          setCriticalNotice({
            title: 'Credite kie.ai insuficiente',
            description: 'Reîncarcă contul kie.ai pentru a continua generarea de fotografii.',
            isError: true,
          });
        } else if (isRate) {
          displayError = `Limită de rată kie.ai (cod 429). Reia mai târziu`;
          stopBatchRef.current = true;
          setIsBatchRunning(false);
          setCriticalNotice({
            title: 'Limită de rată kie.ai (429)',
            description: 'API-ul kie.ai a returnat 429 după reîncercare. Procesul a fost oprit automat.',
            isError: true,
          });
        }

        // Regula: lasă produsul cu status „lipsa” și salvează techDetails pentru depanare
        setItems((prev) => ({
          ...prev,
          [product.id]: {
            ...prev[product.id],
            status: 'lipsa',
            previewUrl: undefined,
            source: undefined,
            error: displayError,
            errorCode: errorCode,
            liveStatus: undefined,
            techDetails: err.techDetails || prev[product.id]?.techDetails,
          },
        }));

        return '';
      }
    } else {
      // Furnizor Gemini
      const cleanKey = geminiApiKey.trim();
      if (!cleanKey) {
        setItems((prev) => ({
          ...prev,
          [product.id]: {
            ...prev[product.id],
            status: 'lipsa',
            previewUrl: undefined,
            source: undefined,
            error: 'Lipsește cheia API / generarea a eșuat',
          },
        }));
        return '';
      }

      incrementSessionCount();

      setItems((prev) => ({
        ...prev,
        [product.id]: {
          ...prev[product.id],
          error: undefined,
          liveStatus: 'Se generează cu Gemini...',
          attempts: (prev[product.id]?.attempts || 0) + 1,
        },
      }));

      try {
        const imageUrl = await generateProductImageWithGemini(
          product.imagePrompt || product.name,
          cleanKey
        );

        setItems((prev) => ({
          ...prev,
          [product.id]: {
            ...prev[product.id],
            status: 'generata',
            previewUrl: imageUrl,
            source: 'gemini',
            error: undefined,
            liveStatus: undefined,
          },
        }));

        return imageUrl;
      } catch (err: any) {
        const isQuota =
          err.isQuotaExceeded ||
          err.status === 429 ||
          err.message?.includes('Cota Gemini') ||
          err.message?.includes('429');

        if (isQuota) {
          stopBatchRef.current = true;
          setIsBatchRunning(false);
          setCriticalNotice({
            title: 'Cota Gemini s-a terminat. Reia mai târziu',
            description: 'Pentru a continua generarea fără întreruperi, folosește furnizorul alternativ kie.ai.',
            isError: true,
          });
        }

        setItems((prev) => ({
          ...prev,
          [product.id]: {
            ...prev[product.id],
            status: 'lipsa',
            previewUrl: undefined,
            source: undefined,
            error: isQuota
              ? 'Cota Gemini s-a terminat. Reia mai târziu'
              : 'Lipsește cheia API / generarea a eșuat',
            liveStatus: undefined,
          },
        }));

        return '';
      }
    }
  };

  // Buclă de generare secvențială
  const runSequentialBatch = async (
    targetProducts: Product[],
    batchTitle: string
  ) => {
    if (targetProducts.length === 0) return;

    if (provider === 'kie' && !kieApiKey.trim()) {
      setCriticalNotice({
        title: 'Lipsește cheia kie.ai',
        description: 'Introdu cheia kie.ai în panoul de configurare pentru a începe generarea.',
        isError: true,
      });
      return;
    }

    if (provider === 'gemini' && !geminiApiKey.trim()) {
      setCriticalNotice({
        title: 'Lipsește cheia Gemini API',
        description: 'Introdu cheia Gemini API sau selectează kie.ai.',
        isError: true,
      });
      return;
    }

    setCriticalNotice(null);
    stopBatchRef.current = false;
    setIsBatchRunning(true);

    const total = targetProducts.length;

    for (let i = 0; i < total; i++) {
      if (stopBatchRef.current) break;

      const p = targetProducts[i];
      setBatchProgress({
        current: i + 1,
        total,
        percent: Math.round(((i + 1) / total) * 100),
        currentName: p.name,
        batchTitle,
        liveStep: 'Se pregătește...',
      });

      await handleGenerateSingle(p);
      if (stopBatchRef.current) {
        break;
      }

      if (i < total - 1 && !stopBatchRef.current) {
        await new Promise((res) => setTimeout(res, 800));
      }
    }

    setIsBatchRunning(false);
  };

  const handleStopBatch = () => {
    stopBatchRef.current = true;
    setIsBatchRunning(false);
  };

  // Buton: „Generează vitrina”
  const handleGenerateVitrina = () => {
    const vitrinaProducts = VITRINA_IDS.map((id) =>
      generateProducts.find((p) => p.id === id)
    ).filter((p): p is Product => p !== undefined);

    const missingVitrina = vitrinaProducts.filter((p) => {
      const it = items[p.id];
      return !it || it.status !== 'aprobata';
    });

    const targetList = missingVitrina.length > 0 ? missingVitrina : vitrinaProducts;
    runSequentialBatch(targetList, 'Vitrina de azi (8 produse)');
  };

  // Buton: „Generează lipsă din categoria selectată”
  const handleGenerateMissingFromCategory = () => {
    const realCat =
      selectedCategory === 'Toate' ? null : CATEGORY_MAP[selectedCategory] || selectedCategory;

    const list = generateProducts.filter((p) => {
      const matchCat = realCat ? p.category === realCat : true;
      const it = items[p.id];
      const isMissing = !it || it.status === 'lipsa';
      return matchCat && isMissing;
    });

    if (list.length === 0) {
      alert(`Toate produsele din categoria „${selectedCategory}” sunt deja generate sau aprobate!`);
      return;
    }

    runSequentialBatch(list, `Categoria: ${selectedCategory} (${list.length} produse lipsă)`);
  };

  // Buton: „Generează toate lipsă”
  const handleGenerateAllMissing = () => {
    const missingList = generateProducts.filter((p) => {
      const it = items[p.id];
      return !it || it.status === 'lipsa';
    });

    if (missingList.length === 0) {
      alert('Toate produsele au deja imagini generate sau aprobate!');
      return;
    }

    runSequentialBatch(missingList, `Toate lipsă (${missingList.length} produse)`);
  };

  // Aprobare produs individual
  const handleApprove = async (product: Product) => {
    const it = items[product.id];
    if (!it || !it.previewUrl) return;

    const source = it.source || (provider === 'kie' ? 'kie' : 'gemini');

    await saveApprovedImage(product.id, it.previewUrl, 'approved', source);

    setItems((prev) => ({
      ...prev,
      [product.id]: {
        ...prev[product.id],
        status: 'aprobata',
        source,
        error: undefined,
      },
    }));
  };

  // Respingere produs
  const handleReject = async (product: Product) => {
    await deleteApprovedImage(product.id);

    setItems((prev) => ({
      ...prev,
      [product.id]: {
        ...prev[product.id],
        status: 'lipsa',
        previewUrl: undefined,
        source: undefined,
        error: undefined,
        liveStatus: undefined,
      },
    }));
  };

  // Aprobă toate generate
  const handleApproveAllGenerated = async () => {
    const generatedItems = Object.values(items).filter(
      (it) => it.status === 'generata' && it.previewUrl && (it.source === 'kie' || it.source === 'gemini')
    );

    for (const it of generatedItems) {
      if (it.previewUrl && it.source) {
        await saveApprovedImage(it.product.id, it.previewUrl, 'approved', it.source);
      }
    }

    setItems((prev) => {
      const updated = { ...prev };
      for (const it of generatedItems) {
        updated[it.product.id] = {
          ...updated[it.product.id],
          status: 'aprobata',
        };
      }
      return updated;
    });
  };

  // Descărcare ZIP
  const handleDownloadZip = async () => {
    setIsZipExporting(true);
    setZipProgress({ percent: 0, note: 'Se pregătesc fotografiile aprobate...' });

    try {
      const allApproved = await getAllApprovedImages();
      const approvedIds = Object.keys(allApproved);

      if (approvedIds.length === 0) {
        alert('Nu există nicio imagine aprobată în baza de date pentru descărcare.');
        setIsZipExporting(false);
        return;
      }

      await downloadApprovedImagesZip(
        allApproved,
        (percent: number, currentItem: string) => {
          setZipProgress({
            percent,
            note: `Procesare WebP 1200×900: ${currentItem}`,
          });
        }
      );

      setZipProgress({ percent: 100, note: 'Arhivă ZIP generată cu succes!' });
    } catch (err: any) {
      alert(`Eroare la generarea arhivei ZIP: ${err.message || 'Necunoscută'}`);
    } finally {
      setTimeout(() => {
        setIsZipExporting(false);
      }, 1500);
    }
  };

  // Statistici exacte
  const totalApprovedCount = Object.values(items).filter((it) => it.status === 'aprobata').length;
  const kieApprovedCount = Object.values(items).filter(
    (it) => it.status === 'aprobata' && it.source === 'kie'
  ).length;
  const geminiApprovedCount = Object.values(items).filter(
    (it) => it.status === 'aprobata' && it.source === 'gemini'
  ).length;
  const totalGeneratedCount = Object.values(items).filter((it) => it.status === 'generata').length;
  const lipsaCount = Object.values(items).filter((it) => it.status === 'lipsa').length;

  // Filtrare produse
  const filteredProducts = generateProducts.filter((product) => {
    if (selectedCategory !== 'Toate') {
      const realCat = CATEGORY_MAP[selectedCategory] || selectedCategory;
      if (product.category !== realCat) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = product.name.toLowerCase().includes(term);
      const matchId = product.id.toLowerCase().includes(term);
      if (!matchName && !matchId) return false;
    }

    const item = items[product.id];
    const status = item ? item.status : 'lipsa';
    if (filterStatus !== 'toate' && status !== filterStatus) {
      return false;
    }

    return true;
  });

  // Antricot vită pentru inspecție directă a corpului de cerere
  const antricotProduct = generateProducts.find((p) => p.id === 'antricot-vita');
  const sampleCleanedPrompt = antricotProduct ? cleanPrompt(antricotProduct.imagePrompt || '') : '';
  const sampleRequestBody = buildKieRequestBody(sampleCleanedPrompt, kieProfile, kieModel);

  return (
    <div className="min-h-screen bg-[#0E0C0A] text-[#F3EBDD] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Antet Pagină */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#2B2521]">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs font-semibold text-[#A89B8C] hover:text-[#C9A55C] transition-colors"
            >
              ← Înapoi în Magazin
            </Link>
            <span className="text-[#2B2521]">•</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B3202A] bg-[#B3202A]/10 px-2 py-0.5 rounded border border-[#B3202A]/20">
              Dev Only • Studio Generare Fotografii
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <h1 className="font-serif-title text-2xl sm:text-3xl font-bold tracking-wide text-[#F3EBDD]">
              Generator Fotografii Produse Carnion
            </h1>

            {/* Comutator Furnizor: kie.ai (implicit) / Gemini */}
            <div className="inline-flex p-1 rounded-xl bg-[#171412] border border-[#2B2521] shadow-inner">
              <button
                type="button"
                onClick={() => handleSelectProvider('kie')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  provider === 'kie'
                    ? 'bg-[#C9A55C] text-[#0E0C0A] shadow-md'
                    : 'text-[#A89B8C] hover:text-[#F3EBDD]'
                }`}
              >
                <span>⚡ kie.ai</span>
                <span className="text-[10px] uppercase font-semibold opacity-80">(implicit)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectProvider('gemini')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  provider === 'gemini'
                    ? 'bg-[#B3202A] text-white shadow-md'
                    : 'text-[#A89B8C] hover:text-[#F3EBDD]'
                }`}
              >
                <span>✨ Gemini</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
            {/* Tag Model Activ & Profil */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F1B18] border border-[#C9A55C]/40 text-[#C9A55C] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#25D366]" />
              {provider === 'kie' ? (
                <>
                  kie.ai profil: <strong className="text-[#F3EBDD] font-mono">{kieProfile}</strong> · model: <code className="font-mono text-[#F3EBDD]">{kieModel}</code>
                </>
              ) : (
                <>
                  Model Gemini: <code className="font-mono text-[#F3EBDD] font-bold">{GEMINI_IMAGE_MODEL_NAME}</code> (4:3, fotografii reale)
                </>
              )}
            </span>

            {/* Contor cereri sesiune */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0E0C0A] border border-[#2B2521] text-xs text-[#A89B8C]">
              📊 Cereri făcute în această sesiune:{' '}
              <strong className="text-[#F3EBDD] font-mono text-sm">{sessionRequestsCount}</strong>
            </span>

            {/* Contor imagini aprobate conform specificației */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-bold">
              ✓ {totalApprovedCount} imagini aprobate (kie: {kieApprovedCount}, gemini: {geminiApprovedCount})
            </span>
          </div>
        </div>

        {/* Butoane Acțiuni Globale */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Buton „Generează vitrina” */}
          <button
            type="button"
            onClick={handleGenerateVitrina}
            disabled={isBatchRunning}
            className="px-4 py-2.5 bg-[#B3202A] hover:bg-[#961720] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
          >
            <span>🥩 Generează vitrina (8)</span>
          </button>

          {/* Buton „Generează toate lipsă” */}
          <button
            type="button"
            onClick={handleGenerateAllMissing}
            disabled={isBatchRunning || lipsaCount === 0}
            className="px-4 py-2.5 bg-[#1F1B18] hover:bg-[#2B2521] border border-[#C9A55C]/50 disabled:opacity-40 text-[#F3EBDD] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
          >
            <span>⚡ Toate lipsă ({lipsaCount})</span>
          </button>

          {/* Buton „Aprobă toate generate” */}
          <button
            type="button"
            onClick={handleApproveAllGenerated}
            disabled={totalGeneratedCount === 0}
            className="px-4 py-2.5 bg-[#C9A55C] hover:bg-[#DFC07D] disabled:opacity-40 disabled:cursor-not-allowed text-[#0E0C0A] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
          >
            <span>✓ Aprobă toate ({totalGeneratedCount})</span>
          </button>

          {/* Buton „Oprește” */}
          {isBatchRunning && (
            <button
              type="button"
              onClick={handleStopBatch}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow animate-pulse cursor-pointer flex items-center gap-1.5"
            >
              <span>🛑 Oprește</span>
            </button>
          )}

          {/* Buton ZIP */}
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={totalApprovedCount === 0 || isZipExporting}
            className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
          >
            <span>📦 Descarcă ZIP</span>
            <span className="font-mono text-xs">({totalApprovedCount})</span>
          </button>
        </div>
      </div>

      {/* Mesaj Purjare Imagini Procedurale */}
      {purgedCountNotice !== null && purgedCountNotice > 0 && (
        <div className="bg-[#171412] border border-[#C9A55C] text-[#C9A55C] p-3.5 rounded-xl text-xs flex items-center justify-between">
          <span>
            🧹 <strong>Curățare completă:</strong> Au fost șterse automat <strong>{purgedCountNotice} imagini procedurale/vechi</strong> din baza de date. În aplicație sunt permise exclusiv fotografii reale ({provider === 'kie' ? 'kie.ai' : 'Gemini'}).
          </span>
          <button
            type="button"
            onClick={() => setPurgedCountNotice(null)}
            className="text-xs font-bold text-[#A89B8C] hover:text-[#F3EBDD] cursor-pointer"
          >
            Închide
          </button>
        </div>
      )}

      {/* Banner Atenționare Critică */}
      {criticalNotice && (
        <div className="bg-[#B3202A]/20 border border-[#B3202A] text-[#F3EBDD] p-4 rounded-xl flex items-start justify-between gap-3 shadow-lg">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🛑</span>
              <strong className="text-sm font-bold text-[#F3EBDD]">{criticalNotice.title}</strong>
            </div>
            <p className="text-xs text-[#A89B8C] mt-1">{criticalNotice.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setCriticalNotice(null)}
            className="text-xs text-[#A89B8C] hover:text-[#F3EBDD] cursor-pointer px-2 py-1 rounded bg-[#0E0C0A]/40"
          >
            Închide
          </button>
        </div>
      )}

      {/* Avertisment local storage */}
      <div className="bg-[#171412] border border-[#2B2521] px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#A89B8C]">
        <div className="flex items-center gap-2">
          <span className="text-base text-[#C9A55C]">💾</span>
          <span>
            <strong className="text-[#F3EBDD]">Important:</strong> Imaginile aprobate sunt salvate doar în acest browser (IndexedDB). Descarcă ZIP-ul înainte să închizi pagina.
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#A89B8C]">
          <span>Format: &#123;id&#125;.webp</span>
          <span>•</span>
          <span>1200×900 px (4:3)</span>
          <span>•</span>
          <span>Q: 0.82</span>
        </div>
      </div>

      {/* Bară Progres Rulare Secvențială */}
      {isBatchRunning && (
        <div className="bg-[#171412] border border-[#C9A55C]/40 p-4 rounded-xl space-y-2 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
            <span className="text-[#F3EBDD] font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-ping" />
              Generare secvențială {provider === 'kie' ? `kie.ai (${kieProfile})` : 'Gemini'} · {batchProgress.batchTitle}:{' '}
              <strong className="text-[#C9A55C]">{batchProgress.currentName}</strong>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#25D366] italic">{batchProgress.liveStep}</span>
              <span className="font-mono text-[#A89B8C]">
                {batchProgress.current} / {batchProgress.total} ({batchProgress.percent}%)
              </span>
              <button
                type="button"
                onClick={handleStopBatch}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded uppercase cursor-pointer"
              >
                Oprește
              </button>
            </div>
          </div>
          <div className="w-full h-2.5 bg-[#0E0C0A] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C9A55C] to-[#25D366] transition-all duration-300"
              style={{ width: `${batchProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Bară Progres Export ZIP */}
      {isZipExporting && (
        <div className="bg-[#171412] border border-[#25D366]/40 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#F3EBDD]">{zipProgress.note}</span>
            <span className="font-mono text-[#25D366] font-bold">{zipProgress.percent}%</span>
          </div>
          <div className="w-full h-2 bg-[#0E0C0A] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#25D366] transition-all duration-150"
              style={{ width: `${zipProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Panou Chei & Configurare Model kie.ai (Profiluri & Corp Cerere) */}
      <div className="bg-[#171412] border border-[#2B2521] p-4 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9A55C]">
                Configurare Furnizor AI Activ: {provider === 'kie' ? 'kie.ai' : 'Google Gemini'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#1F1B18] text-[#A89B8C] border border-[#2B2521]">
                {provider === 'kie' ? 'Profil model dedicat (fără parametri comuni)' : 'API Gemini direct'}
              </span>
            </div>
            <p className="text-[11px] text-[#A89B8C] mt-0.5">
              {provider === 'kie'
                ? 'Cereri asincrone createTask + recordInfo (4s polling). Cheia este securizată strict în browser (localStorage).'
                : 'Generare sincronă Gemini 4:3. Dacă se atinge limita de cotă (429), comută pe kie.ai.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowKeyPanel(!showKeyPanel)}
            className="px-3.5 py-1.5 rounded-lg bg-[#1F1B18] border border-[#2B2521] hover:border-[#C9A55C] text-[#C9A55C] text-xs font-semibold self-start sm:self-auto cursor-pointer"
          >
            {showKeyPanel ? 'Ascunde setările' : 'Configurează cheia & profilul model ⚙️'}
          </button>
        </div>

        {/* Setări detaliate */}
        {showKeyPanel && (
          <div className="pt-3 border-t border-[#2B2521] grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs animate-in fade-in duration-150">
            {/* Panou kie.ai */}
            <div className={`p-4 rounded-xl border space-y-3.5 ${provider === 'kie' ? 'bg-[#1F1B18]/70 border-[#C9A55C]/40' : 'bg-[#0E0C0A] border-[#2B2521]'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F3EBDD] flex items-center gap-1.5">
                  <span>⚡</span> Setări kie.ai (implicit)
                </span>
                {provider === 'kie' && (
                  <span className="text-[10px] font-bold text-[#C9A55C] uppercase bg-[#C9A55C]/10 px-2 py-0.5 rounded">
                    Activ acum
                  </span>
                )}
              </div>

              {/* 1. Comutator Profil Model (nano-banana-2 vs seedream) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[#A89B8C]">
                  Profil model kie.ai:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectKieProfile('nano-banana-2')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      kieProfile === 'nano-banana-2'
                        ? 'bg-[#C9A55C]/20 border-[#C9A55C] text-[#F3EBDD]'
                        : 'bg-[#0E0C0A] border-[#2B2521] text-[#A89B8C] hover:text-[#F3EBDD]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#C9A55C]">nano-banana-2</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#C9A55C] text-[#0E0C0A] font-bold">
                        Implicit
                      </span>
                    </div>
                    <p className="text-[10px] text-[#A89B8C] mt-1 leading-tight">
                      image_input: [], 4:3, 1K, output_format: jpg, fără image_size. Fallback auto 2K la 422.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectKieProfile('seedream')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      kieProfile === 'seedream'
                        ? 'bg-[#C9A55C]/20 border-[#C9A55C] text-[#F3EBDD]'
                        : 'bg-[#0E0C0A] border-[#2B2521] text-[#A89B8C] hover:text-[#F3EBDD]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#C9A55C]">seedream</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#1F1B18] text-[#A89B8C] border border-[#2B2521]">
                        Rezervă
                      </span>
                    </div>
                    <p className="text-[10px] text-[#A89B8C] mt-1 leading-tight">
                      bytedance/seedream-v4-text-to-image, landscape_4_3, 1K, max_images: 1, nsfw: true.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Câmp Model editabil */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-[#A89B8C]">
                    Câmp model (completat automat de profil, editabil):
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSaveKieModel(PROFILE_DEFAULT_MODELS[kieProfile])}
                    className="text-[10px] text-[#C9A55C] hover:underline cursor-pointer"
                  >
                    Resetează la profil
                  </button>
                </div>
                <input
                  type="text"
                  value={kieModel}
                  onChange={(e) => handleSaveKieModel(e.target.value)}
                  placeholder="nano-banana-2 sau bytedance/seedream-v4-text-to-image"
                  className="w-full bg-[#0E0C0A] text-[#F3EBDD] text-xs px-3 py-2 rounded-lg border border-[#2B2521] focus:border-[#C9A55C] focus:outline-none font-mono"
                />
              </div>

              {/* 3. Cheie kie.ai */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[#A89B8C]">
                  Cheia kie.ai (salvată doar în localStorage, type=password):
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={kieApiKey}
                    onChange={(e) => handleSaveKieKey(e.target.value)}
                    placeholder="Introdu cheia kie.ai..."
                    className="flex-1 bg-[#0E0C0A] text-[#F3EBDD] text-xs px-3 py-2 rounded-lg border border-[#2B2521] focus:border-[#C9A55C] focus:outline-none font-mono"
                  />
                  {kieApiKey && (
                    <button
                      type="button"
                      onClick={handleClearKieKey}
                      className="px-3 py-2 bg-[#171412] border border-[#B3202A]/40 text-[#B3202A] hover:bg-[#B3202A]/20 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Șterge cheia
                    </button>
                  )}
                </div>
                {kieApiKey ? (
                  <p className="text-[10px] text-[#25D366]">
                    ✓ Cheia este salvată în siguranță în localStorage (••••{kieApiKey.slice(-4)}).
                  </p>
                ) : (
                  <p className="text-[10px] text-[#B3202A]">
                    ⚠ Cheia lipsește. Introdu cheia pentru a genera pe kie.ai.
                  </p>
                )}
              </div>

              {/* Configurație memorată fallback 422 */}
              {kieProfile === 'nano-banana-2' && (
                <div className="p-2 rounded bg-[#0E0C0A] border border-[#2B2521] text-[10px] text-[#A89B8C] flex items-center justify-between">
                  <span>
                    Config curent memorat pentru nano-banana-2: <code className="text-[#C9A55C] font-mono">{getWorkingNanoBananaConfig().aspectRatio}</code> / <code className="text-[#C9A55C] font-mono">{getWorkingNanoBananaConfig().resolution}</code>
                  </span>
                  <span className="text-[#25D366]">✓ Fallback 422 activ</span>
                </div>
              )}
            </div>

            {/* Panou Gemini API */}
            <div className={`p-4 rounded-xl border space-y-3.5 ${provider === 'gemini' ? 'bg-[#1F1B18]/70 border-[#B3202A]/40' : 'bg-[#0E0C0A] border-[#2B2521]'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F3EBDD] flex items-center gap-1.5">
                  <span>✨</span> Setări Gemini API
                </span>
                {provider === 'gemini' && (
                  <span className="text-[10px] font-bold text-[#B3202A] uppercase bg-[#B3202A]/10 px-2 py-0.5 rounded">
                    Activ acum
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[#A89B8C]">
                  Cheie Gemini API (salvată local în browser):
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => handleSaveGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 bg-[#0E0C0A] text-[#F3EBDD] text-xs px-3 py-2 rounded-lg border border-[#2B2521] focus:border-[#C9A55C] focus:outline-none font-mono"
                  />
                  {geminiApiKey && (
                    <button
                      type="button"
                      onClick={() => handleSaveGeminiKey('')}
                      className="px-3 py-2 bg-[#171412] border border-[#B3202A]/40 text-[#B3202A] hover:bg-[#B3202A]/20 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Șterge cheia
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[#A89B8C]">
                  Model: <code className="font-mono text-[#C9A55C]">{GEMINI_IMAGE_MODEL_NAME}</code> (format 4:3)
                </p>
              </div>

              {/* Inspecție Tehnică Corp Cerere curent pentru depanare rapidă */}
              <div className="mt-3 p-2.5 rounded bg-[#0E0C0A] border border-[#2B2521] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#C9A55C] uppercase">
                    Inspecție corp cerere (exemplu: „Antricot Vită”)
                  </span>
                  <span className="text-[9px] text-[#A89B8C] font-mono">POST /api/v1/jobs/createTask</span>
                </div>
                <pre className="text-[10px] font-mono text-[#A89B8C] bg-[#171412] p-2 rounded overflow-x-auto max-h-36">
                  {JSON.stringify(sampleRequestBody, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Contoare rapide de stare */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center pt-1">
          <div className="bg-[#0E0C0A] border border-[#2B2521] p-2 rounded-xl">
            <span className="block text-base sm:text-lg font-bold font-mono text-[#F3EBDD]">{generateProducts.length}</span>
            <span className="text-[10px] text-[#A89B8C] uppercase">Total Catalog AI</span>
          </div>
          <div className="bg-[#0E0C0A] border border-[#2B2521] p-2 rounded-xl">
            <span className="block text-base sm:text-lg font-bold font-mono text-[#25D366]">{totalApprovedCount}</span>
            <span className="text-[10px] text-[#A89B8C] uppercase">Total Aprobate</span>
          </div>
          <div className="bg-[#0E0C0A] border border-[#2B2521] p-2 rounded-xl">
            <span className="block text-base sm:text-lg font-bold font-mono text-[#C9A55C]">{kieApprovedCount}</span>
            <span className="text-[10px] text-[#A89B8C] uppercase">kie.ai Aprobate</span>
          </div>
          <div className="bg-[#0E0C0A] border border-[#2B2521] p-2 rounded-xl">
            <span className="block text-base sm:text-lg font-bold font-mono text-[#DFC07D]">{geminiApprovedCount}</span>
            <span className="text-[10px] text-[#A89B8C] uppercase">Gemini Aprobate</span>
          </div>
          <div className="bg-[#0E0C0A] border border-[#2B2521] p-2 rounded-xl col-span-2 sm:col-span-1">
            <span className="block text-base sm:text-lg font-bold font-mono text-[#B3202A]">{lipsaCount}</span>
            <span className="text-[10px] text-[#A89B8C] uppercase">Lipsă</span>
          </div>
        </div>
      </div>

      {/* Filtre pe categorii */}
      <div className="bg-[#171412] border border-[#2B2521] p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#C9A55C]">
              Filtrare Categorii Produse AI ({generateProducts.length})
            </h2>
            <p className="text-[11px] text-[#A89B8C]">
              Furnizor: <strong>{provider === 'kie' ? `kie.ai (${kieProfile})` : 'Gemini'}</strong>. Apasă pentru a rula generarea pe categoria aleasă.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateMissingFromCategory}
            disabled={isBatchRunning}
            className="px-4 py-2 bg-[#C9A55C] hover:bg-[#DFC07D] disabled:opacity-40 text-[#0E0C0A] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>⚡ Generează lipsă din categoria {selectedCategory}</span>
          </button>
        </div>

        {/* Tab-uri Categorii */}
        <div className="flex flex-wrap gap-2 pt-1">
          {CATEGORY_TABS.map((catName) => {
            const isSelected = selectedCategory === catName;
            const realCat = CATEGORY_MAP[catName] || catName;
            const missingInCat =
              catName === 'Toate'
                ? Object.values(items).filter((it) => it.status !== 'aprobata').length
                : Object.values(items).filter(
                    (it) => it.product.category === realCat && it.status !== 'aprobata'
                  ).length;

            return (
              <button
                key={catName}
                type="button"
                onClick={() => setSelectedCategory(catName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#C9A55C] text-[#0E0C0A] font-bold shadow'
                    : 'bg-[#0E0C0A] border border-[#2B2521] text-[#A89B8C] hover:text-[#F3EBDD] hover:border-[#C9A55C]/40'
                }`}
              >
                <span>{catName}</span>
                {missingInCat > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-[#0E0C0A] text-[#C9A55C]' : 'bg-[#1F1B18] text-[#A89B8C]'
                    }`}
                  >
                    {missingInCat}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Căutare și filtrare stare */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#2B2521]">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Caută după nume sau ID produs..."
              className="w-full bg-[#0E0C0A] text-[#F3EBDD] text-xs px-3 py-2 rounded-lg border border-[#2B2521] focus:border-[#C9A55C] focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-xs text-[#A89B8C] hover:text-[#F3EBDD]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex gap-1.5">
            {(['toate', 'lipsa', 'generata', 'aprobata'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#1F1B18] text-[#C9A55C] border border-[#C9A55C]'
                    : 'bg-[#0E0C0A] text-[#A89B8C] border border-[#2B2521] hover:text-[#F3EBDD]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Carduri Produse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const itemState = items[product.id];
          const status = itemState ? itemState.status : 'lipsa';
          const previewUrl = itemState?.previewUrl;
          const source = itemState?.source;
          const error = itemState?.error;
          const errorCode = itemState?.errorCode;
          const liveStatus = itemState?.liveStatus;
          const techDetails = itemState?.techDetails;
          const isVitrina = VITRINA_IDS.includes(product.id);
          const isApproved = status === 'aprobata';
          const isExpanded = !!expandedTechDetails[product.id];

          return (
            <div
              key={product.id}
              className={`bg-[#171412] border rounded-xl p-3 flex flex-col justify-between gap-3 transition-all relative ${
                isApproved
                  ? 'border-[#25D366]/40 shadow-sm'
                  : status === 'generata'
                  ? 'border-[#C9A55C]/50 shadow-md'
                  : error
                  ? 'border-[#B3202A]/50'
                  : 'border-[#2B2521]'
              }`}
            >
              {/* Imagine / Placeholder 4:3 */}
              <div className="w-full aspect-[4/3] bg-[#0E0C0A] rounded-lg overflow-hidden border border-[#2B2521] relative flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={product.name}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() =>
                      setSelectedPreview({ product, imageUrl: previewUrl, isApproved, source })
                    }
                  />
                ) : (
                  <div className="text-center p-3 space-y-1">
                    <span className="font-serif-title font-bold text-2xl text-[#A89B8C]/40">
                      {product.category.slice(0, 2).toUpperCase()}
                    </span>
                    <p className="text-[10px] text-[#A89B8C]">Fără poză</p>
                    {liveStatus && (
                      <p className="text-[11px] text-[#C9A55C] font-semibold animate-pulse">
                        {liveStatus}
                      </p>
                    )}
                  </div>
                )}

                {/* Badge Status */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                  {status === 'aprobata' && (
                    <span className="px-2 py-0.5 rounded bg-[#25D366] text-white text-[10px] font-bold uppercase tracking-wider shadow">
                      ✓ {source === 'kie' ? 'kie.ai' : 'Gemini'} Aprobată
                    </span>
                  )}
                  {status === 'generata' && (
                    <span className="px-2 py-0.5 rounded bg-[#C9A55C] text-[#0E0C0A] text-[10px] font-bold uppercase tracking-wider shadow">
                      {source === 'kie' ? 'kie.ai' : 'Gemini'} Generată
                    </span>
                  )}
                  {status === 'lipsa' && (
                    <span className="px-2 py-0.5 rounded bg-[#1F1B18] text-[#A89B8C] border border-[#2B2521] text-[10px] uppercase">
                      Lipsă
                    </span>
                  )}
                  {isVitrina && (
                    <span className="px-1.5 py-0.5 rounded bg-[#B3202A] text-white text-[9px] font-bold uppercase tracking-wider">
                      Vitrină
                    </span>
                  )}
                </div>

                <div className="absolute bottom-2 left-2 text-[10px] font-mono text-[#F3EBDD] bg-[#0E0C0A]/80 px-1.5 py-0.5 rounded">
                  {product.id}.webp
                </div>
              </div>

              {/* Informații Produs */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#A89B8C]">
                  <span className="uppercase text-[#C9A55C] font-semibold">{product.category}</span>
                  <span className="font-mono">{product.price.toFixed(2)} lei</span>
                </div>
                <h3 className="font-serif-title text-sm font-bold text-[#F3EBDD] mt-0.5 truncate">
                  {product.name}
                </h3>

                {/* Prompt preview curat */}
                <p className="text-[10px] text-[#A89B8C] line-clamp-2 mt-1 italic font-mono bg-[#0E0C0A] p-1.5 rounded border border-[#2B2521]">
                  "{cleanPrompt(product.imagePrompt || '')}"
                </p>

                {/* Live Status */}
                {liveStatus && (
                  <p className="text-[11px] text-[#25D366] font-medium mt-1.5 bg-[#25D366]/10 border border-[#25D366]/20 p-1.5 rounded">
                    ⏳ {liveStatus}
                  </p>
                )}

                {/* EROARE VIZIBILĂ: afișează textul real din body.msg și codul primit de la API */}
                {error && (
                  <div className="mt-1.5 bg-[#B3202A]/10 border border-[#B3202A]/30 p-2 rounded space-y-1">
                    <p className="text-[11px] text-[#B3202A] font-semibold">
                      ⚠ {error}
                    </p>
                    {errorCode && (
                      <span className="inline-block text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#B3202A] text-white">
                        Cod: {errorCode}
                      </span>
                    )}
                  </div>
                )}

                {/* Panou Pliabil „Detalii Tehnice” */}
                {techDetails && (
                  <div className="mt-2 pt-1 border-t border-[#2B2521]">
                    <button
                      type="button"
                      onClick={() => toggleTechDetails(product.id)}
                      className="text-[10px] font-mono text-[#C9A55C] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? '▼' : '▶'}</span>
                      <span>Detalii tehnice (corp cerere & răspuns)</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-1.5 bg-[#0E0C0A] p-2 rounded border border-[#2B2521] text-[9px] font-mono space-y-1.5 max-h-48 overflow-y-auto">
                        <div>
                          <span className="text-[#A89B8C]">Endpoint:</span>{' '}
                          <span className="text-[#25D366]">{techDetails.endpoint}</span>
                        </div>
                        <div>
                          <span className="text-[#A89B8C]">Status HTTP:</span>{' '}
                          <span className="text-[#F3EBDD]">{techDetails.responseStatus}</span>
                        </div>
                        <div>
                          <span className="text-[#A89B8C]">Corp Cerere Trimis:</span>
                          <pre className="text-[#C9A55C] whitespace-pre-wrap break-all mt-0.5">
                            {JSON.stringify(techDetails.sentPayload, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <span className="text-[#A89B8C]">Răspuns Brut:</span>
                          <pre className="text-[#F3EBDD] whitespace-pre-wrap break-all mt-0.5">
                            {JSON.stringify(techDetails.responseBody, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Butoane Acțiune */}
              <div className="pt-2 border-t border-[#2B2521] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void handleGenerateSingle(product);
                  }}
                  disabled={isBatchRunning}
                  className="flex-1 py-1.5 px-2 bg-[#1F1B18] hover:bg-[#2B2521] border border-[#2B2521] text-[#F3EBDD] rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
                >
                  {status === 'lipsa'
                    ? `Generează (${provider === 'kie' ? kieProfile : 'gemini'})`
                    : `Regenerează (${provider === 'kie' ? kieProfile : 'gemini'})`}
                </button>

                {status === 'generata' && previewUrl && (
                  <button
                    type="button"
                    onClick={() => handleApprove(product)}
                    className="py-1.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Aprobă ✓
                  </button>
                )}

                {(status === 'generata' || status === 'aprobata') && (
                  <button
                    type="button"
                    onClick={() => handleReject(product)}
                    className="py-1.5 px-2.5 bg-[#1F1B18] hover:bg-[#B3202A]/20 text-[#A89B8C] hover:text-[#B3202A] border border-[#2B2521] rounded-lg text-xs transition-colors cursor-pointer"
                    title="Respinge imaginea și marchează ca lipsă"
                  >
                    Respinge
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Preview Mare */}
      {selectedPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedPreview(null)}
        >
          <div
            className="bg-[#171412] border border-[#C9A55C]/40 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#2B2521] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C9A55C]">
                  {selectedPreview.product.category}
                </span>
                <h3 className="font-serif-title text-lg font-bold text-[#F3EBDD]">
                  {selectedPreview.product.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                className="w-8 h-8 rounded-full bg-[#0E0C0A] text-[#A89B8C] hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="aspect-[4/3] bg-[#0E0C0A] flex items-center justify-center">
              <img
                src={selectedPreview.imageUrl}
                alt={selectedPreview.product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4 space-y-3 bg-[#1F1B18]">
              <div>
                <span className="text-[10px] text-[#A89B8C] uppercase font-bold block">
                  Prompt trimis către model:
                </span>
                <p className="text-xs text-[#F3EBDD] font-mono italic mt-0.5">
                  "{cleanPrompt(selectedPreview.product.imagePrompt || '')}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#2B2521]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#A89B8C]">
                    Fișier țintă: <strong>{selectedPreview.product.id}.webp</strong> (1200×900)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#0E0C0A] text-[#25D366] font-mono border border-[#25D366]/30">
                    Sursă: {selectedPreview.source || 'kie'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!selectedPreview.isApproved && (
                    <button
                      type="button"
                      onClick={() => {
                        handleApprove(selectedPreview.product);
                        setSelectedPreview((prev) => (prev ? { ...prev, isApproved: true } : null));
                      }}
                      className="px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Aprobă acum ✓
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleReject(selectedPreview.product);
                      setSelectedPreview(null);
                    }}
                    className="px-3 py-2 bg-[#171412] border border-[#B3202A]/40 text-[#B3202A] hover:bg-[#B3202A]/20 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Respinge
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminImagesPage;
