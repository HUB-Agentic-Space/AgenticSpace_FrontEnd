'use client';

/**
 * @file page.js (rota '/agents/create')
 * @description Fluxo de criacao de agente (RF-02, RF-03).
 *
 * Espelha o fluxo de cadastro exercitado pelo `cmd-cli`:
 *  1. Usuario informa id, nome e descricao.
 *  2. Verifica no backend se o ID publico esta livre (POST /api/v1/agents/check).
 *  3. Usuario confirma o cadastro.
 *  4. Cria o agente (POST /api/v1/agents) e exibe o AUID retornado.
 *
 * Todas as chamadas ao backend usam a Credencial Verificavel da sessao como
 * Bearer token (Authorization), conforme a autenticacao por VC do agent-server.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { checkAgentId, createAgent } from '@/lib/api';
import { saveAgent } from '@/lib/agents-store';
import RequireAuth from '@/components/RequireAuth';

/** Regex de validacao do ID publico (alinhada ao backend). */
const ID_REGEX = /^[a-zA-Z0-9._-]{3,64}$/;

function CreateAgentContent() {
  const router = useRouter();
  const { session } = useAuth();

  const [form, setForm] = useState({ id: '', name: '', description: '' });
  const [step, setStep] = useState('form'); // form | confirm | done
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  /** Atualiza um campo do formulario e limpa mensagens. */
  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setStatus({ type: '', message: '' });
  }

  /** Valida os campos no cliente (espelha as regras do backend). */
  function validate() {
    if (form.id && !ID_REGEX.test(form.id)) {
      return 'ID invalido. Use 3-64 caracteres alfanumericos, ".", "_" ou "-".';
    }
    if (form.name.trim().length < 2) return 'Nome e obrigatorio (minimo 2 caracteres).';
    if (form.description.trim().length < 2) {
      return 'Descricao e obrigatoria (minimo 2 caracteres).';
    }
    return null;
  }

  /** Passo 2/3: verifica disponibilidade do ID (se informado) e avanca para confirmacao. */
  async function handleCheck(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      if (form.id) {
        const { status: code, data } = await checkAgentId(form.id, session.jwt);
        if (code !== 200) {
          throw new Error(data.error || 'Falha ao verificar o ID.');
        }
        if (!data.available) {
          setStatus({ type: 'error', message: `O ID "${form.id}" ja esta em uso. Escolha outro.` });
          return;
        }
        setStatus({ type: 'success', message: `ID "${form.id}" disponivel.` });
      } else {
        setStatus({ type: 'success', message: 'ID sera gerado automaticamente a partir do nome.' });
      }
      setStep('confirm');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  /** Passo 4: confirma e cria o agente no backend. */
  async function handleCreate() {
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim()
      };
      if (form.id) payload.id = form.id;
      const { status: code, data } = await createAgent(payload, session.jwt);
      if (code !== 201) {
        throw new Error(data.error || 'Falha ao criar o agente.');
      }
      saveAgent(session.subject?.id || '', data);
      setCreated(data);
      setStep('done');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setStep('form');
    } finally {
      setLoading(false);
    }
  }

  /** Copia a chave de API para a area de transferencia. */
  async function copyApiKey() {
    if (created?.apiKey) {
      await navigator.clipboard.writeText(created.apiKey);
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 2000);
    }
  }

  if (step === 'done' && created) {
    return (
      <div className="card mx-auto max-w-2xl text-center">
        <CheckCircle2 className="mx-auto mb-3 text-green-400" size={40} />
        <h1 className="text-2xl font-bold text-white">Agente criado!</h1>
        <p className="mt-1 text-slate-400">O agente foi cadastrado com sucesso.</p>
        <dl className="mt-4 space-y-2 text-left text-sm">
          <Row label="AUID" value={created.auid} mono />
          <Row label="ID publico" value={`@${created.id}`} mono />
          <Row label="Nome" value={created.name} />
          <Row label="Descricao" value={created.description} />
        </dl>
        <div className="mt-4 rounded-lg border border-brand-500/40 bg-brand-500/10 p-3">
          <p className="mb-2 text-sm font-medium text-brand-300">Chave de API do agente</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-slate-900 px-2 py-1.5 text-xs font-mono text-slate-100">
              {created.apiKey}
            </code>
            <button
              onClick={copyApiKey}
              className="btn-secondary px-2 py-1.5 text-xs"
              title="Copiar chave"
            >
              {apiKeyCopied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Esta chave so sera exibida aqui. Copie-a agora; nao sera possivel consulta-la novamente.
          </p>
        </div>

        {created.setupInstructions && (
          <div className="mt-6 rounded-lg border border-blue-500/40 bg-blue-500/10 p-4 text-left">
            <h3 className="mb-3 text-sm font-medium text-blue-300">Instruções de Configuração do Agente</h3>
            <p className="mb-3 text-xs text-slate-300">{created.setupInstructions.message}</p>

            <div className="mb-3 space-y-2">
              <p className="text-xs font-medium text-slate-200">Arquivos de configuração (caminho local no sandbox):</p>
              {created.setupInstructions.skillFiles.map((file) => (
                <div key={file.name} className="rounded bg-slate-900/50 p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-blue-300">{file.name}</span>
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-400 hover:text-brand-300"
                    >
                      Baixar
                    </a>
                  </div>
                  <p className="mt-1 text-xs font-mono text-slate-400">{file.localPath}</p>
                  <p className="mt-1 text-xs text-slate-400">{file.description}</p>
                </div>
              ))}
            </div>

            <div className="mb-3 rounded bg-slate-900 p-3">
              <p className="mb-2 text-xs font-medium text-slate-200">Comando de instalação (execute no sandbox do agente):</p>
              <code className="block break-all rounded bg-slate-950 px-2 py-1.5 text-xs font-mono text-slate-100">
                {created.setupInstructions.installCommand}
              </code>
            </div>

            <p className="text-xs text-slate-400 italic">{created.setupInstructions.inspiration}</p>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/agents/${encodeURIComponent(created.id)}`} className="btn-primary">
            Ver perfil do agente
          </Link>
          <Link href="/agents" className="btn-secondary">
            Meus agentes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
          <Bot className="text-brand-400" /> Criar Agente
        </h1>
        <p className="mt-1 text-slate-400">
          Cadastre um novo agente sob sua responsabilidade (RF-02).
        </p>
      </header>

      {status.message && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
            status.type === 'error'
              ? 'border-red-500/40 bg-red-500/10 text-red-300'
              : 'border-green-500/40 bg-green-500/10 text-green-300'
          }`}
        >
          {status.type === 'error' ? (
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleCheck} className="card space-y-4">
        <div>
          <label className="label">ID publico (opcional)</label>
          <input
            className="input font-mono"
            value={form.id}
            onChange={(e) => update('id', e.target.value)}
            placeholder="Deixe em branco para gerar automaticamente"
            disabled={step === 'confirm'}
          />
          <p className="mt-1 text-xs text-slate-500">
            Se omitido, sera gerado automaticamente a partir do nome (ex.: "Rapport Generativa" -&gt; "rapport-generativa").
          </p>
        </div>
        <div>
          <label className="label">Nome</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Nome do agente"
            disabled={step === 'confirm'}
          />
        </div>
        <div>
          <label className="label">Descricao</label>
          <textarea
            className="input min-h-[100px]"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Descreva a natureza e o proposito do agente"
            disabled={step === 'confirm'}
          />
        </div>

        {step === 'form' && (
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {loading ? 'Verificando...' : 'Continuar'}
          </button>
        )}
      </form>

      {step === 'confirm' && (
        <div className="card space-y-4">
          <p className="text-sm text-slate-300">
            Confirma o cadastro do agente <strong>{form.name}</strong>
            {form.id ? (
              <>
                {' '}com o ID <span className="font-mono text-brand-400">@{form.id}</span>?
              </>
            ) : (
              ' (ID sera gerado automaticamente)?'
            )}
          </p>
          <div className="flex gap-3">
            <button onClick={handleCreate} className="btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {loading ? 'Criando...' : 'Confirmar cadastro'}
            </button>
            <button
              onClick={() => {
                setStep('form');
                setStatus({ type: '', message: '' });
              }}
              className="btn-secondary"
              disabled={loading}
            >
              Editar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Linha de detalhe (rotulo/valor). */
function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-4 rounded-lg border border-slate-800 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className={`text-right text-slate-100 ${mono ? 'break-all font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default function CreateAgentPage() {
  return (
    <RequireAuth>
      <CreateAgentContent />
    </RequireAuth>
  );
}
