# lost-ufpb.github.io

Site do **LOSt – Laboratório de Otimização de Sistemas** (DEP/CT/UFPB), feito com Jekyll e publicado pelo GitHub Pages.

## Estrutura

```
_config.yml              configurações do site
_data/navigation.yml     abas do menu
_data/members.yml        membros (Professores, Mestrado, IC, Egressos)
_data/materiais.yml      materiais didáticos
_layouts/default.html    layout base
_includes/               cabeçalho e rodapé
index.html               página inicial
membros.html             /membros/
publicacoes.html         /publicacoes/
materiais.html           /materiais/
assets/bib/publications.bib   publicações (BibTeX)
assets/img/              logo e fotos (assets/img/membros/)
assets/css/style.css     estilos
assets/js/publications.js     leitor do BibTeX
```

## Como atualizar

- **Publicações:** edite ou substitua `assets/bib/publications.bib`. A página lê o arquivo
  direto no navegador e agrupa por ano, então não precisa mexer em mais nada.
- **Membros:** edite `_data/members.yml`. Para trocar a foto, coloque a imagem em
  `assets/img/membros/` (de preferência quadrada) e altere o campo `photo`.
  O campo `link` é a página pessoal (Lattes, site, etc.).
- **Materiais didáticos:** siga o exemplo comentado em `_data/materiais.yml`.
- **Nova aba:** crie a página (ex.: `projetos.html` com `permalink: /projetos/`) e
  adicione a entrada em `_data/navigation.yml`.

## Rodar localmente

```bash
bundle install
bundle exec jekyll serve
```

Depois, abra http://localhost:4000.
