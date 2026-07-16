'use client';

/**
 * @file cookie-consent.js
 * @description Utility for checking cookie consent status.
 * Provides functions to read and subscribe to consent changes.
 */

export const CONSENT_COOKIE_NAME = 'cookie_consent';
export const CONSENT_EVENT = 'cookie-consent-change';

/**
 * Reads the current cookie consent value.
 * @returns {'accepted' | 'rejected' | null}
 */
export function getCookieConsent() {
  if (typeof document === 'undefined') return null;
  const row = document.cookie
    .split('; ')
    .find(r => r.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!row) return null;
  const value = row.split('=')[1];
  return value === 'accepted' ? 'accepted' : value === 'rejected' ? 'rejected' : null;
}

/**
 * Checks if the user has accepted cookies.
 * @returns {boolean}
 */
export function hasConsented() {
  return getCookieConsent() === 'accepted';
}

/**
 * Subscribes to cookie consent changes.
 * @param {(consent: 'accepted' | 'rejected' | null) => void} callback
 * @returns {() => void} Unsubscribe function.
 */
export function onConsentChange(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback(getCookieConsent());
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}

/**
 * Notifies all subscribers that consent has changed.
 * @param {'accepted' | 'rejected'} consent
 */
export function notifyConsentChange(consent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
}
