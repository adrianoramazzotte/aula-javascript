# Aula JavaScript

Material de estudo da disciplina **Desenvolvimento em JavaScript** — Unidade 1 (UNOPAR, 2026.2).

Páginas em HTML estático, sem dependências ou build. Basta abrir no navegador.

## Conteúdo

| Página | Assunto |
| --- | --- |
| [`aulas/index.html`](aulas/index.html) | Índice da Unidade 1 |
| [`aulas/modulo-1.html`](aulas/modulo-1.html) | Introdução ao JavaScript |
| [`aulas/modulo-2.html`](aulas/modulo-2.html) | Estruturas condicionais |
| [`aulas/modulo-3.html`](aulas/modulo-3.html) | Estruturas de repetição |
| [`aulas/modulo-4.html`](aulas/modulo-4.html) | Estruturas de dados |
| [`aulas/referencias.html`](aulas/referencias.html) | Referências bibliográficas |
| [`guia-ambiente-e-ia.html`](guia-ambiente-e-ia.html) | Guia de ambiente e IA gratuita para JavaScript |

## Opções de desenvolvimento

Três projetos práticos para aplicar o conteúdo da unidade. Cada página traz o
descritivo completo — problema, público, escopo do MVP, modelo de dados, regras
de negócio em código executável, arquitetura, roadmap e indicadores — e leva a
um protótipo funcional em JavaScript puro.

| Página | Projeto | Protótipo |
| --- | --- | --- |
| [`projetos.html`](projetos.html) | Índice e comparativo das três opções | — |
| [`projeto-controle-moveleiro.html`](projeto-controle-moveleiro.html) | Gestão para marcenaria de móveis planejados | [orçamento de ambientes](projetos/controle-moveleiro/index.html) |
| [`projeto-saas-mercado.html`](projeto-saas-mercado.html) | SaaS multiempresa para minimercados | [frente de caixa](projetos/saas-mercado/index.html) |
| [`projeto-saas-panificadora.html`](projeto-saas-panificadora.html) | SaaS para padarias com produção própria | [ficha técnica e produção](projetos/saas-panificadora/index.html) |

Os protótipos guardam dados apenas no `localStorage` do navegador: servem para
validar as regras de negócio, não para uso em produção.

## Estrutura

```
.
├── aulas/
│   ├── assets/       # style.css e app.js compartilhados
│   ├── img/          # figuras dos módulos
│   └── *.html        # índice, módulos 1–4 e referências
├── projetos/
│   ├── assets/       # proto.css compartilhado pelos protótipos
│   ├── controle-moveleiro/
│   ├── saas-mercado/
│   └── saas-panificadora/
├── projetos.html
├── projeto-controle-moveleiro.html
├── projeto-saas-mercado.html
├── projeto-saas-panificadora.html
├── guia-ambiente-e-ia.html
└── README.md
```

## Como visualizar

Abra `aulas/index.html` diretamente no navegador, ou sirva a pasta localmente:

```bash
python3 -m http.server 8000
# depois acesse http://localhost:8000/aulas/
```

## Observação

O livro didático em PDF não faz parte deste repositório por ser material com
direitos autorais da editora.
