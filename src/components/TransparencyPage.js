'use client';

/**
 * @file components/TransparencyPage.js
 * @description Relatório de transparência das doações do Hub Agentic Space.
 * Exibe a chave PIX (QR + copia e cola), a carteira EVM receptora, os saldos
 * on-chain consultados ao vivo via RPC público (Ethereum e Polygon) e a tabela
 * de despesas mantida em src/data/transparency.json.
 *
 * Author:  Carlos Delfino
 * Email:   consultoria@carlosdelfino.eti.br
 * WhatsApp: +55 (85) 98520-5490
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import {
  ArrowLeft, ArrowRight, Copy, Check, ExternalLink,
  HeartHandshake, RefreshCw, Wallet, Landmark
} from 'lucide-react';
import { useTranslations } from '@/lib/LocaleProvider';
import { generateQrDataUrl } from '@/lib/qr-utils';
import { generatePixPayload, PIX_KEY_DISPLAY } from '@/lib/pix-payload';
import { DONATION_WALLET, DONATION_CHAINS, ERC20_ABI } from '@/lib/donations';
import transparencyData from '@/data/transparency.json';
import DonationHistory from '@/components/DonationHistory';
import DonationGoals from '@/components/DonationGoals';

/**
 * Consulta o saldo de um ativo na chain informada, tentando os RPCs em ordem.
 * @param {object} chain - Entrada de DONATION_CHAINS.
 * @param {object} asset - Ativo ({ native } ou { address, decimals }).
 * @returns {Promise<string>} Saldo formatado em unidades principais.
 */
async function fetchAssetBalance(chain, asset) {
  let lastError;
  for (const rpc of chain.rpcs) {
    const request = new ethers.FetchRequest(rpc);
    request.timeout = 10000;
    const provider = new ethers.JsonRpcProvider(request, chain.chainId, { staticNetwork: true });
    try {
      if (asset.native) {
        const wei = await provider.getBalance(DONATION_WALLET);
        return ethers.formatUnits(wei, asset.decimals);
      }
      const token = new ethers.Contract(asset.address, ERC20_ABI, provider);
      const raw = await token.balanceOf(DONATION_WALLET);
      return ethers.formatUnits(raw, asset.decimals);
    } catch (error) {
      lastError = error;
    } finally {
      provider.destroy();
    }
  }
  throw lastError;
}

/** Formata um saldo string com até 6 casas significativas. */
function formatBalance(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  if (n < 0.000001) return '< 0.000001';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
}

