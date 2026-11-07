import QRCode from 'qrcode';
import JSZip from 'jszip';
import { Table, Cafe } from '@/types/cafe';

/**
 * Generate a random, unguessable token for table QR codes.
 */
export function generateUnguessableToken(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const cryptoObj = window.crypto || (window as any).msCrypto;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const randomVals = new Uint8Array(length);
    cryptoObj.getRandomValues(randomVals);
    for (let i = 0; i < length; i++) {
      token += chars[randomVals[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return token;
}

/**
 * Formats the public URL that customers scan to access the table menu.
 */
export function getTableQRUrl(cafeId: string, qrToken: string): string {
  const origin = window.location.origin;
  return `${origin}/m/${cafeId}/${qrToken}`;
}

/**
 * Generates a Data URL (PNG) of the QR code with customizable styling.
 */
export async function generateQRCodeDataUrl(
  url: string,
  options?: { width?: number; margin?: number; darkColor?: string }
): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: options?.width || 512,
    margin: options?.margin || 2,
    color: {
      dark: options?.darkColor || '#1C1917',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Creates a branded printable card image with QR code, Cafe Name, and Table Number.
 */
export async function createBrandedQRCanvas(
  cafe: Cafe,
  table: Table
): Promise<string> {
  const qrUrl = getTableQRUrl(cafe.id, table.qrToken);
  const qrDataUrl = await generateQRCodeDataUrl(qrUrl, { width: 400 });

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(qrDataUrl);

    // Background
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border line
    ctx.strokeStyle = '#EBE7E0';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Accent header ribbon
    ctx.fillStyle = '#C2632A';
    ctx.fillRect(20, 20, canvas.width - 40, 16);

    // Cafe Name
    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 34px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cafe.name, canvas.width / 2, 100);

    // Floor and Table details
    ctx.fillStyle = '#57534E';
    ctx.font = '500 20px Inter, sans-serif';
    const floorText = table.floorName ? `${table.floorName} · ` : '';
    ctx.fillText(`${floorText}Table ${table.label}`, canvas.width / 2, 135);

    // Draw QR Code
    const qrImage = new Image();
    qrImage.onload = () => {
      // White container card for QR
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 20;
      ctx.fillRect(100, 180, 400, 400);
      ctx.shadowBlur = 0;

      ctx.drawImage(qrImage, 120, 200, 360, 360);

      // Call to Action
      ctx.fillStyle = '#C2632A';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText('SCAN TO VIEW MENU & ORDER', canvas.width / 2, 630);

      ctx.fillStyle = '#78716C';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('No app download required · Powered by DineFlow', canvas.width / 2, 665);

      resolve(canvas.toDataURL('image/png'));
    };
    qrImage.src = qrDataUrl;
  });
}

/**
 * Downloads a single table's branded QR code.
 */
export async function downloadTableQRPNG(cafe: Cafe, table: Table) {
  const dataUrl = await createBrandedQRCanvas(cafe, table);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${cafe.name.toLowerCase().replace(/\s+/g, '_')}_table_${table.label}_qr.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads a ZIP file containing all table QR codes for a cafe.
 */
export async function downloadAllTablesQRZip(cafe: Cafe, tables: Table[]) {
  const zip = new JSZip();
  const folder = zip.folder(`${cafe.name.replace(/[^a-zA-Z0-9]/g, '_')}_QR_Codes`);

  for (const table of tables) {
    const dataUrl = await createBrandedQRCanvas(cafe, table);
    // remove base64 header
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    folder?.file(`Table_${table.label}.png`, base64Data, { base64: true });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cafe.name.toLowerCase().replace(/\s+/g, '_')}_all_tables_qr.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

