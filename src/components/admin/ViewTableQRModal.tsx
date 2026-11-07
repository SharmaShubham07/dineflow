import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Table, Cafe } from '@/types/cafe';
import { downloadTableQRPNG, getTableQRUrl, generateQRCodeDataUrl } from '@/lib/qr';
import { Download, ExternalLink, RefreshCw, Printer } from 'lucide-react';
import { regenerateTableQRToken } from '@/lib/firestore';
import { toast } from '@/components/ui/ToastStore';

interface ViewTableQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  cafe: Cafe | null;
  onTokenRotated?: (tableId: string, newToken: string) => void;
}

export const ViewTableQRModal: React.FC<ViewTableQRModalProps> = ({
  isOpen,
  onClose,
  table,
  cafe,
  onTokenRotated,
}) => {
  if (!table || !cafe) return null;

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [rotating, setRotating] = useState(false);

  React.useEffect(() => {
    if (table && cafe) {
      const url = getTableQRUrl(cafe.id, table.qrToken);
      generateQRCodeDataUrl(url, { width: 320 }).then(setQrDataUrl);
    }
  }, [table, cafe]);

  const handleRotate = async () => {
    if (!confirm(`Rotate QR token for Table ${table.label}? Old printed QR codes will stop working.`)) return;
    setRotating(true);
    try {
      const newToken = await regenerateTableQRToken(cafe.id, table.id);
      const url = getTableQRUrl(cafe.id, newToken);
      const newImg = await generateQRCodeDataUrl(url, { width: 320 });
      setQrDataUrl(newImg);
      if (onTokenRotated) onTokenRotated(table.id, newToken);
      toast.success(`New QR code generated for Table ${table.label}!`);
    } catch (e) {
      toast.error('Failed to rotate QR token');
    } finally {
      setRotating(false);
    }
  };

  const menuUrl = getTableQRUrl(cafe.id, table.qrToken);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Table ${table.label} — Live QR Code`}
      description={`${cafe.name} · ${table.floorName || 'Dining Area'}`}
      size="sm"
    >
      <div className="space-y-4 text-center">
        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-3xl shadow-md border border-stone-200 inline-block mx-auto">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Table ${table.label}`}
              className="w-56 h-56 object-contain rounded-2xl mx-auto"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-stone-400">
              Generating QR...
            </div>
          )}
          <p className="text-[11px] font-bold text-accent mt-2 uppercase tracking-wider">
            Scan to View Menu & Order
          </p>
        </div>

        <p className="text-xs text-stone-500 font-mono">
          Token: {table.qrToken}
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
          <Button
            size="sm"
            onClick={() => downloadTableQRPNG(cafe, table)}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download PNG
          </Button>

          <a
            href={menuUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 gap-1.5"
          >
            <ExternalLink className="h-4 w-4" /> Open Menu
          </a>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <button
            onClick={() => window.print()}
            className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1"
          >
            <Printer className="h-3.5 w-3.5" /> Print Sheet
          </button>

          <button
            onClick={handleRotate}
            disabled={rotating}
            className="text-rose-500 hover:underline flex items-center gap-1 font-semibold"
          >
            <RefreshCw className={`h-3 w-3 ${rotating ? 'animate-spin' : ''}`} />
            Regenerate QR
          </button>
        </div>
      </div>
    </Modal>
  );
};

