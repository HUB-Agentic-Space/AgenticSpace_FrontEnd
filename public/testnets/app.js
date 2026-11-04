(() => {
  'use strict';

  const CHAINLIST_URL = 'https://chainid.network/chains.json';
  const CACHE_KEY = 'agenticspace:testnets:chainlist:v1';
  const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
  const elements = {
    search: document.querySelector('#search'),
    statusFilter: document.querySelector('#status-filter'),
    tokensFilter: document.querySelector('#tokens-filter'),
    resultCount: document.querySelector('#result-count'),
    snapshotInfo: document.querySelector('#snapshot-info'),
    statusMessage: document.querySelector('#status-message'),
    retryButton: document.querySelector('#retry-button'),
    networkList: document.querySelector('#network-list'),
    dialog: document.querySelector('#token-dialog'),
    dialogDescription: document.querySelector('#dialog-description'),
    dialogAddress: document.querySelector('#dialog-address'),
    dialogStatus: document.querySelector('#dialog-status'),
    copyToken: document.querySelector('#copy-token'),
    addToken: document.querySelector('#add-token')
  };

  const state = { networks: [], tokensByChainId: {}, selected: null, loadedAt: null, source: 'remota' };

  function el(tag, options = {}, children = []) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = String(options.text);
    if (options.type) node.type = options.type;
    if (options.title) node.title = options.title;
    if (options.disabled) node.disabled = true;
    if (options.dataset) Object.assign(node.dataset, options.dataset);
    for (const child of children) if (child) node.append(child);
    return node;
  }

  function safeHttpUrl(value, allowHttp = true) {
    if (typeof value !== 'string' || value.includes('${')) return null;
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' || (allowHttp && url.protocol === 'http:')) return url.href;
    } catch {}
    return null;
  }

  function safeWalletUrl(value) {
    return safeHttpUrl(value, false);
  }

  function normalizeChain(raw) {
    if (!raw || typeof raw !== 'object' || raw.slip44 !== 1) return null;
    const chainId = Number(raw.chainId);
    const networkId = Number(raw.networkId);
    const currency = raw.nativeCurrency;
    if (!Number.isSafeInteger(chainId) || chainId <= 0 || !currency || typeof currency !== 'object') return null;
    const decimals = Number(currency.decimals);
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) return null;
    const symbol = typeof currency.symbol === 'string' ? currency.symbol.trim().slice(0, 20) : '';
    if (!symbol) return null;
    return {
      name: String(raw.name || raw.title || `Chain ${chainId}`).slice(0, 160),
      title: typeof raw.title === 'string' ? raw.title.slice(0, 180) : '',
      chain: typeof raw.chain === 'string' ? raw.chain.slice(0, 24) : '',
      shortName: typeof raw.shortName === 'string' ? raw.shortName.slice(0, 40) : '',
      chainId,
      networkId: Number.isSafeInteger(networkId) ? networkId : null,
      status: raw.status === 'deprecated' ? 'deprecated' : 'active',
      nativeCurrency: {
        name: String(currency.name || symbol).slice(0, 80),
        symbol,
        decimals
      },
      rpc: Array.isArray(raw.rpc) ? raw.rpc.filter(value => typeof value === 'string').slice(0, 20) : [],
      faucets: Array.isArray(raw.faucets) ? raw.faucets.filter(value => typeof value === 'string').slice(0, 20) : [],
      explorers: Array.isArray(raw.explorers) ? raw.explorers.filter(item => item && typeof item.url === 'string').slice(0, 10) : [],
      infoURL: safeHttpUrl(raw.infoURL),
      features: Array.isArray(raw.features) ? raw.features.map(item => String(item?.name || '')).filter(Boolean).slice(0, 20) : [],
      redFlags: Array.isArray(raw.redFlags) ? raw.redFlags.map(String).slice(0, 20) : [],
      parent: raw.parent && typeof raw.parent === 'object' ? {
        chain: String(raw.parent.chain || '').slice(0, 80),
        type: String(raw.parent.type || '').slice(0, 40)
      } : null
    };
  }

  function normalizeToken(raw, chainId) {
    if (!raw || typeof raw !== 'object') return null;
    const address = typeof raw.address === 'string' ? raw.address.trim() : '';
    const symbol = typeof raw.symbol === 'string' ? raw.symbol.trim() : '';
    const decimals = Number(raw.decimals);
    const source = safeWalletUrl(raw.source);
    if (!/^0x[a-fA-F0-9]{40}$/.test(address) || !symbol || symbol.length > 11 || !Number.isInteger(decimals) || decimals < 0 || decimals > 36 || !source) return null;
    return { name: String(raw.name || symbol).slice(0, 80), symbol, decimals, address, source, chainId };
  }

  function readCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (!parsed || !Array.isArray(parsed.data) || !Number.isFinite(parsed.savedAt)) return null;
      if (Date.now() - parsed.savedAt > CACHE_MAX_AGE_MS) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
    } catch {}
  }

  async function loadCatalog() {
    setStatus('Carregando dados oficiais do Chainlist…');
    elements.retryButton.classList.add('hidden');
    elements.networkList.setAttribute('aria-busy', 'true');
    try {
      const [tokenResponse, chainResponse] = await Promise.all([
        fetch('./tokens.json', { cache: 'no-cache' }),
        fetch(CHAINLIST_URL, { cache: 'no-cache', referrerPolicy: 'no-referrer' })
      ]);
      if (!tokenResponse.ok || !chainResponse.ok) throw new Error('Fonte de dados indisponível.');
      const [tokenCatalog, chainCatalog] = await Promise.all([tokenResponse.json(), chainResponse.json()]);
      if (!Array.isArray(chainCatalog) || !tokenCatalog?.tokensByChainId) throw new Error('Formato de catálogo inválido.');
      hydrate(chainCatalog, tokenCatalog.tokensByChainId, Date.now(), 'Chainlist');
      writeCache(chainCatalog);
    } catch (error) {
      const cache = readCache();
      try {
        const tokenResponse = await fetch('./tokens.json', { cache: 'no-cache' });
        const tokenCatalog = tokenResponse.ok ? await tokenResponse.json() : { tokensByChainId: {} };
        if (!cache) throw error;
        hydrate(cache.data, tokenCatalog.tokensByChainId, cache.savedAt, 'cache local');
        setStatus('Chainlist indisponível. Exibindo a última cópia validada armazenada neste navegador.', 'error');
        elements.retryButton.classList.remove('hidden');
      } catch {
        state.networks = [];
        render();
        setStatus('Não foi possível carregar o catálogo. Verifique sua conexão e tente novamente.', 'error');
        elements.retryButton.classList.remove('hidden');
      }
    } finally {
      elements.networkList.setAttribute('aria-busy', 'false');
    }
  }

  function hydrate(rawChains, rawTokens, loadedAt, source) {
    const unique = new Map();
    for (const raw of rawChains) {
      const chain = normalizeChain(raw);
      if (chain && !unique.has(chain.chainId)) unique.set(chain.chainId, chain);
    }
    const tokensByChainId = {};
    for (const [key, values] of Object.entries(rawTokens || {})) {
      const chainId = Number(key);
      if (!Number.isSafeInteger(chainId) || !Array.isArray(values)) continue;
      tokensByChainId[chainId] = values.map(item => normalizeToken(item, chainId)).filter(Boolean);
    }
    state.networks = [...unique.values()].sort((a, b) => a.chainId - b.chainId);
    state.tokensByChainId = tokensByChainId;
    state.loadedAt = loadedAt;
    state.source = source;
    setStatus('');
    render();
  }

  function matchesFilter(network) {
    const query = elements.search.value.trim().toLocaleLowerCase('pt-BR');
    const tokens = state.tokensByChainId[network.chainId] || [];
    const haystack = [network.name, network.title, network.chain, network.shortName, network.chainId, network.nativeCurrency.symbol, ...tokens.map(token => `${token.name} ${token.symbol}`)].join(' ').toLocaleLowerCase('pt-BR');
    if (query && !haystack.includes(query)) return false;
    if (elements.statusFilter.value !== 'all' && network.status !== elements.statusFilter.value) return false;
    return !elements.tokensFilter.checked || tokens.length > 0;
  }

  function render() {
    const filtered = state.networks.filter(matchesFilter);
    elements.networkList.replaceChildren();
    elements.resultCount.textContent = `${filtered.length} de ${state.networks.length} testnets`;
    elements.snapshotInfo.textContent = state.loadedAt ? `Fonte: ${state.source} · atualizado ${new Date(state.loadedAt).toLocaleString('pt-BR')}` : '';
    if (!filtered.length) {
      elements.networkList.append(el('div', { className: 'empty-state', text: state.networks.length ? 'Nenhuma rede corresponde aos filtros.' : 'Catálogo indisponível.' }));
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const network of filtered) fragment.append(renderNetwork(network));
    elements.networkList.append(fragment);
  }

  function renderNetwork(network) {
    const tokens = state.tokensByChainId[network.chainId] || [];
    const details = el('details', { className: 'network-card' });
    const titleRow = el('div', { className: 'network-title-row' }, [
      el('h2', { className: 'network-title', text: network.name }),
      el('span', { className: `badge ${network.status}`, text: network.status === 'deprecated' ? 'Depreciada' : 'Ativa' }),
      tokens.length ? el('span', { className: 'badge token', text: `${tokens.length} token${tokens.length > 1 ? 's' : ''}` }) : null
    ]);
    const summaryInfo = el('div', {}, [titleRow, el('p', { className: 'network-subtitle', text: `Chain ID ${network.chainId} · ${network.nativeCurrency.symbol}${network.shortName ? ` · ${network.shortName}` : ''}` })]);
    details.append(el('summary', {}, [summaryInfo, el('span', { className: 'expand-label', text: 'Ver configuração' })]));
    const content = el('div', { className: 'network-content' });
    content.append(renderDataGrid(network));
    if (network.redFlags.length || network.status === 'deprecated') {
      const warnings = el('ul', { className: 'warning-list' });
      if (network.status === 'deprecated') warnings.append(el('li', { text: 'Rede marcada como depreciada pelo catálogo.' }));
      for (const flag of network.redFlags) warnings.append(el('li', { text: `Alerta do catálogo: ${flag}` }));
      content.append(warnings);
    }
    content.append(renderUrlSection('RPCs', network.rpc, false));
    content.append(renderExplorerSection(network));
    content.append(renderUrlSection('Faucets', network.faucets, true));
    content.append(renderTokens(network, tokens));
    const addDisabled = !buildWalletChain(network).ok;
    const actions = el('div', { className: 'card-actions' });
    const copyConfig = el('button', { className: 'button secondary', text: 'Copiar configuração', type: 'button' });
    copyConfig.addEventListener('click', () => copyNetworkConfig(network));
    const addNetwork = el('button', { className: 'button primary', text: 'Cadastrar rede na carteira', type: 'button', disabled: addDisabled, title: addDisabled ? 'A rede não possui configuração segura e compatível para cadastro automático.' : '' });
    addNetwork.addEventListener('click', () => addChain(network));
    actions.append(copyConfig, addNetwork);
    content.append(actions);
    details.append(content);
    return details;
  }

  function renderDataGrid(network) {
    const grid = el('div', { className: 'data-grid' });
    const data = [
      ['Chain ID', network.chainId],
      ['Network ID', network.networkId ?? 'Não informado'],
      ['Moeda nativa', `${network.nativeCurrency.name} (${network.nativeCurrency.symbol})`],
      ['Decimais', network.nativeCurrency.decimals],
      ['Código', network.chain || 'Não informado'],
      ['Short name', network.shortName || 'Não informado'],
      ['Recursos', network.features.join(', ') || 'Não informado'],
      ['Parent chain', network.parent ? `${network.parent.chain}${network.parent.type ? ` (${network.parent.type})` : ''}` : 'Não informado']
    ];
    for (const [label, value] of data) grid.append(el('div', { className: 'data-item' }, [el('span', { text: label }), el('code', { text: value })]));
    return grid;
  }

  function renderUrlSection(title, values, external) {
    const section = el('section');
    section.append(el('h3', { className: 'section-title', text: title }));
    const list = el('ul', { className: 'url-list' });
    const usable = values.slice(0, 10);
    if (!usable.length) list.append(el('li', { className: 'empty-tokens', text: 'Não informado pelo catálogo.' }));
    for (const value of usable) {
      const row = el('li', { className: 'url-row' });
      const url = safeHttpUrl(value);
      if (external && url) {
        const link = el('a', { text: value });
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        row.append(link);
      } else {
        row.append(el('code', { text: value }));
      }
      const copy = el('button', { className: 'small-button', text: 'Copiar', type: 'button' });
      copy.addEventListener('click', () => copyText(value, copy));
      row.append(copy);
      list.append(row);
    }
    section.append(list);
    return section;
  }

  function renderExplorerSection(network) {
    const section = el('section');
    section.append(el('h3', { className: 'section-title', text: 'Exploradores e informações' }));
    const list = el('ul', { className: 'url-list' });
    const links = network.explorers.map(item => ({ name: String(item.name || 'Explorer'), url: safeHttpUrl(item.url) })).filter(item => item.url);
    if (network.infoURL) links.push({ name: 'Site da rede', url: network.infoURL });
    if (!links.length) list.append(el('li', { className: 'empty-tokens', text: 'Não informado pelo catálogo.' }));
    for (const item of links) {
      const link = el('a', { text: `${item.name}: ${item.url}` });
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      list.append(el('li', { className: 'url-row' }, [link]));
    }
    section.append(list);
    return section;
  }

  function renderTokens(network, tokens) {
    const section = el('section');
    section.append(el('h3', { className: 'section-title', text: 'Tokens oficiais de teste' }));
    if (!tokens.length) {
      section.append(el('p', { className: 'empty-tokens', text: 'Nenhum contrato de token com fonte oficial foi registrado para esta rede.' }));
      return section;
    }
    const list = el('div', { className: 'token-list' });
    for (const token of tokens) {
      const button = el('button', { className: 'token-button', type: 'button' }, [
        el('span', { className: 'token-name', text: `${token.name} (${token.symbol})` }),
        el('code', { className: 'token-address', text: token.address }),
        el('span', { className: 'token-source', text: 'Copiar ou cadastrar na carteira' })
      ]);
      button.addEventListener('click', () => openTokenDialog(network, token));
      list.append(button);
    }
    section.append(list);
    return section;
  }

  function buildWalletChain(network) {
    const rpcUrls = network.rpc.map(safeWalletUrl).filter(Boolean);
    const blockExplorerUrls = network.explorers.map(item => safeWalletUrl(item.url)).filter(Boolean);
    if (!rpcUrls.length) return { ok: false, reason: 'Nenhum RPC HTTPS sem placeholders está disponível.' };
    if (network.nativeCurrency.symbol.length < 2 || network.nativeCurrency.symbol.length > 6) return { ok: false, reason: 'O símbolo da moeda não atende aos limites da carteira.' };
    const params = {
      chainId: `0x${network.chainId.toString(16)}`,
      chainName: network.name.slice(0, 100),
      nativeCurrency: network.nativeCurrency,
      rpcUrls
    };
    if (blockExplorerUrls.length) params.blockExplorerUrls = blockExplorerUrls;
    return { ok: true, params };
  }

  function getProvider() {
    const provider = window.ethereum;
    if (!provider || typeof provider.request !== 'function') throw new Error('Nenhuma carteira EVM compatível foi encontrada neste navegador.');
    return provider;
  }

  async function addChain(network) {
    const walletChain = buildWalletChain(network);
    if (!walletChain.ok) return setStatus(walletChain.reason, 'error');
    try {
      const provider = getProvider();
      await provider.request({ method: 'wallet_addEthereumChain', params: [walletChain.params] });
      setStatus(`${network.name} foi enviada para confirmação na carteira.`, 'success');
    } catch (error) {
      setStatus(walletError(error, 'Não foi possível cadastrar a rede.'), 'error');
    }
  }

  async function ensureChain(provider, network) {
    const walletChain = buildWalletChain(network);
    if (!walletChain.ok) throw new Error(walletChain.reason);
    const target = walletChain.params.chainId;
    const current = await provider.request({ method: 'eth_chainId' });
    if (String(current).toLowerCase() === target.toLowerCase()) return;
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: target }] });
    } catch (error) {
      if (Number(error?.code) !== 4902) throw error;
      await provider.request({ method: 'wallet_addEthereumChain', params: [walletChain.params] });
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: target }] });
    }
  }

  function openTokenDialog(network, token) {
    state.selected = { network, token };
    elements.dialogDescription.textContent = `${token.name} (${token.symbol}) na rede ${network.name}.`;
    elements.dialogAddress.textContent = token.address;
    setDialogStatus('');
    elements.copyToken.disabled = false;
    elements.addToken.disabled = !buildWalletChain(network).ok;
    elements.dialog.showModal();
  }

  async function addSelectedToken() {
    if (!state.selected) return;
    const { network, token } = state.selected;
    elements.addToken.disabled = true;
    setDialogStatus('Aguardando confirmação da carteira…');
    try {
      const provider = getProvider();
      await provider.request({ method: 'eth_requestAccounts' });
      await ensureChain(provider, network);
      const added = await provider.request({
        method: 'wallet_watchAsset',
        params: { type: 'ERC20', options: { address: token.address, symbol: token.symbol, decimals: token.decimals } }
      });
      if (!added) throw new Error('A carteira não confirmou o cadastro do token.');
      setDialogStatus(`${token.symbol} foi adicionado à carteira.`, 'success');
    } catch (error) {
      setDialogStatus(walletError(error, 'Não foi possível cadastrar o token.'), 'error');
    } finally {
      elements.addToken.disabled = false;
    }
  }

  function walletError(error, fallback) {
    const code = Number(error?.code);
    if (code === 4001) return 'Solicitação cancelada pelo usuário.';
    if (code === -32601 || code === 4200) return 'A carteira não oferece suporte a esta operação.';
    if (code === -32002) return 'Já existe uma solicitação pendente na carteira.';
    const message = typeof error?.message === 'string' ? error.message : '';
    if (/carteira|wallet|RPC|símbolo|rede/i.test(message) && message.length < 220) return message;
    return fallback;
  }

  async function copyNetworkConfig(network) {
    const walletChain = buildWalletChain(network);
    const config = walletChain.ok ? walletChain.params : {
      chainId: `0x${network.chainId.toString(16)}`,
      chainName: network.name,
      nativeCurrency: network.nativeCurrency,
      rpcUrls: network.rpc,
      blockExplorerUrls: network.explorers.map(item => item.url)
    };
    await copyText(JSON.stringify(config, null, 2));
  }

  async function copyText(value, button) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.append(textarea);
        textarea.select();
        if (!document.execCommand('copy')) throw new Error('copy failed');
        textarea.remove();
      }
      if (button) {
        const original = button.textContent;
        button.textContent = 'Copiado';
        window.setTimeout(() => { button.textContent = original; }, 1500);
      } else {
        setStatus('Configuração copiada.', 'success');
      }
      return true;
    } catch {
      setStatus('Não foi possível copiar automaticamente. Selecione e copie o valor manualmente.', 'error');
      return false;
    }
  }

  function setStatus(message, type = '') {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message${type ? ` ${type}` : ''}`;
  }

  function setDialogStatus(message, type = '') {
    elements.dialogStatus.textContent = message;
    elements.dialogStatus.className = `dialog-status${type ? ` ${type}` : ''}`;
  }

  elements.search.addEventListener('input', render);
  elements.statusFilter.addEventListener('change', render);
  elements.tokensFilter.addEventListener('change', render);
  elements.retryButton.addEventListener('click', loadCatalog);
  elements.copyToken.addEventListener('click', async () => {
    if (!state.selected) return;
    const copied = await copyText(state.selected.token.address, elements.copyToken);
    setDialogStatus(copied ? 'Endereço copiado.' : 'Não foi possível copiar automaticamente.', copied ? 'success' : 'error');
  });
  elements.addToken.addEventListener('click', addSelectedToken);
  elements.dialog.addEventListener('close', () => {
    state.selected = null;
    setDialogStatus('');
  });

  loadCatalog();
})();
