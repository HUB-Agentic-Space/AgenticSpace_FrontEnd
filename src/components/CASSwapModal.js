'use client';

/**
 * @file CASSwapModal.js
 * @description Reusable modal for buying/selling CAS via CASSwap contract
 *              using MetaMask. Used in the main frontend for user profile.
 *              Supports i18n via simple translation object.
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ethers } from 'ethers';
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowUpDown,
  Network,
} from 'lucide-react';
import Spinner from '@/components/Spinner';
import { useWallet } from '@/lib/wallet/useWallet';

const MIN_PRIORITY_FEE = 25_000_000_000n;

async function getGasOverrides(provider) {
  const feeData = await provider.getFeeData();
  let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? 0n;
  if (maxPriorityFeePerGas < MIN_PRIORITY_FEE) {
    maxPriorityFeePerGas = MIN_PRIORITY_FEE;
  }
  const baseFee = feeData.maxFeePerGas
    ? feeData.maxFeePerGas - (feeData.maxPriorityFeePerGas ?? 0n)
    : 0n;
  const maxFeePerGas = baseFee + maxPriorityFeePerGas * 2n;
  if (feeData.maxFeePerGas && feeData.maxFeePerGas > maxFeePerGas) {
    return { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas };
  }
  return { maxFeePerGas, maxPriorityFeePerGas };
}

const CASSWAP_ABI = [
  'function buyCAS(uint256 minCasOut, uint256 deadline) external payable returns (uint256)',
  'function sellCAS(uint256 casAmount, uint256 minPolOut, uint256 deadline) external returns (uint256)',
  'function getRatio() external view returns (uint256 numerator, uint256 denominator)',
  'function swapFeeBps() external view returns (uint256)',
  'function casToken() external view returns (address)',
  'function getCasBalance() external view returns (uint256)',
  'function getPolBalance() external view returns (uint256)',
];

const CAS_TOKEN_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

const BPS_DENOMINATOR = 10000;

const DEFAULT_I18N = {
  title: 'CAS Swap',
  buy: 'Buy CAS',
  sell: 'Sell CAS',
  buyLabel: 'POL → CAS',
  sellLabel: 'CAS → POL',
  polAmount: 'POL Amount',
  casAmount: 'CAS Amount',
  ratio: 'Ratio',
  swapFee: 'Swap Fee',
  youReceive: 'You receive',
  connect: 'Connect MetaMask',
  connected: 'Connected',
  casBalance: 'CAS',
  swapping: 'Swapping...',
  swapSuccess: 'Swap successful!',
  viewExplorer: 'View on explorer →',
  metamaskNotFound: 'MetaMask not found. Please install MetaMask.',
  noCasSwap: 'CASSwap contract not configured.',
};

export default function CASSwapModal({
  open,
  onClose,
  casSwapAddress,
  casTokenAddress,
  explorerUrl,
  chainId,
  i18n = DEFAULT_I18N,
}) {
  const [mode, setMode] = useState('buy');
  const [amount, setAmount] = useState('');
  const [ratio, setRatio] = useState({ numerator: '1', denominator: '1' });
  const [swapFeeBps, setSwapFeeBps] = useState(0);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState('');
  const [account, setAccount] = useState(null);
  const [casBalance, setCasBalance] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [networkName, setNetworkName] = useState('');
  const { connect: walletConnect, ethersProvider: walletEthersProvider, getProvider } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = { ...DEFAULT_I18N, ...i18n };
  const explorer = explorerUrl || 'https://polygonscan.com';

  const connectWallet = useCallback(async () => {
    try {
      const { accounts } = await walletConnect();
      setAccount(accounts[0]);
      const provider = getProvider();
      if (provider) {
        const ep = new ethers.BrowserProvider(provider);
        const net = await ep.getNetwork();
        setNetworkName(net.name || `chainId ${Number(net.chainId)}`);
      }
    } catch (err) {
      setError(`Failed to connect wallet: ${err.message}`);
    }
  }, [walletConnect, getProvider]);

  const loadSwapInfo = useCallback(async () => {
    const provider = getProvider();
    if (!casSwapAddress || !provider) return;
    try {
      const ep = new ethers.BrowserProvider(provider);
      const swap = new ethers.Contract(casSwapAddress, CASSWAP_ABI, ep);
      const [num, den] = await swap.getRatio();
      setRatio({ numerator: num.toString(), denominator: den.toString() });
      const fee = await swap.swapFeeBps();
      setSwapFeeBps(Number(fee));
    } catch (err) {
      console.error('[CASSwapModal] loadSwapInfo:', err.message);
    }
  }, [casSwapAddress, getProvider]);

  const loadCasBalance = useCallback(async () => {
    const provider = getProvider();
    if (!casTokenAddress || !account || !provider) return;
    try {
      const ep = new ethers.BrowserProvider(provider);
      const cas = new ethers.Contract(casTokenAddress, CAS_TOKEN_ABI, ep);
      const bal = await cas.balanceOf(account);
      setCasBalance(bal.toString());
    } catch (err) {
      console.error('[CASSwapModal] loadCasBalance:', err.message);
    }
  }, [casTokenAddress, account, getProvider]);

  useEffect(() => {
    if (open && casSwapAddress) {
      loadSwapInfo();
    }
  }, [open, casSwapAddress, loadSwapInfo]);

  useEffect(() => {
    if (open && account) {
      loadCasBalance();
    }
  }, [open, account, loadCasBalance]);

  if (!mounted || !open) return null;

  const ratioNum = Number(ratio.numerator) / Number(ratio.denominator);
  const feePercent = (swapFeeBps / BPS_DENOMINATOR) * 100;

  let preview = '0';
  if (amount) {
    try {
      const amt = parseFloat(amount);
      if (mode === 'buy') {
        const casReceived = amt * ratioNum;
        const fee = (casReceived * swapFeeBps) / BPS_DENOMINATOR;
        preview = (casReceived - fee).toFixed(6);
      } else {
        const polReceived = amt / ratioNum;
        const fee = (polReceived * swapFeeBps) / BPS_DENOMINATOR;
        preview = (polReceived - fee).toFixed(6);
      }
    } catch {
      preview = '0';
    }
  }

  async function ensureNetwork() {
    if (!chainId) return;
    const provider = getProvider();
    if (!provider) throw new Error('Carteira não conectada.');
    const currentChain = await provider.request({ method: 'eth_chainId' });
    const targetHex = '0x' + chainId.toString(16);
    if (currentChain === targetHex) return;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      });
    } catch (switchErr) {
      if (switchErr.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: targetHex,
            chainName: chainId === 137 ? 'Polygon Mainnet' : `Chain ${chainId}`,
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpcUrls: ['https://polygon-rpc.com'],
            blockExplorerUrls: [explorer],
          }],
        });
      } else {
        throw new Error(`Conecte-se à rede Polygon (chainId=${chainId}) na carteira.`);
      }
    }
  }

  async function handleSwap() {
    setError('');
    setTxHash(null);
    setLoading(true);

    try {
      if (!account) {
        await connectWallet();
        setLoading(false);
        return;
      }

      if (!casSwapAddress) {
        setError(t.noCasSwap);
        setLoading(false);
        return;
      }

      await ensureNetwork();

      const rawProvider = getProvider();
      if (!rawProvider) throw new Error('Carteira não conectada.');
      const provider = new ethers.BrowserProvider(rawProvider);
      const signer = await provider.getSigner();
      const gasOverrides = await getGasOverrides(provider);
      const swap = new ethers.Contract(casSwapAddress, CASSWAP_ABI, signer);

      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      if (mode === 'buy') {
        const polAmount = ethers.parseEther(amount);
        const casExpected = ethers.parseEther(preview);
        const minCasOut = (casExpected * 99n) / 100n;

        try {
          await swap.buyCAS.staticCall(minCasOut, deadline, { value: polAmount, from: account });
        } catch (simErr) {
          throw new Error(simErr.reason || simErr.shortMessage || 'A transação seria revertida. Verifique se o contrato CASSwap tem liquidez suficiente.');
        }

        const tx = await swap.buyCAS(minCasOut, deadline, { value: polAmount, ...gasOverrides });
        await tx.wait();
        setTxHash(tx.hash);
      } else {
        const casAmount = ethers.parseEther(amount);
        const cas = new ethers.Contract(casTokenAddress, CAS_TOKEN_ABI, signer);
        const allowance = await cas.allowance(account, casSwapAddress);
        if (allowance < casAmount) {
          const approveTx = await cas.approve(casSwapAddress, casAmount, gasOverrides);
          await approveTx.wait();
        }
        const polExpected = ethers.parseEther(preview);
        const minPolOut = (polExpected * 99n) / 100n;

        try {
          await swap.sellCAS.staticCall(casAmount, minPolOut, deadline, { from: account });
        } catch (simErr) {
          throw new Error(simErr.reason || simErr.shortMessage || 'A transação seria revertida. Verifique seu saldo de CAS e allowance.');
        }

        const tx = await swap.sellCAS(casAmount, minPolOut, deadline, gasOverrides);
        await tx.wait();
        setTxHash(tx.hash);
      }

      loadCasBalance();
      loadSwapInfo();
    } catch (err) {
      const msg = err.reason || err.shortMessage || err.message || 'Swap failed';
      if (msg.includes('missing revert data') || msg.includes('could not coalesce error')) {
        setError('Erro de rede: não foi possível comunicar com o contrato. Verifique se a MetaMask está conectada à Polygon Mainnet (chainId 137) e tente novamente.');
      } else {
        setError(msg);
      }
      console.error('[CASSwapModal] swap error:', err);
    }
    setLoading(false);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {!account && (
          <button onClick={connectWallet} className="btn-primary w-full">
            {t.connect}
          </button>
        )}

        {account && (
          <div className="space-y-1">
            <p className="text-xs text-slate-500">
              {t.connected}: {account.slice(0, 6)}...{account.slice(-4)}
              {casBalance && (
                <span className="ml-2 text-slate-400">
                  {t.casBalance}: {(Number(casBalance) / 1e18).toFixed(4)}
                </span>
              )}
            </p>
            {networkName && (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Network size={12} /> {networkName}
                {chainId && (
                  <span className={
                    networkName === 'matic' || networkName.includes(String(chainId))
                      ? 'text-green-400'
                      : 'text-amber-400'
                  }>
                    {networkName === 'matic' || networkName.includes(String(chainId)) ? ' \u2713' : ' \u26a0 rede incorreta'}
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setMode('buy')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
              mode === 'buy' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {t.buy} ({t.buyLabel})
          </button>
          <button
            onClick={() => setMode('sell')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
              mode === 'sell' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {t.sell} ({t.sellLabel})
          </button>
        </div>

        <div>
          <label className="label">
            {mode === 'buy' ? t.polAmount : t.casAmount}
          </label>
          <input
            type="number"
            step="0.000001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="input"
          />
        </div>

        <div className="rounded-lg bg-slate-800/50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t.ratio}</span>
            <span className="text-slate-300">1 POL = {ratioNum.toFixed(4)} CAS</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t.swapFee}</span>
            <span className="text-slate-300">{feePercent.toFixed(2)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t.youReceive}</span>
            <span className="font-bold text-white">
              {preview} {mode === 'buy' ? 'CAS' : 'POL'}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {txHash && (
          <div className="flex items-start gap-2 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p>{t.swapSuccess}</p>
              <a
                href={`${explorer}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300"
              >
                {t.viewExplorer}
              </a>
            </div>
          </div>
        )}

        <button
          onClick={handleSwap}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="btn-primary w-full"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> {t.swapping}</>
          ) : (
            <><ArrowUpDown size={16} /> {mode === 'buy' ? t.buy : t.sell}</>
          )}
        </button>
      </div>
    </div>,
    document.body
  );
}
