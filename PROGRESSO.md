# Progresso — Projeto Mercado

Controle das etapas de desenvolvimento. **Atualize ao encerrar cada sessão de trabalho.**

- Guia das etapas (passos, comandos, critérios): [plano-desenvolvimento-mercado.html](plano-desenvolvimento-mercado.html)
- Requisitos, modelo de dados e fluxos: [especificacao-mercado.html](especificacao-mercado.html)

Legenda: `[ ]` a fazer · `[x]` concluído · `[~]` em andamento · `[!]` bloqueado

---

## Estado atual

- **Etapa:** 0 — Fundação (não iniciada)
- **Última sessão:** 2026-08-11
- **Parei em:** documentação concluída; nenhuma linha de código do sistema escrita ainda
- **Próximo passo:** `git switch dev` e criar o projeto Nest em `mercado/` (etapa 0, passo 1)
- **Bloqueios:** nenhum

> A linha **"Parei em"** é a mais importante do arquivo. Caixinhas dizem o que foi feito;
> ela diz o que estava em andamento. Escreva sempre, mesmo em sessão curta.

---

## Resumo

| Etapa | Título | Requisitos | Estado |
| --- | --- | --- | --- |
| 0 | Fundação | — | ⬜ 0/8 |
| 1 | Identidade e acesso | RF-01, RNF-01 | ⬜ 0/9 |
| 2 | Lojas e catálogo | RF-02, RF-09 | ⬜ 0/8 |
| 3 | Vitrine SSR e SEO | RNF-04 | ⬜ 0/8 |
| 4 | Carrinho | RF-03 | ⬜ 0/8 |
| 5 | **Checkout e pagamento** | RF-04, RF-05 | ⬜ 0/9 |
| 6 | Operação do vendedor | RF-05, RF-09 | ⬜ 0/6 |
| 7 | Reputação e notificações | RF-06, RF-08 | ⬜ 0/9 |
| 8 | Administração e relatórios | RF-07 | ⬜ 0/7 |
| 9 | PWA, desempenho e produção | RNF-02/03/04 | ⬜ 0/10 |

---

## Etapa 0 — Fundação

**Entregável:** `GET /health` responde 200 com o banco conectado.

- [ ] Projeto Nest criado em `mercado/` na branch `dev`
- [ ] Dependências de base instaladas (config, TypeORM, mysql2, class-validator)
- [ ] `docker-compose.yml` com MySQL 8 e Redis 7, com volume nomeado
- [ ] `ConfigModule` global validando as variáveis de ambiente na inicialização
- [ ] TypeORM com `synchronize: false` e `data-source.ts` para o CLI de migrações
- [ ] Primeira migração criando a tabela `users`
- [ ] Endpoint `GET /health` executando `SELECT 1`
- [ ] ESLint, Prettier, Jest e workflow de CI no GitHub Actions

**Concluída quando:**

- [ ] `docker compose up -d` sobe banco e Redis sem erro
- [ ] `npm run migration:run` cria `users` em banco vazio
- [ ] `npm run migration:revert` desfaz sem deixar resíduo
- [ ] `/health` devolve 200; com o banco derrubado, devolve 503
- [ ] CI verde no GitHub
- [ ] `.env` no `.gitignore` e nenhum segredo versionado

---

## Etapa 1 — Identidade e acesso `RF-01` `RNF-01`

**Entregável:** cadastro, login e rota protegida por papel.

- [ ] Entidades `User`, `RefreshToken` e `Address` com suas migrações
- [ ] Hash de senha com Argon2id em serviço isolado
- [ ] Cadastro com verificação de e-mail (token de uso único, 24 h)
- [ ] Login emitindo access (15 min) e refresh (7 dias)
- [ ] Rotação de refresh token com detecção de reuso
- [ ] `JwtAuthGuard`, `RolesGuard`, `@Roles()` e `@CurrentUser()` em `src/common/`
- [ ] Recuperação de senha (token de 1 h, resposta idêntica para e-mail inexistente)
- [ ] Limitação de tentativas com `@nestjs/throttler`
- [ ] Seed do primeiro administrador por variável de ambiente

**Concluída quando:**

- [ ] Cadastro com e-mail repetido devolve 409
- [ ] `/auth/refresh` rotaciona e invalida o token anterior
- [ ] Reusar refresh token consumido derruba todas as sessões (com teste)
- [ ] Rota `@Roles('admin')` devolve 403 para comprador autenticado
- [ ] Seis logins errados em sequência devolvem 429
- [ ] Nenhuma resposta da API contém `password_hash`

---

## Etapa 2 — Lojas e catálogo `RF-02` `RF-09`

**Entregável:** vendedor aprovado publica produto com variações.

- [ ] Entidades `Store`, `Category`, `Product`, `ProductVariant`, `ProductImage` + índices
- [ ] Solicitação de abertura de loja e fila de aprovação do administrador
- [ ] `StoreOwnerGuard` comparando `storeId` do token com o do recurso
- [ ] CRUD de produto restrito à própria loja, com exclusão lógica
- [ ] Variações com SKU único, atributos JSON, preço e estoque próprios
- [ ] Upload de imagens para armazenamento de objetos, WebP + miniatura
- [ ] Publicação validada (título, imagem, preço, categoria, loja aprovada)
- [ ] Seed da árvore de categorias

