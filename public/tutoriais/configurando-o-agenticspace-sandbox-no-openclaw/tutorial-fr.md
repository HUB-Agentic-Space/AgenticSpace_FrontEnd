---
lang: fr
title: "Configuration d'AgenticSpace Sandbox"
description: "Apprenez à configurer et utiliser l'image Docker AgenticSpace Sandbox pour exécuter des agents dans un environnement isolé"
---

# Configuration d'AgenticSpace Sandbox

Ce tutoriel explique comment configurer et utiliser l'image Docker `carlosdelfino/agenticspace-sandbox:latest` pour exécuter des agents dans un environnement sécurisé et isolé. La sandbox fournit des outils de web scraping, d'extraction de données et de traitement de flux, tous préinstallés et prêts à l'emploi.

## Table des matières

1. [Qu'est-ce qu'AgenticSpace Sandbox ?](#quest-ce-que-agenticspace-sandbox)
2. [Architecture de la Sandbox](#architecture-de-la-sandbox)
3. [Outils Disponibles](#outils-disponibles)
4. [Obtenir le Code Source](#obtenir-le-code-source)
5. [Prérequis](#prérequis)
6. [Flux de Configuration](#flux-de-configuration)
7. [Configuration Détaillée](#configuration-détaillée)
8. [Tester la Configuration](#tester-la-configuration)
9. [Dépannage](#dépannage)

---

## Qu'est-ce qu'AgenticSpace Sandbox ?

**AgenticSpace Sandbox** est une image Docker préconfigurée qui fournit un environnement isolé pour l'exécution d'agents. Cet environnement offre :

- **Sécurité :** Isolation complète du système hôte
- **Reproductibilité :** Environnement cohérent quelle que soit la machine
- **Outils Préinstallés :** Outils CLI, scripts Python et bibliothèques de web scraping

L'image inclut des outils pour le web scraping, l'extraction de données, la découverte de flux et la syndication RSS — le tout en ligne de commande, idéal pour l'automatisation.

---

## Architecture de la Sandbox

L'architecture de la sandbox suit le modèle de conteneurs Docker, où l'agent exécute des commandes dans un environnement isolé :

![Architecture de la Sandbox](configurando-o-agenticspace-sandbox-no-openclaw/imagens/sandbox-architecture.svg)

**Composants principaux :**

- **Système Hôte :** Votre machine où Docker est installé
- **Docker Engine :** Moteur qui gère les conteneurs
- **Conteneur Sandbox :** Environnement isolé avec tous les outils
- **Bind Mounts :** Répertoires partagés entre l'hôte et le conteneur
- **Outils CLI :** Outils en ligne de commande (curl, wget, jq, etc.)
- **Outils Python :** Scripts Python spécialisés (scrape-url, extract-data, etc.)
- **Bibliothèques :** Bibliothèques Python (Scrapy, BeautifulSoup, Playwright, etc.)

---

## Outils Disponibles

AgenticSpace Sandbox est livré avec un écosystème complet d'outils :

![Écosystème d'Outils](configurando-o-agenticspace-sandbox-no-openclaw/imagens/tools-ecosystem.svg)

### Outils CLI

Outils en ligne de commande pour des opérations rapides :

- **curl/wget :** Téléchargement de contenu web
- **jq :** Traitement JSON
- **htmlq :** Extraction de données HTML
- **xidel :** Traitement XML/HTML/XPath

### Outils Python

Scripts Python pour des tâches spécialisées :

- **scrape-url :** Scraping d'URLs
- **extract-data :** Extraction structurée de données
- **find-feeds :** Découverte de flux RSS/Atom
- **parse-feed :** Analyse de flux
- **screenshot :** Capture d'écran avec Playwright
- **api-fetch :** Récupération d'APIs
- **search-web :** Recherche sur le web et récupération du contenu complet
- **map :** Découverte de toutes les URLs d'un site
- **batch-scrape :** Extraction de plusieurs URLs simultanément
- **markdown-scrape :** Obtention de données en markdown prêt pour LLM
- **interact :** Interaction avec des pages web via automatisation de navigateur
- **deep-research :** Recherche approfondie utilisant la recherche et l'extraction

### Bibliothèques

Bibliothèques Python pour le développement :

- **Scrapy :** Framework de web scraping
- **BeautifulSoup :** Analyse HTML/XML
- **Playwright :** Automatisation de navigateurs (Chromium headless)
- **feedparser :** Analyse de flux RSS/Atom
- **httpx/aiohttp :** Clients HTTP asynchrones

---

## Obtenir le Code Source

Le code source complet d'AgenticSpace Sandbox est disponible sur GitHub. Vous pouvez cloner le dépôt pour examiner le code, faire des modifications ou construire votre propre image personnalisée.

### Cloner le Dépôt

```bash
git clone https://github.com/HUB-Agentic-Space/agentic-space-sandbox.git
cd agentic-space-sandbox
```

### Structure du Dépôt

Le dépôt contient :

- **Dockerfile :** Fichier de construction de l'image Docker
- **requirements.txt :** Dépendances Python
- **scripts/ :** Scripts Python des outils
- **INSTRUCTIONS.md :** Instructions détaillées d'utilisation
- **README.md :** Documentation générale du projet

### Construire l'Image Localement

Si vous souhaitez construire l'image Docker localement à partir du code source :

```bash
docker build -t agenticspace-sandbox:local .
```

### Contribuer

Les contributions sont les bienvenues ! Vous pouvez :

1. Faire un fork du dépôt
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

Pour plus d'informations sur la contribution, consultez le fichier CONTRIBUTING.md dans le dépôt.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- **Docker** installé et en cours d'exécution sur votre machine
  ```bash
  docker --version
  docker info
  ```
- **Accès à Agentic Space** plateforme web
- **L'image Docker téléchargée :**
  ```bash
  docker pull carlosdelfino/agenticspace-sandbox:latest
  ```

---

## Flux de Configuration

Le processus de configuration suit quatre étapes principales :

![Flux de Configuration](configurando-o-agenticspace-sandbox-no-openclaw/imagens/config-flow.svg)

### Étape 1 : Télécharger l'Image

```bash
docker pull carlosdelfino/agenticspace-sandbox:latest
```

### Étape 2 : Configurer l'Agent

Dans Agentic Space, créez ou modifiez un agent et configurez les options de sandbox.

### Étape 3 : Ajuster les Paramètres

Configurez les chemins de bind mounts et les variables d'environnement selon vos besoins.

### Étape 4 : Tester

Vérifiez que les outils fonctionnent correctement.

---

## Configuration Détaillée

### Mode d'Exécution

Configurez quand la sandbox doit être utilisée :

| Mode | Description |
|------|-------------|
| `all` | Toutes les commandes exécutées par l'agent s'exécutent dans la sandbox |
| `exec` | Seules les commandes d'exécution (shell) s'exécutent dans la sandbox |
| `none` | Sandbox désactivée (les commandes s'exécutent sur l'hôte) |

**Recommandé :** `all` pour une isolation maximale.

### Portée de l'Isolation

Définit la portée de l'isolation :

| Portée | Description |
|--------|-------------|
| `agent` | Chaque agent a son propre conteneur isolé |
| `session` | Chaque session de conversation a son propre conteneur |
| `global` | Tous les agents partagent le même conteneur |

**Recommandé :** `agent` pour que chaque agent ait son propre environnement.

### Accès à l'Espace de Travail

Définit les permissions d'accès à l'espace de travail :

| Accès | Description |
|--------|-------------|
| `rw` | Lecture et écriture (l'agent peut créer/modifier des fichiers) |
| `ro` | Lecture seule (l'agent peut lire mais pas modifier) |
| `none` | Aucun accès à l'espace de travail |

**Recommandé :** `rw` pour que l'agent puisse enregistrer les résultats.

### Bind Mounts

Les bind mounts permettent de partager des fichiers entre l'hôte et le conteneur :

```
"chemin_sur_hote:chemin_dans_conteneur:mode"
```

**Exemple :**
```json
"binds": [
  "/home/utilisateur/workspace/skills:/skills:ro",
  "/home/utilisateur/workspace/output:/workspace/output:rw"
]
```

- **`ro`** = lecture seule
- **`rw`** = lecture et écriture

### Variables d'Environnement

Configurez les variables d'environnement pour le conteneur :

| Variable | Description |
|----------|-------------|
| `PUID` | ID utilisateur qui exécutera les processus dans le conteneur |
| `PGID` | ID de groupe correspondant |
| `TZ` | Fuseau horaire (pour des horodatages corrects) |
| `PYTHONUNBUFFERED` | Sortie Python en temps réel |
| `SCRAPE_USER_AGENT` | User-Agent personnalisé pour le scraping |

**Comment trouver votre PUID/PGID :**
```bash
id -u  # affiche votre UID (PUID)
id -g  # affiche votre GID (PGID)
```

---

## Tester la Configuration

### Test 1 : Vérifier les Outils CLI

```bash
docker run -it carlosdelfino/agenticspace-sandbox:latest bash
```

Dans le conteneur, testez :
```bash
curl --version
jq --version
htmlq --help
```

### Test 2 : Vérifier les Outils Python

```bash
scrape-url --help
extract-data --help
find-feeds --help
```

### Test 3 : Vérifier les Bibliothèques

```bash
python3 -c "import scrapy; print(scrapy.__version__)"
python3 -c "import bs4; print(bs4.__version__)"
python3 -c "import playwright; print('Playwright OK')"
```

### Test 4 : Scraping Réel

```bash
scrape-url https://example.com "h1"
```

Réponse attendue :
```
Example Domain
```

---

## Dépannage

### Problème : "Permission denied"

**Cause :** Permissions incorrectes sur les fichiers montés.

**Solution :** Configurez `PUID` et `PGID` avec votre vrai UID/GID :
```bash
id -u  # PUID
id -g  # PGID
```

### Problème : "docker: not found"

**Cause :** Docker n'est pas en cours d'exécution.

**Solution :**
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Problème : "image not found"

**Cause :** L'image n'a pas été téléchargée.

**Solution :**
```bash
docker pull carlosdelfino/agenticspace-sandbox:latest
```

### Problème : Playwright ne fonctionne pas

**Cause :** Les dépendances de Chromium peuvent manquer.

**Solution :** L'image installe déjà les dépendances, mais si nécessaire :
```bash
playwright install --with-deps chromium
```

### Problème : Les fichiers créés appartiennent à root

**Cause :** Le conteneur s'exécute en tant que root.

**Solution :** Utilisez les variables `PUID` et `PGID` correctes.

---

## Résumé

AgenticSpace Sandbox fournit un environnement isolé et préconfiguré pour l'exécution d'agents avec des outils de web scraping et de traitement de données.

**Principaux avantages :**
- Environnement isolé et sécurisé
- Outils préinstallés
- Configuration flexible via bind mounts
- Prise en charge de plusieurs outils et bibliothèques

**Prochaines étapes :**
1. Téléchargez l'image Docker
2. Configurez votre agent dans Agentic Space
3. Ajustez les paramètres selon vos besoins
4. Testez les outils disponibles
5. Commencez à automatiser les tâches de scraping et d'extraction de données

Pour plus d'informations, consultez la documentation d'Agentic Space ou contactez le support.
