import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/ToastStore';
import {
  getCafeById,
  getFloors,
  getTables,
  regenerateTableQRToken,
  updateCafe,
} from '@/lib/firestore';
import {
  downloadTableQRPNG,
  downloadAllTablesQRZip,
  getTableQRUrl,
  generateQRCodeDataUrl,
} from '@/lib/qr';
import { Cafe, Floor, Table } from '@/types/cafe';
import {
  ArrowLeft,
  QrCode,
  Download,
  Printer,
  RefreshCw,
  ExternalLink,
  Phone,
  MapPin,
} from 'lucide-react';

export const CafeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [qrPreviews, setQrPreviews] = useState<Record<string, string>>({});
  const [rotatingTokenId, setRotatingTokenId] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [cafeData, floorsData, tablesData] = await Promise.all([
        getCafeById(id),
        getFloors(id),
        getTables(id),
      ]);
      setCafe(cafeData);
      setFloors(floorsData);
      setTables(tablesData);

      // Pre-generate QR data URLs for previews
      const previews: Record<string, string> = {};
      for (const t of tablesData) {
        const url = getTableQRUrl(id, t.qrToken);
        previews[t.id] = await generateQRCodeDataUrl(url, { width: 160 });
      }
      setQrPreviews(previews);
    } catch (e: any) {
      toast.error('Failed to load cafe details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDownloadAllZip = async () => {
    if (!cafe || tables.length === 0) return;
    toast.info('Generating ZIP archive with all table QR codes...');
    await downloadAllTablesQRZip(cafe, tables);
    toast.success('Downloaded QR ZIP package!');
  };

  const handleRegenerateQR = async (table: Table) => {
    if (!cafe) return;
    if (
      !confirm(
        `Are you sure you want to regenerate the QR for Table ${table.label}? The existing printed QR code will be invalidated immediately!`
      )
    ) {
      return;
    }
    setRotatingTokenId(table.id);
    try {
      const newToken = await regenerateTableQRToken(cafe.id, table.id);
      const url = getTableQRUrl(cafe.id, newToken);
      const newPreview = await generateQRCodeDataUrl(url, { width: 160 });
      setQrPreviews((prev) => ({ ...prev, [table.id]: newPreview }));
      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, qrToken: newToken } : t))
      );
      toast.success(`Rotated QR token for Table ${table.label}`);
    } catch (e) {
      toast.error('Failed to regenerate token');
    } finally {
      setRotatingTokenId(null);
    }
  };

  const handleToggleStatus = async () => {
    if (!cafe) return;
    const newStatus = cafe.status === 'active' ? 'suspended' : 'active';
    await updateCafe(cafe.id, { status: newStatus });
    setCafe({ ...cafe, status: newStatus });
    toast.info(`Cafe status changed to ${newStatus}`);
  };

  const filteredTables =
    selectedFloor === 'all'
      ? tables
      : tables.filter((t) => t.floorId === selectedFloor);

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-500">
        Loading cafe management dashboard...
      </div>
    );
  }

  if (!cafe) {
    return (
      <EmptyState
        title="Cafe Not Found"
        description="The cafe tenant does not exist or has been removed."
        actionLabel="Back to Cafes"
        onAction={() => navigate('/super/cafes')}
      />
    );
  }

  const floorTabs = [
    { id: 'all', label: 'All Tables', count: tables.length },
    ...floors.map((f) => ({
      id: f.id,
      label: f.name,
      count: tables.filter((t) => t.floorId === f.id).length,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/super/cafes')}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Cafes
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant={cafe.status === 'active' ? 'outline' : 'primary'}
            size="sm"
            onClick={handleToggleStatus}
          >
            {cafe.status === 'active' ? 'Suspend Cafe' : 'Activate Cafe'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Print QR Sheets
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadAllZip}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download QR ZIP
          </Button>
        </div>
      </div>

      {/* Cafe Profile Card */}
      <GlassCard variant="raised" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-accent text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-md">
              {cafe.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {cafe.name}
                </h2>
                <Badge variant={cafe.status === 'active' ? 'success' : 'error'}>
                  {cafe.status}
                </Badge>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {cafe.address || 'Address not configured'}
              </p>
              {cafe.phone && (
                <p className="text-xs text-stone-500 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {cafe.phone}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-stone-200/60 dark:border-stone-800 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="block text-[11px] font-medium text-stone-400 uppercase">
                Tax / GST
              </span>
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {cafe.taxPercent}% {cafe.gstNumber ? `(${cafe.gstNumber})` : ''}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-stone-400 uppercase">
                UPI Pay ID
              </span>
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[130px] block">
                {cafe.upiId || 'Not set'}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-stone-400 uppercase">
                Floors / Tables
              </span>
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {floors.length} Floors · {tables.length} Tables
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tables & QR Codes Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Floors & Table QR Codes
            </h3>
            <p className="text-xs text-stone-500">
              Each table has a cryptographically unguessable token mapped to its customer menu.
            </p>
          </div>
        </div>

        <Tabs tabs={floorTabs} activeTab={selectedFloor} onChange={setSelectedFloor} />

        {/* QR Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredTables.map((table) => {
            const qrUrl = getTableQRUrl(cafe.id, table.qrToken);
            const preview = qrPreviews[table.id];

            return (
              <GlassCard
                key={table.id}
                variant="raised"
                className="p-5 flex flex-col justify-between text-center relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                      {table.floorName || 'Floor'}
                    </span>
                    <Badge variant="neutral">Cap: {table.capacity}</Badge>
                  </div>

                  <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-3">
                    Table {table.label}
                  </h4>

                  {/* QR Image Box */}
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-200/80 inline-block mx-auto mb-3">
                    {preview ? (
                      <img
                        src={preview}
                        alt={`QR Code Table ${table.label}`}
                        className="w-36 h-36 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center text-stone-400">
                        <QrCode className="h-10 w-10 animate-pulse" />
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] font-mono text-stone-400 truncate px-2">
                    Token: {table.qrToken}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-center gap-2">
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Open Customer Menu"
                    className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <button
                    onClick={() => downloadTableQRPNG(cafe, table)}
                    title="Download Table QR PNG"
                    className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleRegenerateQR(table)}
                    disabled={rotatingTokenId === table.id}
                    title="Rotate / Invalidate QR Token"
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        rotatingTokenId === table.id ? 'animate-spin text-rose-500' : ''
                      }`}
                    />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CafeDetailPage;
