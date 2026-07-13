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
  Info
} from 'lucide-react';
import Spinner from '@/components/Spinner';
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
      if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask não está instalado.');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta MetaMask conectada.');
      }

      const account = accounts[0];
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const gasOverrides = await getGasOverrides(provider);

      // Verificar chain ID
      const network = await provider.getNetwork();
      if (config.chainId && Number(network.chainId) !== config.chainId) {
        setStep('Trocando rede na MetaMask...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + config.chainId.toString(16) }],
          });
        } catch {
          throw new Error(`Conecte-se à rede chainId=${config.chainId} na MetaMask.`);
        }
      }

      const diamondAddress = config.diamondAddress;
      const casTokenAddress = config.casTokenAddress;
      const registrationFee = BigInt(config.registrationFee || '0');

      // Step 1: Approve CAS tokens (se houver taxa e token configurado)
      if (registrationFee > 0n && casTokenAddress && casTokenAddress !== ethers.ZeroAddress) {
        setStep('Aprovando tokens CAS...');
        const casContract = new ethers.Contract(
          casTokenAddress,
          config.abis.casToken,
          signer
        );

        // Verifica allowance atual
        const currentAllowance = await casContract.allowance(account, diamondAddress);
        if (currentAllowance < registrationFee) {
          const approveTx = await casContract.approve(diamondAddress, registrationFee, gasOverrides);
          await approveTx.wait();
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
        const publicIdHash = ethers.keccak256(ethers.toUtf8Bytes(did));
        tx = await userRegistry.registerUser(didHash, publicIdHash, gasOverrides);
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
        />
      )}

      {showModal && registration?.receipt && (
        <RegistrationDetailsModal
          receipt={registration.receipt}
          onClose={() => setShowModal(false)}
          formatGasCost={formatGasCost}
          formatTimestamp={formatTimestamp}
          copyToClipboard={copyToClipboard}
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
function RegistrationConfirmModal({ onConfirm, onCancel }) {
  return (
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
    </div>
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
  copyToClipboard
}) {
  if (!receipt) return null;

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

  return (
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
    </div>
  );
}
