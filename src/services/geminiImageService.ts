import { GoogleGenAI } from '@google/genai';

/**
 * Generează o imagine folosind EXCLUSIV Gemini API oficial (gemini-3.1-flash-lite-image)
 * Fără niciun fallback procedural sau canvas desenat din cod.
 */
export async function generateProductImageWithGemini(
  prompt: string,
  userApiKey?: string
): Promise<string> {
  // Verifică cheia: din parametru, localStorage sau env
  const apiKey =
    userApiKey?.trim() ||
    (typeof window !== 'undefined' ? localStorage.getItem('carnion_gemini_api_key')?.trim() : null) ||
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() ||
    '';

  if (!apiKey) {
    throw new Error('Lipsește cheia API. Configurează cheia Gemini API pentru a genera imagini.');
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Modelul oficial de generare imagini gemini-3.1-flash-lite-image în format 4:3
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: '4:3',
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        return `data:${mime};base64,${part.inlineData.data}`;
      }
    }

    throw new Error('Generarea a eșuat: Răspunsul primit de la Gemini nu a inclus date de imagine.');
  } catch (err: any) {
    console.warn('Eroare Gemini API la generarea imaginii:', err);
    const rawMsg = err.message || '';
    const status = err.status || err.statusCode || (err.response && err.response.status);
    const isQuota =
      status === 429 ||
      rawMsg.includes('429') ||
      rawMsg.toLowerCase().includes('quota') ||
      rawMsg.toLowerCase().includes('resource_exhausted') ||
      rawMsg.toLowerCase().includes('rate limit');

    if (isQuota) {
      const quotaError: any = new Error('Cota Gemini s-a terminat. Reia mai târziu');
      quotaError.isQuotaExceeded = true;
      quotaError.status = 429;
      throw quotaError;
    }

    // Cerința: Dacă nu există cheie sau cererea eșuează, afișează clar mesajul
    throw new Error(err.message || 'Generarea a eșuat.');
  }
}
