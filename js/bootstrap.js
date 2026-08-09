/* =========================================================
   APPLICATION BOOTSTRAP
   ========================================================= */
// Semua initializer dijalankan setelah dependency selesai dimuat.

initializeOsisAdmin();
initializeAnnouncementV11();
initializeCommandCenterV12();
initializeV13Ux();
renderPublicCards();
updateAspirasiCounters();
refreshPublicAspirasiCount();

if (aspirasiForm) {
    const aspCharCount =
        document.getElementById('asp-char-count');

    const updateAspCharacterCount = () => {
        if (!aspPesan || !aspCharCount) return;

        const length = aspPesan.value.length;
        aspCharCount.textContent = `${length} / 2000`;

        if (length >= 1800) {
            aspCharCount.classList.add('near-limit');
        } else {
            aspCharCount.classList.remove('near-limit');
        }
    };

    aspPesan?.addEventListener(
        'input',
        () => {
            updateAspCharacterCount();

            if (aspPesan.value.trim()) {
                aspPesan.setAttribute(
                    'aria-invalid',
                    'false'
                );
                aspError.style.display = 'none';
            }
        }
    );

    updateAspCharacterCount();

    aspirasiForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        aspError.style.display = 'none';
        aspPesan.setAttribute(
            'aria-invalid',
            'false'
        );

        if (!aspPesan.value.trim()) {
            aspError.textContent =
                'Mohon isi pesan aspirasi.';
            aspError.style.display = 'block';
            aspPesan.setAttribute(
                'aria-invalid',
                'true'
            );
            aspPesan.focus();
            return;
        }

        const submitBtn = aspirasiForm.querySelector('button[type="submit"]');
        const originalHtml = submitBtn?.innerHTML || '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '.7';
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Mengirim...';
        }

        const payload = {
            name: document.getElementById('asp-nama').value.trim() || 'Anonim',
            kelas: document.getElementById('asp-kelas').value.trim() || '-',
            category: document.getElementById('asp-category').value || 'Saran Umum',
            message: aspPesan.value.trim(),
            website: document.getElementById('asp-website')?.value || ''
        };

        try {
            await saveAspirasi(payload);
            aspirasiForm.reset();
            updateAspCharacterCount();
            aspPesan.setAttribute(
                'aria-invalid',
                'false'
            );
            aspSuccessModal.style.display = 'flex';
            showAppToast('Aspirasi berhasil dikirim.');
        } catch (err) {
            console.error('[Aspirasi] Kirim gagal:', err);
            aspError.style.display = 'block';
            aspPesan.setAttribute(
                'aria-invalid',
                'true'
            );
            aspError.textContent =
                'Gagal mengirim aspirasi: ' +
                err.message;
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.innerHTML = originalHtml;
            }
        }
    });
}
