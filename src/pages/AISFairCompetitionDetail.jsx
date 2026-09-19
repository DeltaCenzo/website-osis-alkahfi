import { motion } from 'framer-motion';
import { getCompetitionBySlug } from '../data/aisFairCompetitions.js';

function FactRow({ label, value }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-4 border-b border-[#d8d9dd] py-4 last:border-b-0">
      <dt className="text-xs font-semibold tracking-[0.08em] text-[#777a86]">{label}</dt>
      <dd className="text-sm font-semibold leading-6 text-[#2c2f3d]">{value}</dd>
    </div>
  );
}

export default function AISFairCompetitionDetail({ competitionSlug }) {
  const competition = getCompetitionBySlug(competitionSlug);

  if (!competition) {
    return (
      <main className="ais-page min-h-[70dvh] bg-[#f4f3ec] px-5 py-20 text-[#252735] sm:px-7">
        <section className="mx-auto max-w-3xl border border-[#d7d9df] bg-[#fbfbf7] p-8 sm:p-12">
          <p className="font-mono text-xs font-semibold text-[#777a86]">404 / AIS FAIR 2026</p>
          <h1 className="mt-5 text-5xl font-extrabold leading-none tracking-[-0.055em] text-[#20255c]">Lomba tidak ditemukan.</h1>
          <p className="mt-5 max-w-[52ch] text-base leading-7 text-[#666976]">Cabang lomba yang kamu cari belum tersedia atau tautannya tidak valid. Kembali ke daftar lomba untuk memilih cabang yang aktif.</p>
          <a href="/ais-fair-2026" className="ais-cta ais-cta--navy mt-8">← Kembali ke daftar lomba</a>
        </section>
      </main>
    );
  }

  const guide = competition.technicalGuide;

  return (
    <main className="ais-page bg-[#f4f3ec] pb-20 text-[#252735]">
      <div className="mx-auto max-w-[1180px] px-5 pt-8 sm:px-7 lg:px-10 lg:pt-10">
        <a href="/ais-fair-2026#kompetisi" className="inline-flex items-center gap-2 text-sm font-semibold text-[#555967] underline decoration-[#b9bbc3] underline-offset-4 transition hover:text-[#20255c]">
          <span aria-hidden="true">←</span> Kembali ke daftar lomba
        </a>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: 'easeOut' }}
          className="mt-7 grid overflow-hidden border border-[#cfd1d8] lg:grid-cols-[1.35fr_.65fr]"
        >
          <article className="ais-halftone relative bg-[#20255c] px-6 py-9 text-white sm:px-9 sm:py-11 lg:px-12 lg:py-14">
            <p className="font-mono text-xs font-semibold tracking-[0.08em] text-white/55">AIS FAIR 2026 / {competition.level}</p>
            <h1 className="mt-5 max-w-[12ch] text-5xl font-extrabold leading-[0.93] tracking-[-0.055em] sm:text-6xl">{competition.name}</h1>
            <p className="mt-6 max-w-[58ch] text-base leading-8 text-white/74">{competition.description}</p>

            {competition.theme ? (
              <div className="mt-7 max-w-xl border-l-2 border-[#78da86] pl-4 text-sm leading-6 text-white/80">
                <span className="block text-xs font-semibold tracking-[0.08em] text-[#78da86]">TEMA LOMBA</span>
                <strong className="mt-1 block font-semibold text-white">{competition.theme}</strong>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/68">
              <span>{competition.category}</span>
              <span aria-hidden="true">·</span>
              <span>{competition.peserta}</span>
              <span aria-hidden="true">·</span>
              <span>Status {competition.status}</span>
              {competition.internalOnly ? <><span aria-hidden="true">·</span><strong className="font-semibold text-white">Internal AIS</strong></> : null}
            </div>

            <a href={`/ais-fair-2026/${competition.slug}/register`} className="ais-cta ais-cta--green mt-9">
              Lanjut ke pendaftaran <span aria-hidden="true">→</span>
            </a>
          </article>

          <aside className="bg-[#fbfbf7] px-6 py-7 sm:px-8 lg:py-10" aria-label="Ringkasan lomba">
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-bold tracking-[-0.02em] text-[#20255c]">Ringkasan</h2>
              <span className="font-mono text-[10px] font-semibold text-[#8a8d97]">{competition.slug}</span>
            </div>
            <dl>
              <FactRow label="JENJANG" value={competition.level} />
              <FactRow label="BIDANG" value={competition.category} />
              <FactRow label="FORMAT" value={competition.peserta} />
              <FactRow label="KUOTA" value={competition.quota ? `${competition.quota} peserta` : 'Mengikuti ketentuan panitia'} />
              <FactRow label="DEADLINE" value={competition.deadline} />
              <FactRow label="STATUS" value={competition.status} />
            </dl>
          </aside>
        </motion.section>

        {competition.internalOnly ? (
          <aside className="mt-6 grid gap-2 border-l-4 border-[#20255c] bg-[#ececf2] px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6" aria-label="Keterangan lomba internal">
            <strong className="text-sm font-bold text-[#20255c]">Internal AIS</strong>
            <p className="text-sm leading-7 text-[#5f6270]">Cabang ini hanya dapat diikuti oleh siswa aktif Al-Kahfi Islamic School (AIS). Peserta dari sekolah lain tidak dapat mendaftar.</p>
          </aside>
        ) : null}

        {guide ? (
          <section className="mt-14 border-t border-[#bfc2c9] pt-8">
            <div className="grid gap-5 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <p className="font-mono text-xs font-semibold text-[#777a86]">01 / PETUNJUK TEKNIS</p>
                <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.045em] text-[#20255c] sm:text-5xl">Juknis {competition.shortName}</h2>
              </div>
              <p className="text-sm leading-7 text-[#676a76] lg:col-span-4 lg:text-right">Divisi lomba TK · informasi teknis dari panitia AIS FAIR 2026.</p>
            </div>

            <dl className="mt-8 grid border-y border-[#d1d3d8] md:grid-cols-3 md:divide-x md:divide-[#d1d3d8]">
              <div className="px-0 py-5 md:px-5 md:first:pl-0">
                <dt className="text-[11px] font-semibold tracking-[0.08em] text-[#7a7d87]">TEMPAT</dt>
                <dd className="mt-2 text-base font-semibold text-[#2c2f3d]">{guide.venue}</dd>
              </div>
              <div className="border-t border-[#d1d3d8] px-0 py-5 md:border-t-0 md:px-5">
                <dt className="text-[11px] font-semibold tracking-[0.08em] text-[#7a7d87]">WAKTU</dt>
                <dd className="mt-2 text-base font-semibold text-[#2c2f3d]">{guide.time}</dd>
              </div>
              <div className="border-t border-[#d1d3d8] px-0 py-5 md:border-t-0 md:px-5 md:last:pr-0">
                <dt className="text-[11px] font-semibold tracking-[0.08em] text-[#7a7d87]">PIC</dt>
                <dd className="mt-2 text-sm font-semibold leading-6 text-[#2c2f3d]">{guide.pic.join(' · ')}</dd>
              </div>
            </dl>

            {guide.timeNote ? (
              <p className="mt-4 max-w-[76ch] border-l-2 border-[#c4a95a] pl-4 text-sm leading-7 text-[#666976]"><strong className="font-semibold text-[#404351]">Catatan waktu:</strong> {guide.timeNote}</p>
            ) : null}

            <div className="mt-10 grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <h3 className="text-2xl font-bold tracking-[-0.025em] text-[#20255c]">Teknik perlombaan</h3>
                <ol className="mt-5 divide-y divide-[#d7d9df] border-y border-[#d7d9df]">
                  {guide.technique.map((item, index) => (
                    <li key={item} className="grid grid-cols-[2.7rem_1fr] gap-4 py-4">
                      <span className="font-mono text-xs font-semibold tabular-nums text-[#898b95]">{String(index + 1).padStart(2, '0')}</span>
                      <p className="text-sm leading-7 text-[#5f6270]">{item}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <aside className="lg:col-span-5">
                <h3 className="text-2xl font-bold tracking-[-0.025em] text-[#20255c]">Aspek penilaian</h3>
                <p className="mt-2 text-sm leading-7 text-[#686b76]">Bobot penilaian juri untuk lomba mewarnai pola gambar.</p>
                <div className="mt-5 border-y border-[#d7d9df]">
                  {guide.assessment.map((item) => (
                    <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-5 border-b border-[#d7d9df] py-4 last:border-b-0">
                      <span className="text-sm font-semibold leading-6 text-[#333644]">{item.label}</span>
                      <strong className="font-mono text-sm tabular-nums text-[#20255c]">{item.weight}</strong>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        <section className="mt-14 grid gap-10 border-t border-[#bfc2c9] pt-8 lg:grid-cols-12">
          <article className="lg:col-span-7">
            <p className="font-mono text-xs font-semibold text-[#777a86]">02 / KETENTUAN</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.045em] text-[#20255c]">Ketentuan peserta</h2>
            <ol className="mt-7 divide-y divide-[#d7d9df] border-y border-[#d7d9df]">
              {competition.requirements.map((item, index) => (
                <li key={item} className="grid grid-cols-[2.8rem_1fr] gap-4 py-4">
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#898b95]">{String(index + 1).padStart(2, '0')}</span>
                  <p className="text-sm leading-7 text-[#5f6270]">{item}</p>
                </li>
              ))}
            </ol>
          </article>

          <aside className="lg:col-span-5 lg:pl-4">
            <p className="font-mono text-xs font-semibold text-[#777a86]">03 / CATATAN</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#20255c]">Sebelum mendaftar</h2>
            <div className="mt-7 divide-y divide-[#d7d9df] border-y border-[#d7d9df]">
              <div className="py-5">
                <h3 className="text-sm font-bold text-[#303341]">Form khusus cabang</h3>
                <p className="mt-2 text-sm leading-7 text-[#676a76]">Pilihan lomba akan terkunci otomatis, jadi peserta tidak perlu memilih ulang di formulir.</p>
              </div>
              <div className="py-5">
                <h3 className="text-sm font-bold text-[#303341]">Biaya pendaftaran</h3>
                <p className="mt-2 text-sm leading-7 text-[#676a76]">Pendaftaran AIS FAIR 2026 tidak dikenakan biaya.</p>
              </div>
              <div className="py-5">
                <h3 className="text-sm font-bold text-[#303341]">Pembaruan panitia</h3>
                <p className="mt-2 text-sm leading-7 text-[#676a76]">Kuota, jadwal, dan ketentuan teknis dapat diperbarui. Baca informasi terbaru sebelum mengirim pendaftaran.</p>
              </div>
              <div className="py-5">
                <h3 className="text-sm font-bold text-[#303341]">Lokasi penyelenggara</h3>
                <p className="mt-2 text-sm leading-7 text-[#676a76]">Al-Kahfi Islamic School Batam.</p>
              </div>
            </div>

            <a href={`/ais-fair-2026/${competition.slug}/register`} className="ais-cta ais-cta--navy mt-7 w-full justify-between sm:w-auto">
              Daftar {competition.shortName} <span aria-hidden="true">→</span>
            </a>
          </aside>
        </section>
      </div>
    </main>
  );
}
