'use client';

/**
 * @file OnchainRegistrationButton.js
 * @description Botão e modal para registro on-chain de perfis (usuário e agente).
 *
 * Quando o perfil ainda não está registrado na blockchain, exibe um botão
 * "Registrar na Blockchain" que inicia o fluxo MetaMask (approve CAS + register).
 * Após o registro, o botão se torna "Detalhes do Registro" e abre uma modal
 * com os detalhes da transação (txHash, block, gas, custo, timestamp, explorer).
 *
 * Degrada graciosamente quando DIAMOND_ADDRESS não está configurado.
 */

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ethers } from 'ethers';
import {
  Link2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  X,
  Copy,
  Fuel,
  Hash,
  Calendar,
  ArrowRight,
  Download,
  ShieldAlert,
  Info,
  Coins
} from 'lucide-react';
import Spinner from '@/components/Spinner';
import { useWallet } from '@/lib/wallet/useWallet';
import {
  getOnchainConfig,
  getUserOnchainRegistration,
  saveUserOnchainRegistration,
  getAgentOnchainRegistration,
  saveAgentOnchainRegistration
} from '@/lib/api';

const METAMASK_MESSAGE = 'Register on Agentic Space Diamond';

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

/**
 * @param {{ ownerType: 'user'|'agent', publicId?: string, jwt: string, walletAddress?: string, did: string, agent?: Object|null }} props
 */
