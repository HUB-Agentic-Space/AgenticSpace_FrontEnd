'use client';

/**
 * @file useFees.js
 * @description Hook compartilhado que busca taxas operacionais on-chain do
 *              contrato Diamond, a ratio POL/CAS do CASSwap, e a cotação
 *              do POL em múltiplas moedas fiat via CoinGecko.
 *
 *              Retorna cada taxa com seu valor em CAS, USD e na moeda
 *              correspondente ao locale do usuário (BRL/EUR/USD).
 *
 *              Utiliza cache em sessionStorage (60s) para evitar chamadas
 *              redundantes entre páginas.
 *
 * Padrão: Strategy + Facade (abstrai múltiplas fontes de dados em uma API unificada)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useLocaleContext } from '@/lib/LocaleProvider';
import {
  POLYGON_RPC,
  CASSWAP_ADDRESS,
  DIAMOND_ADDRESS,
  CASSWAP_READ_ABI,
  DIAMOND_READ_ABI,
  DEFAULT_RATIO,
  DEFAULT_OPERATIONAL_FEES,
  COINGECKO_MULTI_PRICE_URL,
  LOCALE_CURRENCY_MAP,
  CURRENCY_LOCALE_MAP,
  FEES_CACHE_KEY,
  FEES_CACHE_TTL_MS,
} from '@/lib/cas-token-config';

/**
 * Formata um valor fiat usando Intl.NumberFormat.
 * @param {number} value - valor na moeda alvo
 * @param {string} currency - código ISO 4217 (BRL, USD, EUR)
 * @returns {string} valor formatado (ex: R$ 3,75 / $0.75 / €0,69)
 */
