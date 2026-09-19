import { useEffect, useMemo, useState } from 'react';
import { aisFairCompetitions, getCompetitionBySlug, schoolsByNpsn } from '../data/aisFairCompetitions.js';

const classOptionsByLevel = {
  TK: ['TK A', 'TK B'],
  SD: ['SD Kelas 1', 'SD Kelas 2', 'SD Kelas 3', 'SD Kelas 4', 'SD Kelas 5', 'SD Kelas 6'],
  SMP: ['SMP Kelas 7', 'SMP Kelas 8', 'SMP Kelas 9'],
  SMA: ['SMA Kelas 10', 'SMA Kelas 11', 'SMA Kelas 12'],
};

const emptyParticipant = () => ({
  fullName: '',
  age: '',
  grade: '',
  whatsapp: '',
  email: '',
  nisn: '',
  photoName: '',
});

const initialSchool = {
  npsn: '',
  schoolName: '',
  schoolCity: '',
  schoolProvince: '',
};

const internalSchool = {
  npsn: '',
  schoolName: 'Al-Kahfi Islamic School (AIS)',
  schoolCity: 'Batam',
  schoolProvince: 'Kepulauan Riau',
};

function Field({ id, label, hint, optional = false, children }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-[#363947]">
        {label}{optional ? <span className="ml-2 font-normal text-[#858893]">opsional</span> : null}
      </label>
      {children}
      {hint ? <p className="max-w-[58ch] text-xs leading-5 text-[#7b7e89]">{hint}</p> : null}
    </div>
  );
}

