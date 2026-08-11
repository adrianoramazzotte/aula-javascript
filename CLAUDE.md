# Repositório: material didático + projeto Mercado

Duas coisas convivem aqui:

1. **Material didático** de Desenvolvimento em JavaScript (UNOPAR 2026.2) — páginas HTML
   estáticas em `aulas/`, `projetos/` e na raiz. Sem build, sem dependências.
2. **Projeto Mercado** — o marketplace que está sendo desenvolvido, em `mercado/`.

## Ao retomar o trabalho no projeto Mercado

Leia nesta ordem:

1. **`PROGRESSO.md`** — etapa atual, o que ficou pela metade e qual é o próximo passo.
2. **`plano-desenvolvimento-mercado.html`** — as 10 etapas: passos, comandos e critérios
   de conclusão. Trabalhe apenas na etapa corrente.
3. **`especificacao-mercado.html`** — requisitos (RF/RNF), modelo de dados e fluxos.
   Consulte quando precisar do "o quê" e do "por quê".

Ao encerrar a sessão, atualize `PROGRESSO.md` — em especial a linha **"Parei em"**.

## Regras do repositório

- **Branches:** trabalho em `dev`; promover para `hml` ao fechar uma etapa; `main` é
  protegida por ruleset e só o dono do repositório atualiza.
- **Commits:** `tipo(escopo): descrição no imperativo` — `feat`, `fix`, `refactor`,
  `test`, `docs`, `chore`. Um commit por tarefa concluída.
- **Nunca** commitar `.env`, credenciais ou o PDF do livro didático (já no `.gitignore`).

## Regras do projeto Mercado

- TypeORM com `synchronize: false` em **todos** os ambientes; esquema só muda por migração.
- Dinheiro em `DECIMAL(10,2)`; nunca `float`.
- `order_items` guarda snapshot de título e preço — pedido antigo não muda quando o
  produto muda.
- Criação de pedido e baixa de estoque na **mesma transação**, com lock na variação.
- Preço nunca vem do cliente: o servidor lê do banco.
- Toda rota de vendedor filtra por `store_id` do token, não só pelo papel.

## Material didático

- Páginas reusam `aulas/assets/style.css` e `aulas/assets/app.js` (tema, sumário
  automático a partir de `h2[id]`, realce de sintaxe, blocos de código executáveis com
  `data-run`).
- Para visualizar: `python3 -m http.server 8080` na raiz.
