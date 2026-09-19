import { useCallback, useEffect, useState } from 'react';
import { pushConfig, pushRegister, pushUnregister } from '../services/api.js';
import { getAdminSessionToken } from '../lib/adminSession.js';

const NOTIF_KEY = 'osis_admin_notifications_v1';
const PUSH_SDK_URL = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
const PUSH_WORKER_FILE = 'push/onesignal/OneSignalSDKWorker.js';

function safeGet(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { window.localStorage.setItem(key, value); } catch {}
}
function safeRemove(key) {
  try { window.localStorage.removeItem(key); } catch {}
}

let sdkInstance = null;
let sdkInitPromise = null;

function workerOptions() {
  let base = '/';
  try {
    const p = new URL('.', window.location.href).pathname;
    base = p.endsWith('/') ? p : `${p}/`;
  } catch {}
  return {
    serviceWorkerPath: `${base.replace(/^\/+/, '')}${PUSH_WORKER_FILE}`,
    serviceWorkerParam: { scope: `${base}push/onesignal/` },
  };
}

function ensureSdk() {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${PUSH_SDK_URL}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = PUSH_SDK_URL;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('SDK notifikasi gagal dimuat.'));
    document.head.appendChild(script);
  });
}

async function getSdkInstance(appId) {
  if (sdkInstance) return sdkInstance;
  if (sdkInitPromise) return sdkInitPromise;

  sdkInitPromise = new Promise((resolve, reject) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        const worker = workerOptions();
        await OneSignal.init({
          appId,
          serviceWorkerPath: worker.serviceWorkerPath,
          serviceWorkerParam: worker.serviceWorkerParam,
          allowLocalhostAsSecureOrigin: true,
          welcomeNotification: { disable: true },
        });
        sdkInstance = OneSignal;
        resolve(OneSignal);
      } catch (error) {
        reject(error);
      }
    });
  });

  await ensureSdk();
  return sdkInitPromise;
}

function deviceName() {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const isiOS = /iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isWindows = /Windows/i.test(ua);
  const isMac = /Macintosh|Mac OS X/i.test(ua) && !isiOS;
  const isEdge = /Edg\//i.test(ua);
  const isChrome = /Chrome\//i.test(ua) && !isEdge;
  const isFirefox = /Firefox\//i.test(ua);
  const isSafari = /Safari\//i.test(ua) && !/Chrome|CriOS|Edg|FxiOS/i.test(ua);
  const browser = isEdge ? 'Edge' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Browser';
  const device = isiOS ? 'iPhone/iPad' : isAndroid ? 'Android' : isWindows ? 'Windows' : isMac ? 'Mac' : 'Perangkat';
  return `${browser} • ${device}`;
}

async function waitForSubscriptionId(OneSignal, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const id = String(OneSignal.User?.PushSubscription?.id || '').trim();
    const optedIn = Boolean(OneSignal.User?.PushSubscription?.optedIn);
    if (id && optedIn) return id;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return '';
}

export default function useNotifications() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setEnabled(safeGet(NOTIF_KEY) === 'on');
  }, []);

  const enable = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      if (!('Notification' in window)) {
        setMessage('Browser tidak mendukung notifikasi.');
        return;
      }
      let permission = Notification.permission;
      if (permission === 'default') permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setMessage('Izin notifikasi ditolak. Ubah lewat pengaturan browser.');
        return;
      }

      const token = getAdminSessionToken();
      if (!token) {
        safeSet(NOTIF_KEY, 'on');
        setEnabled(true);
        return;
      }

      const config = await pushConfig(token);
      if (!config?.configured || !config?.appId) {
        safeSet(NOTIF_KEY, 'on');
        setEnabled(true);
        setMessage('Notifikasi lokal aktif. Push server belum dikonfigurasi.');
        return;
      }

      const OneSignal = await getSdkInstance(config.appId);
      if (!OneSignal.Notifications.permission) {
        await OneSignal.Notifications.requestPermission();
      }
      await OneSignal.User.PushSubscription.optIn();
      const subscriptionId = await waitForSubscriptionId(OneSignal);
      if (!subscriptionId) {
        throw new Error('Subscription push tidak selesai dibuat. Muat ulang lalu coba lagi.');
      }

      await pushRegister(token, {
        subscriptionId,
        deviceName: deviceName(),
        preferencesJson: JSON.stringify({ aspirasi: true, pengumuman: true, event: true, galeri: true, keamanan: true }),
        siteUrl: window.location.origin,
      });

      safeSet(NOTIF_KEY, 'on');
      setEnabled(true);
    } catch (error) {
      setMessage(error?.message || 'Gagal mengaktifkan notifikasi.');
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const disable = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const token = getAdminSessionToken();
      const id = String(sdkInstance?.User?.PushSubscription?.id || '').trim();
      if (token && id) {
        await pushUnregister(token, id);
      }
      await sdkInstance?.User?.PushSubscription?.optOut?.().catch(() => {});
      safeRemove(NOTIF_KEY);
      setEnabled(false);
    } catch (error) {
      setMessage(error?.message || 'Gagal menonaktifkan notifikasi.');
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const toggle = useCallback(() => {
    if (enabled) return disable();
    return enable();
  }, [enabled, enable, disable]);

  return { enabled, busy, message, toggle };
}
