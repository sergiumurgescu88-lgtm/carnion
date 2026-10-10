import JSZip from 'jszip';

/**
 * Încarcă un URL sau DataUrl într-un element HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Eroare la încărcarea imaginii pentru conversie'));
    img.src = src;
  });
}

/**
 * Convertește o imagine la WebP 1200×900, calitate 0.82, raport 4:3 cu acoperire (crop centrat)
 */
export async function convertToWebp1200x900(imageSrc: string): Promise<Blob> {
  const img = await loadImage(imageSrc);

  const targetWidth = 1200;
  const targetHeight = 900;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Nu s-a putut inițializa contextul 2D Canvas');
  }

  // Calcul raport aspect pentru acoperire (object-fit: cover)
  const sourceRatio = img.width / img.height;
  const targetRatio = targetWidth / targetHeight; // 4:3 = 1.333

  let renderWidth: number;
  let renderHeight: number;
  let offsetX = 0;
  let offsetY = 0;

  if (sourceRatio > targetRatio) {
    // Sursa este mai lată decât 4:3
    renderHeight = targetHeight;
    renderWidth = img.width * (targetHeight / img.height);
    offsetX = (targetWidth - renderWidth) / 2;
  } else {
    // Sursa este mai înaltă decât 4:3
    renderWidth = targetWidth;
    renderHeight = img.height * (targetWidth / img.width);
    offsetY = (targetHeight - renderHeight) / 2;
  }

  // Fundal neutru în caz de margini
  ctx.fillStyle = '#0E0C0A';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Calitate scalare maximă
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Desenare centrată
  ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);

  // Conversie în WebP cu calitatea 0.82 cerută
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Fallback la jpeg dacă browserul nu suportă toBlob WebP
          canvas.toBlob(
            (fallbackBlob) => {
              if (fallbackBlob) resolve(fallbackBlob);
              else reject(new Error('Conversia la Blob a eșuat'));
            },
            'image/jpeg',
            0.82
          );
        }
      },
      'image/webp',
      0.82
    );
  });
}

/**
 * Creează o arhivă ZIP cu toate imaginile aprobate, numite {id}.webp
 * @param approvedImages Record<productId, dataUrl>
 * @param onProgress Callback apelat cu procentul de progres (0-100)
 */
export async function downloadApprovedImagesZip(
  approvedImages: Record<string, string>,
  onProgress?: (percent: number, currentItem: string) => void
): Promise<void> {
  const zip = new JSZip();
  const entries = Object.entries(approvedImages);

  if (entries.length === 0) {
    throw new Error('Nu există imagini aprobate pentru descărcare.');
  }

  let processed = 0;
  for (const [id, dataUrl] of entries) {
    if (onProgress) {
      onProgress(Math.round((processed / entries.length) * 90), id);
    }

    try {
      const webpBlob = await convertToWebp1200x900(dataUrl);
      const fileName = `${id}.webp`;
      zip.file(fileName, webpBlob);
    } catch (err) {
      console.warn(`Nu s-a putut converti imaginea pentru ${id}:`, err);
    }

    processed++;
  }

  if (onProgress) {
    onProgress(95, 'Generare fișier ZIP...');
  }

  // Generare arhivă
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  if (onProgress) {
    onProgress(100, 'Descărcare finalizată!');
  }

  // Declansare descărcare automată în browser
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = `carnion-produse-imagini-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
