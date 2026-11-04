'use client';

/**
 * Página estática de resgate de vouchers QR.
 * Usa `?code=` para aceitar qualquer voucher sem depender de segmentos dinâmicos incompatíveis com `output: export`.
 * Author:  Carlos Delfino
 * Email:   consultoria@carlosdelfino.eti.br
 * WhatsApp: +55 (85) 98520-5490
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Gift, Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { qrClaimRequest } from '@/lib/api';

function errorMessage(data) {
  const code = data?.code || 'CLAIM_ERROR';
  const message = data?.message || data?.error || 'Não foi possível concluir a operação.';
  return `[${code}] ${message}${data?.next_step ? ` ${data.next_step}` : ''}`;
}

function ClaimContent() {
  const params = useSearchParams();
  const code = (params.get('code') || '').trim();
  const [voucher, setVoucher] = useState(null);
  const [wallet, setWallet] = useState('');
  const [state, setState] = useState('validating');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function validate() {
      if (!/^[0-9a-fA-F]{64}$/.test(code)) {
        setState('error');
        setMessage('Código ausente ou inválido. Leia novamente um QR Code Rapport.');
        return;
      }
      const result = await qrClaimRequest('/qr-claims/validate', { code });
      if (result.status !== 200) {
        setState('error');
        setMessage(errorMessage(result.data));
        return;
      }
      setVoucher(result.data);
      setState('ready');
    }
    validate().catch(() => {
      setState('error');
      setMessage('Falha de rede ao validar o voucher. Tente novamente.');
    });
  }, [code]);

  async function redeem() {
    if (!window.ethereum) {
      setMessage('Nenhuma carteira EVM foi encontrada neste navegador.');
      return;
    }
    if (!window.confirm('Confirma o resgate deste voucher para a carteira conectada? Esta é uma operação financeira.')) return;
    setState('claiming');
    setMessage('');
    try {
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWallet(address);
      const challenge = await qrClaimRequest('/qr-claims/challenge', { code, wallet: address });
      if (challenge.status !== 200) throw new Error(errorMessage(challenge.data));
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [challenge.data.message, address]
      });
      const authorization = await qrClaimRequest('/qr-claims/authorize', {
        code,
        wallet: address,
        challengeId: challenge.data.challengeId,
        signature
      });
      if (authorization.status !== 200) throw new Error(errorMessage(authorization.data));
      const submission = await qrClaimRequest('/qr-claims/submit', {
        authorization: authorization.data.authorization,
        signature: authorization.data.signature
      });
      if (submission.status !== 200) throw new Error(errorMessage(submission.data));
      setVoucher((current) => ({ ...current, claim: submission.data }));
      setState('done');
    } catch (error) {
      setState('ready');
      setMessage(error?.message || 'O resgate foi interrompido.');
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <section className="card space-y-6 border-brand-500/30">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-brand-500/15 p-3"><Gift className="text-brand-400" /></span>
          <div><h1 className="text-2xl font-bold text-white">Resgatar voucher</h1><p className="text-sm text-slate-400">Validação segura e recebimento patrocinado.</p></div>
        </div>

        {state === 'validating' && <p className="flex items-center gap-2 text-slate-300"><Loader2 className="animate-spin" size={18} /> Validando voucher…</p>}
        {voucher?.campaign && (
          <div className="grid gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4 sm:grid-cols-2">
            <div><p className="text-xs uppercase text-slate-500">Campanha</p><p className="font-medium text-white">{voucher.campaign.name}</p></div>
            <div><p className="text-xs uppercase text-slate-500">Valor</p><p className="font-mono text-brand-400">{voucher.campaign.amountPerVoucher} {voucher.campaign.assetSymbol}</p></div>
            <div><p className="text-xs uppercase text-slate-500">Voucher</p><p className="font-mono text-sm text-slate-300">{voucher.voucher?.status}</p></div>
            <div><p className="text-xs uppercase text-slate-500">Proteção</p><p className="flex items-center gap-1 text-sm text-slate-300"><ShieldCheck size={15} /> NFT ERC-5192</p></div>
          </div>
        )}
        {message && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{message}</p>}
        {state === 'ready' && voucher?.voucher?.status === 'VALID' && <button className="btn-primary w-full justify-center" onClick={redeem}><Wallet size={18} /> Conectar carteira e resgatar</button>}
        {state === 'claiming' && <p className="flex items-center gap-2 text-brand-300"><Loader2 className="animate-spin" size={18} /> Autorize na carteira; o envio on-chain será patrocinado.</p>}
        {state === 'done' && <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-green-300"><p className="flex items-center gap-2 font-semibold"><CheckCircle2 /> Resgate confirmado</p><p className="mt-2 break-all font-mono text-xs">Carteira: {wallet}</p></div>}
      </section>
    </main>
  );
}

export default function ClaimPage() {
  return <Suspense fallback={<main className="p-12 text-center text-slate-400">Carregando…</main>}><ClaimContent /></Suspense>;
}
