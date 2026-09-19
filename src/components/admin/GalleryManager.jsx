import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FolderPlus, ImagePlus, Images, Trash2, X, Star, Loader2 } from 'lucide-react';
import {
  fetchGalleryData,
  requestGalleryCredential,
  upsertAlbum,
  uploadGalleryPhoto,
  deleteGalleryPhoto,
  deleteGalleryPhotos,
  setGalleryCover,
  deleteGalleryAlbum,
  fileToDataUrl,
  sha256Hex,
} from '../../services/api.js';
import { getAdminSessionToken } from '../../lib/adminSession.js';

const MAX_IMAGE_BYTES = 1200 * 1024;
const MAX_DATA_URL = 1800000;

export default function GalleryManager(){
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAlbumId, setActiveAlbumId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef(null);
  const galleryTokenRef = useRef('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchGalleryData();
      if (data && data.ok) {
        setAlbums(Array.isArray(data.albums) ? data.albums : []);
      } else {
        setError(data?.error || 'Gagal memuat galeri.');
      }
    } catch (err) {
      setError(err?.message || 'Tidak dapat memuat galeri.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (activeAlbumId && !albums.some((a) => a.id === activeAlbumId)) {
      setActiveAlbumId(albums[0]?.id || null);
    }
  }, [albums, activeAlbumId]);

  const ensureToken = useCallback(async () => {
    if (galleryTokenRef.current) return galleryTokenRef.current;
    const token = getAdminSessionToken();
    const result = await requestGalleryCredential(token);
    if (result?.success && result?.token) {
      galleryTokenRef.current = result.token;
      return result.token;
    }
    throw new Error(result?.message || 'Gagal mendapatkan kredensial galeri.');
  }, []);

  const runMutation = useCallback(async (fn, successMessage) => {
    setBusy(true);
    setNotice('');
    try {
      const authToken = await ensureToken();
      const result = await fn(authToken);
      if (result && result.ok) {
        setNotice(successMessage);
        await load();
      } else {
        setError(result?.error || result?.message || 'Operasi gagal.');
      }
    } catch (err) {
      setError(err?.message || 'Operasi gagal.');
    } finally {
      setBusy(false);
    }
  }, [ensureToken, load]);

  const activeAlbum = useMemo(
    () => albums.find((a) => a.id === activeAlbumId) || null,
    [albums, activeAlbumId],
  );

  const createAlbum = async () => {
    const title = window.prompt('Nama album baru:');
    if (!title || !title.trim()) return;
    await runMutation(
      (token) => upsertAlbum(token, { title: title.trim() }),
      'Album berhasil dibuat.',
    );
  };

  const renameAlbum = async () => {
    if (!activeAlbum) return;
    const title = window.prompt('Nama album baru:', activeAlbum.title);
    if (!title || !title.trim()) return;
    await runMutation(
      (token) => upsertAlbum(token, { albumId: activeAlbum.id, title: title.trim(), subtitle: activeAlbum.subtitle || '' }),
      'Album diperbarui.',
    );
  };

  const removeAlbum = async () => {
    if (!activeAlbum) return;
    if (!window.confirm(`Hapus album "${activeAlbum.title}" beserta semua fotonya?`)) return;
    await runMutation(
      (token) => deleteGalleryAlbum(token, activeAlbum.id),
      'Album dihapus.',
    );
  };

  const onPickFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || !activeAlbum) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const authToken = await ensureToken();
      let uploaded = 0;
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > MAX_IMAGE_BYTES) {
          setError(`"${file.name}" melebihi 1.2 MB.`);
          continue;
        }
        const dataUrl = await fileToDataUrl(file);
        if (dataUrl.length > MAX_DATA_URL) {
          setError(`"${file.name}" terlalu besar setelah diproses.`);
          continue;
        }
        const sha256 = await sha256Hex(file);
        const result = await uploadGalleryPhoto(authToken, {
          albumId: activeAlbum.id,
          dataUrl,
          name: file.name,
          sha256,
        });
        if (result && result.ok) uploaded++;
        else setError(result?.error || `Gagal mengunggah "${file.name}".`);
      }
      if (uploaded) setNotice(`${uploaded} foto berhasil diunggah.`);
      await load();
    } catch (err) {
      setError(err?.message || 'Gagal mengunggah foto.');
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async (photoId) => {
    if (!activeAlbum) return;
    if (!window.confirm('Hapus foto ini?')) return;
    await runMutation(
      (token) => deleteGalleryPhoto(token, activeAlbum.id, photoId),
      'Foto dihapus.',
    );
  };

  const makeCover = async (photoId) => {
    if (!activeAlbum) return;
    await runMutation(
      (token) => setGalleryCover(token, activeAlbum.id, photoId),
      'Sampul album diperbarui.',
    );
  };

  const removeSelected = async () => {
    if (!activeAlbum) return;
    const selected = Array.from(
      document.querySelectorAll('[data-gallery-photo]:checked'),
    ).map((el) => el.getAttribute('data-gallery-photo'));
    if (!selected.length) return;
    if (!window.confirm(`Hapus ${selected.length} foto terpilih?`)) return;
    await runMutation(
      (token) => deleteGalleryPhotos(token, activeAlbum.id, selected),
      `${selected.length} foto dihapus.`,
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-950 dark:text-white">Manajemen Galeri</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Upload, hapus, dan atur album foto kegiatan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:text-slate-200" onClick={renameAlbum} disabled={!activeAlbum || busy} type="button"><FolderPlus className="h-4 w-4" /> Ganti Nama Album</button>
          <button className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:text-slate-200" onClick={createAlbum} disabled={busy} type="button"><FolderPlus className="h-4 w-4" /> Album Baru</button>
          <button className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-500/20 dark:text-red-300" onClick={removeAlbum} disabled={!activeAlbum || busy} type="button"><Trash2 className="h-4 w-4" /> Hapus Album</button>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300" role="alert">{error}</p>}
      {notice && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" role="status">{notice}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-slate-500 dark:text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Memuat galeri...</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {albums.map((album) => (
              <button
                key={album.id}
                type="button"
                onClick={() => setActiveAlbumId(album.id)}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${activeAlbumId === album.id ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200' : 'border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-300'}`}
              >
                <Images className="h-4 w-4" /> {album.title}
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{album.photos?.length || 0}</span>
              </button>
            ))}
            {!albums.length && <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada album. Buat album baru untuk mulai.</p>}
          </div>

          {activeAlbum && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-700">
                <div>
                  <h4 className="font-black text-slate-950 dark:text-white">{activeAlbum.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activeAlbum.photos?.length || 0} foto</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-50" onClick={() => fileInputRef.current?.click()} disabled={busy} type="button"><ImagePlus className="h-4 w-4" /> Upload Foto</button>
                  <button className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-500/20 dark:text-red-300" onClick={removeSelected} disabled={busy} type="button"><Trash2 className="h-4 w-4" /> Hapus Terpilih</button>
                  <input ref={fileInputRef} accept="image/jpeg,image/png,image/webp" className="sr-only" multiple onChange={onPickFiles} type="file" />
                </div>
              </div>

              {activeAlbum.photos?.length ? (
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
                  {activeAlbum.photos.map((photo) => (
                    <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                      <input className="absolute left-2 top-2 z-10 h-5 w-5 cursor-pointer" data-gallery-photo={photo.id} type="checkbox" aria-label="Pilih foto" />
                      <img src={photo.url} alt={photo.name} loading="lazy" className="aspect-square w-full object-cover" />
                      {activeAlbum.coverPhotoId === photo.id && <span className="absolute right-2 top-2 z-10 rounded-md bg-amber-400/90 p-1 text-amber-900"><Star className="h-3.5 w-3.5" /></span>}
                      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                        <button className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-white/90 text-slate-700 hover:bg-white" onClick={() => makeCover(photo.id)} title="Jadikan sampul" type="button"><Star className="h-4 w-4" /></button>
                        <button className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-white/90 text-red-600 hover:bg-white" onClick={() => removePhoto(photo.id)} title="Hapus foto" type="button"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Album masih kosong. Upload foto pertama.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