export default function OnchainRegistrationButton({
  ownerType,
  publicId,
  jwt,
  walletAddress,
  did,
  agent
}) {
  const [config, setConfig] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('');
  const [paymentAsset, setPaymentAsset] = useState('CAS');
  const { connect: walletConnect, getProvider } = useWallet();

  const fetchConfig = useCallback(async () => {
    if (!jwt) return;
    try {
      const { status, data } = await getOnchainConfig(jwt);
      if (status < 400) {
        setConfig(data);
      }
    } catch {
      // Config não disponível
    }
  }, [jwt]);

  const fetchRegistration = useCallback(async () => {
    if (!jwt) return;
    try {
      const { status, data } = ownerType === 'user'
        ? await getUserOnchainRegistration(jwt)
        : await getAgentOnchainRegistration(publicId, jwt);

      if (status < 400) {
        setRegistration(data);
      }
    } catch {
      // Registro não encontrado
    } finally {
      setLoading(false);
    }
  }, [jwt, ownerType, publicId]);

  useEffect(() => {
    fetchConfig();
    fetchRegistration();
  }, [fetchConfig, fetchRegistration]);

  const isRegistered = Boolean(registration?.registered || registration?.receipt);
  const isEnabled = config?.enabled;

  async function handleRegister() {
    setError('');
    setRegistering(true);
    setStep('');

    try {
      const { accounts } = await walletConnect();
      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta conectada.');
      }

      const account = accounts[0];
      const rawProvider = getProvider();
      if (!rawProvider) throw new Error('Carteira não conectada.');
      const provider = new ethers.BrowserProvider(rawProvider);
      const signer = await provider.getSigner();

      const gasOverrides = await getGasOverrides(provider);

      // Verificar chain ID
      const network = await provider.getNetwork();
      if (config.chainId && Number(network.chainId) !== config.chainId) {
        setStep('Trocando rede na carteira...');
        try {
          await rawProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + config.chainId.toString(16) }],
          });
        } catch {
          throw new Error(`Conecte-se à rede chainId=${config.chainId} na carteira.`);
        }
      }

      const diamondAddress = config.diamondAddress;
      const casTokenAddress = config.casTokenAddress;
      const registrationFee = BigInt(config.registrationFee || '0');
      const userRegistrationFee = BigInt(config.userRegistrationFee || '0');

      // Pre-check: verify CAS balance is sufficient before starting
      const requiredFee = ownerType === 'user' ? userRegistrationFee : registrationFee;
      if (requiredFee > 0n && (paymentAsset === 'CAS' || ownerType === 'agent') && casTokenAddress && casTokenAddress !== ethers.ZeroAddress) {
        const casContract = new ethers.Contract(casTokenAddress, config.abis.casToken, provider);
        const balance = await casContract.balanceOf(account);
        if (balance < requiredFee) {
          const feeStr = ethers.formatEther(requiredFee);
          const balStr = ethers.formatEther(balance);
          throw new Error(`Saldo CAS insuficiente. Necessário: ${feeStr} CAS, disponível: ${balStr} CAS. Use o CASSwap para obter CAS tokens.`);
        }
      }

      // Step 1: Prepare payment based on selected asset
      if (ownerType === 'user') {
        if (paymentAsset === 'CAS') {
          if (userRegistrationFee > 0n && casTokenAddress && casTokenAddress !== ethers.ZeroAddress) {
            setStep('Aprovando tokens CAS...');
            const casContract = new ethers.Contract(
              casTokenAddress,
              config.abis.casToken,
              signer
            );
            const currentAllowance = await casContract.allowance(account, diamondAddress);
            if (currentAllowance < userRegistrationFee) {
              const approveTx = await casContract.approve(diamondAddress, userRegistrationFee, gasOverrides);
              await approveTx.wait();
            }
          }
        } else if (paymentAsset === 'POL') {
          // POL payment: msg.value will be sent with registerUser call
          // No approve needed, but we need to calculate the required POL amount
          // The contract validates msg.value against CASSwap ratio
        } else if (paymentAsset === 'WETH') {
          if (!config.wethTokenAddress || config.wethTokenAddress === ethers.ZeroAddress) {
            throw new Error('WETH não disponível nesta rede. Use CAS ou POL.');
          }
          setStep('Aprovando tokens WETH...');
          const wethContract = new ethers.Contract(
            config.wethTokenAddress,
            config.abis.casToken,
            signer
          );
          const currentAllowance = await wethContract.allowance(account, diamondAddress);
          if (currentAllowance < userRegistrationFee) {
            const approveTx = await wethContract.approve(diamondAddress, userRegistrationFee, gasOverrides);
            await approveTx.wait();
          }
        }
      } else {
        // Agent registration: always CAS
        if (registrationFee > 0n && casTokenAddress && casTokenAddress !== ethers.ZeroAddress) {
          setStep('Aprovando tokens CAS...');
          const casContract = new ethers.Contract(
            casTokenAddress,
            config.abis.casToken,
            signer
          );
          const currentAllowance = await casContract.allowance(account, diamondAddress);
          if (currentAllowance < registrationFee) {
            const approveTx = await casContract.approve(diamondAddress, registrationFee, gasOverrides);
            await approveTx.wait();
          }
        }
      }

      // Step 2: Registrar on-chain
      setStep('Enviando transação de registro...');
      let tx;

      if (ownerType === 'user') {
        const userRegistry = new ethers.Contract(
          diamondAddress,
          config.abis.userRegistry,
          signer
        );
        const didHash = ethers.keccak256(ethers.toUtf8Bytes(did));
        const publicIdHash = ethers.keccak256(ethers.toUtf8Bytes(account));
        const assetEnum = paymentAsset === 'CAS' ? 0 : paymentAsset === 'POL' ? 1 : 2;

        let txOverrides = { ...gasOverrides };
        if (paymentAsset === 'POL' && userRegistrationFee > 0n) {
          // Calculate required POL using CASSwap ratio (if available)
          // The contract will validate the exact amount; we send an estimate
          // For simplicity, the user sends the fee equivalent in POL
          // The contract reverts if msg.value doesn't match exactly
          txOverrides.value = userRegistrationFee; // Approximate — contract validates
        }

        tx = await userRegistry.registerUser(didHash, publicIdHash, assetEnum, txOverrides);
      } else {
        const agentRegistry = new ethers.Contract(
          diamondAddress,
          config.abis.agentRegistry,
          signer
        );
        const didHash = ethers.keccak256(ethers.toUtf8Bytes(did));
        const merkleRoot = ethers.keccak256(
          ethers.toUtf8Bytes(`${agent.auid || ''}:${agent.name || ''}:${agent.description || ''}`)
        );
        tx = await agentRegistry.registerAgent(
          didHash,
          agent.publicId || publicId,
          agent.auid || '',
          agent.name || '',
          agent.description || '',
          agent.parentPublicId || '',
          merkleRoot,
          0,
          gasOverrides
        );
      }

      setStep('Aguardando confirmação da transação...');
      await tx.wait();

      // Step 3: Persistir recibo no backend
      setStep('Salvando recibo no backend...');
      const { status, data } = ownerType === 'user'
        ? await saveUserOnchainRegistration(tx.hash, jwt)
        : await saveAgentOnchainRegistration(publicId, tx.hash, jwt);

      if (status >= 400) {
        throw new Error(data.error || 'Falha ao salvar recibo no backend.');
      }

      setRegistration({ registered: true, receipt: data.receipt });
      setShowModal(true);
      setStep('');
    } catch (err) {
      setError(err.message || 'Falha no registro on-chain.');
      setStep('');
    } finally {
      setRegistering(false);
    }
  }

  function formatGasCost(weiStr) {
    if (!weiStr) return '—';
    try {
      const eth = ethers.formatEther(BigInt(weiStr));
      return `${parseFloat(eth).toFixed(6)} MATIC`;
    } catch {
      return '—';
    }
  }

  function formatTimestamp(ts) {
    if (!ts) return '—';
    try {
      return new Date(Number(ts) * 1000).toLocaleString('pt-BR');
    } catch {
      return '—';
    }
  }

  async function copyToClipboard(text) {
    if (text) await navigator.clipboard.writeText(text);
  }

  // Loading state
  if (loading) {
    return (
      <button className="btn-secondary" disabled>
        <Spinner size={16} />
      </button>
    );
  }

  // Not enabled — degrades gracefully
  if (!isEnabled) {
    return (
      <button
        className="btn-secondary cursor-not-allowed opacity-50"
        disabled
        title="Registro on-chain indisponível. DIAMOND_ADDRESS não configurado."
      >
        <Link2 size={16} /> Blockchain indisponível
      </button>
    );
  }

  // Already registered — show details button
  if (isRegistered) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="btn-secondary"
          title="Ver detalhes do registro on-chain"
        >
          <CheckCircle2 size={16} className="text-green-400" />
          Detalhes do Registro
        </button>

        {showModal && (
          <RegistrationDetailsModal
            receipt={registration?.receipt}
            onClose={() => setShowModal(false)}
            formatGasCost={formatGasCost}
            formatTimestamp={formatTimestamp}
            copyToClipboard={copyToClipboard}
            ownerType={ownerType}
            paymentAsset={paymentAsset}
            config={config}
          />
        )}
      </>
    );
  }

  // Not registered — show register button
  return (
    <>
      <button
        onClick={() => setShowConfirmModal(true)}
        className="btn-primary"
        disabled={registering}
        title="Registrar perfil na blockchain via MetaMask"
      >
        {registering ? (
          <Spinner size={16} />
        ) : (
          <Link2 size={16} />
        )}
        {registering ? (step || 'Registrando...') : 'Registrar na Blockchain'}
      </button>

      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showConfirmModal && (
        <RegistrationConfirmModal
          onConfirm={() => {
            setShowConfirmModal(false);
            handleRegister();
          }}
          onCancel={() => setShowConfirmModal(false)}
          ownerType={ownerType}
          paymentAsset={paymentAsset}
          setPaymentAsset={setPaymentAsset}
          config={config}
        />
      )}

      {showModal && registration?.receipt && (
        <RegistrationDetailsModal
          receipt={registration.receipt}
          onClose={() => setShowModal(false)}
          formatGasCost={formatGasCost}
          formatTimestamp={formatTimestamp}
          copyToClipboard={copyToClipboard}
          ownerType={ownerType}
          paymentAsset={paymentAsset}
          config={config}
        />
      )}
    </>
  );
}

