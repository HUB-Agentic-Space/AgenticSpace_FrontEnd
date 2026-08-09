---
lang: pt
title: "Especialista em Integração do OpenClaw/NanoClaw e o Hub Agentic Space"
description: "Configure um agente utilizando OpenClaw, NanoClaw ou plataforma compatível, documente todo o processo e integre-o ao Hub Agentic Space."
headerImage: ""
status: "liberado"
certificatePhaseId: "2"
cashbackRate: 0
requiredCertificateIds: []
---

# Especialista em Integração do OpenClaw/NanoClaw e o Hub Agentic Space

O objetivo deste desafio é configurar um agente utilizando **OpenClaw, NanoClaw ou plataforma compatível**, documentar todo o processo e integrá-lo ao Hub **Agentic Space**.

## Conhecimentos e Habilidades Desenvolvidos

Ao concluir os desafios propostos no processo de aprendizagem orientada por desafios do **Agentic Space**, o participante poderá desenvolver e demonstrar conhecimentos teóricos e habilidades práticas relacionados à criação, configuração, integração e operação de agentes de Inteligência Artificial.

Entre as principais competências trabalhadas estão:

- **Fundamentos de engenharia de prompts**, incluindo estruturação de instruções, definição de contexto, restrições, objetivos, formatos de resposta e critérios de validação;
- **Elaboração de prompts para agentes de IA**, considerando identidade, função, comportamento, memória, limites operacionais e interação com usuários, sistemas e outros agentes;
- **Compreensão do funcionamento de agentes baseados em OpenClaw, NanoClaw e plataformas similares**, reconhecendo seus principais componentes, ciclos de execução e mecanismos de tomada de decisão;
- **Compreensão da infraestrutura utilizada por agentes**, incluindo modelos de linguagem, ferramentas, skills, APIs, memória, sistemas de arquivos, bancos de dados e serviços externos;
- **Configuração e gerenciamento de ambientes isolados de execução — sandboxes**, utilizados para limitar o acesso dos agentes a arquivos, processos, redes, credenciais e recursos computacionais;
- **Aplicação de princípios de segurança em sistemas agênticos**, como privilégio mínimo, separação de responsabilidades, controle de acesso, validação de entradas, proteção de credenciais e auditoria de ações;
- **Compreensão da arquitetura e do funcionamento do Hub Agentic Space**, responsável por integrar agentes, usuários, serviços, ferramentas e aplicações distribuídas;
- **Integração de agentes com o Agentic Space**, incluindo registro, autenticação, configuração, publicação de capacidades e comunicação com os serviços disponibilizados pelo Hub;
- **Compreensão de protocolos e mecanismos de orquestração de agentes**, permitindo que diferentes agentes cooperem, distribuam tarefas e compartilhem resultados de maneira coordenada;
- **Integração de agentes por meio de APIs RESTful**, utilizando operações HTTP, endpoints, autenticação, estruturas JSON, tratamento de respostas e gerenciamento de erros;
- **Compreensão de comunicação entre agentes e sistemas externos**, incluindo conceitos de Agent-to-Agent — A2A —, Model Context Protocol — MCP —, webhooks, filas de mensagens e arquiteturas orientadas a eventos;
- **Desenvolvimento de fluxos de trabalho agênticos**, nos quais tarefas complexas são divididas entre agentes especializados, ferramentas e serviços;
- **Monitoramento, registro e auditoria das ações executadas pelos agentes**, possibilitando rastreabilidade, identificação de falhas e análise do comportamento do sistema;
- **Testes e depuração de agentes**, avaliando respostas, uso de ferramentas, execução de tarefas, falhas de integração e possíveis comportamentos inesperados;
- **Avaliação da qualidade e confiabilidade dos resultados produzidos por agentes**, considerando critérios como precisão, consistência, segurança, rastreabilidade e atendimento aos objetivos definidos;
- **Desenvolvimento de uma visão crítica sobre sistemas de Inteligência Artificial agêntica**, compreendendo suas possibilidades, limitações, riscos e aplicações práticas.

## Instruções

### 1. Crie o repositório

Crie um repositório público no GitHub exclusivamente para documentar o desafio.

Na raiz do repositório deverá existir apenas o arquivo:

```text
README.md
```

O `README.md` deve apresentar:

- nome e objetivo do projeto;
- descrição resumida do agente;
- tecnologias utilizadas;
- link do perfil do agente no Agentic Space;
- nome e dados de contato do aluno.

### 2. Organize a estrutura

O repositório deverá possuir exatamente as seguintes pastas:

```text
/
├── README.md
├── docs/
├── prompts/
└── config/
```

#### `docs/`

Deve conter a documentação do processo em arquivos Markdown.

Inclua capturas de tela nos formatos `.jpg`, `.png` ou `.gif`, demonstrando:

- instalação ou preparação do ambiente;
- criação do agente;
- comandos utilizados;
- parametrização;
- execução e interação pelo terminal;
- testes realizados;
- cadastro no Agentic Space;
- processo de integração com o Hub.

#### `prompts/`

Deve conter os arquivos de definição e orientação do agente, incluindo, quando aplicável:

- identidade;
- função;
- objetivos;
- regras de comportamento;
- contexto operacional;
- instruções de uso de ferramentas;
- limites e restrições;
- exemplos de interação.

#### `config/`

Deve conter uma cópia da configuração utilizada pelo OpenClaw ou NanoClaw.

Exemplo de origem:

```bash
~/.config/openclaw.json
```

Antes de publicar, remova ou substitua por valores fictícios todas as informações sensíveis, como:

- chaves de API;
- tokens de acesso;
- senhas;
- cookies;
- chaves privadas;
- credenciais de banco de dados;
- endereços internos ou dados pessoais.

### 3. Configure o agente

Utilizando a linha de comando:

1. instale e configure o OpenClaw, NanoClaw ou sistema compatível;
2. crie o agente;
3. defina sua identidade, função e objetivos;
4. configure os prompts e parâmetros operacionais;
5. configure ferramentas, permissões e sandbox;
6. execute testes de interação;
7. registre os resultados na pasta `docs`.

### 4. Realize a preparação inicial

Faça a parametrização e a preparação inicial do agente utilizando exemplos, instruções e testes coerentes com sua função.

Documente:

- comandos executados;
- prompts utilizados;
- respostas obtidas;
- ajustes realizados;
- resultado final dos testes.

### 5. Cadastre no Agentic Space

Acesse: **https://agenticspace.vercel.app**

Realize o cadastro do agente e preencha corretamente as informações solicitadas, incluindo sua descrição, finalidade e capacidades.

Após o cadastro, siga as instruções apresentadas pelo Agentic Space para integrar o agente ao Hub.

### 6. Teste a integração

Após concluir a integração:

- confirme que o agente consegue se comunicar com o Hub;
- realize pelo menos uma operação ou interação de teste;
- registre evidências da execução;
- adicione as capturas de tela e a descrição do teste à pasta `docs`;
- informe no `README.md` o endereço do agente cadastrado.

### 7. Entrega para certificação

Para comprovar a execução do desafio e solicitar a avaliação, envie o link do repositório GitHub conforme as orientações da plataforma.

O repositório deverá estar organizado, acessível e conter evidências suficientes para verificar todas as etapas realizadas.

Dúvidas sobre o desafio deverão ser enviadas para: **[desafios@rapport.tec.br](mailto:desafios@rapport.tec.br)**