**Concluída quando:**

- [ ] Vendedor da loja A recebe 403 ao editar produto da loja B (com teste)
- [ ] Produto sem imagem não publica e o erro aponta o campo
- [ ] Loja pendente não consegue publicar
- [ ] Upload devolve URL pública funcional com miniatura
- [ ] Exclusão é lógica: some da listagem, permanece consultável por id

---

## Etapa 3 — Vitrine SSR e SEO `RNF-04`

**Entregável:** navegação pública com busca, filtros e URL amigável.

- [ ] Handlebars configurado com layout base, partials e helpers de formatação
- [ ] Rotas `/`, `/c/:slug`, `/produto/:slug` e `/loja/:slug` em módulo `web`
- [ ] Busca `FULLTEXT` + filtros (categoria, preço, loja, nota) + paginação
- [ ] Slugs únicos e imutáveis após a publicação
- [ ] `<title>`, description, Open Graph, Twitter Card e canonical
- [ ] JSON-LD de `Product`, `Offer`, `AggregateRating` e `BreadcrumbList`
- [ ] `/sitemap.xml` dinâmico e `/robots.txt` bloqueando áreas privadas
- [ ] Imagens responsivas com `srcset`, dimensões explícitas e lazy loading

**Concluída quando:**

- [ ] `curl` na página de produto devolve HTML com título, preço e descrição
- [ ] URL é `/produto/tenis-corrida-azul-42`, não `/produto?id=7311`
- [ ] Validador de dados estruturados do Google aceita sem erro
- [ ] `/sitemap.xml` lista apenas produtos publicados
- [ ] Lighthouse: SEO ≥ 90 e desempenho ≥ 80
- [ ] Usável em 360 px sem rolagem horizontal

---

## Etapa 4 — Carrinho `RF-03`

**Entregável:** carrinho com itens de duas lojas, preservado no login.

- [ ] Entidades `Cart` e `CartItem` com unicidade por carrinho + variação
- [ ] Sessão de visitante em cookie `HttpOnly` / `Secure` / `SameSite=Lax`
- [ ] Adicionar, alterar quantidade, remover e esvaziar — validando estoque
- [ ] Mesclagem do carrinho de visitante no login
- [ ] Revalidação de preço e disponibilidade a cada exibição
- [ ] Agrupamento por loja com subtotal e frete próprios
- [ ] Frete por tabela de região configurada pela loja + retirada
- [ ] Rotina de expiração de carrinhos de visitante (30 dias)

**Concluída quando:**

- [ ] Adicionar como visitante, logar e encontrar o item (com teste)
- [ ] Preço adulterado no corpo da requisição é ignorado
- [ ] Carrinho com duas lojas mostra dois subtotais e dois fretes
- [ ] Produto despublicado aparece marcado e bloqueia o checkout
- [ ] Quantidade acima do estoque é rejeitada com mensagem clara

---

## Etapa 5 — Checkout e pagamento `RF-04` `RF-05` — **MARCO**

**Entregável:** uma venda completa, do carrinho ao pedido pago.

- [ ] Entidades `Order`, `SubOrder`, `OrderItem`, `Payment`, `OrderStatusHistory`
- [ ] Snapshot de título e preço unitário em `OrderItem`
- [ ] Fluxo de checkout em etapas, validado no servidor
- [ ] Criação do pedido em transação única com `SELECT ... FOR UPDATE` na variação
- [ ] Chave de idempotência na criação do pedido
- [ ] Integração com o gateway (cartão tokenizado + Pix)
- [ ] Webhook com verificação de assinatura e idempotência por evento
- [ ] Confirmação: baixa de estoque, cálculo de comissão, estado `pago`
- [ ] Rotina de expiração de reserva (30 min) devolvendo estoque

**Concluída quando:**

- [ ] Compra completa funciona com o gateway em modo de teste
- [ ] Webhook duplicado não confirma nem baixa estoque duas vezes
- [ ] Duas compras simultâneas da última unidade: uma conclui, outra falha
- [ ] Estoque nunca fica negativo
- [ ] Pedido não pago é cancelado e o estoque volta
- [ ] Mudar o preço depois da compra não altera o pedido já criado
- [ ] Nenhum dado de cartão no banco ou nos logs

---

## Etapa 6 — Operação do vendedor `RF-05` `RF-09`

**Entregável:** vendedor separa, envia e informa rastreio.

- [ ] Máquina de estados central validando cada transição
- [ ] Painel do vendedor: lista por estado, detalhe e ações
- [ ] Campo de código de rastreio
- [ ] Linha do tempo do subpedido para o comprador
- [ ] Cancelamento (antes do envio) e devolução com estorno
- [ ] Extrato: bruto, comissão e líquido por período

**Concluída quando:**

