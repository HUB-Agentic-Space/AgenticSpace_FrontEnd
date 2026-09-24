'use client';

/**
 * @file CASSwapInline.js
 * @description Inline (non-modal) multi-asset swap component using the
 *              CASSwapUSDCPOLFacet on the Diamond. Supports CAS, POL, USDC
 *              and BRLA in both directions on Polygon PoS.
 *
 *              Rotas com CAS em uma ponta usam uma perna; rotas entre dois
 *              ativos cotados (ex.: BRLA -> USDC) compõem `in -> CAS -> out`
 *              on-chain, com o CAS como unidade de conta (sua reserva não se
 *              move). Quando os seletores multi-ativo ainda não estão
 *              instalados no Diamond, o componente degrada para as funções
 *              legadas CAS <-> POL/USDC.
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowUpDown,
  ArrowDown,
  Network,
  Wallet,
  LogOut,
} from 'lucide-react';
import { useWallet } from '@/lib/wallet/useWallet';

const MIN_PRIORITY_FEE = BigInt('25000000000');

async function getGasOverrides(provider) {
  try {
    const feeData = await provider.getFeeData();
    const hasEip1559 = feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null;
    if (hasEip1559) {
      let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      if (maxPriorityFeePerGas < MIN_PRIORITY_FEE) {
        maxPriorityFeePerGas = MIN_PRIORITY_FEE;
      }
      const baseFee = feeData.maxFeePerGas - (feeData.maxPriorityFeePerGas || 0n);
      const maxFeePerGas = baseFee + maxPriorityFeePerGas * 2n;
      if (feeData.maxFeePerGas > maxFeePerGas) {
        return { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas };
      }
      return { maxFeePerGas, maxPriorityFeePerGas };
    }
    if (feeData.gasPrice != null) {
      return { gasPrice: feeData.gasPrice };
    }
    return {};
  } catch (err) {
    console.warn('[CASSwapInline] getFeeData falhou, delegando gás para a carteira:', err?.code || err?.message);
    return {};
  }
}

// Currency ids no contrato: 0 = POL (nativo), 1 = USDC, 2 = BRLA, 3 = CAS.
const CURRENCY_ID = { POL: 0, USDC: 1, BRLA: 2, CAS: 3 };

const DIAMOND_SWAP_ABI = [
  // Multi-asset (novo facet)
  'function swapExact(uint8 currencyIn, uint8 currencyOut, uint256 amountIn, uint256 minOut, uint256 deadline) external payable returns (uint256)',
  'function quoteSwap(uint8 currencyIn, uint8 currencyOut, uint256 amountIn) external view returns (uint256 amountOut, uint256 fee)',
  'function getReservesMulti() external view returns (uint256 casBalance, uint256 polBalance, uint256 usdcBalance, uint256 brlaBalance)',
  // Legado CAS <-> POL/USDC
  'function buyCASWithPOL(uint256 minCasOut, uint256 deadline) external payable returns (uint256)',
  'function sellCASForPOL(uint256 casAmount, uint256 minPolOut, uint256 deadline) external returns (uint256)',
  'function buyCASWithUSDC(uint256 usdcAmount, uint256 minCasOut, uint256 deadline) external returns (uint256)',
  'function sellCASForUSDC(uint256 casAmount, uint256 minUsdcOut, uint256 deadline) external returns (uint256)',
  // Ratios e estado
  'function getRatio() external view returns (uint256 numerator, uint256 denominator)',
  'function getRatioUSDC() external view returns (uint256 numerator, uint256 denominator)',
  'function getRatioSell() external view returns (uint256 numerator, uint256 denominator)',
  'function getRatioUSDCSell() external view returns (uint256 numerator, uint256 denominator)',
  'function getRatioBRLA() external view returns (uint256 numerator, uint256 denominator)',
  'function getRatioBRLASell() external view returns (uint256 numerator, uint256 denominator)',
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

const BPS_DENOMINATOR = 10000n;
const SLIPPAGE_BPS = 100n; // 1% padrão de slippage
// Fallback da taxa de swap (0,5%) exibida até getSwapFeeBps() resolver on-chain.
const DEFAULT_SWAP_FEE_BPS = 50;

const SWAP_ERRORS_ABI = [
  'error ZeroAmount()',
  'error InvalidRatio()',
  'error InsufficientCASBalance(uint256,uint256)',
  'error InsufficientPOLBalance(uint256,uint256)',
  'error InsufficientUSDCBalance(uint256,uint256)',
  'error InsufficientBRLABalance(uint256,uint256)',
  'error SlippageExceeded(uint256,uint256)',
  'error POLTransferFailed()',
  'error ReentrantCall()',
  'error SwapPaused()',
  'error DeadlineExpired(uint256,uint256)',
  'error ZeroAddress()',
  'error InvalidRatioArg()',
  'error InvalidCurrency(uint8)',
  'error SameTokenSwap()',
  'error BRLANotConfigured()',
  'error ReverseSpread(uint8)',
  'error MsgValueMismatch(uint256,uint256)',
  'error BudgetExceeded(uint256,uint256)',
  'error InsufficientReserve(uint256,uint256)',
  'error SafeTransferFailed()',
  'error SafeTransferFromFailed()',
];

const swapErrorsIface = new ethers.Interface(SWAP_ERRORS_ABI);

const ERROR_NEXT_STEP = {
  InsufficientCASBalance: 'reduza o valor de compra ou aguarde o reabastecimento de liquidez CAS.',
  InsufficientPOLBalance: 'reduza o valor de venda ou aguarde o reabastecimento de POL.',
  InsufficientUSDCBalance: 'reduza o valor de venda ou aguarde o reabastecimento de USDC.',
  InsufficientBRLABalance: 'reduza o valor de venda ou aguarde o reabastecimento de BRLA.',
  InsufficientReserve: 'aguarde o reabastecimento da reserva correspondente.',
  SlippageExceeded: 'aumente a tolerância de slippage ou reduza o valor.',
  SwapPaused: 'aguarde o despausamento do swap.',
  InvalidRatio: 'o ratio ainda não foi configurado. Tente novamente mais tarde ou contate o suporte.',
  BRLANotConfigured: 'o token BRLA ainda não foi habilitado no contrato de swap.',
  SameTokenSwap: 'selecione dois ativos diferentes.',
  ReverseSpread: 'os ratios estão invertidos; aguarde a correção do operador.',
  BudgetExceeded: 'o orçamento de suporte de preço foi atingido.',
  DeadlineExpired: 'aumente o prazo da transação e tente novamente.',
  MsgValueMismatch: 'revise o valor de POL informado e o enviado.',
  InvalidCurrency: 'selecione um dos ativos suportados.',
  ZeroAmount: 'informe um valor maior que zero.',
  SafeTransferFromFailed: 'verifique se autorizou o contrato a usar seus tokens.',
};

const ERROR_USER_MESSAGE = {
  ZeroAmount: 'Quantidade insuficiente para swap.',
  InvalidRatio: 'O ratio de swap ainda não foi configurado. Tente novamente em alguns instantes.',
  InsufficientCASBalance: 'O contrato não tem CAS suficiente para esta compra.',
  InsufficientPOLBalance: 'O contrato não tem POL suficiente para esta venda.',
  InsufficientUSDCBalance: 'O contrato não tem USDC suficiente para esta venda.',
  InsufficientBRLABalance: 'O contrato não tem BRLA suficiente para esta venda.',
  SlippageExceeded: 'O valor recebido ficaria abaixo do mínimo aceitável (slippage). Tente com um valor menor.',
  POLTransferFailed: 'Falha ao transferir POL do contrato.',
  ReentrantCall: 'Erro de reentrância no contrato.',
  SwapPaused: 'O swap está pausado no momento.',
  DeadlineExpired: 'A transação expirou. Tente novamente.',
  ZeroAddress: 'Endereço inválido no contrato.',
  InvalidRatioArg: 'Parâmetros de ratio inválidos.',
  InvalidCurrency: 'Moeda de swap inválida.',
  SameTokenSwap: 'Não é possível trocar um ativo por ele mesmo.',
  BRLANotConfigured: 'O BRLA ainda não foi habilitado neste contrato de swap.',
  ReverseSpread: 'A configuração de spread está invertida no contrato.',
  MsgValueMismatch: 'O valor de POL enviado não corresponde ao informado.',
  BudgetExceeded: 'Orçamento de suporte de preço excedido.',
  InsufficientReserve: 'Reserva insuficiente no contrato.',
  SafeTransferFailed: 'Falha ao transferir o token.',
  SafeTransferFromFailed: 'Falha na aprovação ou transferência do token. Verifique se autorizou o contrato.',
};

function decodeSwapError(err) {
  const rawErr = err?.data || err?.error?.data || err?.info?.error?.data;
  if (!rawErr || typeof rawErr !== 'string') return null;

  try {
    const decoded = swapErrorsIface.parseError(rawErr);
    if (!decoded) return null;
    const user = ERROR_USER_MESSAGE[decoded.name] || `Erro no contrato: ${decoded.name}`;
    return { name: decoded.name, user, detail: `${decoded.name}(${decoded.args.join(', ')})` };
  } catch {
    return null;
  }
}

function formatUserError(err) {
  const decoded = decodeSwapError(err);
  if (decoded) {
    console.error('[CASSwapInline] contract error:', decoded.detail);
    const next = ERROR_NEXT_STEP[decoded.name] || 'verifique o saldo, o valor e a rede e tente novamente.';
    return `${decoded.user} — Próximo passo: ${next}`;
  }

  const msg = err?.reason || err?.shortMessage || err?.message || 'Swap falhou';

  if (msg.includes('missing revert data') || msg.includes('could not coalesce error')) {
    return 'Erro de comunicação com o contrato (sem dados de reversão). — Próximo passo: confirme que está na Polygon Mainnet (chainId 137), que a MetaMask está conectada a um RPC compatível e que a faceta CASSwapUSDCPOL está instalada no Diamond.';
  }
  if (msg.includes('user rejected') || msg.includes('ACTION_REJECTED')) {
    return 'Transação cancelada pelo usuário.';
  }
  if (msg.includes('insufficient funds')) {
    return 'Saldo insuficiente para esta transação (gas + valor). — Próximo passo: adicione POL à carteira e tente novamente.';
  }
  if (msg.includes('execution reverted')) {
    return 'A transação foi revertida pelo contrato. — Próximo passo: reduza o valor, verifique a liquidez, o slippage ou se o swap está pausado.';
  }

  return msg;
}

export default function CASSwapInline({
  diamondAddress,
  casTokenAddress,
  usdcAddress,
  brlaAddress,
  explorerUrl,
  chainId,
}) {
  const TOKENS = [
    { symbol: 'CAS', id: CURRENCY_ID.CAS, decimals: 18, native: false, address: casTokenAddress },
    { symbol: 'POL', id: CURRENCY_ID.POL, decimals: 18, native: true, address: null },
    { symbol: 'USDC', id: CURRENCY_ID.USDC, decimals: 6, native: false, address: usdcAddress },
    { symbol: 'BRLA', id: CURRENCY_ID.BRLA, decimals: 18, native: false, address: brlaAddress },
  ];
  const tokenBySymbol = Object.fromEntries(TOKENS.map((t) => [t.symbol, t]));

  const [fromSymbol, setFromSymbol] = useState('POL');
  const [toSymbol, setToSymbol] = useState('CAS');
  const [amount, setAmount] = useState('');
  const [swapFeeBps, setSwapFeeBps] = useState(DEFAULT_SWAP_FEE_BPS);
  const [paused, setPaused] = useState(false);
  const [multiAsset, setMultiAsset] = useState(false);
  const [ratios, setRatios] = useState(null); // { POL:{buy:[n,d],sell:[n,d]}, USDC:..., BRLA:... }
  const [quote, setQuote] = useState(null); // bigint amountOut (base units do token de saída)
  const [quoteError, setQuoteError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState('');
  const [account, setAccount] = useState(null);
  const [balances, setBalances] = useState({}); // symbol -> bigint string
  const [reserves, setReserves] = useState(null); // symbol -> bigint
  const [networkName, setNetworkName] = useState('');
  const { connect: walletConnect, disconnect: walletDisconnect, getProvider } = useWallet();

  const explorer = explorerUrl || 'https://polygonscan.com';
  const from = tokenBySymbol[fromSymbol];
  const to = tokenBySymbol[toSymbol];
  const isCrossPair = fromSymbol !== 'CAS' && toSymbol !== 'CAS';

  const ensureNetwork = useCallback(async () => {
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
  }, [chainId, getProvider, explorer]);

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
  }, [walletConnect, getProvider, chainId, ensureNetwork]);

  const disconnectWallet = useCallback(async () => {
    try {
      await walletDisconnect();
    } catch (err) {
      console.error('[CASSwapInline] disconnect error:', err.message);
    }
    setAccount(null);
    setBalances({});
    setNetworkName('');
    setQuote(null);
    setAmount('');
    setError('');
  }, [walletDisconnect]);

  const readPair = async (swap, getter) => {
    const [n, d] = await swap[getter]();
    return [n, d];
  };

  const loadSwapInfo = useCallback(async () => {
    const provider = getProvider();
    if (!diamondAddress || !provider) return;
    try {
      const ep = new ethers.BrowserProvider(provider);
      const swap = new ethers.Contract(diamondAddress, DIAMOND_SWAP_ABI, ep);

      // Sonda de capacidade: getReservesMulti só existe no facet multi-ativo.
      let multi = false;
      try {
        const [casBal, polBal, usdcBal, brlaBal] = await swap.getReservesMulti();
        setReserves({ CAS: casBal, POL: polBal, USDC: usdcBal, BRLA: brlaBal });
        multi = true;
      } catch {
        const [casBal, usdcBal, polBal] = await swap.getReserves();
        setReserves({ CAS: casBal, POL: polBal, USDC: usdcBal, BRLA: null });
      }
      setMultiAsset(multi);

      const nextRatios = {};
      try { nextRatios.POL = { buy: await readPair(swap, 'getRatio'), sell: await readPair(swap, 'getRatioSell') }; }
      catch (e) { console.warn('[CASSwapInline] ratios POL indisponíveis:', e.message); }
      try { nextRatios.USDC = { buy: await readPair(swap, 'getRatioUSDC'), sell: await readPair(swap, 'getRatioUSDCSell') }; }
      catch (e) { console.warn('[CASSwapInline] ratios USDC indisponíveis:', e.message); }
      try { nextRatios.BRLA = { buy: await readPair(swap, 'getRatioBRLA'), sell: await readPair(swap, 'getRatioBRLASell') }; }
      catch (e) { console.warn('[CASSwapInline] ratios BRLA indisponíveis:', e.message); }
      setRatios(nextRatios);

      const fee = await swap.getSwapFeeBps();
      setSwapFeeBps(Number(fee));
      const isPaused = await swap.isSwapPaused();
      setPaused(isPaused);
    } catch (err) {
      console.error('[CASSwapInline] loadSwapInfo:', err.message);
      setError('Não foi possível carregar os dados do swap. Verifique a rede e o endereço do Diamond.');
    }
  }, [diamondAddress, getProvider]);

  const loadBalances = useCallback(async () => {
    const provider = getProvider();
    if (!account || !provider) return;
    try {
      const ep = new ethers.BrowserProvider(provider);
      const entries = await Promise.all(TOKENS.map(async (t) => {
        if (t.native) return [t.symbol, await ep.getBalance(account)];
        if (!t.address) return [t.symbol, 0n];
        return [t.symbol, await new ethers.Contract(t.address, ERC20_ABI, ep).balanceOf(account)];
      }));
      setBalances(Object.fromEntries(entries.map(([s, b]) => [s, b.toString()])));
    } catch (err) {
      console.error('[CASSwapInline] loadBalances:', err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casTokenAddress, usdcAddress, brlaAddress, account, getProvider]);

  useEffect(() => {
    if (diamondAddress) {
      loadSwapInfo();
    }
  }, [diamondAddress, loadSwapInfo]);

  useEffect(() => {
    if (account) {
      loadBalances();
    }
  }, [account, loadBalances]);

  // ------------------------------------------------------------------
  // Cotação client-side (espelha LibCASSwap.quoteSwap) — usada como
  // fallback quando os seletores multi-ativo ainda não estão no Diamond.
  // ------------------------------------------------------------------
  function clientQuote(amountIn) {
    if (!ratios) throw new Error('Ratios não carregados.');
    const feeBps = BigInt(swapFeeBps);
    const rIn = fromSymbol === 'CAS' ? null : ratios[fromSymbol];
    const rOut = toSymbol === 'CAS' ? null : ratios[toSymbol];

    if (toSymbol === 'CAS') {
      if (!rIn) throw new Error(`Ratio ${fromSymbol} indisponível.`);
      const [num, den] = rIn.buy;
      if (num === 0n || den === 0n) throw new Error(`Ratio ${fromSymbol} não configurado.`);
      const fee = (amountIn * feeBps) / BPS_DENOMINATOR;
      return ((amountIn - fee) * num) / den;
    }
    if (fromSymbol === 'CAS') {
      if (!rOut) throw new Error(`Ratio ${toSymbol} indisponível.`);
      const [num, den] = rOut.sell;
      if (num === 0n || den === 0n) throw new Error(`Ratio ${toSymbol} não configurado.`);
      const outEq = (amountIn * den) / num;
      const fee = (outEq * feeBps) / BPS_DENOMINATOR;
      return outEq - fee;
    }
    if (!rIn || !rOut) throw new Error('Rota indisponível até a atualização do contrato.');
    const [inNum, inDen] = rIn.buy;
    const [outNum, outDen] = rOut.sell;
    if (inNum === 0n || inDen === 0n || outNum === 0n || outDen === 0n) {
      throw new Error('Ratio da rota não configurado.');
    }
    const fee = (amountIn * feeBps) / BPS_DENOMINATOR;
    const casEq = ((amountIn - fee) * inNum) / inDen;
    return (casEq * outDen) / outNum;
  }

  // Cotação on-chain (quoteSwap) quando disponível; fallback local.
  useEffect(() => {
    let cancelled = false;
    setQuote(null);
    setQuoteError('');
    if (!diamondAddress || !amount || parseFloat(amount) <= 0 || fromSymbol === toSymbol) return;
    if (!multiAsset && (isCrossPair || fromSymbol === 'BRLA' || toSymbol === 'BRLA')) return;

    const run = async () => {
      setQuoting(true);
      try {
        const amountIn = ethers.parseUnits(amount, from.decimals);
        let out;
        if (multiAsset) {
          const provider = getProvider();
          if (!provider) return;
          const ep = new ethers.BrowserProvider(provider);
          const swap = new ethers.Contract(diamondAddress, DIAMOND_SWAP_ABI, ep);
          [out] = await swap.quoteSwap(from.id, to.id, amountIn);
        } else {
          out = clientQuote(amountIn);
        }
        if (!cancelled) setQuote(out);
      } catch (err) {
        if (!cancelled) {
          const decoded = decodeSwapError(err);
          setQuoteError(decoded ? decoded.user : 'Não foi possível cotar este valor.');
        }
      } finally {
        if (!cancelled) setQuoting(false);
      }
    };
    const timer = setTimeout(run, 300); // debounce
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, fromSymbol, toSymbol, multiAsset, ratios, swapFeeBps, diamondAddress]);

  const fmt = (value, decimals) => {
    try {
      const n = Number(ethers.formatUnits(value, decimals));
      if (!isFinite(n)) return '0';
      return n >= 1 ? n.toFixed(4) : n.toPrecision(4);
    } catch {
      return '0';
    }
  };

  const preview = quote != null ? fmt(quote, to.decimals) : '0';
  const minOutWei = quote != null ? (quote * (BPS_DENOMINATOR - SLIPPAGE_BPS)) / BPS_DENOMINATOR : 0n;
  const minOut = fmt(minOutWei, to.decimals);
  const feePercent = (swapFeeBps / Number(BPS_DENOMINATOR)) * 100;

  const routeLabel = isCrossPair ? `${fromSymbol} → CAS → ${toSymbol}` : `${fromSymbol} → ${toSymbol}`;
  const routeAvailable = multiAsset ||
    (!isCrossPair && fromSymbol !== 'BRLA' && toSymbol !== 'BRLA');

  function invertPair() {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setQuote(null);
  }

  async function ensureAllowance(token, owner, required, gasOverrides) {
    const allowance = await token.allowance(owner, diamondAddress);
    if (allowance < required) {
      const approveTx = await token.approve(diamondAddress, required, gasOverrides);
      await approveTx.wait();
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

      if (fromSymbol === toSymbol) {
        setError('Selecione dois ativos diferentes.');
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
      const amountIn = ethers.parseUnits(amount, from.decimals);

      // Saldo do usuário
      const userBal = balances[fromSymbol] != null ? BigInt(balances[fromSymbol]) : null;
      if (userBal != null && amountIn > userBal) {
        throw new Error(`Saldo insuficiente de ${fromSymbol}: você tem ${fmt(userBal, from.decimals)} ${fromSymbol}. — Próximo passo: deposite mais ${fromSymbol} na carteira.`);
      }

      // Reserva do ativo de saída
      const expectedOut = quote != null ? quote : clientQuote(amountIn);
      const reserveOut = reserves?.[toSymbol];
      if (reserveOut != null && expectedOut > reserveOut) {
        throw new Error(`O contrato não tem ${toSymbol} suficiente. Reserva: ${fmt(reserveOut, to.decimals)} ${toSymbol}. — Próximo passo: reduza o valor ou aguarde o reabastecimento.`);
      }

      const minOut = (expectedOut * (BPS_DENOMINATOR - SLIPPAGE_BPS)) / BPS_DENOMINATOR;

      // Aprovação do input ERC-20 (POL entra via msg.value)
      if (!from.native && from.address) {
        const token = new ethers.Contract(from.address, ERC20_ABI, signer);
        await ensureAllowance(token, account, amountIn, gasOverrides);
      }

      if (multiAsset) {
        const overrides = from.native ? { value: amountIn, ...gasOverrides } : gasOverrides;
        await swap.swapExact.staticCall(from.id, to.id, amountIn, minOut, deadline, from.native ? { value: amountIn } : {});
        const tx = await swap.swapExact(from.id, to.id, amountIn, minOut, deadline, overrides);
        await tx.wait();
        setTxHash(tx.hash);
      } else {
        // Caminho legado: apenas CAS <-> POL/USDC.
        if (toSymbol === 'CAS' && fromSymbol === 'POL') {
          await swap.buyCASWithPOL.staticCall(minOut, deadline, { value: amountIn });
          const tx = await swap.buyCASWithPOL(minOut, deadline, { value: amountIn, ...gasOverrides });
          await tx.wait();
          setTxHash(tx.hash);
        } else if (fromSymbol === 'CAS' && toSymbol === 'POL') {
          await swap.sellCASForPOL.staticCall(amountIn, minOut, deadline);
          const tx = await swap.sellCASForPOL(amountIn, minOut, deadline, gasOverrides);
          await tx.wait();
          setTxHash(tx.hash);
        } else if (toSymbol === 'CAS' && fromSymbol === 'USDC') {
          await swap.buyCASWithUSDC.staticCall(amountIn, minOut, deadline);
          const tx = await swap.buyCASWithUSDC(amountIn, minOut, deadline, gasOverrides);
          await tx.wait();
          setTxHash(tx.hash);
        } else if (fromSymbol === 'CAS' && toSymbol === 'USDC') {
          await swap.sellCASForUSDC.staticCall(amountIn, minOut, deadline);
          const tx = await swap.sellCASForUSDC(amountIn, minOut, deadline, gasOverrides);
          await tx.wait();
          setTxHash(tx.hash);
        } else {
          throw new Error('Esta rota requer a atualização multi-ativo do contrato. Rotas disponíveis agora: CAS ↔ POL e CAS ↔ USDC.');
        }
      }

      loadBalances();
      loadSwapInfo();
    } catch (err) {
      console.error('[CASSwapInline] swap error:', err);
      setError(formatUserError(err));
    }
    setLoading(false);
  }

  const outputReserveEmpty = reserves && reserves[toSymbol] === 0n;
  const balance = balances[fromSymbol];

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
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Conectado: {account.slice(0, 6)}...{account.slice(-4)}
              {TOKENS.map((t) => balances[t.symbol] != null && (
                <span key={t.symbol} className="ml-2 text-slate-400">
                  {t.symbol}: {fmt(balances[t.symbol], t.decimals)}
                </span>
              ))}
            </p>
            <button
              type="button"
              onClick={disconnectWallet}
              className="btn-secondary px-2 py-1 text-xs"
              aria-label="Desconectar carteira"
            >
              <LogOut size={12} /> Sair
            </button>
          </div>
          {networkName && (
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <Network size={12} /> {networkName}
              {chainId && (
                <span className={
                  networkName === 'matic' || networkName.includes(String(chainId))
                    ? 'text-green-400'
                    : 'text-amber-400'
                }>
                  {networkName === 'matic' || networkName.includes(String(chainId)) ? ' ✓' : ' ⚠ rede incorreta'}
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {/* From token */}
      <div>
        <div className="flex items-center justify-between">
          <label className="label">Você paga</label>
          {balance != null && (
            <button
              type="button"
              className="text-xs text-brand-400 hover:text-brand-300"
              onClick={() => setAmount(ethers.formatUnits(balance, from.decimals))}
            >
              Saldo: {fmt(balance, from.decimals)} — MAX
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            step={to.decimals === 6 || from.decimals === 6 ? '0.01' : '0.000001'}
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="input flex-[3] min-w-0"
          />
          <select
            value={fromSymbol}
            onChange={(e) => {
              const next = e.target.value;
              setFromSymbol(next);
              if (next === toSymbol) setToSymbol(next === 'CAS' ? 'POL' : 'CAS');
            }}
            className="input flex-1 min-w-0"
          >
            {TOKENS.map((t) => (
              <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Invert */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={invertPair}
          className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700"
          aria-label="Inverter par"
        >
          <ArrowDown size={16} />
        </button>
      </div>

      {/* To token */}
      <div>
        <label className="label">Você recebe</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={quoting ? 'cotando…' : preview}
            className="input flex-[3] min-w-0 bg-slate-800/60"
          />
          <select
            value={toSymbol}
            onChange={(e) => {
              const next = e.target.value;
              setToSymbol(next);
              if (next === fromSymbol) setFromSymbol(next === 'CAS' ? 'POL' : 'CAS');
            }}
            className="input flex-1 min-w-0"
          >
            {TOKENS.map((t) => (
              <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {!routeAvailable && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            A rota {routeLabel} será habilitada após a atualização multi-ativo do
            contrato. No momento estão disponíveis CAS ↔ POL e CAS ↔ USDC.
          </span>
        </div>
      )}

      {reserves && (
        <div className={`rounded-lg p-3 text-sm ${outputReserveEmpty ? 'border border-amber-500/40 bg-amber-500/10 text-amber-300' : 'bg-slate-800/50'}`}>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Liquidez do contrato</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1">
            {TOKENS.map((t) => reserves[t.symbol] != null && (
              <span key={t.symbol}>{t.symbol}: {fmt(reserves[t.symbol], t.decimals)}</span>
            ))}
          </div>
          {outputReserveEmpty && (
            <p className="mt-1 text-xs">Sem {toSymbol} no contrato. Esta direção fica indisponível até nova liquidez ser adicionada.</p>
          )}
        </div>
      )}

      <div className="rounded-lg bg-slate-800/50 p-3 text-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Rota</span>
          <span className="text-slate-300">{routeLabel}</span>
        </div>
        {isCrossPair && (
          <p className="text-xs text-slate-500">
            Rota composta: o CAS é usado apenas como unidade de conta interna —
            você recebe {toSymbol} diretamente.
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Swap Fee</span>
          <span className="text-slate-300">{feePercent.toFixed(2)}%</span>
        </div>
        {isCrossPair && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Spread</span>
            <span className="text-slate-300">compra + venda (2 pernas)</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Você recebe (previsão)</span>
          <span className="font-bold text-white">
            {preview} {toSymbol}
          </span>
        </div>
        {quote != null && quote > 0n && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-slate-500">Mínimo a receber (slippage 1%)</span>
            <span className="text-slate-300">
              {minOut} {toSymbol}
            </span>
          </div>
        )}
        <p className="pt-1 text-xs text-slate-500">
          O swap opera com preços de compra e venda distintos (spread) definidos
          pelo operador a partir das pools de mercado: você compra CAS pelo maior
          preço observado e vende pelo menor. A diferença entre os dois preços
          financia a manutenção das reservas de liquidez do contrato.
        </p>
      </div>

      {quoteError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{quoteError}</span>
        </div>
      )}

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
        disabled={
          loading ||
          !amount ||
          parseFloat(amount) <= 0 ||
          paused ||
          !routeAvailable ||
          quote == null ||
          outputReserveEmpty
        }
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Processando...</>
        ) : (
          <><ArrowUpDown size={16} /> Trocar {fromSymbol} por {toSymbol}</>
        )}
      </button>
    </div>
  );
}
