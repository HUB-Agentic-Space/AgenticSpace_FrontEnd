# Notícias e Informáticos do Agentic Space

Este diretório contém as notícias e informátivos oficiais disponíveis no Agentic Space.

## Estrutura de uma Notícia

Cada notícia deve ser uma pasta com a seguinte estrutura:

```
nome-da-noticia/
├── news-pt.md           # Conteúdo da notícia em português (Markdown)
├── news-en.md           # Conteúdo da notícia em inglês (Markdown)
├── news-fr.md           # Conteúdo da notícia em francês (Markdown)
└── imagens/             # Pasta de imagens (opcional)
    └── imagem.png
```

## Arquivo index.json

O arquivo `index.json` na raiz da pasta `news` contém a lista de todas as notícias disponíveis e seus metadados:

```json
{
  "news": [
    {
      "slug": "nome-da-noticia",
      "title": "Título da Notícia",
      "description": "Descrição breve da notícia",
      "date": "YYYY-MM-DD",
      "category": "official",
      "availableLanguages": ["pt", "en", "fr"],
      "defaultLanguage": "pt"
    }
  ]
}
```

Campos:
- `slug` (obrigatório): Identificador único da notícia (deve corresponder ao nome da pasta)
- `title` (obrigatório): Título da notícia que será exibido na listagem
- `description` (obrigatório): Descrição breve da notícia
- `date` (obrigatório): Data da notícia no formato YYYY-MM-DD (usado para ordenação)
- `category` (opcional): Categoria da notícia (ex: "official", "update", "alert")
- `availableLanguages` (obrigatório): Lista de idiomas disponíveis
- `defaultLanguage` (obrigatório): Idioma padrão para fallback

## Arquivo news-XX.md

Cada arquivo `news-XX.md` deve conter frontmatter com metadados seguido do conteúdo em Markdown:

```markdown
---
lang: pt
title: "Título da Notícia"
description: "Descrição breve"
date: "2026-07-31"
category: "official"
---

# Conteúdo da notícia...
```

## Como Adicionar uma Nova Notícia

1. Crie uma nova pasta em `frontend/public/news/` com o nome da notícia (use kebab-case)
2. Dentro da pasta, crie os arquivos `news-pt.md`, `news-en.md`, `news-fr.md` com o conteúdo traduzido
3. (Opcional) Crie a pasta `imagens/` e adicione as imagens necessárias
4. Atualize o arquivo `index.json` na raiz da pasta `news` adicionando a nova notícia à lista

## Ordenação

As notícias são ordenadas por data (mais recente primeiro). As 3 mais recentes são exibidas na página principal.

## Acesso às Notícias

As notícias são acessíveis através do menu:
- Institucional > Notícias e Informátivos

Ou diretamente pela URL:
- Listagem: `/news`
- Notícia específica: `/news/view?slug=nome-da-noticia`
