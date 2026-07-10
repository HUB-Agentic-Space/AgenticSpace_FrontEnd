---
lang: en
title: "Configuring AgenticSpace Sandbox"
description: "Learn how to configure and use the AgenticSpace Sandbox Docker image to run agents in an isolated environment"
---

# Configuring AgenticSpace Sandbox

This tutorial explains how to configure and use the Docker image `carlosdelfino/agenticspace-sandbox:latest` to run agents in a secure, isolated environment. The sandbox provides web scraping, data extraction, and feed processing tools, all pre-installed and ready to use.

## Table of Contents

1. [What is AgenticSpace Sandbox?](#what-is-agenticspace-sandbox)
2. [Sandbox Architecture](#sandbox-architecture)
3. [Available Tools](#available-tools)
4. [Getting the Source Code](#getting-the-source-code)
5. [Prerequisites](#prerequisites)
6. [Configuration Flow](#configuration-flow)
7. [Detailed Configuration](#detailed-configuration)
8. [Testing the Configuration](#testing-the-configuration)
9. [Troubleshooting](#troubleshooting)

---

## What is AgenticSpace Sandbox?

**AgenticSpace Sandbox** is a pre-configured Docker image that provides an isolated environment for agent execution. This environment offers:

- **Security:** Complete isolation from the host system
- **Reproducibility:** Consistent environment regardless of the machine
- **Pre-installed Tools:** CLI tools, Python scripts, and web scraping libraries

The image includes tools for web scraping, data extraction, feed discovery, and RSS syndication — all via command line, ideal for automation.

---

## Sandbox Architecture

The sandbox architecture follows the Docker container model, where the agent executes commands in an isolated environment:

![Sandbox Architecture](configurando-o-agenticspace-sandbox-no-openclaw/imagens/sandbox-architecture.svg)

**Main components:**

- **Host System:** Your machine where Docker is installed
- **Docker Engine:** Engine that manages containers
- **Sandbox Container:** Isolated environment with all tools
- **Bind Mounts:** Shared directories between host and container
- **CLI Tools:** Command line tools (curl, wget, jq, etc)
- **Python Tools:** Specialized Python scripts (scrape-url, extract-data, etc)
- **Libraries:** Python libraries (Scrapy, BeautifulSoup, Playwright, etc)

---

## Available Tools

AgenticSpace Sandbox comes with a complete ecosystem of tools:

![Tools Ecosystem](configurando-o-agenticspace-sandbox-no-openclaw/imagens/tools-ecosystem.svg)

### CLI Tools

Command line tools for quick operations:

- **curl/wget:** Web content download
- **jq:** JSON processing
- **htmlq:** HTML data extraction
- **xidel:** XML/HTML/XPath processing

### Python Tools

Python scripts for specialized tasks:

- **scrape-url:** URL scraping
- **extract-data:** Structured data extraction
- **find-feeds:** RSS/Atom feed discovery
- **parse-feed:** Feed parsing
- **screenshot:** Playwright screen capture
- **api-fetch:** API fetching
- **search-web:** Search the web and get full content
- **map:** Discover all URLs on a website
- **batch-scrape:** Scrape multiple URLs at once
- **markdown-scrape:** Get LLM-ready markdown from any website
- **interact:** Interact with webpages using browser automation
- **deep-research:** Perform comprehensive research using search and extraction

### Libraries

Python libraries for development:

- **Scrapy:** Web scraping framework
- **BeautifulSoup:** HTML/XML parsing
- **Playwright:** Browser automation (Chromium headless)
- **feedparser:** RSS/Atom feed parsing
- **httpx/aiohttp:** Async HTTP clients

---

## Getting the Source Code

The complete source code for AgenticSpace Sandbox is available on GitHub. You can clone the repository to examine the code, make modifications, or build your own custom image.

### Cloning the Repository

```bash
git clone https://github.com/HUB-Agentic-Space/agentic-space-sandbox.git
cd agentic-space-sandbox
```

### Repository Structure

The repository contains:

- **Dockerfile:** Docker image build file
- **requirements.txt:** Python dependencies
- **scripts/:** Python tool scripts
- **INSTRUCTIONS.md:** Detailed usage instructions
- **README.md:** General project documentation

### Building the Image Locally

If you want to build the Docker image locally from the source code:

```bash
docker build -t agenticspace-sandbox:local .
```

### Contributing

Contributions are welcome! You can:

1. Fork the repository
2. Create a branch for your feature
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

For more information on how to contribute, consult the CONTRIBUTING.md file in the repository.

---

## Prerequisites

Before starting, make sure you have:

- **Docker** installed and running on your machine
  ```bash
  docker --version
  docker info
  ```
- **Access to Agentic Space** web platform
- **The Docker image downloaded:**
  ```bash
  docker pull carlosdelfino/agenticspace-sandbox:latest
  ```

---

## Configuration Flow

The configuration process follows four main steps:

![Configuration Flow](configurando-o-agenticspace-sandbox-no-openclaw/imagens/config-flow.svg)

### Step 1: Download the Image

```bash
docker pull carlosdelfino/agenticspace-sandbox:latest
```

### Step 2: Configure the Agent

In Agentic Space, create or edit an agent and configure the sandbox options.

### Step 3: Adjust Parameters

Configure bind mount paths and environment variables as needed.

### Step 4: Test

Verify that the tools are working correctly.

---

## Detailed Configuration

### Execution Mode

Configure when the sandbox should be used:

| Mode | Description |
|------|-------------|
| `all` | All commands executed by the agent run in the sandbox |
| `exec` | Only execution commands (shell) run in the sandbox |
| `none` | Sandbox disabled (commands run on host) |

**Recommended:** `all` for maximum isolation.

### Isolation Scope

Defines the scope of isolation:

| Scope | Description |
|-------|-------------|
| `agent` | Each agent has its own isolated container |
| `session` | Each conversation session has its own container |
| `global` | All agents share the same container |

**Recommended:** `agent` so each agent has its own environment.

### Workspace Access

Defines workspace access permissions:

| Access | Description |
|--------|-------------|
| `rw` | Read and write (agent can create/modify files) |
| `ro` | Read only (agent can read but not modify) |
| `none` | No workspace access |

**Recommended:** `rw` so the agent can save results.

### Bind Mounts

Bind mounts allow sharing files between host and container:

```
"path_on_host:path_on_container:mode"
```

**Example:**
```json
"binds": [
  "/home/user/workspace/skills:/skills:ro",
  "/home/user/workspace/output:/workspace/output:rw"
]
```

- **`ro`** = read-only
- **`rw`** = read-write

### Environment Variables

Configure environment variables for the container:

| Variable | Description |
|----------|-------------|
| `PUID` | User ID that will run processes in the container |
| `PGID` | Corresponding group ID |
| `TZ` | Time zone (for correct timestamps) |
| `PYTHONUNBUFFERED` | Real-time Python output |
| `SCRAPE_USER_AGENT` | Custom user agent for scraping |

**How to find your PUID/PGID:**
```bash
id -u  # shows your UID (PUID)
id -g  # shows your GID (PGID)
```

---

## Testing the Configuration

### Test 1: Verify CLI Tools

```bash
docker run -it carlosdelfino/agenticspace-sandbox:latest bash
```

Inside the container, test:
```bash
curl --version
jq --version
htmlq --help
```

### Test 2: Verify Python Tools

```bash
scrape-url --help
extract-data --help
find-feeds --help
```

### Test 3: Verify Libraries

```bash
python3 -c "import scrapy; print(scrapy.__version__)"
python3 -c "import bs4; print(bs4.__version__)"
python3 -c "import playwright; print('Playwright OK')"
```

### Test 4: Real Scraping

```bash
scrape-url https://example.com "h1"
```

Expected response:
```
Example Domain
```

---

## Troubleshooting

### Problem: "Permission denied"

**Cause:** Incorrect permissions on mounted files.

**Solution:** Configure `PUID` and `PGID` with your real UID/GID:
```bash
id -u  # PUID
id -g  # PGID
```

### Problem: "docker: not found"

**Cause:** Docker is not running.

**Solution:**
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Problem: "image not found"

**Cause:** The image was not downloaded.

**Solution:**
```bash
docker pull carlosdelfino/agenticspace-sandbox:latest
```

### Problem: Playwright doesn't work

**Cause:** Chromium dependencies may be missing.

**Solution:** The image already installs dependencies, but if needed:
```bash
playwright install --with-deps chromium
```

### Problem: Created files belong to root

**Cause:** The container is running as root.

**Solution:** Use the correct `PUID` and `PGID` variables.

---

## Summary

AgenticSpace Sandbox provides an isolated, pre-configured environment for agent execution with web scraping and data processing tools.

**Main benefits:**
- Isolated and secure environment
- Pre-installed tools
- Flexible configuration via bind mounts
- Support for multiple tools and libraries

**Next steps:**
1. Download the Docker image
2. Configure your agent in Agentic Space
3. Adjust parameters as needed
4. Test available tools
5. Start automating scraping and data extraction tasks

For more information, consult the Agentic Space documentation or contact support.
