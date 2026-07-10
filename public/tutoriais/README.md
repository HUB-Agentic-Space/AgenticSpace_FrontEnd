# Tutoriais do Agentic Space

Este diretório contém os tutoriais disponíveis no Agentic Space.

## Estrutura de um Tutorial

Cada tutorial deve ser uma pasta com o seguinte estrutura:

```
nome-do-tutorial/
├── tutorial.md           # Conteúdo do tutorial em Markdown
└── imagens/               # Pasta de imagens (opcional)
    └── imagem.png
```

## Arquivo index.json

O arquivo `index.json` na raiz da pasta `tutoriais` contém a lista de todos os tutoriais disponíveis e seus metadados:

```json
{
  "tutorials": [
    {
      "slug": "nome-do-tutorial",
      "title": "Título do Tutorial",
      "description": "Descrição breve do tutorial"
    }
  ]
}
```

Campos:
- `slug` (obrigatório): Identificador único do tutorial (deve corresponder ao nome da pasta)
- `title` (obrigatório): Título do tutorial que será exibido na listagem
- `description` (obrigatório): Descrição breve do tutorial
- `thumb` (opcional): Caminho relativo para a imagem de thumbnail (ex: "imagens/thumb.png"). Se não fornecido, será exibido um ícone padrão.

## Arquivo tutorial.md

O arquivo `tutorial.md` deve conter o conteúdo do tutorial em formato Markdown. Suporta:

- Títulos (h1, h2, h3, etc.)
- Listas (ordenadas e não ordenadas)
- Links
- Imagens (caminho relativo ao arquivo tutorial.md)
- Blocos de código
- Tabelas
- Etc.

Exemplo de referência a imagem:
```markdown
![Descrição da imagem](imagens/minha-imagem.png)
```

## Pasta imagens

A pasta `imagens` é opcional e deve conter todas as imagens usadas no tutorial. As imagens devem ser referenciadas no arquivo `tutorial.md` com caminho relativo.

## Como Adicionar um Novo Tutorial

1. Crie uma nova pasta em `frontend/public/tutoriais/` com o nome do tutorial (use kebab-case, ex: `meu-novo-tutorial`)
2. Dentro da pasta, crie o arquivo `tutorial.md` com o conteúdo do tutorial
3. (Opcional) Crie a pasta `imagens/` e adicione as imagens necessárias
4. Atualize o arquivo `index.json` na raiz da pasta `tutoriais` adicionando o novo tutorial à lista

## Atualizar index.json

O arquivo `index.json` na raiz da pasta `tutoriais` lista todos os tutoriais disponíveis. Adicione o novo tutorial:

```json
{
  "tutorials": [
    {
      "slug": "nome-do-tutorial",
      "title": "Título do Tutorial",
      "description": "Descrição breve do tutorial"
    },
    {
      "slug": "meu-novo-tutorial",
      "title": "Meu Novo Tutorial",
      "description": "Descrição do meu novo tutorial"
    }
  ]
}
```

O campo `slug` deve corresponder exatamente ao nome da pasta do tutorial.

## Acesso aos Tutoriais

Os tutoriais são acessíveis através do menu:
- Tutoriais (direto na barra de navegação)

Ou diretamente pela URL:
- Listagem: `/tutoriais`
- Tutorial específico: `/tutoriais/view?slug=nome-do-tutorial`