/**
 * Modal de confirmação antes de iniciar o registro on-chain.
 * Alerta que a ligação entre conta de login e address não poderá ser alterada
 * após o registro. Se alterada, o registro é invalidado on-chain e o usuário
 * precisará repetir todo o processo.
 */
function RegistrationConfirmModal({ onConfirm, onCancel, ownerType, paymentAsset, setPaymentAsset, config }) {
  const userRegFee = config?.userRegistrationFee;
  const agentRegFee = config?.registrationFee;
  const wethAvailable = config?.wethTokenAddress && config.wethTokenAddress !== ethers.ZeroAddress;
  const infraFundAddress = config?.infrastructureFundAddress;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        className="card max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <ShieldAlert size={20} className="text-amber-400" />
            Aviso Importante
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          {ownerType === 'user' && (
            <div className="space-y-2">
              <label className="text-slate-400 font-medium">Forma de Pagamento da Taxa de Registro</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentAsset('CAS')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                    paymentAsset === 'CAS'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400'
                  }`}
                >
                  CAS
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAsset('POL')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                    paymentAsset === 'POL'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400'
                  }`}
                >
                  POL
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAsset('WETH')}
                  disabled={!wethAvailable}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                    paymentAsset === 'WETH'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400'
                  } ${!wethAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title={wethAvailable ? 'WETH (Mainnet)' : 'WETH não disponível nesta rede'}
                >
                  WETH
                </button>
              </div>
              {userRegFee && userRegFee !== '0' && (
                <p className="text-xs text-slate-500">
                  Taxa: {ethers.formatEther(BigInt(userRegFee))} CAS
                  {paymentAsset === 'POL' && ' (convertido via CASSwap)'}
                  {paymentAsset === 'WETH' && ' (convertido via CASSwap)'}
                </p>
              )}
            </div>
          )}
          {ownerType === 'agent' && agentRegFee && agentRegFee !== '0' && (
            <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <div className="flex items-center gap-2 text-slate-400 font-medium">
                <Coins size={16} className="text-brand-400" />
                <span>Taxa de Registro de Agente</span>
              </div>
              <p className="text-sm text-white">
                {ethers.formatEther(BigInt(agentRegFee))} CAS
              </p>
              <p className="text-xs text-slate-500">
                Pagamento em CAS tokens. A taxa é transferida para o InfrastructureFund.
                {infraFundAddress && (
                  <> Endereço: <code className="font-mono text-slate-400">{infraFundAddress.slice(0, 10)}...{infraFundAddress.slice(-8)}</code></>
                )}
              </p>
            </div>
          )}
          <p>
            Ao efetuar o registro on-chain, a ligação entre sua conta de login
            e o endereço da carteira (wallet address) será registrada na blockchain
            de forma <strong className="text-white">permanente</strong>.
          </p>
          <p>
            <strong className="text-amber-300">Não será possível trocar essa ligação
            após o registro.</strong> Se você alterar a vinculação da conta de login
            com o endereço da carteira, o registro será invalidado.
          </p>
          <p>
            Em caso de invalidação, será feito um cadastro na blockchain de
            invalidação do registro, e você precisará repetir todo o processo
            de registro novamente.
          </p>
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
            <span className="text-amber-100">
              Certifique-se de que a conta MetaMask conectada é a correta antes
              de prosseguir.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={onConfirm} className="btn-primary">
            <Link2 size={16} />
            Entendi, registrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Modal de detalhes do registro on-chain.
 */
