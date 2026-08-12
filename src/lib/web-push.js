/**
 * @file web-push.js
 * @description Utilitários de Web Push para o frontend Next.js.
 *
 * Responsabilidades:
 *  - Registrar o service worker em /service-worker.js.
 *  - Solicitar permissão ao usuário e criar a subscription.
 *  - Sincronizar a subscription e preferências com o backend.
 */

import {
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
  setPushEnabled,
  setPushCommunitySetting,
  getPushStatus
} from './api.js';

/**
 * Indica se o navegador suporta Web Push.
 */
export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Indica se a permissão de notificação foi concedida.
 */
export function getNotificationPermission() {
  if (typeof window === 'undefined') return 'default';
  return Notification.permission;
}

/**
 * Solicita permissão para notificações.
 * @returns {Promise<'granted'|'denied'|'default'>}
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return 'default';
  if (!('Notification' in window)) return 'default';
  return Notification.requestPermission();
}

let serviceWorkerRegistration = null;

/**
 * Registra o service worker do projeto.
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  if (serviceWorkerRegistration) return serviceWorkerRegistration;

  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('[web-push] Service Worker registrado:', serviceWorkerRegistration.scope);
    return serviceWorkerRegistration;
  } catch (error) {
    console.error('[web-push] Falha ao registrar Service Worker:', error);
    return null;
  }
}

/**
 * Retorna a subscription atual do PushManager.
 */
export async function getCurrentPushSubscription() {
  const registration = await registerServiceWorker();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/**
 * Cria uma nova subscription no navegador usando a VAPID public key do backend.
 */
export async function createPushSubscription() {
  const registration = await registerServiceWorker();
  if (!registration) throw new Error('Service Worker não disponível.');

  const { status, data } = await getVapidPublicKey();
  if (status !== 200 || !data.publicKey) {
    throw new Error('Chave pública VAPID indisponível.');
  }

  const applicationServerKey = urlBase64ToUint8Array(data.publicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey
  });
  return subscription;
}

/**
 * Ativa o Web Push: solicita permissão, cria subscription e salva no backend.
 * @param {string} jwt JWT da sessão.
 */
export async function enablePushNotifications(jwt) {
  if (!isPushSupported()) {
    throw new Error('Este navegador não suporta Web Push.');
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    throw new Error('Permissão de notificação não concedida.');
  }

  const subscription = await createPushSubscription();
  const { status, data } = await subscribePush(subscription, jwt);
  if (status !== 200) {
    throw new Error(data?.error || 'Falha ao salvar subscription no servidor.');
  }

  await setPushEnabled(true, jwt);
  return { subscription, data };
}

/**
 * Desativa o Web Push geral e remove a subscription do backend/navegador.
 * @param {string} jwt JWT da sessão.
 * @param {boolean} removeSubscription Se true, remove a subscription do navegador e backend.
 */
export async function disablePushNotifications(jwt, removeSubscription = true) {
  await setPushEnabled(false, jwt);

  if (removeSubscription) {
    const subscription = await getCurrentPushSubscription();
    if (subscription) {
      await unsubscribePush(subscription.endpoint, jwt);
      await subscription.unsubscribe();
    }
  }
}

/**
 * Sincroniza o estado do toggle geral com o backend sem alterar a subscription.
 * @param {boolean} enabled
 * @param {string} jwt JWT da sessão.
 */
export async function updatePushEnabled(enabled, jwt) {
  const { status, data } = await setPushEnabled(enabled, jwt);
  if (status !== 200) {
    throw new Error(data?.error || 'Falha ao atualizar preferência geral.');
  }
  return data;
}

/**
 * Atualiza a preferência de notificação de uma comunidade.
 * @param {string} publicId ID público da comunidade.
 * @param {boolean} enabled
 * @param {string} jwt JWT da sessão.
 */
export async function updateCommunityPushSetting(publicId, enabled, jwt) {
  const { status, data } = await setPushCommunitySetting(publicId, enabled, jwt);
  if (status !== 200) {
    throw new Error(data?.error || 'Falha ao atualizar preferência da comunidade.');
  }
  return data;
}

/**
 * Carrega o status geral e configurações por comunidade.
 * @param {string} jwt JWT da sessão.
 */
export async function loadPushStatus(jwt) {
  const { status, data } = await getPushStatus(jwt);
  if (status !== 200) {
    throw new Error(data?.error || 'Falha ao carregar status de notificações.');
  }
  return data;
}

/**
 * Converte uma chave base64url (VAPID) para Uint8Array.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
