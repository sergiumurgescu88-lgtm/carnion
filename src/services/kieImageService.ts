import { convertToWebp1200x900 } from '../utils/imageZip';

/**
 * Serviciu pentru integrarea cu API-ul asincron kie.ai
 * Respectă strict specificațiile:
 * 1. Două profiluri de model:
 *    a) "nano-banana-2" (implicit):
 *       model: "nano-banana-2"
 *       input: { prompt, image_input: [], aspect_ratio: "4:3", resolution: "1K", output_format: "jpg", google_search: false }
 *       (image_input este mereu [], fără image_size, max_images sau nsfw_checker)
 *    b) "seedream":
 *       model: "bytedance/seedream-v4-text-to-image"
 *       input: { prompt, image_size: "landscape_4_3", image_resolution: "1K", max_images: 1, nsfw_checker: true }
 * 2. Fallback la 422: dacă răspunsul are code 422 pentru nano-banana-2, reîncearcă o dată cu aspect_ratio "auto" și resolution "2K"
 *    și memorează varianta care a funcționat.
 * 3. Curățare prompt: elimină spațiile de la capete și orice ghilimele " sau ' de la început și sfârșit.
 * 4. Erori vizibile cu textul real din body.msg și cod, salvare detalii tehnice pentru depanare.
 * 5. Conversie WebP 1200×900 calitate 0.82 decupat 4:3 centrat, stocare în IndexedDB cu source: 'kie'.
 */

export type KieProfile = 'nano-banana-2' | 'seedream';

export interface KieTechDetails {
  endpoint: string;
  sentPayload: any;
  responseStatus: number;
  responseBody: any;
  timestamp: number;
}

export interface KieGenerateOptions {
  prompt: string;
  apiKey: string;
  profile?: KieProfile;
  modelOverride?: string;
  onStatusUpdate?: (statusText: string, credits?: number) => void;
  shouldStop?: () => boolean;
}

export interface KieGenerateResult {
  imageUrl: string; // Data URL WebP 1200x900
  creditsConsumed?: number;
  taskId: string;
  techDetails?: KieTechDetails;
}

export class KieApiError extends Error {
  code?: number;
  isRateLimit?: boolean;
  isAuthError?: boolean;
  isCreditsError?: boolean;
  techDetails?: KieTechDetails;

  constructor(message: string, code?: number, techDetails?: KieTechDetails) {
    super(message);
    this.name = 'KieApiError';
    this.code = code;
    this.techDetails = techDetails;
    this.isRateLimit = code === 429;
    this.isAuthError = code === 401;
    this.isCreditsError =
      code === 402 ||
      message.toLowerCase().includes('credit') ||
      message.toLowerCase().includes('insufficient');
  }
}