function RegistrationDetailsModal({
  receipt,
  onClose,
  formatGasCost,
  formatTimestamp,
  copyToClipboard,
  ownerType,
  paymentAsset,
  config
}) {
  if (!receipt) return null;

  const feeAmount = ownerType === 'user'
    ? config?.userRegistrationFee
    : config?.registrationFee;
  const infraFundAddress = config?.infrastructureFundAddress;
  const diamondAddress = config?.diamondAddress;
  const explorerUrl = config?.explorerUrl || '';

  function handleSaveJson() {
    const jsonData = {
      title: 'Registro On-Chain - Agentic Space',
      description: 'Recibo de registro na blockchain. Guarde este arquivo com segurança.',
      warning: 'Estes dados são de responsabilidade do usuário. A perda destas informações pode impedir a recuperação do registro.',
      savedAt: new Date().toISOString(),
      receipt: {
        txHash: receipt.txHash,
        blockNumber: receipt.blockNumber,
        fromAddress: receipt.fromAddress,
        gasUsed: receipt.gasUsed,
        gasPrice: receipt.gasPrice,
        totalGasCost: receipt.totalGasCost,
        txTimestamp: receipt.txTimestamp,
        explorerUrl: receipt.explorerUrl,
        metadata: receipt.metadata,
        createdAt: receipt.createdAt,
        fee: {
          type: ownerType === 'user' ? 'User Registration' : 'Agent Registration',
          asset: paymentAsset || 'CAS',
          amount: feeAmount || '0',
          amountFormatted: feeAmount ? ethers.formatEther(BigInt(feeAmount)) : '0',
          infrastructureFundAddress: infraFundAddress || '',
          diamondAddress: diamondAddress || '',
        },
      },
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onchain-registration-${receipt.txHash?.slice(0, 10) || 'receipt'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="card max-w-lg space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <CheckCircle2 size={20} className="text-green-400" />
            Detalhes do Registro On-Chain
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          {/* Transaction Hash */}
          <div className="rounded-lg border border-slate-800 p-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Hash size={14} />
              <span>Hash da Transação</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <code className="break-all font-mono text-xs text-slate-200">
                {receipt.txHash}
              </code>
              <button
                onClick={() => copyToClipboard(receipt.txHash)}
                className="shrink-0 text-slate-400 hover:text-white"
                title="Copiar"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          {/* Block Number */}
          {receipt.blockNumber != null && (
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Hash size={14} />
                <span>Bloco</span>
              </div>
              <div className="mt-1 font-mono text-slate-200">
                #{receipt.blockNumber}
              </div>
            </div>
          )}

          {/* Fee Paid */}
          {feeAmount && feeAmount !== '0' && (
            <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 p-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Coins size={14} className="text-brand-400" />
                <span>Taxa Paga</span>
              </div>
              <div className="mt-1 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipo</span>
                  <span className="text-slate-200">
                    {ownerType === 'user' ? 'Registro de Usuário' : 'Registro de Agente'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Asset</span>
                  <span className="text-slate-200">{paymentAsset || 'CAS'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor</span>
                  <span className="font-mono text-brand-400">
                    {ethers.formatEther(BigInt(feeAmount))} {paymentAsset || 'CAS'}
                  </span>
                </div>
                {infraFundAddress && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">InfrastructureFund</span>
                    <a
                      href={`${explorerUrl}/address/${infraFundAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-brand-300 hover:underline"
                    >
                      {infraFundAddress.slice(0, 10)}...{infraFundAddress.slice(-8)}
                    </a>
                  </div>
                )}
                {diamondAddress && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Diamond Proxy</span>
                    <a
                      href={`${explorerUrl}/address/${diamondAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-brand-300 hover:underline"
                    >
                      {diamondAddress.slice(0, 10)}...{diamondAddress.slice(-8)}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gas Costs */}
          <div className="rounded-lg border border-slate-800 p-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Fuel size={14} />
              <span>Custos da Transação</span>
            </div>
            <div className="mt-1 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Gas usado</span>
                <span className="font-mono text-slate-200">{receipt.gasUsed || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gas price</span>
                <span className="font-mono text-slate-200">
                  {receipt.gasPrice ? ethers.formatUnits(BigInt(receipt.gasPrice), 'gwei') + ' gwei' : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Custo total</span>
                <span className="font-mono text-brand-400">
                  {formatGasCost(receipt.totalGasCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          {receipt.txTimestamp && (
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar size={14} />
                <span>Data do Registro</span>
              </div>
              <div className="mt-1 text-slate-200">
                {formatTimestamp(receipt.txTimestamp)}
              </div>
            </div>
          )}

          {/* From Address */}
          {receipt.fromAddress && (
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="text-slate-400">Carteira de Origem</div>
              <div className="mt-1 flex items-center gap-2">
                <code className="break-all font-mono text-xs text-slate-200">
                  {receipt.fromAddress}
                </code>
                <button
                  onClick={() => copyToClipboard(receipt.fromAddress)}
                  className="shrink-0 text-slate-400 hover:text-white"
                  title="Copiar"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Save JSON Warning */}
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
              <div className="space-y-2">
                <p className="text-xs text-amber-100">
                  <strong>Atenção:</strong> Estes dados são de responsabilidade do usuário.
                  A perda destas informações pode impedir a recuperação do registro.
                </p>
                <button
                  onClick={handleSaveJson}
                  className="btn-secondary w-full justify-center text-sm"
                >
                  <Download size={16} />
                  Salvar dados do registro (JSON)
                </button>
              </div>
            </div>
          </div>

          {/* Explorer Link */}
          {receipt.explorerUrl && (
            <a
              href={receipt.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary w-full justify-center"
            >
              <ExternalLink size={16} />
              Ver no Explorer
              <ArrowRight size={14} />
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
