import { useEffect, useMemo, useState } from 'react';
import { Camera, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  DAILY_REPORT_ACCEPTED_IMAGE_TYPES,
  DAILY_REPORT_MAX_PHOTO_BYTES,
  DAILY_REPORT_MAX_PHOTOS,
  DAILY_REPORT_PHOTO_ACCEPT,
  type DailySiteReportPhoto,
} from './types';

interface PendingPhoto {
  file: File;
  description: string;
}

interface DailyReportPhotoUploaderProps {
  photos: DailySiteReportPhoto[];
  editable: boolean;
  saving: boolean;
  onUpload: (files: File[], descriptions: string[]) => Promise<boolean>;
  onDelete: (photoId: string) => void;
}

function photoSource(photo: DailySiteReportPhoto): string | undefined {
  return photo.fileUrl ?? photo.url ?? undefined;
}

export function DailyReportPhotoUploader({
  photos,
  editable,
  saving,
  onUpload,
  onDelete,
}: DailyReportPhotoUploaderProps) {
  const isMobile = useIsMobile();
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const previews = useMemo(
    () => pending.map((item) => ({ ...item, url: URL.createObjectURL(item.file) })),
    [pending],
  );

  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setValidationError(null);
    const available = DAILY_REPORT_MAX_PHOTOS - photos.length - pending.length;
    if (available <= 0) {
      setValidationError(`Bir rapora en fazla ${DAILY_REPORT_MAX_PHOTOS} fotoğraf eklenebilir.`);
      return;
    }

    const incoming = Array.from(fileList);
    const acceptedExtensions = /\.(jpe?g|png|webp|heic|heif)$/i;
    const invalidType = incoming.find((file) => {
      const acceptedMime = DAILY_REPORT_ACCEPTED_IMAGE_TYPES.includes(
        file.type as (typeof DAILY_REPORT_ACCEPTED_IMAGE_TYPES)[number],
      );
      return !acceptedMime && !acceptedExtensions.test(file.name);
    });
    if (invalidType) {
      setValidationError('Yalnızca JPG, PNG, WEBP, HEIC ve HEIF görselleri yüklenebilir.');
      return;
    }
    const oversized = incoming.find((file) => file.size > DAILY_REPORT_MAX_PHOTO_BYTES);
    if (oversized) {
      setValidationError('Her fotoğraf en fazla 8 MB olabilir.');
      return;
    }
    if (incoming.length > available) {
      setValidationError(`En fazla ${available} fotoğraf daha seçebilirsiniz.`);
    }
    setPending((current) => [
      ...current,
      ...incoming.slice(0, available).map((file) => ({ file, description: '' })),
    ]);
  }

  async function handleUpload() {
    const uploaded = await onUpload(
      pending.map((item) => item.file),
      pending.map((item) => item.description.trim()),
    );
    if (uploaded) {
      setPending([]);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">Saha Fotoğrafları</h3>
          <p className="mt-1 text-xs text-slate-500">
            En fazla {DAILY_REPORT_MAX_PHOTOS} görsel, görsel başına 8 MB.
          </p>
        </div>
        <span className="text-sm text-slate-500">
          {photos.length + pending.length}/{DAILY_REPORT_MAX_PHOTOS}
        </span>
      </div>

      {photos.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-slate-200">
              {photoSource(photo) ? (
                <img
                  src={photoSource(photo)}
                  alt={photo.description || photo.fileName || 'Saha fotoğrafı'}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-slate-100 text-xs text-slate-500">
                  Görsel
                </div>
              )}
              {photo.description ? (
                <p className="truncate px-2 py-1 text-xs text-slate-600">{photo.description}</p>
              ) : null}
              {editable ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onDelete(photo.id)}
                  className="absolute right-1 top-1 rounded-md bg-white/90 p-1.5 text-red-600 shadow hover:bg-white disabled:opacity-50"
                  aria-label="Fotoğrafı sil"
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {pending.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {previews.map((item, index) => (
            <div key={`${item.file.name}-${item.file.lastModified}`} className="rounded-lg border border-slate-200 p-2">
              <div className="flex gap-3">
                <img src={item.url} alt="" className="h-20 w-20 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">{item.file.name}</p>
                  <input
                    className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                    value={item.description}
                    maxLength={250}
                    placeholder="Açıklama (opsiyonel)"
                    onChange={(event) => setPending((current) => current.map((photo, photoIndex) =>
                      photoIndex === index ? { ...photo, description: event.target.value } : photo
                    ))}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPending((current) => current.filter((_, photoIndex) => photoIndex !== index))}
                className="mt-2 text-xs font-medium text-red-600"
              >
                Seçimden kaldır
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {validationError ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{validationError}</p>
      ) : null}

      {editable && photos.length + pending.length < DAILY_REPORT_MAX_PHOTOS ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {isMobile ? (
            <>
              <label
                htmlFor="daily-report-camera"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                <Camera size={16} />
                Kamera
              </label>
              <input
                id="daily-report-camera"
                type="file"
                className="sr-only"
                accept={DAILY_REPORT_PHOTO_ACCEPT}
                capture="environment"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = '';
                }}
              />
              <label
                htmlFor="daily-report-gallery"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                <ImagePlus size={16} />
                Galeri
              </label>
              <input
                id="daily-report-gallery"
                type="file"
                multiple
                className="sr-only"
                accept={DAILY_REPORT_PHOTO_ACCEPT}
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = '';
                }}
              />
            </>
          ) : (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
              <ImagePlus size={16} />
              Fotoğraf seç
              <input
                type="file"
                multiple
                className="sr-only"
                accept={DAILY_REPORT_PHOTO_ACCEPT}
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
          )}
        </div>
      ) : null}

      {pending.length > 0 ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleUpload()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
            {pending.length} Fotoğrafı Yükle
          </button>
        </div>
      ) : null}
    </section>
  );
}
