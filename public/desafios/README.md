![header](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=Desafios&fontSize=36&fontAlignY=35&animation=twinkling)

![visitors](https://visitor-badge.laobi.icu/badge?page_id=RapportTecnologia.AgenticSpace.desafios_readme)

[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC_BY--SA_4.0-blue.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
![Language: Portuguese](https://img.shields.io/badge/Language-Portuguese-brightgreen.svg)
![Status](https://img.shields.io/badge/Status-Ongoing-yellow)
[![GitHub Issues](https://img.shields.io/github/issues/RapportTecnologia/AgenticSpace)](https://github.com/RapportTecnologia/AgenticSpace/issues)

# Desafios do Agentic Space

Este diretório contém os desafios disponíveis no Agentic Space para obtenção de certificados e moedas (CAS).

## Estrutura de um Desafio

Cada desafio deve ser uma pasta com a seguinte estrutura:

```
nome-do-desafio/
├── desafio-pt.md           # Conteúdo do desafio em português (YAML + Markdown)
├── desafio-en.md           # Conteúdo do desafio em inglês (opcional)
├── desafio-fr.md           # Conteúdo do desafio em francês (opcional)
└── imagens/                # Pasta de imagens (opcional)
    └── header.png
```

## Arquivo index.json

O arquivo `index.json` na raiz da pasta `desafios` contém a lista de todos os desafios disponíveis e seus metadados:

```json
{
  "challenges": [
    {
      "slug": "nome-do-desafio",
      "title": "Título do Desafio",
      "description": "Descrição breve do desafio",
      "availableLanguages": ["pt", "en", "fr"],
      "defaultLanguage": "pt",
      "certificatePhaseId": "2"
    }
  ]
}
```

Campos:

- `slug` (obrigatório): Identificador único do desafio (deve corresponder ao nome da pasta)
- `title` (obrigatório): Título do desafio exibido na listagem
- `description` (obrigatório): Descrição breve do desafio
- `availableLanguages` (obrigatório): Lista de idiomas disponíveis
- `defaultLanguage` (obrigatório): Idioma padrão para fallback
- `certificatePhaseId` (obrigatório): ID on-chain da fase/certificado vinculado a este desafio

## Arquivo desafio-{lang}.md

Cada arquivo de desafio deve conter um cabeçalho YAML (frontmatter) seguido do conteúdo em Markdown.

### Campos do YAML Frontmatter

```yaml
---
lang: pt
title: "Título do Desafio"
description: "Descrição breve do desafio"
headerImage: "imagens/header.png"
status: "liberado"
certificatePhaseId: "2"
cashbackRate: 1.0
---
```

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `lang` | string | sim | Código do idioma (`pt`, `en`, `fr`, `es`, `de`) |
| `title` | string | sim | Título do desafio |
| `description` | string | sim | Descrição breve |
| `headerImage` | string | não | Caminho relativo para imagem de header |
| `status` | string | sim | `"planejamento"` ou `"liberado"` |
| `certificatePhaseId` | string | sim | ID on-chain da fase/certificado |
| `cashbackRate` | float | não | Multiplicador de cashback (padrão: `0` = sem cashback) |
| `requiredCertificateIds` | array | não | Array de IDs de fases cujos certificados são pré-requisito (ex: `[1, 2]`) |

### Campo `cashbackRate`

Quando `status` e `cashbackRate` estão ambos definidos no YAML, um banner informativo é exibido na página do desafio mostrando o status atual e o valor do cashback.

O `cashbackRate` define a porcentagem de cashback sobre o valor pago pelo certificado:

- **0** ou ausente = sem cashback (não exibido)
- **1.0** = 100% do valor pago volta como cashback
- **>1.0** = bônus (ex: `1.5` = 150% do valor pago)
- **<1.0** = parcial (ex: `0.5` = 50% do valor pago)

O valor do cashback exibido é calculado como: `minCasDeposit (on-chain) × cashbackRate (YAML)`

### Campo `certificatePhaseId`

O `certificatePhaseId` vincula o desafio a uma fase no smart contract de certificados. A partir desse ID, a página busca em tempo de execução (read-only via RPC):

- Preço do certificado (`minCasDeposit`)
- Status ativo da fase (`activePhases`)
- Pré-requisitos (`phasePrerequisites`)
- Habilidades adquiridas (`skillsDescription`)
- Instruções para obtenção (`instructions`)

## Como Adicionar um Novo Desafio

1. Crie uma nova pasta em `frontend/public/desafios/` com o nome do desafio (use kebab-case, ex: `meu-novo-desafio`)
2. Dentro da pasta, crie o arquivo `desafio-pt.md` com o conteúdo do desafio (YAML + Markdown)
3. (Opcional) Crie arquivos `desafio-en.md`, `desafio-fr.md`, etc. para outros idiomas
4. (Opcional) Crie a pasta `imagens/` e adicione as imagens necessárias
5. Atualize o arquivo `index.json` na raiz da pasta `desafios` adicionando o novo desafio à lista

## Acesso aos Desafios

Os desafios são acessíveis através do menu:

- Desafios (direto na barra de navegação)

Ou diretamente pela URL:

- Listagem: `/desafios`
- Desafio específico: `/desafios/view?slug=nome-do-desafio`

## Changelog

| Data | Versão | Descrição |
|---|---|---|
| 2025-08-09 | 0.1.0 | Documentação inicial do padrão de desafios |

![footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer&animation=twinkling)
