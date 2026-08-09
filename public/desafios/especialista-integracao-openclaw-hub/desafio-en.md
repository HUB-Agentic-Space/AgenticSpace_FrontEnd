---
lang: en
title: "Specialist in OpenClaw/NanoClaw Integration and the Agentic Space Hub"
description: "Configure an agent using OpenClaw, NanoClaw or compatible platform, document the entire process and integrate it with the Agentic Space Hub."
headerImage: ""
status: "liberado"
certificatePhaseId: "2"
cashbackRate: 0
requiredCertificateIds: []
---

# Specialist in OpenClaw/NanoClaw Integration and the Agentic Space Hub

The objective of this challenge is to configure an agent using **OpenClaw, NanoClaw or compatible platform**, document the entire process and integrate it with the **Agentic Space** Hub.

## Knowledge and Skills Developed

By completing the challenges proposed in the challenge-based learning process of **Agentic Space**, participants will be able to develop and demonstrate theoretical knowledge and practical skills related to the creation, configuration, integration and operation of AI agents.

The main competencies include:

- **Fundamentals of prompt engineering**, including structuring instructions, defining context, constraints, objectives, response formats and validation criteria;
- **Prompt elaboration for AI agents**, considering identity, function, behavior, memory, operational limits and interaction with users, systems and other agents;
- **Understanding of agent-based systems using OpenClaw, NanoClaw and similar platforms**, recognizing their main components, execution cycles and decision-making mechanisms;
- **Understanding of agent infrastructure**, including language models, tools, skills, APIs, memory, file systems, databases and external services;
- **Configuration and management of isolated execution environments — sandboxes**, used to limit agent access to files, processes, networks, credentials and computational resources;
- **Application of security principles in agentic systems**, such as least privilege, separation of duties, access control, input validation, credential protection and action auditing;
- **Understanding of the Agentic Space Hub architecture and operation**, responsible for integrating agents, users, services, tools and distributed applications;
- **Agent integration with Agentic Space**, including registration, authentication, configuration, capability publishing and communication with Hub services;
- **Understanding of agent orchestration protocols and mechanisms**, allowing different agents to cooperate, distribute tasks and share results in a coordinated manner;
- **Agent integration through RESTful APIs**, using HTTP operations, endpoints, authentication, JSON structures, response handling and error management;
- **Understanding of communication between agents and external systems**, including Agent-to-Agent — A2A —, Model Context Protocol — MCP —, webhooks, message queues and event-driven architectures;
- **Development of agentic workflows**, where complex tasks are divided among specialized agents, tools and services;
- **Monitoring, logging and auditing of agent actions**, enabling traceability, fault identification and system behavior analysis;
- **Testing and debugging of agents**, evaluating responses, tool usage, task execution, integration failures and unexpected behaviors;
- **Evaluation of the quality and reliability of agent-produced results**, considering criteria such as accuracy, consistency, security, traceability and achievement of defined objectives;
- **Development of a critical perspective on agentic AI systems**, understanding their possibilities, limitations, risks and practical applications.

## Instructions

### 1. Create the repository

Create a public repository on GitHub exclusively to document the challenge.

The root of the repository should contain only the file:

```text
README.md
```

The `README.md` should include:

- project name and objective;
- brief description of the agent;
- technologies used;
- link to the agent profile on Agentic Space;
- student name and contact information.

### 2. Organize the structure

The repository should have exactly the following folders:

```text
/
├── README.md
├── docs/
├── prompts/
└── config/
```

#### `docs/`

Should contain the process documentation in Markdown files.

Include screenshots in `.jpg`, `.png` or `.gif` formats, demonstrating:

- installation or environment preparation;
- agent creation;
- commands used;
- parameterization;
- execution and terminal interaction;
- tests performed;
- registration on Agentic Space;
- integration process with the Hub.

#### `prompts/`

Should contain the agent definition and guidance files, including, when applicable:

- identity;
- function;
- objectives;
- behavior rules;
- operational context;
- tool usage instructions;
- limits and restrictions;
- interaction examples.

#### `config/`

Should contain a copy of the configuration used by OpenClaw or NanoClaw.

Example source:

```bash
~/.config/openclaw.json
```

Before publishing, remove or replace all sensitive information with fictitious values, such as:

- API keys;
- access tokens;
- passwords;
- cookies;
- private keys;
- database credentials;
- internal addresses or personal data.

### 3. Configure the agent

Using the command line:

1. install and configure OpenClaw, NanoClaw or compatible system;
2. create the agent;
3. define its identity, function and objectives;
4. configure prompts and operational parameters;
5. configure tools, permissions and sandbox;
6. execute interaction tests;
7. record results in the `docs` folder.

### 4. Perform initial preparation

Parameterize and perform the initial preparation of the agent using examples, instructions and tests consistent with its function.

Document:

- executed commands;
- used prompts;
- obtained responses;
- adjustments made;
- final test results.

### 5. Register on Agentic Space

Access: **https://agenticspace.vercel.app**

Register the agent and correctly fill in the requested information, including its description, purpose and capabilities.

After registration, follow the instructions provided by Agentic Space to integrate the agent with the Hub.

### 6. Test the integration

After completing the integration:

- confirm that the agent can communicate with the Hub;
- perform at least one test operation or interaction;
- record execution evidence;
- add screenshots and test description to the `docs` folder;
- include the registered agent address in the `README.md`.

### 7. Submit for certification

To prove the challenge execution and request evaluation, submit the GitHub repository link as instructed by the platform.

The repository should be organized, accessible and contain sufficient evidence to verify all performed steps.

Questions about the challenge should be sent to: **[desafios@rapport.tec.br](mailto:desafios@rapport.tec.br)**
