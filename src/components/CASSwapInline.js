'use client';

/**
 * @file CASSwapInline.js
 * @description Inline (non-modal) swap component using the new
 *              CASSwapUSDCPOLFacet on the Diamond. Supports POL and USDC
 *              pairs for buying/selling CAS on Polygon PoS.
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowUpDown,
  Network,
  Wallet,
  Coins,
  DollarSign,
} from 'lucide-react';
import { useWallet } from '@/lib/wallet/useWallet';

const MIN_PRIORITY_FEE = BigInt('25000000000');

async function getGasOverrides(provider) {
  const feeData = await provider.getFeeData();
  let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? BigInt('0');
  if (maxPriorityFeePerGas < MIN_PRIORITY_FEE) {
    maxPriorityFeePerGas = MIN_PRIORITY_FEE;
  }
  const baseFee = feeData.maxFeePerGas
    ? feeData.maxFeePerGas - (feeData.maxPriorityFeePerGas ?? BigInt('0'))
    : BigInt('0');
  const maxFeePerGas = baseFee + maxPriorityFeePerGas * BigInt('2');
  if (feeData.maxFeePerGas && feeData.maxFeePerGas > maxFeePerGas) {
    return { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas };
  }
  return { maxFeePerGas, maxPriorityFeePerGas };
}

const DIAMOND_SWAP_ABI = [
  'function buyCASWithPOL(uint256 minCasOut, uint256 deadline) external payable returns (uint256)',
  'function sellCASForPOL(uint256 casAmount, uint256 minPolOut, uint256 deadline) external returns (uint256)',
  'function buyCASWithUSDC(uint256 usdcAmount, uint256 minCasOut, uint256 deadline) external returns (uint256)',
  'function sellCASForUSDC(uint256 casAmount, uint256 minUsdcOut, uint256 deadline) external returns (uint256)',
  'function getRatio() external view returns (uint256 numerator, uint256 denominator)',
  'function getRatioUSDC() external view returns (uint256 numerator, uint256 denominator)',
  'function getSwapFeeBps() external view returns (uint256)',
  'function getReserves() external view returns (uint256 casBalance, uint256 usdcBalance, uint256 polBalance)',
  'function isSwapPaused() external view returns (bool)',
];

const ERC20_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

const BPS_DENOMINATOR = 10000;
const USDC_DECIMALS = 6;

const SWAP_ERRORS_ABI = [
  'error ZeroAmount()',
  'error InvalidRatio()',
  'error InsufficientCASBalance(uint256 available, uint256 required)',
  'error InsufficientPOLBalance(uint256 available, uint256 required)',
  'error InsufficientUSDCBalance(uint256 available, uint256 required)',
  'error SlippageExceeded(uint256 minExpected, uint256 actual)',
  'error POLTransferFailed()',
  'error ReentrantCall()',
  'error SwapPaused()',
  'error DeadlineExpired(uint256 deadline, uint256 nowTs)',
  'error ZeroAddress()',
  'error InvalidRatioArg()',
  'error InvalidCurrency(uint8 currency)',
  'error MsgValueMismatch(uint256 expected, uint256 sent)',
  'error BudgetExceeded(uint256 requested, uint256 remaining)',
  'error InsufficientReserve(uint256 available, uint256 required)',
  'error SafeTransferFailed()',
  'error SafeTransferFromFailed()',
];

const swapErrorsIface = new ethers.Interface(SWAP_ERRORS_ABI);

function decodeSwapError(err) {
  const rawErr = err?.data || err?.error?.data || err?.info?.error?.data;
  if (!rawErr || typeof rawErr !== 'string') return null;

  try {
    const decoded = swapErrorsIface.parseError(rawErr);
    if (!decoded) return null;

    const fmt = ethers.formatEther;
    const fmtU = (v) => ethers.formatUnits(v, USDC_DECIMALS);

    switch (decoded.name) {
      case 'ZeroAmount':
        return { user: 'Quantidade insuficiente para swap.', detail: 'ZeroAmount()' };
      case 'InvalidRatio':
        return { user: 'O ratio de swap ainda não foi configurado. Tente novamente em alguns instantes.', detail: 'InvalidRatio()' };
      case 'InsufficientCASBalance':
        return {
          user: 'O contrato não tem CAS suficiente para esta compra.',
          detail: `InsufficientCASBalance(available=${fmt(decoded.args[0])}, required=${fmt(decoded.args[1])})`,
        };
      case 'InsufficientPOLBalance':
        return {
          user: 'O contrato não tem POL suficiente para esta venda.',
          detail: `InsufficientPOLBalance(available=${fmt(decoded.args[0])}, required=${fmt(decoded.args[1])})`,
        };
      case 'InsufficientUSDCBalance':
        return {
          user: 'O contrato não tem USDC suficiente para esta venda.',
          detail: `InsufficientUSDCBalance(available=${fmtU(decoded.args[0])}, required=${fmtU(decoded.args[1])})`,
        };
      case 'SlippageExceeded':
        return {
          user: 'O valor recebido ficaria abaixo do mínimo aceitável (slippage). Tente com um valor menor.',
          detail: `SlippageExceeded(minExpected=${decoded.args[0]}, actual=${decoded.args[1]})`,
        };
      case 'POLTransferFailed':
        return { user: 'Falha ao transferir POL do contrato.', detail: 'POLTransferFailed()' };
      case 'ReentrantCall':
        return { user: 'Erro de reentrância no contrato.', detail: 'ReentrantCall()' };
      case 'SwapPaused':
        return { user: 'O swap está pausado no momento.', detail: 'SwapPaused()' };
      case 'DeadlineExpired':
        return { user: 'A transação expirou. Tente novamente.', detail: `DeadlineExpired(deadline=${decoded.args[0]}, now=${decoded.args[1]})` };
      case 'ZeroAddress':
        return { user: 'Endereço inválido no contrato.', detail: 'ZeroAddress()' };
      case 'InvalidRatioArg':
        return { user: 'Parâmetros de ratio inválidos.', detail: 'InvalidRatioArg()' };
      case 'InvalidCurrency':
        return { user: 'Moeda de swap inválida.', detail: `InvalidCurrency(currency=${decoded.args[0]})` };
      case 'MsgValueMismatch':
        return { user: 'O valor de POL enviado não corresponde ao informado.', detail: `MsgValueMismatch(expected=${decoded.args[0]}, sent=${decoded.args[1]})` };
      case 'BudgetExceeded':
        return { user: 'Orçamento de suporte de preço excedido.', detail: `BudgetExceeded(requested=${decoded.args[0]}, remaining=${decoded.args[1]})` };
      case 'InsufficientReserve':
        return { user: 'Reserva insuficiente no contrato.', detail: `InsufficientReserve(available=${decoded.args[0]}, required=${decoded.args[1]})` };
      case 'SafeTransferFailed':
        return { user: 'Falha ao transferir o token.', detail: 'SafeTransferFailed()' };
      case 'SafeTransferFromFailed':
        return { user: 'Falha na aprovação ou transferência do token. Verifique se autorizou o contrato.', detail: 'SafeTransferFromFailed()' };
      default:
        return { user: `Erro no contrato: ${decoded.name}`, detail: `${decoded.name}(${decoded.args.join(', ')})` };
    }
  } catch {
    return null;
  }
}

function formatUserError(err) {
  const decoded = decodeSwapError(err);
  if (decoded) {
    console.error('[CASSwapInline] contract error:', decoded.detail);
    return decoded.user;
  }

  const msg = err?.reason || err?.shortMessage || err?.message || 'Swap falhou';

  if (msg.includes('missing revert data') || msg.includes('could not coalesce error')) {
    return 'Erro de rede: não foi possível comunicar com o contrato. Verifique se a carteira está na Polygon Mainnet (chainId 137).';
  }
  if (msg.includes('user rejected') || msg.includes('ACTION_REJECTED')) {
    return 'Transação cancelada pelo usuário.';
  }
  if (msg.includes('insufficient funds')) {
    return 'Saldo insuficiente para esta transação (gas + valor).';
  }
  if (msg.includes('execution reverted')) {
    return 'A transação foi revertida pelo contrato. Possíveis causas: saldo insuficiente do contrato, ratio não configurado, ou slippage excessivo.';
  }

  return msg;
}

export default function CASSwapInline({
  diamondAddress,
  casTokenAddress,
  usdcAddress,
  explorerUrl,
  chainId,
}) {
  const [currency, setCurrency] = useState('POL');
  const [mode, setMode] = useState('buy');
  const [amount, setAmount] = useState('');
  const [ratio, setRatio] = useState({ numerator: '1', denominator: '1' });
  const [swapFeeBps, setSwapFeeBps] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState('');
  const [account, setAccount] = useState(null);
  const [casBalance, setCasBalance] = useState(null);
  const [networkName, setNetworkName] = useState('');
  const { connect: walletConnect, getProvider } = useWallet();

  const explorer = explorerUrl || 'https://polygonscan.com';

  const connectWallet = useCallback(async () => {
    try {
      const { accounts } = await walletConnect();
      setAccount(accounts[0]);
      const provider = getProvider();
      if (provider) {
        if (chainId) {
          try {
            await ensureNetwork();
          } catch (netErr) {
            setError(netErr.message || 'Falha ao alternar para Polygon Mainnet.');
          }
        }
        const ep = new ethers.BrowserProvider(provider);
        const net = await ep.getNetwork();
        setNetworkName(net.name || `chainId ${Number(net.chainId)}`);
      }
    } catch (err) {
      setError(`Falha ao conectar carteira: ${err.message}`);
    }
  }, [walletConnect, getProvider, chainId]);

  const loadSwapInfo = useCallback(async () => {
    const provider = getProvider();
    if (!diamondAddress || !provider) return;
    try {
      const ep = new ethers.BrowserProvider(provider);
      const swap = new ethers.Contract(diamondAddress, DIAMOND_SWAP_ABI, ep);
      const [num, den] = await swap.getRatio();
      setRatio({ numerator: num.toString(), denominator: den.toString() });
      const fee = await swap.getSwapFeeBps();
      setSwapFeeBps(Number(fee));
      const isPaused = await swap.isSwapPaused();
      setPaused(isPaused);
    } catch (err) {
      console.error('[CASSwapInline] loadSwapInfo:', err.message);
    }
  }, [diamondAddress, getProvider]);

  const loadCasBalance = useCallback(async () => {
    const provider = getProvider();
    if (!casTokenAddress || !account || !provider) return;
    try {
      const ep = new ethers.BrowserProvider(provider);
      const cas = new ethers.Contract(casTokenAddress, ERC20_ABI, ep);
      const bal = await cas.balanceOf(account);
      setCasBalance(bal.toString());
    } catch (err) {
      console.error('[CASSwapInline] loadCasBalance:', err.message);
    }
  }, [casTokenAddress, account, getProvider]);

  useEffect(() => {
    if (diamondAddress) {
      loadSwapInfo();
    }
  }, [diamondAddress, loadSwapInfo]);

  useEffect(() => {
    if (account) {
      loadCasBalance();
    }
  }, [account, loadCasBalance]);

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
            rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL || 'https://polygon.drpc.org'],
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

      if (!diamondAddress) {
        setError('Diamond não configurado.');
        setLoading(false);
        return;
      }

      if (paused) {
        setError('O swap está pausado no momento.');
        setLoading(false);
        return;
      }

      await ensureNetwork();

      const rawProvider = getProvider();
      if (!rawProvider) throw new Error('Carteira não conectada.');
      const provider = new ethers.BrowserProvider(rawProvider);
      const signer = await provider.getSigner();
      const gasOverrides = await getGasOverrides(provider);
      const swap = new ethers.Contract(diamondAddress, DIAMOND_SWAP_ABI, signer);

      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      if (mode === 'buy' && currency === 'POL') {
        const polAmount = ethers.parseEther(amount);
        const casExpected = ethers.parseEther(preview);
        const minCasOut = (casExpected * BigInt('99')) / BigInt('100');

        try {
          await swap.buyCASWithPOL.staticCall(minCasOut, deadline, { value: polAmount });
        } catch (simErr) {
          throw simErr;
        }

        const tx = await swap.buyCASWithPOL(minCasOut, deadline, { value: polAmount, ...gasOverrides });
        await tx.wait();
        setTxHash(tx.hash);
      } else if (mode === 'sell' && currency === 'POL') {
        const casAmount = ethers.parseEther(amount);
        const cas = new ethers.Contract(casTokenAddress, ERC20_ABI, signer);
        const allowance = await cas.allowance(account, diamondAddress);
        if (allowance < casAmount) {
          const approveTx = await cas.approve(diamondAddress, casAmount, gasOverrides);
          await approveTx.wait();
        }
        const polExpected = ethers.parseEther(preview);
        const minPolOut = (polExpected * BigInt('99')) / BigInt('100');

        try {
          await swap.sellCASForPOL.staticCall(casAmount, minPolOut, deadline);
        } catch (simErr) {
          throw simErr;
        }

        const tx = await swap.sellCASForPOL(casAmount, minPolOut, deadline, gasOverrides);
        await tx.wait();
        setTxHash(tx.hash);
      } else if (mode === 'buy' && currency === 'USDC') {
        const usdcAmount = ethers.parseUnits(amount, USDC_DECIMALS);
        const casExpected = ethers.parseEther(preview);
        const minCasOut = (casExpected * BigInt('99')) / BigInt('100');

        const usdc = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
        const allowance = await usdc.allowance(account, diamondAddress);
        if (allowance < usdcAmount) {
          const approveTx = await usdc.approve(diamondAddress, usdcAmount, gasOverrides);
          await approveTx.wait();
        }

        try {
          await swap.buyCASWithUSDC.staticCall(usdcAmount, minCasOut, deadline);
        } catch (simErr) {
          throw simErr;
        }

        const tx = await swap.buyCASWithUSDC(usdcAmount, minCasOut, deadline, gasOverrides);
        await tx.wait();
        setTxHash(tx.hash);
      } else if (mode === 'sell' && currency === 'USDC') {
        const casAmount = ethers.parseEther(amount);
        const cas = new ethers.Contract(casTokenAddress, ERC20_ABI, signer);
        const casAllowance = await cas.allowance(account, diamondAddress);
        if (casAllowance < casAmount) {
          const approveTx = await cas.approve(diamondAddress, casAmount, gasOverrides);
          await approveTx.wait();
        }
        const usdcExpected = ethers.parseUnits(preview, USDC_DECIMALS);
        const minUsdcOut = (usdcExpected * BigInt('99')) / BigInt('100');

        try {
          await swap.sellCASForUSDC.staticCall(casAmount, minUsdcOut, deadline);
        } catch (simErr) {
          throw simErr;
        }

        const tx = await swap.sellCASForUSDC(casAmount, minUsdcOut, deadline, gasOverrides);
        await tx.wait();
        setTxHash(tx.hash);
      }

      loadCasBalance();
      loadSwapInfo();
    } catch (err) {
      console.error('[CASSwapInline] swap error:', err);
      setError(formatUserError(err));
    }
    setLoading(false);
  }

  const inputLabel = mode === 'buy'
    ? `Quantidade de ${currency}`
    : 'Quantidade de CAS';
  const outputToken = mode === 'buy' ? 'CAS' : currency;

  return (
    <div className="card w-full max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ArrowUpDown className="text-brand-400" size={20} />
          CASSwap
        </h2>
        <div className="flex items-center gap-2">
          {paused && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300 ring-1 ring-red-500/30">
              Pausado
            </span>
          )}
          <span className="text-xs text-slate-500">Diamond facet</span>
        </div>
      </div>

      {!account && (
        <button onClick={connectWallet} className="btn-primary w-full flex items-center justify-center gap-2">
          <Wallet size={16} /> Conectar MetaMask
        </button>
      )}

      {account && (
        <div className="space-y-1">
          <p className="text-xs text-slate-500">
            Conectado: {account.slice(0, 6)}...{account.slice(-4)}
            {casBalance && (
              <span className="ml-2 text-slate-400">
                CAS: {(Number(casBalance) / 1e18).toFixed(4)}
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

      {/* Currency selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setCurrency('POL')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-1.5 ${
            currency === 'POL' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <Coins size={14} /> POL
        </button>
        <button
          onClick={() => setCurrency('USDC')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-1.5 ${
            currency === 'USDC' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <DollarSign size={14} /> USDC
        </button>
      </div>

      {/* Buy/Sell selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('buy')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
            mode === 'buy' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Comprar ({currency} → CAS)
        </button>
        <button
          onClick={() => setMode('sell')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
            mode === 'sell' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Vender (CAS → {currency})
        </button>
      </div>

      <div>
        <label className="label">{inputLabel}</label>
        <input
          type="number"
          step={currency === 'USDC' ? '0.01' : '0.000001'}
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="input"
        />
      </div>

      <div className="rounded-lg bg-slate-800/50 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Ratio</span>
          <span className="text-slate-300">1 {currency} = {ratioNum.toFixed(4)} CAS</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Swap Fee</span>
          <span className="text-slate-300">{feePercent.toFixed(2)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Você recebe</span>
          <span className="font-bold text-white">
            {preview} {outputToken}
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
            <p>Swap realizado com sucesso!</p>
            <a
              href={`${explorer}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300"
            >
              Ver no explorer →
            </a>
          </div>
        </div>
      )}

      <button
        onClick={handleSwap}
        disabled={loading || !amount || parseFloat(amount) <= 0 || paused}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Processando...</>
        ) : (
          <><ArrowUpDown size={16} /> {mode === 'buy' ? 'Comprar CAS' : 'Vender CAS'}</>
        )}
      </button>
    </div>
  );
}