// Memorare în memorie / localStorage pentru parametrii funcționali nano-banana-2 după fallback 422
let workingNanoBananaConfig: { aspectRatio: string; resolution: string } = (() => {
  try {
    const saved = localStorage.getItem('carnion_kie_nano_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return { aspectRatio: '4:3', resolution: '1K' };
})();

export function setWorkingNanoBananaConfig(config: { aspectRatio: string; resolution: string }) {
  workingNanoBananaConfig = config;
  try {
    localStorage.setItem('carnion_kie_nano_config', JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function getWorkingNanoBananaConfig() {
  return workingNanoBananaConfig;
}

/**
 * Curăță promptul de spații exterioare și de ghilimele la început și sfârșit (" sau ')
 */
export function cleanPrompt(rawPrompt: string): string {
  if (!rawPrompt) return '';
  let str = rawPrompt.trim();
  let modified = true;
  while (modified) {
    modified = false;
    if (str.startsWith('"') && str.endsWith('"') && str.length >= 2) {
      str = str.slice(1, -1).trim();
      modified = true;
    } else if (str.startsWith("'") && str.endsWith("'") && str.length >= 2) {
      str = str.slice(1, -1).trim();
      modified = true;
    }
  }
  return str;
}

/**
 * Construiește corpul cererii specific profilului și modelului
 */
export function buildKieRequestBody(
  cleanedPrompt: string,
  profile: KieProfile,
  modelOverride?: string,
  nanoConfigOverride?: { aspectRatio: string; resolution: string }
): { model: string; input: Record<string, any> } {
  if (profile === 'seedream') {
    const model = (modelOverride && modelOverride.trim()) || 'bytedance/seedream-v4-text-to-image';
    return {
      model,
      input: {
        prompt: cleanedPrompt,
        image_size: 'landscape_4_3',
        image_resolution: '1K',
        max_images: 1,
        nsfw_checker: true,
      },
    };
  }

  // Profil "nano-banana-2" (implicit)
  const model = (modelOverride && modelOverride.trim()) || 'nano-banana-2';
  const cfg = nanoConfigOverride || workingNanoBananaConfig;
  return {
    model,
    input: {
      prompt: cleanedPrompt,
      image_input: [], // Mereu array gol []
      aspect_ratio: cfg.aspectRatio,
      resolution: cfg.resolution,
      output_format: 'jpg',
      google_search: false,
    },
  };
}

/**
 * Helper intern pentru apeluri API:
 * Folosește proxy-ul Vite /api/kie în dezvoltare pentru a evita CORS,
 * cu fallback direct la https://api.kie.ai
 */
async function fetchKieEndpoint(
  endpoint: string,
  options: RequestInit
): Promise<Response> {
  // 1. Încercare prin proxy-ul local /api/kie
  try {
    const proxyUrl = `/api/kie${endpoint}`;
    const proxyRes = await fetch(proxyUrl, options);
    if (proxyRes.status !== 404 && proxyRes.status !== 502 && proxyRes.status !== 504) {
      return proxyRes;
    }
  } catch {
    // Eșec de rețea proxy, trecem la apel direct
  }

  // 2. Fallback apel direct la https://api.kie.ai
  const directUrl = `https://api.kie.ai${endpoint}`;
  return fetch(directUrl, options);
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convertește un Blob de tip WebP la DataURL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Conversia la Data URL a eșuat'));
      }
    };
    reader.onerror = () => reject(new Error('Eroare la citirea Blob-ului'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Descarcă imaginea de la URL, decupează 4:3 centrat și convertește la WebP 1200x900 (calitate 0.82)
 * Salvează direct ca DataURL WebP compatibil IndexedDB.
 */
async function processAndConvertKieImage(imageUrl: string): Promise<string> {
  try {
    // Convertim folosind utilitarul convertToWebp1200x900
    const webpBlob = await convertToWebp1200x900(imageUrl);
    return await blobToDataUrl(webpBlob);
  } catch (convErr) {
    // Dacă browserul blochează canvas din motive de CORS pentru URL-ul CDN,
    // încercăm fetch cu blob direct
    try {
      const res = await fetch(imageUrl, { mode: 'cors' });
      if (res.ok) {
        const directBlob = await res.blob();
        const objUrl = URL.createObjectURL(directBlob);
        try {
          const webpBlob = await convertToWebp1200x900(objUrl);
          URL.revokeObjectURL(objUrl);
          return await blobToDataUrl(webpBlob);
        } catch {
          URL.revokeObjectURL(objUrl);
          return await blobToDataUrl(directBlob);
        }
      }
    } catch {
      // Fallback
    }
    return imageUrl;
  }
}

/**
 * Pasul 1: Crearea task-ului asincron pe kie.ai
 * POST https://api.kie.ai/api/v1/jobs/createTask
 * Include fallback automat la 422 conform cerinței.
 */
async function createTask(
  rawPrompt: string,
  apiKey: string,
  profile: KieProfile,
  modelOverride?: string,
  isRateRetry = false
): Promise<{ taskId: string; techDetails: KieTechDetails }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new KieApiError('Lipsește cheia API / generarea a eșuat', 401);
  }

  const cleanedPrompt = cleanPrompt(rawPrompt);

  // Funcție internă de lansare request
  const doCreateCall = async (
    payload: any
  ): Promise<{ res: Response; body: any; techDetails: KieTechDetails }> => {
    let res: Response;
    try {
      res = await fetchKieEndpoint('/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (netErr: any) {
      throw new KieApiError(`Eroare de rețea către kie.ai: ${netErr.message || 'Eșec conexiune'}`);
    }

    let body: any = null;
    try {
      body = await res.json();
    } catch {
      throw new KieApiError(`Răspuns invalid de la kie.ai (HTTP ${res.status})`, res.status);
    }

    const techDetails: KieTechDetails = {
      endpoint: 'POST /api/v1/jobs/createTask',
      sentPayload: payload,
      responseStatus: res.status,
      responseBody: body,
      timestamp: Date.now(),
    };

    return { res, body, techDetails };
  };

  // 1. Prima încercare cu configurația curentă
  const firstPayload = buildKieRequestBody(cleanedPrompt, profile, modelOverride);
  const firstAttempt = await doCreateCall(firstPayload);
  const firstBody = firstAttempt.body;
  const firstCode = typeof firstBody?.code === 'number' ? firstBody.code : firstAttempt.res.status;

  // FALLBACK LA 422:
  // Dacă răspunsul are code 422 pentru profilul nano-banana-2, reîncearcă O DATĂ cu aspect_ratio "auto" și resolution "2K"
  if (firstCode === 422 && profile === 'nano-banana-2') {
    const fallbackConfig = { aspectRatio: 'auto', resolution: '2K' };
    const secondPayload = buildKieRequestBody(cleanedPrompt, profile, modelOverride, fallbackConfig);
    const secondAttempt = await doCreateCall(secondPayload);
    const secondBody = secondAttempt.body;
    const secondCode = typeof secondBody?.code === 'number' ? secondBody.code : secondAttempt.res.status;

    if (secondCode === 200 || secondCode === 0) {
      // Succes pe fallback! Memorează varianta care a mers
      setWorkingNanoBananaConfig(fallbackConfig);
      const taskId = secondBody?.data?.taskId;
      if (taskId) {
        return { taskId, techDetails: secondAttempt.techDetails };
      }
    }

    // Dacă și a doua încercare dă 422 (sau altă eroare), oprește și afișează mesajul exact primit de la API
    const exactMsg = secondBody?.msg || firstBody?.msg || 'Parametri invalizi pentru modelul kie.ai';
    throw new KieApiError(`${exactMsg} (cod ${secondCode})`, secondCode, secondAttempt.techDetails);
  }

  // Verificare erori generale la prima încercare
  if (firstCode === 401 || firstAttempt.res.status === 401) {
    throw new KieApiError('Cheie kie.ai invalidă (cod 401)', 401, firstAttempt.techDetails);
  }

  if (firstCode === 402 || (firstBody?.msg && /credit/i.test(firstBody.msg))) {
    throw new KieApiError('Credite kie.ai insuficiente. Reîncarcă contul', 402, firstAttempt.techDetails);
  }

  if (firstCode === 429 || firstAttempt.res.status === 429) {
    if (!isRateRetry) {
      // Regula: oprește, așteaptă 10 secunde, reia o dată
      await waitMs(10000);
      return createTask(rawPrompt, apiKey, profile, modelOverride, true);
    }
    throw new KieApiError('Limită de rată kie.ai (429). Reia mai târziu', 429, firstAttempt.techDetails);
  }

  if (firstCode === 422) {
    const exactMsg = firstBody?.msg || 'Parametri invalizi pentru modelul kie.ai';
    throw new KieApiError(`${exactMsg} (cod 422)`, 422, firstAttempt.techDetails);
  }

  if (firstCode !== 200 && firstCode !== 0) {
    const exactMsg = firstBody?.msg || `Eroare kie.ai (cod ${firstCode})`;
    throw new KieApiError(`${exactMsg} (cod ${firstCode})`, firstCode, firstAttempt.techDetails);
  }

  const taskId = firstBody?.data?.taskId;
  if (!taskId) {
    throw new KieApiError(firstBody?.msg || 'Nu s-a primit niciun taskId de la kie.ai', undefined, firstAttempt.techDetails);
  }

  // Dacă prima încercare a reușit pe nano-banana-2 cu config-ul curent, confirmăm memorarea
  if (profile === 'nano-banana-2') {
    setWorkingNanoBananaConfig(workingNanoBananaConfig);
  }

  return { taskId, techDetails: firstAttempt.techDetails };
}

/**
 * Pasul 2: Verificare periodică a statusului (polling la 4 secunde)
 * GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=<taskId>
 */
async function pollTaskResult(
  taskId: string,
  apiKey: string,
  lastTechDetails?: KieTechDetails,
  onStatusUpdate?: (statusText: string, credits?: number) => void,
  shouldStop?: () => boolean
): Promise<{ imageUrl: string; creditsConsumed?: number; techDetails?: KieTechDetails }> {
  const cleanKey = apiKey.trim();
  const maxAttempts = 75; // 75 verificări * 4s = 300s = 5 minute timeout
  let attempts = 0;
  let hasRetriedRateLimit = false;
  let currentTechDetails = lastTechDetails;

  while (attempts < maxAttempts) {
    if (shouldStop && shouldStop()) {
      throw new Error('Generarea a fost oprită manual de către utilizator.');
    }

    attempts++;

    let res: Response;
    try {
      res = await fetchKieEndpoint(
        `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${cleanKey}`,
          },
        }
      );
    } catch {
      await waitMs(4000);
      continue;
    }

    let body: any = null;
    try {
      body = await res.json();
    } catch {
      await waitMs(4000);
      continue;
    }

    currentTechDetails = {
      endpoint: `GET /api/v1/jobs/recordInfo?taskId=${taskId}`,
      sentPayload: { taskId },
      responseStatus: res.status,
      responseBody: body,
      timestamp: Date.now(),
    };

    const code = typeof body?.code === 'number' ? body.code : res.status;

    if (code === 401 || res.status === 401) {
      throw new KieApiError('Cheie kie.ai invalidă (cod 401)', 401, currentTechDetails);
    }

    if (code === 402 || (body?.msg && /credit/i.test(body.msg))) {
      throw new KieApiError('Credite kie.ai insuficiente. Reîncarcă contul', 402, currentTechDetails);
    }

    if (code === 429 || res.status === 429) {
      if (!hasRetriedRateLimit) {
        hasRetriedRateLimit = true;
        await waitMs(10000);
        continue;
      }
      throw new KieApiError('Limită de rată kie.ai (429). Reia mai târziu', 429, currentTechDetails);
    }

    if (code === 422) {
      const exactMsg = body?.msg || 'Task ID kie.ai invalid';
      throw new KieApiError(`${exactMsg} (cod 422)`, 422, currentTechDetails);
    }

    if (code !== 200 && code !== 0) {
      const exactMsg = body?.msg || `Eroare verificare status kie.ai (${code})`;
      throw new KieApiError(`${exactMsg} (cod ${code})`, code, currentTechDetails);
    }

    const data = body?.data || {};
    const state = data?.state;
    const credits = data?.creditsConsumed;

    if (onStatusUpdate) {
      let stateLabel = 'Se procesează...';
      if (state === 'waiting') stateLabel = 'În așteptare (waiting)...';
      else if (state === 'queuing') stateLabel = 'În coadă pe server (queuing)...';
      else if (state === 'generating') stateLabel = 'Se generează fotografia (generating)...';
      onStatusUpdate(stateLabel, credits);
    }

    if (state === 'fail') {
      const failMsg = data?.failMsg || 'Generarea pe kie.ai a eșuat';
      throw new KieApiError(failMsg, undefined, currentTechDetails);
    }

    if (state === 'success') {
      let resultObj: any = null;
      if (typeof data?.resultJson === 'string') {
        try {
          resultObj = JSON.parse(data.resultJson);
        } catch {
          resultObj = null;
        }
      } else if (typeof data?.resultJson === 'object') {
        resultObj = data.resultJson;
      }

      // Imaginea vine ca jpg în resultUrls[0] (din data.resultJson după JSON.parse)
      const rawImageUrl =
        resultObj?.resultUrls?.[0] ||
        resultObj?.images?.[0] ||
        (Array.isArray(data?.resultUrls) ? data.resultUrls[0] : null);

      if (!rawImageUrl) {
        throw new KieApiError(
          'Răspunsul primit de la kie.ai nu conține URL-ul imaginii în resultUrls[0].',
          undefined,
          currentTechDetails
        );
      }

      return {
        imageUrl: rawImageUrl,
        creditsConsumed: credits,
        techDetails: currentTechDetails,
      };
    }

    await waitMs(4000);
  }

  throw new KieApiError('Timp de așteptare depășit (timeout 5 minute) pe kie.ai', undefined, currentTechDetails);
}

/**
 * Funcția principală de generare:
 * - Curăță promptul
 * - Creează task-ul cu corpul specific profilului
 * - Fallback la 422 dacă este cazul
 * - Așteaptă rezultatul prin polling
 * - Convertește imaginea la WebP 1200x900 (calitate 0.82, raport 4:3 centrat)
 */
export async function generateProductImageWithKie(
  options: KieGenerateOptions
): Promise<KieGenerateResult> {
  const {
    prompt,
    apiKey,
    profile = 'nano-banana-2',
    modelOverride,
    onStatusUpdate,
    shouldStop,
  } = options;

  if (onStatusUpdate) {
    onStatusUpdate(`Se inițiază sarcina pe kie.ai (${profile})...`);
  }

  const { taskId, techDetails: createTech } = await createTask(
    prompt,
    apiKey,
    profile,
    modelOverride
  );

  if (onStatusUpdate) {
    onStatusUpdate('Sarcină preluată, se așteaptă generarea...');
  }

  const result = await pollTaskResult(taskId, apiKey, createTech, onStatusUpdate, shouldStop);

  if (onStatusUpdate) {
    onStatusUpdate('Fotografie descărcată, conversie WebP 1200×900...');
  }

  // Decupare centrală 4:3 la 1200×900 WebP calitate 0.82
  const finalWebpUrl = await processAndConvertKieImage(result.imageUrl);

  return {
    imageUrl: finalWebpUrl,
    creditsConsumed: result.creditsConsumed,
    taskId,
    techDetails: result.techDetails || createTech,
  };
}
