'use client';

/**
 * @file useFees.js
 * @description Catálogo compartilhado de taxas operacionais lidas do Diamond.
 *              Mescla os quatro campos legados de getFees() com todos os tipos
 *              extensíveis retornados por getAllFeeTypes(), sem fixar valores
 *              ou o tamanho futuro da lista no frontend.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { useLocaleContext } from '@/lib/LocaleProvider';
import {
  POLYGON_RPC,
  CASSWAP_ADDRESS,
  DIAMOND_ADDRESS,
  CASSWAP_READ_ABI,
  DIAMOND_READ_ABI,
  DEFAULT_RATIO,
  CORE_OPERATIONAL_FEES,
  KNOWN_CUSTOM_FEE_OPERATIONS,
  COINGECKO_MULTI_PRICE_URL,
  LOCALE_CURRENCY_MAP,
  CURRENCY_LOCALE_MAP,
  FEES_CACHE_KEY,
  FEES_CACHE_TTL_MS,
} from '@/lib/cas-token-config';

/**
 * Formata um valor fiat usando Intl.NumberFormat.
 * @param {number} value valor na moeda alvo
 * @param {string} currency código ISO 4217 (BRL, USD, EUR)
 * @returns {string|null} valor formatado
 */
export function formatFiat(value, currency) {
  if (value == null || Number.isNaN(value)) return null;
  const locale = CURRENCY_LOCALE_MAP[currency] || 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/**
 * Formata CAS no locale informado, preservando até seis casas decimais.
 * As taxas do contrato têm limite de 10.000 CAS e podem ser convertidas com
 * segurança para Number apenas para apresentação.
 */
export function formatCas(value, locale = 'pt') {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) return '—';
  const numberLocale = locale === 'pt' ? 'pt-BR' : locale === 'fr' ? 'fr-FR' : 'en-US';
  return new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(numericValue);
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(FEES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > FEES_CACHE_TTL_MS) return null;
    if (!Array.isArray(parsed.data?.feeList)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(FEES_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data,
    }));
  } catch {
    // sessionStorage pode estar indisponível em modo privado.
  }
}

async function fetchPolPrice() {
  const response = await fetch(COINGECKO_MULTI_PRICE_URL);
  if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);
  const data = await response.json();
  const pol = data['matic-network'];
  return {
    usd: pol?.usd ?? null,
    brl: pol?.brl ?? null,
    eur: pol?.eur ?? null,
  };
}

function createFeeEntry({ feeType, operation, amount, casPrices, currencyCode, isCustom }) {
  const amountRaw = BigInt(amount).toString();
  const casFormatted = ethers.formatEther(amountRaw);
  const cas = Number(casFormatted);

  return {
    feeType: String(feeType),
    operation,
    amountRaw,
    casFormatted,
    cas,
    usd: casPrices.USD != null ? cas * casPrices.USD : null,
    localeCurrency: casPrices[currencyCode] != null ? cas * casPrices[currencyCode] : null,
    currencyCode,
    isCustom,
  };
}

function buildFeeCatalog({ coreFees, customFeeTypes, customAmounts, casPrices, currencyCode }) {
  const feeList = CORE_OPERATIONAL_FEES.map((descriptor) => createFeeEntry({
    feeType: descriptor.feeType,
    operation: descriptor.operation,
    amount: coreFees[descriptor.contractField],
    casPrices,
    currencyCode,
    isCustom: false,
  }));

  if (customFeeTypes.length !== customAmounts.length) {
    throw new Error('Catálogo de taxas on-chain retornou listas incompatíveis.');
  }

  const knownTypes = new Set(feeList.map((fee) => fee.feeType));
  for (let index = 0; index < customFeeTypes.length; index += 1) {
    const feeType = customFeeTypes[index].toString();
    if (knownTypes.has(feeType)) continue;

    feeList.push(createFeeEntry({
      feeType,
      operation: KNOWN_CUSTOM_FEE_OPERATIONS[feeType] ?? `customFee:${feeType}`,
      amount: customAmounts[index],
      casPrices,
      currencyCode,
      isCustom: true,
    }));
    knownTypes.add(feeType);
  }

  const fees = {};
  for (const fee of feeList) {
    fees[fee.operation] = fee;
  }

  return { fees, feeList };
}

