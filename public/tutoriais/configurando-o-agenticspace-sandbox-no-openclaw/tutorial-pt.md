---
lang: pt
title: "Configurando o AgenticSpace Sandbox"
description: "Aprenda como configurar e usar a imagem Docker AgenticSpace Sandbox para executar agentes em ambiente isolado"
---

# Configurando o AgenticSpace Sandbox

Este tutorial explica como configurar e utilizar a imagem Docker `carlosdelfino/agenticspace-sandbox:latest` para executar agentes em um ambiente isolado e seguro. A sandbox fornece ferramentas de web scraping, extração de dados e processamento de feeds, tudo pré-instalado e pronto para uso.

## Índice

1. [O que é o AgenticSpace Sandbox?](#o-que-é-o-agenticspace-sandbox)
2. [Arquitetura da Sandbox](#arquitetura-da-sandbox)
3. [Ferramentas Disponíveis](#ferramentas-disponíveis)
4. [Obtendo o Código Fonte](#obtendo-o-código-fonte)
5. [Pré-requisitos](#pré-requisitos)
6. [Fluxo de Configuração](#fluxo-de-configuração)
7. [Configuração Detalhada](#configuração-detalhada)
8. [Testando a Configuração](#testando-a-configuração)
9. [Solução de Problemas](#solução-de-problemas)

---

## O que é o AgenticSpace Sandbox?

O **AgenticSpace Sandbox** é uma imagem Docker pré-configurada que fornece um ambiente isolado para execução de agentes. Este ambiente oferece:

- **Segurança:** Isolamento completo do sistema host
- **Reprodutibilidade:** Ambiente consistente independente da máquina
- **Ferramentas Pré-instaladas:** CLI tools, Python scripts e bibliotecas para web scraping

A imagem inclui ferramentas para web scraping, extração de dados, busca de feeds e sindicação RSS — tudo via linha de comando, ideal para automação.

---

## Arquitetura da Sandbox

A arquitetura da sandbox segue o modelo de containers Docker, onde o agente executa comandos em um ambiente isolado:

![Arquitetura da Sandbox](configurando-o-agenticspace-sandbox-no-openclaw/imagens/sandbox-architecture.svg)

**Componentes principais:**

- **Host System:** Sua máquina onde o Docker está instalado
- **Docker Engine:** Motor que gerencia os containers
- **Sandbox Container:** Ambiente isolado com todas as ferramentas
- **Bind Mounts:** Diretórios compartilhados entre host e container
- **CLI Tools:** Ferramentas de linha de comando (curl, wget, jq, etc)
- **Python Tools:** Scripts Python especializados (scrape-url, extract-data, etc)
- **Libraries:** Bibliotecas Python (Scrapy, BeautifulSoup, Playwright, etc)

---

## Ferramentas Disponíveis

O AgenticSpace Sandbox vem com um ecossistema completo de ferramentas:

![Ecossistema de Ferramentas](configurando-o-agenticspace-sandbox-no-openclaw/imagens/tools-ecosystem.svg)

### CLI Tools

Ferramentas de linha de comando para operações rápidas:

- **curl/wget:** Download de conteúdo web
- **jq:** Processamento de JSON
- **htmlq:** Extração de dados HTML
- **xidel:** Processamento de XML/HTML/XPath

### Python Tools

Scripts Python para tarefas especializadas:

- **scrape-url:** Scraping de URLs
- **extract-data:** Extração estruturada de dados
- **find-feeds:** Descoberta de feeds RSS/Atom
- **parse-feed:** Parsing de feeds
- **screenshot:** Captura de tela com Playwright
- **api-fetch:** Fetch de APIs
- **search-web:** Busca na web e retorna conteúdo completo
- **map:** Descobre todas as URLs de um site
- **batch-scrape:** Extrai múltiplas URLs simultaneamente
- **markdown-scrape:** Obtém dados em markdown pronto para LLM
- **interact:** Interage com páginas web usando automação de navegador
- **deep-research:** Realiza pesquisa abrangente usando busca e extração

### Libraries

Bibliotecas Python para desenvolvimento:

- **Scrapy:** Framework de web scraping
- **BeautifulSoup:** Parsing HTML/XML
- **Playwright:** Automação de browsers (Chromium headless)
- **feedparser:** Parsing de feeds RSS/Atom
- **httpx/aiohttp:** Clientes HTTP assíncronos

---

## Obtendo o Código Fonte

O código fonte completo do AgenticSpace Sandbox está disponível no GitHub. Você pode clonar o repositório para examinar o código, fazer modificações ou construir sua própria imagem customizada.

### Clonando o Repositório

```bash
git clone https://github.com/HUB-Agentic-Space/agentic-space-sandbox.git
cd agentic-space-sandbox
```

### Estrutura do Repositório

O repositório contém:

- **Dockerfile:** Arquivo de construção da imagem Docker
- **requirements.txt:** Dependências Python
- **scripts/:** Scripts Python das ferramentas
- **INSTRUCTIONS.md:** Instruções detalhadas de uso
- **README.md:** Documentação geral do projeto

### Construindo a Imagem Localmente

Se você deseja construir a imagem Docker localmente a partir do código fonte:

```bash
docker build -t agenticspace-sandbox:local .
```

### Contribuindo

Contribuições são bem-vindas! Você pode:

1. Fazer fork do repositório
2. Criar uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abrir um Pull Request

Para mais informações sobre como contribuir, consulte o arquivo CONTRIBUTING.md no repositório.

---

## Pré-requisitos

Antes de começar, certifique-se de que você tem:

- **Docker** instalado e rodando na sua máquina
  ```bash
  docker --version
  docker info
  ```
- **Acesso ao Agentic Space** plataforma web
- **A imagem Docker baixada:**
  ```bash
  docker pull carlosdelfino/agenticspace-sandbox:latest
  ```

---

## Fluxo de Configuração

O processo de configuração segue quatro passos principais:

![Fluxo de Configuração](configurando-o-agenticspace-sandbox-no-openclaw/imagens/config-flow.svg)

### Passo 1: Baixar a Imagem

```bash
docker pull carlosdelfino/agenticspace-sandbox:latest
```

### Passo 2: Configurar o Agente

No Agentic Space, crie ou edite um agente e configure as opções de sandbox.

### Passo 3: Ajustar Parâmetros

Configure os caminhos de bind mounts e variáveis de ambiente conforme necessário.

### Passo 4: Testar

Verifique se as ferramentas estão funcionando corretamente.

---

## Configuração Detalhada

### Modo de Execução

Configure quando a sandbox deve ser usada:

| Modo | Descrição |
|------|-----------|
| `all` | Todos os comandos executados pelo agente rodam na sandbox |
| `exec` | Apenas comandos de execução (shell) rodam na sandbox |
| `none` | Sandbox desativada (comandos rodam no host) |

**Recomendado:** `all` para máximo isolamento.

### Escopo do Isolamento

Define o escopo do isolamento:

| Escopo | Descrição |
|--------|-----------|
| `agent` | Cada agente tem seu próprio container isolado |
| `session` | Cada sessão de conversa tem seu próprio container |
| `global` | Todos os agentes compartilham o mesmo container |

**Recomendado:** `agent` para que cada agente tenha seu ambiente próprio.

### Acesso ao Workspace

Define as permissões de acesso ao workspace:

| Acesso | Descrição |
|--------|-----------|
| `rw` | Leitura e escrita (o agente pode criar/modificar arquivos) |
| `ro` | Somente leitura (o agente pode ler mas não modificar) |
| `none` | Sem acesso ao workspace |

**Recomendado:** `rw` para que o agente possa salvar resultados.

### Bind Mounts

Bind mounts permitem compartilhar arquivos entre host e container:

```
"caminho_no_host:caminho_no_container:modo"
```

**Exemplo:**
```json
"binds": [
  "/home/usuario/workspace/skills:/skills:ro",
  "/home/usuario/workspace/output:/workspace/output:rw"
]
```

- **`ro`** = read-only (somente leitura)
- **`rw`** = read-write (leitura e escrita)

### Variáveis de Ambiente

Configure variáveis de ambiente para o container:

| Variável | Descrição |
|----------|-----------|
| `PUID` | ID do usuário que rodará os processos no container |
| `PGID` | ID do grupo correspondente |
| `TZ` | Fuso horário (para timestamps corretos) |
| `PYTHONUNBUFFERED` | Output Python em tempo real |
| `SCRAPE_USER_AGENT` | User-Agent customizado para scraping |

**Como descobrir seu PUID/PGID:**
```bash
id -u  # mostra seu UID (PUID)
id -g  # mostra seu GID (PGID)
```

---

## Testando a Configuração

### Teste 1: Verificar CLI Tools

```bash
docker run -it carlosdelfino/agenticspace-sandbox:latest bash
```

Dentro do container, teste:
```bash
curl --version
jq --version
htmlq --help
```

### Teste 2: Verificar Python Tools

```bash
scrape-url --help
extract-data --help
find-feeds --help
```

### Teste 3: Verificar Bibliotecas

```bash
python3 -c "import scrapy; print(scrapy.__version__)"
python3 -c "import bs4; print(bs4.__version__)"
python3 -c "import playwright; print('Playwright OK')"
```

### Teste 4: Scraping Real

```bash
scrape-url https://example.com "h1"
```

Resposta esperada:
```
Example Domain
```

---

## Solução de Problemas

### Problema: "Permission denied"

**Causa:** Permissões incorretas em arquivos montados.

**Solução:** Configure `PUID` e `PGID` com seu UID/GID real:
```bash
id -u  # PUID
id -g  # PGID
```

### Problema: "docker: not found"

**Causa:** Docker não está rodando.

**Solução:**
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Problema: "image not found"

**Causa:** A imagem não foi baixada.

**Solução:**
```bash
docker pull carlosdelfino/agenticspace-sandbox:latest
```

### Problema: Playwright não funciona

**Causa:** Dependências do Chromium podem estar faltando.

**Solução:** A imagem já instala as dependências, mas se necessário:
```bash
playwright install --with-deps chromium
```

### Problema: Arquivos criados pertencem ao root

**Causa:** O container está rodando como root.

**Solução:** Use as variáveis `PUID` e `PGID` corretas.

---

## Resumo

O AgenticSpace Sandbox fornece um ambiente isolado e pré-configurado para execução de agentes com ferramentas de web scraping e processamento de dados.

**Principais benefícios:**
- Ambiente isolado e seguro
- Ferramentas pré-instaladas
- Configuração flexível via bind mounts
- Suporte a múltiplas ferramentas e bibliotecas

**Próximos passos:**
1. Baixe a imagem Docker
2. Configure seu agente no Agentic Space
3. Ajuste os parâmetros conforme necessário
4. Teste as ferramentas disponíveis
5. Comece a automatizar tarefas de scraping e extração de dados

Para mais informações, consulte a documentação do Agentic Space ou entre em contato com o suporte.