- [ ] Pular de `pago` para `entregue` é rejeitado pelo serviço (com teste)
- [ ] Vendedor A não enxerga nem altera subpedido da loja B
- [ ] Cancelamento devolve estoque e reverte comissão
- [ ] Todo estado registra autor, data e motivo
- [ ] Extrato bate com a soma dos subpedidos do período

---

## Etapa 7 — Reputação e notificações `RF-06` `RF-08`

**Entregável:** comprador avalia; vendedor recebe push.

- [ ] Avaliação vinculada a `order_item_id` único, só com subpedido `entregue`
- [ ] Média e contagem desnormalizadas em produto e loja
- [ ] Resposta do vendedor e fluxo de denúncia/moderação
- [ ] BullMQ sobre Redis com retentativa em espera exponencial
- [ ] E-mail transacional com provedor real e templates versionados
- [ ] Push com chaves VAPID e entidade `push_subscriptions`
- [ ] Remoção automática de inscrição inválida (410)
- [ ] Pedido de permissão de push após ação relevante, não ao abrir o site
- [ ] Preferências por canal e por tipo de evento

**Concluída quando:**

- [ ] Quem não comprou não consegue avaliar (com teste)
- [ ] Avaliar duas vezes o mesmo item é rejeitado
- [ ] A média do produto muda ao registrar nova avaliação
- [ ] Provedor de e-mail fora do ar não impede a confirmação do pedido
- [ ] Push chega ao vendedor em venda real de teste
- [ ] Desativar um tipo de notificação interrompe só aquele envio

---

## Etapa 8 — Administração e relatórios `RF-07`

**Entregável:** GMV, comissão e curva ABC com dados reais.

- [ ] Rotas `/admin` protegidas por papel e fora da indexação
- [ ] Visão geral: GMV, comissão, pedidos, ticket médio, cancelamento
- [ ] Relatórios: vendas por período, produtos, curva ABC, vendedores, operacional
- [ ] Filas de moderação (lojas, avaliações, produtos)
- [ ] Gestão de usuários, lojas e comissão, com auditoria
- [ ] Exportação em CSV
- [ ] Índices por data e loja nas consultas agregadas

**Concluída quando:**

- [ ] Comprador e vendedor recebem 403 em qualquer rota `/admin`
- [ ] GMV do relatório bate com a soma manual dos pedidos pagos
- [ ] Alterar preço de produto não altera faturamento de meses anteriores
- [ ] Suspender loja despublica produtos e preserva pedidos em andamento
- [ ] CSV abre com acentuação e decimais brasileiros corretos

---

## Etapa 9 — PWA, desempenho e produção `RNF-02` `RNF-03` `RNF-04`

**Entregável:** aplicação instalável, Lighthouse ≥ 90, em produção.

- [ ] `manifest.webmanifest` com ícones de 192 e 512 px
- [ ] Service worker com cache de casca e estáticos + página offline
- [ ] Carrinho, checkout, conta e pedidos **sempre** da rede
- [ ] Auditoria de N+1 com log de SQL nas telas principais
- [ ] Revisão de índices pelo plano de execução
- [ ] Teste de carga (200 simultâneos, 50 pedidos/min) medindo p95
- [ ] Endurecimento: helmet, CSP, CSRF, throttler, `npm audit` limpo
- [ ] Acessibilidade: teclado, foco visível, contraste, leitor de tela
- [ ] Deploy em produção com HTTPS, domínio e backup diário
- [ ] Observabilidade: logs estruturados, monitoramento de erros, alerta no `/health`

**Concluída quando:**

- [ ] Instalável em desktop e celular
- [ ] Sem rede aparece a página offline e o checkout nunca vem do cache
- [ ] Lighthouse ≥ 90 nas quatro categorias
- [ ] Teste de carga com p95 dentro das metas
- [ ] Produção no ar com backup testado (restauração feita ao menos uma vez)
- [ ] Uma compra real de ponta a ponta feita em produção

---

## Decisões tomadas

| Data | Decisão |
| --- | --- |
| 2026-08-11 | Projeto escolhido: **Mercado**, redefinido como marketplace multivendedor |
| 2026-08-11 | Código em `mercado/`, neste repositório, aproveitando as branches protegidas |
| 2026-08-11 | MySQL 8 com TypeORM e migrações versionadas — `synchronize: false` desde o início |

## Decisões pendentes

Detalhadas na seção 8.4 da especificação. Nenhuma bloqueia a etapa 0.

| Pergunta | Bloqueia a partir da |
| --- | --- |
| Nest com views SSR ou Nest + Next.js? | Etapa 3 |
| Gateway: Mercado Pago ou Stripe? | Etapa 5 |
| Hospedagem: Railway, Render ou AWS? | Etapa 9 |
| Frete: tabela fixa ou integração real? | Etapa 4 (MVP assume tabela) |
| Redis/fila desde o início? | Etapa 7 (recomendado subir já na etapa 0) |

---

## Registro de sessões

| Data | Etapa | O que foi feito |
| --- | --- | --- |
| 2026-08-11 | — | Especificação e plano de desenvolvimento escritos e publicados |