/**
 * Busca taxas on-chain, ratio POL/CAS e equivalentes fiat.
 *
 * @returns {{
 *   fees: Object<string, object>|null,
 *   feeList: Array<object>|null,
 *   ratio: {numerator: string, denominator: string}|null,
 *   loading: boolean,
 *   error: string|null,
 *   warning: string|null,
 *   catalogAvailable: boolean,
 *   refresh: () => void,
 * }}
 */
export function useFees() {
  const { locale } = useLocaleContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const currencyCode = LOCALE_CURRENCY_MAP[locale] || 'USD';

  const fetchFees = useCallback(async (forceRefresh = false) => {
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    const cached = forceRefresh ? null : readCache();
    if (cached?.currencyCode === currencyCode) {
      if (mountedRef.current) {
        setData(cached);
        setLoading(false);
      }
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
      const swap = new ethers.Contract(CASSWAP_ADDRESS, CASSWAP_READ_ABI, provider);
      const diamond = new ethers.Contract(DIAMOND_ADDRESS, DIAMOND_READ_ABI, provider);

      const [ratioResult, coreFeesResult, customFeesResult, polPriceResult] = await Promise.allSettled([
        swap.getRatio(),
        diamond.getFees(),
        diamond.getAllFeeTypes(),
        fetchPolPrice(),
      ]);

      if (coreFeesResult.status === 'rejected') {
        throw new Error(`Diamond indisponível: ${coreFeesResult.reason?.message ?? 'falha em getFees()'}`);
      }

      const ratio = ratioResult.status === 'fulfilled'
        ? {
            numerator: ratioResult.value[0].toString(),
            denominator: ratioResult.value[1].toString(),
          }
        : {
            numerator: String(DEFAULT_RATIO.numerator),
            denominator: String(DEFAULT_RATIO.denominator),
          };
      const ratioNumber = Number(ratio.numerator) / Number(ratio.denominator);

      const polPrice = polPriceResult.status === 'fulfilled'
        ? polPriceResult.value
        : { usd: null, brl: null, eur: null };
      const casPrices = {
        USD: polPrice.usd != null ? polPrice.usd / ratioNumber : null,
        BRL: polPrice.brl != null ? polPrice.brl / ratioNumber : null,
        EUR: polPrice.eur != null ? polPrice.eur / ratioNumber : null,
      };

      const catalogAvailable = customFeesResult.status === 'fulfilled';
      const customFeeTypes = catalogAvailable ? Array.from(customFeesResult.value[0]) : [];
      const customAmounts = catalogAvailable ? Array.from(customFeesResult.value[1]) : [];
      const { fees, feeList } = buildFeeCatalog({
        coreFees: coreFeesResult.value,
        customFeeTypes,
        customAmounts,
        casPrices,
        currencyCode,
      });

      const result = {
        fees,
        feeList,
        ratio,
        polPrice,
        casPrice: { usd: casPrices.USD, brl: casPrices.BRL, eur: casPrices.EUR },
        currencyCode,
        catalogAvailable,
        warning: catalogAvailable
          ? null
          : customFeesResult.reason?.message ?? 'Catálogo extensível indisponível.',
      };

      writeCache(result);
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (fetchError) {
      console.error('[useFees] on-chain fetch failed:', fetchError.message);
      if (mountedRef.current) {
        setData(null);
        setError(fetchError.message);
        setLoading(false);
      }
    }
  }, [currencyCode]);

  useEffect(() => {
    mountedRef.current = true;
    fetchFees();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchFees]);

  const refresh = useCallback(() => {
    try {
      sessionStorage.removeItem(FEES_CACHE_KEY);
    } catch {
      // sessionStorage pode estar indisponível em modo privado.
    }
    fetchFees(true);
  }, [fetchFees]);

  return {
    fees: data?.fees ?? null,
    feeList: data?.feeList ?? null,
    ratio: data?.ratio ?? null,
    polPrice: data?.polPrice ?? null,
    casPrice: data?.casPrice ?? null,
    currencyCode,
    loading,
    error,
    warning: data?.warning ?? null,
    catalogAvailable: data?.catalogAvailable ?? false,
    refresh,
  };
}
