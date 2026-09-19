import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Images, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchGalleryData } from '../../services/api.js';

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function GallerySection(){
  const [albums, setAlbums] = useState([]);
  const [status, setStatus] = useState('loading');
  const [lightbox, setLightbox] = useState(null);
  const reduced = useReducedMotion();
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const openLightbox = (photo) => {
    restoreFocusRef.current = document.activeElement;
    setLightbox(photo || null);
  };

  const closeLightbox = () => setLightbox(null);

  useEffect(() => {
    let mounted = true;
    fetchGalleryData()
      .then((data) => {
        if (!mounted) return;
        if (data && data.ok) {
          setAlbums(Array.isArray(data.albums) ? data.albums : []);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      })
      .catch(() => mounted && setStatus('error'));
    return () => { mounted = false; };
  }, []);

  const photoCount = albums.reduce((sum, a) => sum + (a.photos?.length || 0), 0);

  const flatPhotos = albums.flatMap((album) => (album.photos || []).map((p) => ({ ...p, albumTitle: album.title })));
  const lightboxIndex = lightbox ? flatPhotos.findIndex((p) => p.id === lightbox.id) : -1;

  const move = (dir) => {
    if (lightboxIndex < 0) return;
    const next = (lightboxIndex + dir + flatPhotos.length) % flatPhotos.length;
    setLightbox(flatPhotos[next]);
  };

  useEffect(() => {
    if (!lightbox) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll('button');
    (focusables?.[0] || dialog)?.focus?.();
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'Tab' && focusables && focusables.length) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = oldOverflow;
      restoreFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [lightbox, lightboxIndex]);

  return (
    <section className="container scroll-mt-24 mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28" id="galeri">
      <motion.div
        className="section-title mx-auto mb-10 max-w-3xl text-center sm:mb-12"
        initial={reduced ? false : reveal.hidden}
        whileInView={reveal.visible}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Galeri Kegiatan</h2>
        <p className="subtitle mt-3 text-slate-600 dark:text-slate-400">Dokumentasi kegiatan, program kerja, dan momen OSIS SMA Al-Kahfi.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <div aria-live="polite" className="gallery-summary inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300" id="gallerySummary">
            <Images className="h-4 w-4" />
            {status === 'loading' ? 'Memuat galeri...' : status === 'error' ? 'Gagal memuat galeri' : `${albums.length} album${photoCount ? ` • ${photoCount} foto` : ''}`}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            <Sparkles className="h-3.5 w-3.5" />
            Klik foto untuk melihat detail.
          </div>
        </div>
      </motion.div>

      <div className="relative">
        {status === 'loading' && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 dark:border-slate-800 dark:bg-slate-900/75">
                <div className="aspect-[4/3] animate-pulse bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2 p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {albums.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {albums.map((album, i) => {
              const cover = album.photos?.find((p) => p.id === album.coverPhotoId) || album.photos?.[0];
              return (
                <motion.article
                  key={album.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur transition duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/75"
                  initial={reduced ? false : reveal.hidden}
                  whileInView={reveal.visible}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                  {cover ? (
                    <button type="button" className="relative block w-full cursor-pointer overflow-hidden" onClick={() => openLightbox(flatPhotos.find((p) => p.id === cover.id))}>
                      <img src={cover.url} alt={album.title} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                      {album.photos?.length > 1 && (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                          <Images className="h-3 w-3" /> {album.photos.length}
                        </span>
                      )}
                    </button>
                  ) : (
                    <div className="grid aspect-[4/3] w-full place-items-center bg-slate-100 text-slate-400 dark:bg-slate-800"><Images className="h-8 w-8" /></div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-black text-slate-950 dark:text-white">{album.title}</h3>
                    {album.subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{album.subtitle}</p>}
                    {album.photos?.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {album.photos.slice(0, 6).map((photo) => (
                          <button key={photo.id} type="button" className="shrink-0 cursor-pointer overflow-hidden rounded-lg transition hover:opacity-80" onClick={() => openLightbox(flatPhotos.find((p) => p.id === photo.id))}>
                            <img src={photo.url} alt={photo.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-14 w-14 object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {status === 'ready' && albums.length === 0 && (
          <p className="py-10 text-center text-slate-500 dark:text-slate-400">Belum ada album foto.</p>
        )}
        {status === 'error' && (
          <p className="py-10 text-center text-slate-500 dark:text-slate-400">Galeri belum dapat dimuat. Coba muat ulang halaman.</p>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[80000] flex items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={lightbox.name || lightbox.albumTitle || 'Pratinjau foto'}
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <button type="button" aria-label="Tutup" className="absolute right-4 top-4 z-10 grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" onClick={closeLightbox}><X className="h-5 w-5" /></button>

            {flatPhotos.length > 1 && (
              <>
                <button type="button" aria-label="Sebelumnya" className="absolute left-2 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-4" onClick={(e) => { e.stopPropagation(); move(-1); }}><ChevronLeft className="h-6 w-6" /></button>
                <button type="button" aria-label="Berikutnya" className="absolute right-2 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-4" onClick={(e) => { e.stopPropagation(); move(1); }}><ChevronRight className="h-6 w-6" /></button>
              </>
            )}

            <motion.figure
              className="flex max-h-[85vh] flex-col items-center"
              key={lightbox.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={lightbox.url} alt={lightbox.name} decoding="async" referrerPolicy="no-referrer" className="max-h-[78vh] max-w-full rounded-2xl object-contain" />
              {lightbox.albumTitle && (
                <figcaption className="mt-3 text-center text-sm font-semibold text-white/80">{lightbox.albumTitle}{lightbox.name ? ` · ${lightbox.name}` : ''}</figcaption>
              )}
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
