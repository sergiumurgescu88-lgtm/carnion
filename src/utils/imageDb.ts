import { useState, useEffect } from 'react';

const DB_NAME = 'carnion_catalog_images_v1';
const STORE_NAME = 'approved_images';
const DB_VERSION = 1;

export interface StoredImageRecord {
  id: string; // product id (e.g. "ceafa-porc-fara-os")
  dataUrl: string; // base64 or blob URL
  status: 'approved' | 'generated';
  source?: 'gemini' | 'kie' | 'procedural'; // sursa imaginii
  updatedAt: number;
}

/**
 * Deschide baza de date IndexedDB cu tratare a erorilor (try/catch)
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB nu este disponibil în acest mediu.'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Salvează o imagine în IndexedDB marcată cu sursa ei (ex: 'kie' sau 'gemini')
 */
export async function saveApprovedImage(
  id: string,
  dataUrl: string,
  status: 'approved' | 'generated' = 'approved',
  source: 'gemini' | 'kie' | 'procedural' = 'kie'
): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: StoredImageRecord = {
      id,
      dataUrl,
      status,
      source,
      updatedAt: Date.now(),
    };

    store.put(record);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Notifică întreaga aplicație că s-a actualizat o imagine
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('carnion-images-updated', { detail: { id, status, source } })
      );
    }
  } catch (err) {
    console.warn('Eroare la salvarea imaginii în IndexedDB:', err);
  }
}

/**
 * Obține o înregistrare de imagine după ID-ul produsului
 */
export async function getApprovedImage(id: string): Promise<StoredImageRecord | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Eroare la citirea imaginii din IndexedDB:', err);
    return null;
  }
}

/**
 * Obține toate înregistrările brute din baza de date
 */
export async function getAllRawImageRecords(): Promise<StoredImageRecord[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Eroare la citirea înregistrărilor din IndexedDB:', err);
    return [];
  }
}

/**
 * Obține toate imaginile aprobate EXCLUSIV generate de furnizori reali (kie.ai sau Gemini) (map ID -> dataUrl)
 */
export async function getAllApprovedImages(): Promise<Record<string, string>> {
  try {
    const records = await getAllRawImageRecords();
    const map: Record<string, string> = {};
    for (const r of records) {
      // Acceptă exclusiv surse reale autorizate: 'kie' sau 'gemini'
      const isAuthentic = r.source === 'gemini' || r.source === 'kie';
      if (r.status === 'approved' && r.dataUrl && isAuthentic) {
        map[r.id] = r.dataUrl;
      }
    }
    return map;
  } catch (err) {
    console.warn('Eroare la citirea tuturor imaginilor din IndexedDB:', err);
    return {};
  }
}

/**
 * Curăță din IndexedDB toate imaginile procedurale / desenate din cod
 * Returnează numărul de imagini procedurale eliminate
 */
export async function purgeProceduralImages(): Promise<number> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = async () => {
        const records: StoredImageRecord[] = request.result || [];
        let deletedCount = 0;

        for (const r of records) {
          // Detectare imagine procedurală:
          // 1. Marcată explicit ca source === 'procedural'
          // 2. Altceva decât sursele reale 'gemini' sau 'kie'
          // 3. Canvas jpeg procedural fără sursă 'gemini' sau 'kie'
          const isProcedural =
            r.source === 'procedural' ||
            (r.source !== 'gemini' && r.source !== 'kie') ||
            (typeof r.dataUrl === 'string' && r.dataUrl.startsWith('data:image/jpeg') && r.source !== 'gemini' && r.source !== 'kie');

          if (isProcedural) {
            store.delete(r.id);
            deletedCount++;
          }
        }

        tx.oncomplete = () => {
          if (deletedCount > 0 && typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('carnion-images-updated', { detail: { action: 'purged' } })
            );
          }
          resolve(deletedCount);
        };
        tx.onerror = () => resolve(deletedCount);
      };
      request.onerror = () => resolve(0);
    });
  } catch (err) {
    console.warn('Eroare la eliminarea imaginilor procedurale:', err);
    return 0;
  }
}

/**
 * Șterge o imagine aprobată
 */
export async function deleteApprovedImage(id: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('carnion-images-updated', { detail: { id, status: 'deleted' } })
      );
    }
  } catch (err) {
    console.warn('Eroare la ștergerea imaginii din IndexedDB:', err);
  }
}

/**
 * Hook React pentru a avea mereu acces în timp real la imaginile aprobate (doar Gemini)
 */
export function useApprovedImages(): Record<string, string> {
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    const loadImages = async () => {
      const map = await getAllApprovedImages();
      if (isMounted) {
        setImages(map);
      }
    };

    loadImages();

    const handleUpdate = () => {
      loadImages();
    };

    window.addEventListener('carnion-images-updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('carnion-images-updated', handleUpdate);
    };
  }, []);

  return images;
}
