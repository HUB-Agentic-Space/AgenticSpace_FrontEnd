---
lang: es
title: "Configurando el AgenticSpace Sandbox"
description: "Aprende cómo configurar y usar la imagen Docker AgenticSpace Sandbox para ejecutar agentes en un entorno aislado"
---

# Configurando el AgenticSpace Sandbox

Este tutorial explica cómo configurar y utilizar la imagen Docker `carlosdelfino/agenticspace-sandbox:latest` para ejecutar agentes en un entorno aislado y seguro. La sandbox proporciona herramientas de web scraping, extracción de datos y procesamiento de feeds, todo preinstalado y listo para usar.

## Índice

1. [¿Qué es el AgenticSpace Sandbox?](#qué-es-el-agenticspace-sandbox)
2. [Arquitectura de la Sandbox](#arquitectura-de-la-sandbox)
3. [Herramientas Disponibles](#herramientas-disponibles)
4. [Obtener el Código Fuente](#obtener-el-código-fuente)
5. [Requisitos Previos](#requisitos-previos)
6. [Flujo de Configuración](#flujo-de-configuración)
7. [Configuración Detallada](#configuración-detallada)
8. [Probando la Configuración](#probando-la-configuración)
9. [Solución de Problemas](#solución-de-problemas)

---

## ¿Qué es el AgenticSpace Sandbox?

El **AgenticSpace Sandbox** es una imagen Docker preconfigurada que proporciona un entorno aislado para la ejecución de agentes. Este entorno ofrece:

- **Seguridad:** Aislamiento completo del sistema host
- **Reproducibilidad:** Entorno consistente independientemente de la máquina
- **Herramientas Preinstaladas:** Herramientas CLI, scripts Python y bibliotecas para web scraping

La imagen incluye herramientas para web scraping, extracción de datos, búsqueda de feeds y sindicación RSS — todo vía línea de comando, ideal para automatización.

---

## Arquitectura de la Sandbox

La arquitectura de la sandbox sigue el modelo de contenedores Docker, donde el agente ejecuta comandos en un entorno aislado:

![Arquitectura de la Sandbox](configurando-o-agenticspace-sandbox-no-openclaw/imagens/sandbox-architecture.svg)

**Componentes principales:**

- **Host System:** Tu máquina donde Docker está instalado
- **Docker Engine:** Motor que gestiona los contenedores
- **Sandbox Container:** Entorno aislado con todas las herramientas
- **Bind Mounts:** Directorios compartidos entre host y contenedor
- **CLI Tools:** Herramientas de línea de comando (curl, wget, jq, etc.)
- **Python Tools:** Scripts Python especializados (scrape-url, extract-data, etc.)
- **Libraries:** Bibliotecas Python (Scrapy, BeautifulSoup, Playwright, etc.)

---

## Herramientas Disponibles

El AgenticSpace Sandbox viene con un ecosistema completo de herramientas:

![Ecosistema de Herramientas](configurando-o-agenticspace-sandbox-no-openclaw/imagens/tools-ecosystem.svg)

### CLI Tools

Herramientas de línea de comando para operaciones rápidas:

- **curl/wget:** Descarga de contenido web
- **jq:** Procesamiento de JSON
- **htmlq:** Extracción de datos HTML
- **xidel:** Procesamiento de XML/HTML/XPath

### Python Tools

Scripts Python para tareas especializadas:

- **scrape-url:** Scraping de URLs
- **extract-data:** Extracción estructurada de datos
- **find-feeds:** Descubrimiento de feeds RSS/Atom
- **parse-feed:** Parsing de feeds
- **screenshot:** Captura de pantalla con Playwright
- **api-fetch:** Fetch de APIs
- **search-web:** Búsqueda en la web y devuelve contenido completo
- **map:** Descubre todas las URLs de un sitio
- **batch-scrape:** Extrae múltiples URLs simultáneamente
- **markdown-scrape:** Obtiene datos en markdown listo para LLM
- **interact:** Interactúa con páginas web usando automatización de navegador
- **deep-research:** Realiza investigación abarcadora usando búsqueda y extracción

### Libraries

Bibliotecas Python para desarrollo:

- **Scrapy:** Framework de web scraping
- **BeautifulSoup:** Parsing HTML/XML
- **Playwright:** Automatización de browsers (Chromium headless)
- **feedparser:** Parsing de feeds RSS/Atom
- **httpx/aiohttp:** Clientes HTTP asíncronos

---

## Obtener el Código Fuente

El código fuente completo del AgenticSpace Sandbox está disponible en GitHub. Puedes clonar el repositorio para examinar el código, hacer modificaciones o construir tu propia imagen personalizada.

### Clonando el Repositorio

```bash
git clone https://github.com/HUB-Agentic-Space/agentic-space-sandbox.git
cd agentic-space-sandbox
```

### Estructura del Repositorio

El repositorio contiene:

- **Dockerfile:** Archivo de construcción de la imagen Docker
- **requirements.txt:** Dependencias Python
- **scripts/:** Scripts Python de las herramientas
- **INSTRUCTIONS.md:** Instrucciones detalladas de uso
- **README.md:** Documentación general del proyecto

### Construyendo la Imagen Localmente

Si deseas construir la imagen Docker localmente a partir del código fuente:

```bash
docker build -t agenticspace-sandbox:local .
```

### Contribuyendo

¡Las contribuciones son bienvenidas! Puedes:

1. Hacer fork del repositorio
2. Crear una branch para tu feature
3. Hacer commit de tus cambios
4. Hacer push a la branch
5. Abrir un Pull Request

Para más información sobre cómo contribuir, consulta el archivo CONTRIBUTING.md en el repositorio.

---

## Requisitos Previos

Antes de comenzar, asegúrate de que tienes:

- **Docker** instalado y corriendo en tu máquina
  ```bash
  docker --version
  docker info
  ```
- **Acceso a Agentic Space** plataforma web
- **La imagen Docker descargada:**
  ```bash
  docker pull carlosdelfino/agenticspace-sandbox:latest
  ```

---

## Flujo de Configuración

El proceso de configuración sigue cuatro pasos principales:

![Flujo de Configuración](configurando-o-agenticspace-sandbox-no-openclaw/imagens/config-flow.svg)

### Paso 1: Descargar la Imagen

```bash
docker pull carlosdelfino/agenticspace-sandbox:latest
```

### Paso 2: Configurar el Agente

En Agentic Space, crea o edita un agente y configura las opciones de sandbox.

### Paso 3: Ajustar Parámetros

Configura las rutas de bind mounts y variables de entorno según sea necesario.

### Paso 4: Probar

Verifica que las herramientas estén funcionando correctamente.

---

## Configuración Detallada

### Modo de Ejecución

Configura cuándo debe usarse la sandbox:

| Modo | Descripción |
|------|-------------|
| `all` | Todos los comandos ejecutados por el agente corren en la sandbox |
| `exec` | Solo comandos de ejecución (shell) corren en la sandbox |
| `none` | Sandbox desactivada (comandos corren en el host) |

**Recomendado:** `all` para máximo aislamiento.

### Alcance del Aislamiento

Define el alcance del aislamiento:

| Alcance | Descripción |
|---------|-------------|
| `agent` | Cada agente tiene su propio contenedor aislado |
| `session` | Cada sesión de conversación tiene su propio contenedor |
| `global` | Todos los agentes comparten el mismo contenedor |

**Recomendado:** `agent` para que cada agente tenga su propio entorno.

### Acceso al Workspace

Define los permisos de acceso al workspace:

| Acceso | Descripción |
|--------|-------------|
| `rw` | Lectura y escritura (el agente puede crear/modificar archivos) |
| `ro` | Solo lectura (el agente puede leer pero no modificar) |
| `none` | Sin acceso al workspace |

**Recomendado:** `rw` para que el agente pueda guardar resultados.

### Bind Mounts

Los bind mounts permiten compartir archivos entre host y contenedor:

```
"caminho_no_host:caminho_no_container:modo"
```

**Ejemplo:**
```json
"binds": [
  "/home/usuario/workspace/skills:/skills:ro",
  "/home/usuario/workspace/output:/workspace/output:rw"
]
```

- **`ro`** = read-only (solo lectura)
- **`rw`** = read-write (lectura y escritura)

### Variables de Entorno

Configura variables de entorno para el contenedor:

| Variable | Descripción |
|----------|-------------|
| `PUID` | ID del usuario que correrá los procesos en el contenedor |
| `PGID` | ID del grupo correspondiente |
| `TZ` | Zona horaria (para timestamps correctos) |
| `PYTHONUNBUFFERED` | Output de Python en tiempo real |
| `SCRAPE_USER_AGENT` | User-Agent personalizado para scraping |

**Cómo descubrir tu PUID/PGID:**
```bash
id -u  # muestra tu UID (PUID)
id -g  # muestra tu GID (PGID)
```

---

## Probando la Configuración

### Prueba 1: Verificar CLI Tools

```bash
docker run -it carlosdelfino/agenticspace-sandbox:latest bash
```

Dentro del contenedor, prueba:
```bash
curl --version
jq --version
htmlq --help
```

### Prueba 2: Verificar Python Tools

```bash
scrape-url --help
extract-data --help
find-feeds --help
```

### Prueba 3: Verificar Bibliotecas

```bash
python3 -c "import scrapy; print(scrapy.__version__)"
python3 -c "import bs4; print(bs4.__version__)"
python3 -c "import playwright; print('Playwright OK')"
```

### Prueba 4: Scraping Real

```bash
scrape-url https://example.com "h1"
```

Respuesta esperada:
```
Example Domain
```

---

## Solución de Problemas

### Problema: "Permission denied"

**Causa:** Permisos incorrectos en archivos montados.

**Solución:** Configura `PUID` y `PGID` con tu UID/GID real:
```bash
id -u  # PUID
id -g  # PGID
```

### Problema: "docker: not found"

**Causa:** Docker no está corriendo.

**Solución:**
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Problema: "image not found"

**Causa:** La imagen no fue descargada.

**Solución:**
```bash
docker pull carlosdelfino/agenticspace-sandbox:latest
```

### Problema: Playwright no funciona

**Causa:** Pueden faltar dependencias de Chromium.

**Solución:** La imagen ya instala las dependencias, pero si es necesario:
```bash
playwright install --with-deps chromium
```

### Problema: Los archivos creados pertenecen a root

**Causa:** El contenedor está corriendo como root.

**Solución:** Usa las variables `PUID` y `PGID` correctas.

---

## Resumen

El AgenticSpace Sandbox proporciona un entorno aislado y preconfigurado para la ejecución de agentes con herramientas de web scraping y procesamiento de datos.

**Principales beneficios:**
- Entorno aislado y seguro
- Herramientas preinstaladas
- Configuración flexible vía bind mounts
- Soporte a múltiples herramientas y bibliotecas

**Próximos pasos:**
1. Descarga la imagen Docker
2. Configura tu agente en Agentic Space
3. Ajusta los parámetros según sea necesario
4. Prueba las herramientas disponibles
5. Comienza a automatizar tareas de scraping y extracción de datos

Para más información, consulta la documentación de Agentic Space o contacta al soporte.