function ParticipantFields({ participant, index, total, level, allowedGrades, onChange }) {
  const isLeader = index === 0;
  const contactRequired = total === 1 || isLeader;
  const classOptions = allowedGrades?.length ? allowedGrades : (classOptionsByLevel[level] || Object.values(classOptionsByLevel).flat());
  const prefix = `participant-${index}`;

  return (
    <section className="grid gap-6 border-t border-[#d7d9df] py-7 first:border-t-0 first:pt-0 md:grid-cols-[8rem_1fr] md:gap-8">
      <header>
        <span className="font-mono text-xs font-semibold tabular-nums text-[#8a8d97]">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="mt-2 text-lg font-bold leading-6 text-[#20255c]">
          {total === 1 ? 'Peserta' : isLeader ? 'Ketua tim' : `Anggota ${index + 1}`}
        </h3>
        {total > 1 ? <p className="mt-2 text-xs leading-5 text-[#777a86]">Anggota {index + 1} dari {total}</p> : null}
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <Field id={`${prefix}-name`} label="Nama lengkap">
          <input id={`${prefix}-name`} value={participant.fullName} onChange={(e) => onChange('fullName', e.target.value)} className="ais-field-input" placeholder="Nama sesuai identitas" autoComplete="name" required />
        </Field>

        {level === 'TK' ? (
          <Field id={`${prefix}-age`} label="Usia peserta" hint="Sesuai juknis TK, peserta berusia 4–6 tahun.">
            <input id={`${prefix}-age`} type="number" min="4" max="6" value={participant.age} onChange={(e) => onChange('age', e.target.value)} className="ais-field-input" placeholder="4–6 tahun" required />
          </Field>
        ) : null}

        <Field id={`${prefix}-grade`} label="Jenjang / kelas">
          <select id={`${prefix}-grade`} value={participant.grade} onChange={(e) => onChange('grade', e.target.value)} className="ais-field-input" required>
            <option value="">Pilih jenjang / kelas</option>
            {classOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </Field>

        <Field id={`${prefix}-nisn`} label="NISN">
          <input id={`${prefix}-nisn`} value={participant.nisn} onChange={(e) => onChange('nisn', e.target.value)} className="ais-field-input" placeholder="Masukkan NISN" inputMode="numeric" required />
        </Field>

        <Field id={`${prefix}-wa`} label="Nomor WhatsApp aktif" optional={!contactRequired} hint={total > 1 && isLeader ? 'Nomor ketua tim menjadi kontak utama panitia.' : undefined}>
          <input id={`${prefix}-wa`} value={participant.whatsapp} onChange={(e) => onChange('whatsapp', e.target.value)} className="ais-field-input" placeholder="08xxxxxxxxxx" inputMode="tel" autoComplete="tel" required={contactRequired} />
        </Field>

        <Field id={`${prefix}-email`} label="Alamat email aktif" optional={!contactRequired}>
          <input id={`${prefix}-email`} type="email" value={participant.email} onChange={(e) => onChange('email', e.target.value)} className="ais-field-input" placeholder="nama@email.com" autoComplete="email" required={contactRequired} />
        </Field>

        <Field id={`${prefix}-photo`} label="Pas foto resmi" hint="Format JPG/PNG. Pada versi UI ini nama file disimpan lokal dan belum dikirim ke server.">
          <label htmlFor={`${prefix}-photo`} className="ais-file-input">
            <span className="font-semibold text-[#20255c]">Pilih file</span>
            <span className="min-w-0 flex-1 truncate text-right text-[#777a86]">{participant.photoName || 'Belum ada file'}</span>
          </label>
          <input id={`${prefix}-photo`} type="file" accept="image/*" className="sr-only" onChange={(e) => onChange('photoName', e.target.files?.[0]?.name || '')} required />
        </Field>
      </div>
    </section>
  );
}

export default function AISFairRegister({ competitionSlug = '' }) {
  const fixedCompetition = useMemo(() => getCompetitionBySlug(competitionSlug), [competitionSlug]);
  const [chosenSlug, setChosenSlug] = useState(competitionSlug || '');
  const activeCompetition = fixedCompetition || getCompetitionBySlug(chosenSlug);
  const memberCount = Math.max(1, Number(activeCompetition?.registration?.memberCount || 1));
  const isTeam = memberCount > 1;

  const [participants, setParticipants] = useState(() => Array.from({ length: memberCount }, emptyParticipant));
  const [teamName, setTeamName] = useState('');
  const [school, setSchool] = useState(initialSchool);
  const [lookupState, setLookupState] = useState({ status: 'idle', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (competitionSlug) setChosenSlug(competitionSlug);
  }, [competitionSlug]);

  useEffect(() => {
    setParticipants((current) => Array.from({ length: memberCount }, (_, index) => current[index] || emptyParticipant()));
    setTeamName('');
    setSubmitted(false);
  }, [memberCount, activeCompetition?.slug]);

  useEffect(() => {
    if (!activeCompetition) return;
    setSchool(activeCompetition.internalOnly ? internalSchool : initialSchool);
    setLookupState({ status: 'idle', message: '' });
  }, [activeCompetition?.slug, activeCompetition?.internalOnly]);

  const updateParticipant = (index, key, value) => {
    setParticipants((current) => current.map((participant, participantIndex) => (
      participantIndex === index ? { ...participant, [key]: value } : participant
    )));
  };

  const updateSchool = (key, value) => setSchool((current) => ({ ...current, [key]: value }));

  const handleLookup = () => {
    const clean = school.npsn.trim();
    if (!clean) {
      setLookupState({ status: 'error', message: 'Masukkan NPSN terlebih dahulu.' });
      return;
    }
    const found = schoolsByNpsn[clean];
    if (!found) {
      setLookupState({ status: 'error', message: 'NPSN belum ditemukan pada simulasi ini. Data sekolah tetap bisa diisi manual.' });
      return;
    }
    setSchool((current) => ({
      ...current,
      schoolName: found.schoolName,
      schoolCity: found.city,
      schoolProvince: found.province,
    }));
    setLookupState({ status: 'success', message: 'Data sekolah ditemukan. Periksa kembali sebelum mengirim formulir.' });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!activeCompetition) return;

    const payload = {
      competitionSlug: activeCompetition.slug,
      competition: activeCompetition.name,
      registrationType: isTeam ? 'team' : 'individual',
      teamName: isTeam ? teamName : '',
      participants,
      school,
      submittedAt: new Date().toISOString(),
    };

    const counterKey = `aisfair_${activeCompetition.slug}_registered`;
    const current = Number(localStorage.getItem(counterKey) || 0);
    localStorage.setItem(counterKey, String(current + 1));

    const submissionKey = `aisfair_${activeCompetition.slug}_submissions`;
    try {
      const existing = JSON.parse(localStorage.getItem(submissionKey) || '[]');
      localStorage.setItem(submissionKey, JSON.stringify([...existing, payload]));
    } catch {
      localStorage.setItem(submissionKey, JSON.stringify([payload]));
    }

    setSubmitted(true);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const backHref = activeCompetition ? `/ais-fair-2026/${activeCompetition.slug}` : '/ais-fair-2026';

  return (
    <main className="ais-page min-h-screen bg-[#f4f3ec] pb-20 text-[#252735]">
      <section className="ais-halftone bg-[#20255c] text-white">
        <div className="mx-auto max-w-[1040px] px-5 py-10 sm:px-7 sm:py-12 lg:px-10">
          <a href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 underline decoration-white/25 underline-offset-4 transition hover:text-white">
            <span aria-hidden="true">←</span> Kembali
          </a>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-xs font-semibold tracking-[0.08em] text-[#78da86]">FORM PENDAFTARAN / AIS FAIR 2026</p>
              <h1 className="mt-4 max-w-[15ch] text-5xl font-extrabold leading-[0.93] tracking-[-0.055em] sm:text-6xl">
                {activeCompetition ? `Daftar ${activeCompetition.shortName}` : 'Pendaftaran AIS FAIR 2026'}
              </h1>
            </div>
            {activeCompetition ? (
              <dl className="grid min-w-[14rem] grid-cols-2 gap-x-5 gap-y-3 border-t border-white/20 pt-4 text-sm lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <div><dt className="text-xs text-white/45">Jenjang</dt><dd className="mt-1 font-semibold">{activeCompetition.level}</dd></div>
                <div><dt className="text-xs text-white/45">Format</dt><dd className="mt-1 font-semibold">{activeCompetition.peserta}</dd></div>
              </dl>
            ) : null}
          </div>
          <p className="mt-6 max-w-[64ch] text-sm leading-7 text-white/68">
            {activeCompetition
              ? activeCompetition.internalOnly
                ? `Cabang internal AIS. Form hanya menerima pendaftaran siswa aktif Al-Kahfi Islamic School.${isTeam ? ` Satu tim berisi ${memberCount} orang.` : ''}`
                : isTeam
                  ? `Satu formulir untuk satu tim berisi ${memberCount} orang. Isi data seluruh anggota dan gunakan kontak ketua tim sebagai kontak utama.`
                  : 'Form ini khusus untuk satu peserta. Isi data diri dan data sekolah dengan lengkap.'
              : 'Pilih cabang lomba terlebih dahulu. Isian peserta akan menyesuaikan otomatis dengan format lomba.'}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1040px] px-5 pt-9 sm:px-7 lg:px-10">
        {submitted && activeCompetition ? (
          <section className="border border-[#cfd1d8] bg-[#fbfbf7] p-7 sm:p-10" aria-live="polite">
            <p className="font-mono text-xs font-semibold text-[#777a86]">PENDAFTARAN TERSIMPAN</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.045em] text-[#20255c]">Data sudah dicatat di perangkat ini.</h2>
            <p className="mt-4 max-w-[62ch] text-sm leading-7 text-[#646773]">
              Pendaftaran untuk <strong className="font-semibold text-[#303341]">{activeCompetition.name}</strong> berhasil disimpan pada penyimpanan lokal browser. Versi ini masih berupa antarmuka dan belum mengirim data ke server panitia.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <a href={`/ais-fair-2026/${activeCompetition.slug}`} className="ais-cta ais-cta--navy">Kembali ke detail lomba</a>
              <button type="button" onClick={() => setSubmitted(false)} className="ais-text-button">Periksa formulir lagi</button>
            </div>
          </section>
        ) : (
          <>
            {!fixedCompetition ? (
              <section className="border-b border-[#c9cbd1] pb-8">
                <p className="font-mono text-xs font-semibold text-[#777a86]">00 / CABANG LOMBA</p>
                <div className="mt-4 max-w-2xl">
                  <Field id="competition" label="Pilih cabang lomba" hint="Setelah dipilih, format formulir akan menyesuaikan dengan lomba tersebut.">
                    <select id="competition" value={chosenSlug} onChange={(e) => setChosenSlug(e.target.value)} className="ais-field-input" required>
                      <option value="">Pilih cabang lomba</option>
                      {aisFairCompetitions.map((item) => (
                        <option key={item.slug} value={item.slug}>{item.level} · {item.name} · {item.peserta}{item.internalOnly ? ' · Internal AIS' : ''}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </section>
            ) : null}

            {activeCompetition?.internalOnly ? (
              <aside className="mt-7 grid gap-2 border-l-4 border-[#20255c] bg-[#ececf2] px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <strong className="text-sm font-bold text-[#20255c]">Internal AIS</strong>
                <p className="text-sm leading-7 text-[#5f6270]">Sekolah asal dikunci menjadi Al-Kahfi Islamic School agar form cabang internal hanya digunakan oleh siswa AIS.</p>
              </aside>
            ) : null}

            {activeCompetition ? (
              <form onSubmit={handleSubmit} className="mt-8 border border-[#cfd1d8] bg-[#fbfbf7]">
                <section className="px-5 py-7 sm:px-8 sm:py-9">
                  <div className="grid gap-4 border-b border-[#cfd1d8] pb-6 md:grid-cols-[8rem_1fr] md:gap-8">
                    <p className="font-mono text-xs font-semibold text-[#777a86]">01 / PESERTA</p>
                    <div>
                      <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-[#20255c]">{isTeam ? 'Data tim' : 'Data peserta'}</h2>
                      <p className="mt-2 max-w-[62ch] text-sm leading-7 text-[#676a76]">Cabang terkunci: <strong className="font-semibold text-[#333644]">{activeCompetition.level} · {activeCompetition.name}</strong>.</p>
                    </div>
                  </div>

                  {isTeam ? (
                    <div className="grid gap-4 border-b border-[#d7d9df] py-7 md:grid-cols-[8rem_1fr] md:gap-8">
                      <div>
                        <span className="font-mono text-xs font-semibold text-[#8a8d97]">TIM</span>
                        <h3 className="mt-2 text-lg font-bold text-[#20255c]">Identitas tim</h3>
                      </div>
                      <div className="max-w-xl">
                        <Field id="team-name" label="Nama tim" hint="Nama ini akan digunakan pada daftar peserta dan bagan lomba.">
                          <input id="team-name" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="ais-field-input" placeholder="Contoh: Al-Kahfi Team A" required />
                        </Field>
                      </div>
                    </div>
                  ) : null}

                  <div className="pt-7">
                    {participants.map((participant, index) => (
                      <ParticipantFields
                        key={`${activeCompetition.slug}-${index}`}
                        participant={participant}
                        index={index}
                        total={memberCount}
                        level={activeCompetition.level}
                        allowedGrades={activeCompetition.allowedGrades}
                        onChange={(key, value) => updateParticipant(index, key, value)}
                      />
                    ))}
                  </div>
                </section>

                <section className="border-t border-[#cfd1d8] px-5 py-7 sm:px-8 sm:py-9">
                  <div className="grid gap-4 border-b border-[#cfd1d8] pb-6 md:grid-cols-[8rem_1fr] md:gap-8">
                    <p className="font-mono text-xs font-semibold text-[#777a86]">02 / SEKOLAH</p>
                    <div>
                      <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-[#20255c]">Data sekolah asal</h2>
                      <p className="mt-2 max-w-[62ch] text-sm leading-7 text-[#676a76]">
                        {activeCompetition.internalOnly ? 'Cabang internal menggunakan data Al-Kahfi Islamic School.' : 'Data sekolah cukup diisi satu kali untuk pendaftaran ini.'}
                      </p>
                    </div>
                  </div>

                  {activeCompetition.internalOnly ? (
                    <div className="mt-7 grid gap-5 lg:grid-cols-3">
                      <Field id="school-name" label="Nama sekolah"><input id="school-name" value={school.schoolName} readOnly className="ais-field-input ais-field-input--readonly" /></Field>
                      <Field id="school-city" label="Kota"><input id="school-city" value={school.schoolCity} readOnly className="ais-field-input ais-field-input--readonly" /></Field>
                      <Field id="school-province" label="Provinsi"><input id="school-province" value={school.schoolProvince} readOnly className="ais-field-input ais-field-input--readonly" /></Field>
                    </div>
                  ) : (
                    <div className="mt-7 grid gap-5 lg:grid-cols-2">
                      <div className="lg:col-span-2">
                        <Field id="npsn" label="NPSN" hint="Contoh simulasi UI: 11000111, 11000112, 69728123, 11022334.">
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <input id="npsn" value={school.npsn} onChange={(e) => updateSchool('npsn', e.target.value)} className="ais-field-input flex-1" placeholder="Masukkan NPSN sekolah" inputMode="numeric" required />
                            <button type="button" onClick={handleLookup} className="ais-secondary-button">Cari sekolah</button>
                          </div>
                        </Field>
                        {lookupState.message ? (
                          <p className={`mt-3 border-l-2 pl-3 text-sm leading-6 ${lookupState.status === 'success' ? 'border-[#5eaa68] text-[#446c4a]' : 'border-[#b35c5c] text-[#8b4444]'}`} role="status">
                            {lookupState.message}
                          </p>
                        ) : null}
                      </div>
                      <Field id="school-name" label="Nama sekolah"><input id="school-name" value={school.schoolName} onChange={(e) => updateSchool('schoolName', e.target.value)} className="ais-field-input" placeholder="Nama sekolah" required /></Field>
                      <Field id="school-city" label="Kota sekolah"><input id="school-city" value={school.schoolCity} onChange={(e) => updateSchool('schoolCity', e.target.value)} className="ais-field-input" placeholder="Kota sekolah" required /></Field>
                      <Field id="school-province" label="Provinsi sekolah"><input id="school-province" value={school.schoolProvince} onChange={(e) => updateSchool('schoolProvince', e.target.value)} className="ais-field-input" placeholder="Provinsi sekolah" required /></Field>
                    </div>
                  )}
                </section>

                <footer className="grid gap-5 border-t border-[#cfd1d8] bg-[#efefe9] px-5 py-6 sm:px-8 md:grid-cols-[1fr_auto] md:items-center">
                  <p className="max-w-[62ch] text-xs leading-6 text-[#747781]">Dengan mengirim formulir, peserta menyatakan data yang diisi sudah diperiksa dan benar. Pada versi ini, data masih disimpan di browser perangkat.</p>
                  <button type="submit" className="ais-cta ais-cta--green justify-between md:min-w-[13rem]">Kirim pendaftaran <span aria-hidden="true">→</span></button>
                </footer>
              </form>
            ) : (
              <div className="mt-8 border border-dashed border-[#c5c7ce] bg-[#fbfbf7] px-6 py-12 text-center">
                <p className="font-semibold text-[#646773]">Pilih cabang lomba untuk membuka formulir pendaftaran.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