/** Botão de copiar com feedback. */
function CopyInline({ text, label }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] [TransparencyPage:CopyInline] error clipboard_failed`, error);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 transition hover:bg-slate-700"
    >
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
      {copied ? t('donation.copied') : label}
    </button>
  );
}

export default function TransparencyPage() {
  const t = useTranslations();
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [walletQrDataUrl, setWalletQrDataUrl] = useState(null);
  const [balances, setBalances] = useState({});
  const [donationReport, setDonationReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const pixPayload = generatePixPayload();

  const loadBalances = async () => {
    setLoading(true);
    const results = {};
    await Promise.all(DONATION_CHAINS.map(async (chain) => {
      results[chain.id] = await Promise.all(chain.assets.map(async (asset) => {
        try {
          const balance = await fetchAssetBalance(chain, asset);
          return { ...asset, balance, error: false };
        } catch (error) {
          console.warn(
            `[${new Date().toISOString()}] [TransparencyPage:loadBalances] warn ` +
            `balance_unavailable - chain=${chain.id} asset=${asset.symbol}`
          );
          return { ...asset, balance: null, error: true };
        }
      }));
    }));
    setBalances(results);
    setLoading(false);
    console.log(
      `[${new Date().toISOString()}] [TransparencyPage:loadBalances] info ` +
      `balances_loaded - chains=${Object.keys(results).join(',')}`
    );
  };

  useEffect(() => {
    let mounted = true;
    generateQrDataUrl(pixPayload, { width: 320, margin: 1 })
      .then((url) => { if (mounted) setQrDataUrl(url); })
      .catch((error) => {
        console.error(`[${new Date().toISOString()}] [TransparencyPage:useEffect] error qr_generation_failed`, error);
      });
    // URI ethereum: (EIP-681) para leitura direta pelo MetaMask e outras wallets.
    generateQrDataUrl(`ethereum:${DONATION_WALLET}`, { width: 320, margin: 1 })
      .then((url) => { if (mounted) setWalletQrDataUrl(url); })
      .catch((error) => {
        console.error(`[${new Date().toISOString()}] [TransparencyPage:useEffect] error wallet_qr_generation_failed`, error);
      });
    loadBalances();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-slate-400 transition hover:text-white">
          <ArrowLeft size={16} />
          {t('transparency.back')}
        </Link>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
          <HeartHandshake className="text-brand-400" size={30} />
          {t('transparency.title')}
        </h1>
        <p className="mt-2 max-w-3xl text-slate-400">{t('transparency.subtitle')}</p>
      </div>

      {/* Recebíveis */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <Landmark size={18} className="text-brand-400" />
            {t('transparency.pixTitle')}
          </h2>
          <p className="text-sm text-slate-300">
            <span className="font-mono">{PIX_KEY_DISPLAY}</span> — Rapport Tecnologia
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <CopyInline text={pixPayload} label={t('donation.copyPix')} />
            <CopyInline text={PIX_KEY_DISPLAY} label={t('transparency.copyKey')} />
          </div>
          {qrDataUrl && (
            <div className="inline-block rounded-lg bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt={t('donation.qrAlt')} width={140} height={140} className="h-36 w-36" />
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <Wallet size={18} className="text-brand-400" />
            {t('transparency.walletTitle')}
          </h2>
          <p className="break-all font-mono text-xs text-slate-300">{DONATION_WALLET}</p>
          {walletQrDataUrl && (
            <div className="flex items-center gap-3">
              <div className="inline-block rounded-lg bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={walletQrDataUrl} alt={t('transparency.walletQrAlt')} width={112} height={112} className="h-28 w-28" />
              </div>
              <p className="text-xs text-slate-400">{t('transparency.walletQrCaption')}</p>
            </div>
          )}
          <p className="text-xs text-slate-400">{t('transparency.walletNetworks')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <CopyInline text={DONATION_WALLET} label={t('donation.copyWallet')} />
            {DONATION_CHAINS.map((chain) => (
              <a
                key={chain.id}
                href={chain.explorer(DONATION_WALLET)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 transition hover:bg-slate-700"
              >
                <ExternalLink size={13} />
                {chain.id === 'ethereum' ? 'Etherscan' : chain.id === 'polygon' ? 'Polygonscan' : 'ARC Explorer'}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Saldos on-chain */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">{t('transparency.balancesTitle')}</h2>
          <button
            type="button"
            onClick={loadBalances}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {t('transparency.refresh')}
          </button>
        </div>
        <p className="text-xs text-slate-400">{t('transparency.balancesNote')}</p>

        <div className="space-y-6">
          {DONATION_CHAINS.map((chain) => (
            <div key={chain.id}>
              <p className="eyebrow mb-2">{chain.label}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {(balances[chain.id] || chain.assets).map((asset) => (
                  <div
                    key={asset.symbol}
                    data-testid={`${chain.id}-${asset.symbol}-balance`}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3"
                  >
                    <p className="text-xs font-semibold text-slate-400">{asset.symbol}</p>
                    <p className="mt-1 font-mono text-lg text-white">
                      {asset.error
                        ? t('transparency.unavailable')
                        : asset.balance != null
                          ? formatBalance(asset.balance)
                          : '…'}
                    </p>
                    {asset.address && (
                      <a
                        href={chain.explorer(asset.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-brand-400"
                      >
                        <ExternalLink size={11} />
                        {asset.address.slice(0, 8)}…{asset.address.slice(-6)}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <DonationGoals data={transparencyData} report={donationReport} />
      <DonationHistory onReport={setDonationReport} />

      <section className="card space-y-4" aria-labelledby="pix-donations-title">
        <h2 id="pix-donations-title" className="font-semibold text-white">Doações via PIX</h2>
        <p className="text-xs text-slate-400">Registros atualizados manualmente pela Rapport Tecnologia. Todos os doadores são apresentados como Anônimo; nenhum dado pessoal é publicado.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-300">
                <th scope="col" className="p-2">Nome</th>
                <th scope="col" className="p-2">Data</th>
                <th scope="col" className="p-2 text-right">Valor (BRL)</th>
              </tr>
            </thead>
            <tbody>
              {transparencyData.pixDonations.map((donation, index) => (
                <tr key={`${donation.date}-${index}`} className="border-b border-slate-800 text-slate-300">
                  <td className="p-2">Anônimo</td>
                  <td className="p-2">{donation.date.split('-').reverse().join('/')}</td>
                  <td className="p-2 text-right font-mono">{(donation.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Metas e despesas */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-white">{t('transparency.expensesTitle')}</h2>
        <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 px-4 py-3">
          <p className="font-semibold text-brand-400">{transparencyData.goal.title}</p>
          <p className="mt-1 text-sm text-slate-300">
            {t('transparency.goalMonthly')}: ~US$ {transparencyData.goal.monthlyUsd}/mês
          </p>
          <p className="mt-1 text-sm text-slate-400">{transparencyData.goal.description}</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-400">
              <th className="py-2 pr-4 font-medium">{t('transparency.colDate')}</th>
              <th className="py-2 pr-4 font-medium">{t('transparency.colItem')}</th>
              <th className="py-2 pr-4 font-medium">{t('transparency.colCategory')}</th>
              <th className="py-2 text-right font-medium">{t('transparency.colMonthly')}</th>
            </tr>
          </thead>
          <tbody>
            {transparencyData.expenses.map((expense) => (
              <tr key={`${expense.date}-${expense.item}`} className="border-b border-slate-800/50 text-slate-300">
                <td className="py-2 pr-4 font-mono text-xs">{expense.date}</td>
                <td className="py-2 pr-4">{expense.item}</td>
                <td className="py-2 pr-4 text-slate-400">{expense.category}</td>
                <td className="py-2 text-right font-mono">US$ {expense.monthlyUsd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="text-sm text-slate-400">
        {t('transparency.thanks')}{' '}
        <Link href="/" className="link-arrow inline-flex items-center gap-1">
          {t('transparency.backHome')}
          <ArrowRight size={14} />
        </Link>
      </p>
    </div>
  );
}