export function formatFiat(value, currency) {
  if (value == null || isNaN(value)) return null;
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
 * Lê o cache de fees do sessionStorage se ainda válido.
 * @returns {object|null} dados em cache ou null
 */
function readCache() {
  try {
    const raw = sessionStorage.getItem(FEES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > FEES_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

/**
 * Escreve o cache de fees no sessionStorage.
 * @param {object} data - dados a armazenar
 */
function writeCache(data) {
  try {
    sessionStorage.setItem(FEES_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data,
    }));
  } catch {
    // sessionStorage indisponível (modo privado, etc.)
  }
}

/**
 * Busca taxas on-chain e cotação POL em fiat.
 *
 * @returns {{
 *   fees: Object<string, {cas: number, usd: number|null, localeCurrency: number|null, currencyCode: string}>,
 *   ratio: {numerator: string, denominator: string},
 *   polPrice: {usd: number|null, brl: number|null, eur: number|null},
 *   loading: boolean,
 *   error: string|null,
 *   refresh: () => void,
 * }}
 */
export function useFees() {
  const { locale } = useLocaleContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const refreshCounter = useRef(0);

  const currencyCode = LOCALE_CURRENCY_MAP[locale] || 'USD';

  const fetchFees = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Tenta cache primeiro
    const cached = readCache();
    if (cached && !refreshCounter.current) {
      setData(cached);
      setLoading(false);
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(POLYGON_RPC);

      // Busca ratio POL→CAS
      const swap = new ethers.Contract(CASSWAP_ADDRESS, CASSWAP_READ_ABI, provider);
      const [num, den] = await swap.getRatio();
      const ratio = {
        numerator: num.toString(),
        denominator: den.toString(),
      };
      const ratioNum = Number(ratio.numerator) / Number(ratio.denominator);

      // Busca taxas do Diamond
      const diamond = new ethers.Contract(DIAMOND_ADDRESS, DIAMOND_READ_ABI, provider);
      const onChainFees = await diamond.getFees();

      // Busca preço POL em USD, BRL, EUR via CoinGecko
      let polPrice = { usd: null, brl: null, eur: null };
      try {
        const res = await fetch(COINGECKO_MULTI_PRICE_URL);
        if (res.ok) {
          const cgData = await res.json();
          const matic = cgData['matic-network'];
          if (matic) {
            polPrice = {
              usd: matic.usd ?? null,
              brl: matic.brl ?? null,
              eur: matic.eur ?? null,
            };
          }
        }
      } catch (err) {
        console.error('[useFees] CoinGecko fetch failed:', err.message);
      }

      // Preço do CAS em cada fiat: casPriceFiat = polPriceFiat / ratioNum
      const casPriceUsd = polPrice.usd != null ? polPrice.usd / ratioNum : null;
      const casPriceBrl = polPrice.brl != null ? polPrice.brl / ratioNum : null;
      const casPriceEur = polPrice.eur != null ? polPrice.eur / ratioNum : null;

      const casPriceByCurrency = { USD: casPriceUsd, BRL: casPriceBrl, EUR: casPriceEur };

      // Constrói objeto de taxas com equivalentes fiat
      const fees = {};
      for (const f of DEFAULT_OPERATIONAL_FEES) {
        const casAmount = Number(ethers.formatEther(onChainFees[f.contractField]));
        fees[f.operation] = {
          cas: casAmount,
          usd: casPriceUsd != null ? casAmount * casPriceUsd : null,
          localeCurrency: casPriceByCurrency[currencyCode] != null
            ? casAmount * casPriceByCurrency[currencyCode]
            : null,
          currencyCode,
        };
      }

      // daoVoting não está no getFees() do Diamond — usa daoProposalFee/5 como fallback
      // conforme documentação do contrato (votação = 1/10 do registro)
      // Se o contrato adicionar daoVotingFee no futuro, usar diretamente
      if (!fees.daoVoting) {
        const proposalCas = fees.daoProposal?.cas ?? DEFAULT_OPERATIONAL_FEES.find(
          (f) => f.operation === 'daoProposal'
        )?.fee ?? 50;
        fees.daoVoting = {
          cas: proposalCas,
          usd: casPriceUsd != null ? proposalCas * casPriceUsd : null,
          localeCurrency: casPriceByCurrency[currencyCode] != null
            ? proposalCas * casPriceByCurrency[currencyCode]
            : null,
          currencyCode,
        };
      }

      const result = {
        fees,
        ratio,
        polPrice,
        casPrice: { usd: casPriceUsd, brl: casPriceBrl, eur: casPriceEur },
        currencyCode,
      };

      writeCache(result);
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      console.error('[useFees] on-chain fetch failed:', err.message);
      // Fallback para valores padrão
      const fallbackFees = {};
      for (const f of DEFAULT_OPERATIONAL_FEES) {
        fallbackFees[f.operation] = {
          cas: f.fee,
          usd: null,
          localeCurrency: null,
          currencyCode,
        };
      }
      fallbackFees.daoVoting = {
        cas: 50,
        usd: null,
        localeCurrency: null,
        currencyCode,
      };

      const result = {
        fees: fallbackFees,
        ratio: { numerator: String(DEFAULT_RATIO.numerator), denominator: String(DEFAULT_RATIO.denominator) },
        polPrice: { usd: null, brl: null, eur: null },
        casPrice: { usd: null, brl: null, eur: null },
        currencyCode,
      };

      if (mountedRef.current) {
        setData(result);
        setError(err.message);
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

  // Recalcula localeCurrency quando o locale mudar (sem refetch on-chain)
  useEffect(() => {
    if (!data) return;
    const newCurrencyCode = LOCALE_CURRENCY_MAP[locale] || 'USD';
    if (newCurrencyCode === data.currencyCode) return;

    const updatedFees = {};
    for (const [key, fee] of Object.entries(data.fees)) {
      const casPriceByCurrency = {
        USD: data.casPrice.usd,
        BRL: data.casPrice.brl,
        EUR: data.casPrice.eur,
      };
      updatedFees[key] = {
        ...fee,
        currencyCode: newCurrencyCode,
        localeCurrency: casPriceByCurrency[newCurrencyCode] != null
          ? fee.cas * casPriceByCurrency[newCurrencyCode]
          : null,
      };
    }
    setData({ ...data, fees: updatedFees, currencyCode: newCurrencyCode });
  }, [locale, data]);

  const refresh = useCallback(() => {
    refreshCounter.current += 1;
    fetchFees();
  }, [fetchFees]);

  return {
    fees: data?.fees ?? null,
    ratio: data?.ratio ?? null,
    polPrice: data?.polPrice ?? null,
    casPrice: data?.casPrice ?? null,
    currencyCode,
    loading,
    error,
    refresh,
  };
}
