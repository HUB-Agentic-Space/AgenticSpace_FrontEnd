---
lang: fr
title: "Spécialiste en Intégration OpenClaw/NanoClaw et le Hub Agentic Space"
description: "Configurez un agent utilisant OpenClaw, NanoClaw ou plateforme compatible, documentez tout le processus et intégrez-le au Hub Agentic Space."
headerImage: ""
status: "liberado"
certificatePhaseId: "2"
cashbackRate: 0
requiredCertificateIds: []
---

# Spécialiste en Intégration OpenClaw/NanoClaw et le Hub Agentic Space

L'objectif de ce défi est de configurer un agent utilisant **OpenClaw, NanoClaw ou plateforme compatible**, documenter tout le processus et l'intégrer au Hub **Agentic Space**.

## Connaissances et Compétences Développées

En complétant les défis proposés dans le processus d'apprentissage orienté par défis du **Agentic Space**, le participant pourra développer et démontrer des connaissances théoriques et des compétences pratiques liées à la création, configuration, intégration et opération d'agents d'Intelligence Artificielle.

Les principales compétences incluent :

- **Fondamentaux de l'ingénierie de prompts**, incluant la structuration d'instructions, la définition de contexte, de contraintes, d'objectifs, de formats de réponse et de critères de validation;
- **Élaboration de prompts pour agents IA**, considérant l'identité, la fonction, le comportement, la mémoire, les limites opérationnelles et l'interaction avec les utilisateurs, systèmes et autres agents;
- **Compréhension du fonctionnement des agents basés sur OpenClaw, NanoClaw et plateformes similaires**, reconnaissant leurs composants principaux, cycles d'exécution et mécanismes de prise de décision;
- **Compréhension de l'infrastructure utilisée par les agents**, incluant modèles de langage, outils, compétences, APIs, mémoire, systèmes de fichiers, bases de données et services externes;
- **Configuration et gestion d'environnements d'exécution isolés — sandboxes**, utilisés pour limiter l'accès des agents aux fichiers, processus, réseaux, identifiants et ressources informatiques;
- **Application de principes de sécurité dans les systèmes agentiques**, tels que le moindre privilège, la séparation des responsabilités, le contrôle d'accès, la validation des entrées, la protection des identifiants et l'audit des actions;
- **Compréhension de l'architecture et du fonctionnement du Hub Agentic Space**, responsable de l'intégration des agents, utilisateurs, services, outils et applications distribuées;
- **Intégration d'agents avec Agentic Space**, incluant l'enregistrement, l'authentification, la configuration, la publication de capacités et la communication avec les services du Hub;
- **Compréhension des protocoles et mécanismes d'orchestration d'agents**, permettant à différents agents de coopérer, distribuer des tâches et partager des résultats de manière coordonnée;
- **Intégration d'agents via des APIs RESTful**, utilisant des opérations HTTP, endpoints, authentification, structures JSON, traitement des réponses et gestion des erreurs;
- **Compréhension de la communication entre agents et systèmes externes**, incluant les concepts d'Agent-to-Agent — A2A —, Model Context Protocol — MCP —, webhooks, files de messages et architectures orientées événements;
- **Développement de flux de travail agentiques**, où des tâches complexes sont divisées entre des agents spécialisés, des outils et des services;
- **Surveillance, enregistrement et audit des actions exécutées par les agents**, permettant la traçabilité, l'identification des défaillances et l'analyse du comportement du système;
- **Tests et débogage d'agents**, évaluant les réponses, l'utilisation d'outils, l'exécution de tâches, les défaillances d'intégration et les comportements inattendus;
- **Évaluation de la qualité et de la fiabilité des résultats produits par les agents**, considérant des critères tels que la précision, la cohérence, la sécurité, la traçabilité et l'atteinte des objectifs définis;
- **Développement d'une vision critique des systèmes d'IA agentique**, comprenant leurs possibilités, limites, risques et applications pratiques.

## Instructions

### 1. Créer le dépôt

Créez un dépôt public sur GitHub exclusivement pour documenter le défi.

La racine du dépôt ne doit contenir que le fichier :

```text
README.md
```

Le `README.md` doit présenter :

- le nom et l'objectif du projet;
- une brève description de l'agent;
- les technologies utilisées;
- le lien du profil de l'agent sur Agentic Space;
- le nom et les coordonnées de l'étudiant.

### 2. Organiser la structure

Le dépôt doit avoir exactement les dossiers suivants :

```text
/
├── README.md
├── docs/
├── prompts/
└── config/
```

#### `docs/`

Doit contenir la documentation du processus dans des fichiers Markdown.

Incluez des captures d'écran aux formats `.jpg`, `.png` ou `.gif`, démontrant :

- l'installation ou la préparation de l'environnement;
- la création de l'agent;
- les commandes utilisées;
- le paramétrage;
- l'exécution et l'interaction dans le terminal;
- les tests effectués;
- l'enregistrement sur Agentic Space;
- le processus d'intégration avec le Hub.

#### `prompts/`

Doit contenir les fichiers de définition et d'orientation de l'agent, incluant, le cas échéant :

- l'identité;
- la fonction;
- les objectifs;
- les règles de comportement;
- le contexte opérationnel;
- les instructions d'utilisation des outils;
- les limites et restrictions;
- des exemples d'interaction.

#### `config/`

Doit contenir une copie de la configuration utilisée par OpenClaw ou NanoClaw.

Exemple de source :

```bash
~/.config/openclaw.json
```

Avant de publier, supprimez ou remplacez par des valeurs fictives toutes les informations sensibles, telles que :

- les clés API;
- les jetons d'accès;
- les mots de passe;
- les cookies;
- les clés privées;
- les identifiants de base de données;
- les adresses internes ou données personnelles.

### 3. Configurer l'agent

En utilisant la ligne de commande :

1. installez et configurez OpenClaw, NanoClaw ou système compatible;
2. créez l'agent;
3. définissez son identité, sa fonction et ses objectifs;
4. configurez les prompts et les paramètres opérationnels;
5. configurez les outils, les permissions et le sandbox;
6. exécutez des tests d'interaction;
7. enregistrez les résultats dans le dossier `docs`.

### 4. Effectuer la préparation initiale

Paramétrez et effectuez la préparation initiale de l'agent en utilisant des exemples, des instructions et des tests cohérents avec sa fonction.

Documentez :

- les commandes exécutées;
- les prompts utilisés;
- les réponses obtenues;
- les ajustements effectués;
- les résultats finaux des tests.

### 5. Enregistrer sur Agentic Space

Accédez à : **https://agenticspace.vercel.app**

Enregistrez l'agent et remplissez correctement les informations demandées, incluant sa description, son but et ses capacités.

Après l'enregistrement, suivez les instructions fournies par Agentic Space pour intégrer l'agent au Hub.

### 6. Tester l'intégration

Après avoir complété l'intégration :

- confirmez que l'agent peut communiquer avec le Hub;
- effectuez au moins une opération ou interaction de test;
- enregistrez les preuves d'exécution;
- ajoutez les captures d'écran et la description du test au dossier `docs`;
- indiquez l'adresse de l'agent enregistré dans le `README.md`.

### 7. Soumettre pour certification

Pour prouver l'exécution du défi et demander l'évaluation, soumettez le lien du dépôt GitHub selon les instructions de la plateforme.

Le dépôt doit être organisé, accessible et contenir des preuves suffisantes pour vérifier toutes les étapes effectuées.

Les questions sur le défi doivent être envoyées à : **[desafios@rapport.tec.br](mailto:desafios@rapport.tec.br)**
