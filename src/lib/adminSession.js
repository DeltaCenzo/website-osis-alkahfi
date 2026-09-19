export const ADMIN_SESSION_KEY = 'osis_aspirasi_admin_session_v2';
export const ADMIN_WORKSPACE_KEY = 'osis_admin_workspace_v1';

function safeSessionGet(key) {
  try {
    return window.sessionStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function safeSessionSet(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage dapat dibatasi oleh browser tertentu.
  }
}

function safeSessionRemove(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage dapat dibatasi oleh browser tertentu.
  }
}

export function getAdminSessionToken() {
  return safeSessionGet(ADMIN_SESSION_KEY);
}

export function storeAdminSession(token) {
  safeSessionSet(ADMIN_SESSION_KEY, String(token || ''));
}

export function storeAdminWorkspace(role) {
  safeSessionSet(ADMIN_WORKSPACE_KEY, String(role || ''));
}

export function clearAdminSessionCache() {
  safeSessionRemove(ADMIN_SESSION_KEY);
  safeSessionRemove(ADMIN_WORKSPACE_KEY);
}

const CLIENT_ID_KEY = 'osis_admin_client_id_v1';

export function getClientId() {
  try {
    let id = window.localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
      window.localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

function getEndpoint() {
  return String(window.OSIS_ASPIRASI_CONFIG?.appsScriptUrl || '').trim();
}

async function postAdminAction(endpoint, action, token, signal) {
  const body = new URLSearchParams({ action, token });
  const response = await fetch(endpoint, {
    method: 'POST',
    body,
    signal,
    redirect: 'follow',
    credentials: 'omit',
  });

  if (!response.ok) {
    return {
      ok: false,
      network: true,
      message: `Backend OSIS merespons HTTP ${response.status}.`,
    };
  }

  let result;
  try {
    result = await response.json();
  } catch {
    return {
      ok: false,
      network: true,
      message: 'Respons backend OSIS tidak dapat dibaca.',
    };
  }

  return { ok: true, result };
}

function isUnknownAction(result) {
  return result?.success !== true && /action api tidak dikenal|action tidak dikenal/i.test(String(result?.message || ''));
}

function isSessionError(result) {
  const message = String(result?.message || '');
  return /sesi admin|token|kedaluwarsa|expired|tidak valid|akses ditolak/i.test(message);
}

export async function validateAdminSession({ timeoutMs = 12000, signal: externalSignal } = {}) {
  const token = getAdminSessionToken();
  if (!token) {
    return { valid: false, reason: 'missing', message: 'Sesi pengurus belum tersedia.' };
  }

  const endpoint = getEndpoint();
  if (!endpoint) {
    return { valid: false, reason: 'config', message: 'Konfigurasi backend OSIS belum tersedia.' };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  externalSignal?.addEventListener?.('abort', onAbort, { once: true });

  try {
    const primary = await postAdminAction(endpoint, 'validateSession', token, controller.signal);

    if (!primary.ok) {
      return { valid: false, reason: 'network', message: primary.message };
    }

    if (primary.result?.success === true && primary.result?.valid === true) {
      return {
        valid: true,
        reason: 'ok',
        checkedAt: primary.result.checkedAt || '',
        validator: 'validateSession',
      };
    }

    // Kompatibilitas backend sebelum V15: `list` juga dilindungi wajibAdmin(token),
    // sehingga dapat digunakan sebagai verifikasi server-side tanpa membuka bypass.
    if (isUnknownAction(primary.result)) {
      const fallback = await postAdminAction(endpoint, 'list', token, controller.signal);

      if (!fallback.ok) {
        return { valid: false, reason: 'network', message: fallback.message };
      }

      if (fallback.result?.success === true) {
        return {
          valid: true,
          reason: 'ok',
          checkedAt: new Date().toISOString(),
          validator: 'legacy-list',
        };
      }

      if (isSessionError(fallback.result)) {
        clearAdminSessionCache();
        return {
          valid: false,
          reason: 'invalid',
          message: fallback.result?.message || 'Sesi pengurus tidak valid atau sudah kedaluwarsa.',
        };
      }

      return {
        valid: false,
        reason: 'network',
        message: fallback.result?.message || 'Backend OSIS belum dapat memverifikasi sesi.',
      };
    }

    if (isSessionError(primary.result)) {
      clearAdminSessionCache();
      return {
        valid: false,
        reason: 'invalid',
        message: primary.result?.message || 'Sesi pengurus tidak valid atau sudah kedaluwarsa.',
      };
    }

    return {
      valid: false,
      reason: 'network',
      message: primary.result?.message || 'Backend OSIS belum dapat memverifikasi sesi.',
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return { valid: false, reason: 'network', message: 'Verifikasi sesi terlalu lama. Periksa koneksi lalu coba lagi.' };
    }
    return { valid: false, reason: 'network', message: 'Tidak dapat memverifikasi sesi ke server OSIS.' };
  } finally {
    window.clearTimeout(timeout);
    externalSignal?.removeEventListener?.('abort', onAbort);
  }
}
