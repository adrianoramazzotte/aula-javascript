/* =========================================================================
   SaaS para Mercado — protótipo
   Frente de caixa, baixa de estoque em FEFO, alertas de validade e
   curva ABC do turno. JavaScript puro, sem dependências.
   ========================================================================= */
(function () {
  'use strict';

  var CHAVE = 'mercado-v1';

  /* ---------------------------------------------------------------
     Dados iniciais — validades relativas a hoje para que os alertas
     façam sentido em qualquer dia que o protótipo for aberto.
     --------------------------------------------------------------- */
  function emDias(dias) {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
  }

  var PRODUTOS_SEED = [
    {
      gtin: '7891000100103', descricao: 'Leite integral 1L', unidade: 'UN',
      categoria: 'Laticínios', preco: 5.99, custoMedio: 4.18, minimo: 24,
      lotes: [
        { numero: 'L2408', qtd: 12, dias: 3,   custo: 4.05 },
        { numero: 'L2411', qtd: 30, dias: 22,  custo: 4.18 },
        { numero: 'L2415', qtd: 48, dias: 47,  custo: 4.25 }
      ]
    },
    {
      gtin: '7896004400112', descricao: 'Iogurte morango 170g', unidade: 'UN',
      categoria: 'Laticínios', preco: 3.49, custoMedio: 2.30, minimo: 30,
      lotes: [
        { numero: 'I0781', qtd: 18, dias: 1,  custo: 2.28 },
        { numero: 'I0792', qtd: 24, dias: 12, custo: 2.30 }
      ]
    },
    {
      gtin: '7893500011118', descricao: 'Arroz tipo 1 5kg', unidade: 'UN',
      categoria: 'Mercearia', preco: 24.90, custoMedio: 22.40, minimo: 20,
      lotes: [
        { numero: 'A5510', qtd: 40, dias: 320, custo: 22.10 },
        { numero: 'A5533', qtd: 25, dias: 410, custo: 22.60 }
      ]
    },
    {
      gtin: '7894900011517', descricao: 'Refrigerante cola 2L', unidade: 'UN',
      categoria: 'Bebidas', preco: 8.49, custoMedio: 6.10, minimo: 36,
      lotes: [
        { numero: 'R1204', qtd: 60, dias: 180, custo: 6.02 },
        { numero: 'R1221', qtd: 30, dias: 240, custo: 6.18 }
      ]
    },
    {
      gtin: '7891149101016', descricao: 'Café torrado 500g', unidade: 'UN',
      categoria: 'Mercearia', preco: 21.90, custoMedio: 17.40, minimo: 15,
      lotes: [
        { numero: 'C3302', qtd: 22, dias: 95, custo: 17.40 }
      ]
    },
    {
      gtin: '7891000053508', descricao: 'Presunto fatiado 200g', unidade: 'UN',
      categoria: 'Frios', preco: 12.90, custoMedio: 9.10, minimo: 12,
      lotes: [
        { numero: 'P0455', qtd: 6,  dias: -1, custo: 9.05 },
        { numero: 'P0461', qtd: 14, dias: 9,  custo: 9.12 }
      ]
    },
    {
      gtin: '7896098900116', descricao: 'Sabão em pó 1kg', unidade: 'UN',
      categoria: 'Limpeza', preco: 13.90, custoMedio: 11.80, minimo: 18,
      lotes: [
        { numero: 'S7701', qtd: 9, dias: 500, custo: 11.75 }
      ]
    },
    {
      gtin: '2000000000015', descricao: 'Banana prata (kg)', unidade: 'KG',
      categoria: 'Hortifrúti', preco: 7.49, custoMedio: 4.90, minimo: 10,
      lotes: [
        { numero: 'H0101', qtd: 22.5, dias: 4, custo: 4.90 }
      ]
    }
  ];

  function montarProdutos() {
    return PRODUTOS_SEED.map(function (p) {
      return {
        gtin: p.gtin, descricao: p.descricao, unidade: p.unidade,
        categoria: p.categoria, preco: p.preco, custoMedio: p.custoMedio,
        minimo: p.minimo,
        lotes: p.lotes.map(function (l) {
          return { numero: l.numero, qtd: l.qtd, validade: emDias(l.dias), custo: l.custo };
        })
      };
    });
  }

  /* ---------------------------------------------------------------
     Estado
     --------------------------------------------------------------- */
  var estado = {
    produtos: montarProdutos(),
    cupom: [],
    vendas: [],
    proximaVenda: 1,
    ultimaBaixa: null
  };

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {}
  }

  function carregar() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (!bruto) { return; }
      var dados = JSON.parse(bruto);
      for (var k in dados) {
        if (Object.prototype.hasOwnProperty.call(dados, k)) { estado[k] = dados[k]; }
      }
    } catch (e) {}
  }

  /* ---------------------------------------------------------------
     Regras de negócio
     --------------------------------------------------------------- */
  function estoqueTotal(produto) {
    var total = 0;
    produto.lotes.forEach(function (l) { total += l.qtd; });
    return total;
  }

  function lotesEmFEFO(produto) {
    return produto.lotes.slice().sort(function (a, b) {
      return a.validade < b.validade ? -1 : (a.validade > b.validade ? 1 : 0);
    });
  }

  function baixarEstoqueFEFO(produto, quantidade) {
    var fila = lotesEmFEFO(produto);
    var restante = quantidade;
    var custoTotal = 0;
    var consumo = [];

    for (var i = 0; i < fila.length && restante > 0.0001; i++) {
      var lote = fila[i];
      var retirar = Math.min(lote.qtd, restante);

      if (retirar > 0) {
        lote.qtd = arred(lote.qtd - retirar, 3);
        restante = arred(restante - retirar, 3);
        custoTotal += retirar * lote.custo;
        consumo.push({ lote: lote.numero, qtd: retirar, validade: lote.validade });
      }
    }

    produto.lotes = produto.lotes.filter(function (l) { return l.qtd > 0.0001; });

    return { atendido: arred(quantidade - restante, 3), faltou: restante, custo: custoTotal, consumo: consumo };
  }

  function diasAteVencer(validade) {
    var hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    return Math.round((new Date(validade + 'T12:00:00') - hoje) / 86400000);
  }

  function classificarLote(dias) {
    if (dias < 0)   { return 'VENCIDO'; }
    if (dias <= 3)  { return 'CRÍTICO'; }
    if (dias <= 15) { return 'ATENÇÃO'; }
    return 'NORMAL';
  }

  function precoLiquidacao(situacao, preco, custo) {
    var desconto = 0;
    if (situacao === 'CRÍTICO') { desconto = 0.40; }
    else if (situacao === 'ATENÇÃO') { desconto = 0.15; }
    else { return null; }

    var promo = preco * (1 - desconto);
    return promo < custo ? custo : promo;
  }

  function curvaABC(linhas) {
    var ordenado = linhas.slice().sort(function (a, b) { return b.faturamento - a.faturamento; });

    var total = 0;
    ordenado.forEach(function (v) { total += v.faturamento; });
    if (total === 0) { return []; }

    var acumulado = 0;
    return ordenado.map(function (v) {
      acumulado += v.faturamento;
      var perc = acumulado / total;
      var classe = perc <= 0.80 ? 'A' : (perc <= 0.95 ? 'B' : 'C');
      return {
        produto: v.produto, faturamento: v.faturamento,
        participacao: v.faturamento / total, acumulado: perc, classe: classe
      };
    });
  }

  /* ---------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------- */
  function arred(v, casas) {
    var f = Math.pow(10, casas || 2);
    return Math.round(v * f) / f;
  }

  function brl(v) {
    return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function n2(v) {
    return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pct(f) { return (f * 100).toFixed(1).replace('.', ',') + '%'; }

  function dataBR(iso) {
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function el(id) { return document.getElementById(id); }

  function aviso(id, texto, tipo) {
    var c = el(id);
    c.className = 'msg' + (tipo ? ' msg--' + tipo : '');
    c.textContent = texto || '';
  }

  function escapar(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buscarProduto(gtin) {
    for (var i = 0; i < estado.produtos.length; i++) {
      if (estado.produtos[i].gtin === gtin) { return estado.produtos[i]; }
    }
    return null;
  }

  /* ---------------------------------------------------------------
     Renderização
     --------------------------------------------------------------- */
  function renderCatalogo() {
    var alvo = el('catalogo');
    alvo.innerHTML = '';

    estado.produtos.forEach(function (p) {
      var saldo = estoqueTotal(p);
      var b = document.createElement('button');
      b.className = 'prod';
      b.type = 'button';
      b.dataset.gtin = p.gtin;
      b.innerHTML =
        '<b>' + escapar(p.descricao) + '</b>' +
        '<span class="pr">' + brl(p.preco) + ' / ' + p.unidade + '</span>' +
        '<span>' + n2(saldo) + ' em estoque</span>';
      alvo.appendChild(b);
    });
  }

  function renderCupom() {
    var tb = el('tb-cupom');
    tb.innerHTML = '';

    if (estado.cupom.length === 0) {
      tb.innerHTML = '<tr><td colspan="5" class="empty">Cupom vazio. Leia um código ou clique no catálogo.</td></tr>';
    } else {
      estado.cupom.forEach(function (item, i) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapar(item.descricao) + '<br><span class="hint mono">' + item.gtin + '</span></td>' +
          '<td class="num">' + n2(item.qtd) + '</td>' +
          '<td class="num">' + brl(item.preco) + '</td>' +
          '<td class="num">' + brl(item.qtd * item.preco) + '</td>' +
          '<td class="num"><button class="mini" data-rm="' + i + '" type="button">cancelar</button></td>';
        tb.appendChild(tr);
      });
    }

    var total = 0, itens = 0;
    estado.cupom.forEach(function (i) { total += i.qtd * i.preco; itens += i.qtd; });

    el('rs-itens').textContent = n2(itens);
    el('rs-total').textContent = brl(total);
    el('btn-finalizar').disabled = estado.cupom.length === 0;

    renderTroco();
  }

  function renderTroco() {
    var total = 0;
    estado.cupom.forEach(function (i) { total += i.qtd * i.preco; });

    var forma = el('pg-forma').value;
    var dinheiro = forma === 'dinheiro';

    el('campo-recebido').hidden = !dinheiro;

    if (!dinheiro) {
      el('rs-troco').textContent = brl(0);
      return;
    }

    var recebido = parseFloat(el('pg-recebido').value) || 0;
    var troco = recebido - total;
    el('rs-troco').textContent = troco > 0 ? brl(troco) : brl(0);
  }

  function renderUltimaBaixa() {
    var alvo = el('ultima-baixa');

    if (!estado.ultimaBaixa) {
      alvo.innerHTML = '<p class="empty">Finalize uma venda para ver de quais lotes o produto saiu.</p>';
      return;
    }

    var html = '<div class="tbl"><table><thead><tr>' +
               '<th>Produto</th><th>Lote</th><th class="num">Qtd</th><th>Validade</th></tr></thead><tbody>';

    estado.ultimaBaixa.forEach(function (linha) {
      html += '<tr><td>' + escapar(linha.produto) + '</td>' +
              '<td class="mono">' + linha.lote + '</td>' +
              '<td class="num">' + n2(linha.qtd) + '</td>' +
              '<td>' + dataBR(linha.validade) + '</td></tr>';
    });

    alvo.innerHTML = html + '</tbody></table></div>';
  }

  function renderAlertas() {
    var tb = el('tb-alertas');
    tb.innerHTML = '';

    var linhas = [];

    estado.produtos.forEach(function (p) {
      p.lotes.forEach(function (l) {
        var dias = diasAteVencer(l.validade);
        var situacao = classificarLote(dias);
        if (situacao === 'NORMAL') { return; }

        var acao;
        if (situacao === 'VENCIDO') {
          acao = 'Retirar da gôndola — perda de ' + brl(l.qtd * l.custo);
        } else {
          var promo = precoLiquidacao(situacao, p.preco, l.custo);
          acao = promo !== null
            ? 'Liquidar a ' + brl(promo) + ' (de ' + brl(p.preco) + ')'
            : 'Acompanhar';
        }

        linhas.push({ situacao: situacao, produto: p.descricao, lote: l.numero, qtd: l.qtd, validade: l.validade, dias: dias, acao: acao });
      });

      var saldo = estoqueTotal(p);
      if (saldo < p.minimo) {
        linhas.push({
          situacao: 'REPOR', produto: p.descricao, lote: '—', qtd: saldo,
          validade: '', dias: null,
          acao: 'Abaixo do mínimo (' + p.minimo + ') — comprar ' + n2(p.minimo - saldo) + ' ' + p.unidade
        });
      }
    });

    linhas.sort(function (a, b) {
      var ordem = { 'VENCIDO': 0, 'CRÍTICO': 1, 'REPOR': 2, 'ATENÇÃO': 3 };
      return ordem[a.situacao] - ordem[b.situacao];
    });

    el('pill-alertas').textContent = linhas.length + ' alerta(s)';
    el('pill-alertas').className = 'pill ' + (linhas.length === 0 ? 'pill--ok' : 'pill--warn');

    if (linhas.length === 0) {
      tb.innerHTML = '<tr><td colspan="7" class="empty">Nenhum alerta. Estoque saudável.</td></tr>';
      return;
    }

    linhas.forEach(function (l) {
      var classe = l.situacao === 'VENCIDO' ? 'pill--danger'
                 : (l.situacao === 'CRÍTICO' ? 'pill--danger'
                 : (l.situacao === 'REPOR' ? 'pill--info' : 'pill--warn'));

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span class="pill ' + classe + '">' + l.situacao + '</span></td>' +
        '<td>' + escapar(l.produto) + '</td>' +
        '<td class="mono">' + l.lote + '</td>' +
        '<td class="num">' + n2(l.qtd) + '</td>' +
        '<td>' + (l.validade ? dataBR(l.validade) : '—') + '</td>' +
        '<td class="num">' + (l.dias === null ? '—' : l.dias) + '</td>' +
        '<td>' + escapar(l.acao) + '</td>';
      tb.appendChild(tr);
    });
  }

  function renderEstoque() {
    var tb = el('tb-estoque');
    tb.innerHTML = '';

    estado.produtos.forEach(function (p) {
      var saldo = estoqueTotal(p);
      var margem = p.preco > 0 ? (p.preco - p.custoMedio) / p.preco : 0;

      var lotes = lotesEmFEFO(p).map(function (l) {
        return l.numero + ' (' + n2(l.qtd) + ' · ' + dataBR(l.validade) + ')';
      }).join('<br>') || '<span class="hint">sem lote</span>';

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><b>' + escapar(p.descricao) + '</b><br><span class="hint mono">' + p.gtin + '</span></td>' +
        '<td class="num">' + brl(p.preco) + '</td>' +
        '<td class="num">' + brl(p.custoMedio) + '</td>' +
        '<td class="num">' + pct(margem) + '</td>' +
        '<td class="num">' + n2(saldo) + (saldo < p.minimo ? ' <span class="pill pill--warn">baixo</span>' : '') + '</td>' +
        '<td class="num">' + p.minimo + '</td>' +
        '<td class="hint">' + lotes + '</td>';
      tb.appendChild(tr);
    });
  }

  function renderRelatorios() {
    var fat = 0, custo = 0, itens = 0;
    var porProduto = {};

    estado.vendas.forEach(function (v) {
      fat += v.total;
      custo += v.custo;
      v.itens.forEach(function (i) {
        itens += i.qtd;
        porProduto[i.descricao] = (porProduto[i.descricao] || 0) + i.qtd * i.preco;
      });
    });

    var lucro = fat - custo;

    el('tr-vendas').textContent = estado.vendas.length;
    el('tr-fat').textContent    = n2(fat);
    el('tr-custo').textContent  = n2(custo);
    el('tr-lucro').textContent  = n2(lucro);
    el('tr-margem').textContent = fat > 0 ? pct(lucro / fat) : '0,0%';
    el('tr-ticket').textContent = estado.vendas.length > 0 ? n2(fat / estado.vendas.length) : '0,00';

    var linhas = [];
    for (var nome in porProduto) {
      if (Object.prototype.hasOwnProperty.call(porProduto, nome)) {
        linhas.push({ produto: nome, faturamento: porProduto[nome] });
      }
    }

    var tbAbc = el('tb-abc');
    tbAbc.innerHTML = '';
    var abc = curvaABC(linhas);

    if (abc.length === 0) {
      tbAbc.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma venda registrada ainda.</td></tr>';
    } else {
      abc.forEach(function (r) {
        var classe = r.classe === 'A' ? 'pill--ok' : (r.classe === 'B' ? 'pill--info' : '');
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><span class="pill ' + classe + '">' + r.classe + '</span></td>' +
          '<td>' + escapar(r.produto) + '</td>' +
          '<td class="num">' + brl(r.faturamento) + '</td>' +
          '<td class="num">' + pct(r.participacao) + '</td>' +
          '<td class="num">' + pct(r.acumulado) + '</td>';
        tbAbc.appendChild(tr);
      });
    }

    var tbV = el('tb-vendas');
    tbV.innerHTML = '';

    if (estado.vendas.length === 0) {
      tbV.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma venda registrada.</td></tr>';
      return;
    }

    estado.vendas.slice().reverse().forEach(function (v) {
      var qtd = 0;
      v.itens.forEach(function (i) { qtd += i.qtd; });

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="mono">' + v.numero + '</td>' +
        '<td>' + v.hora + '</td>' +
        '<td>' + v.forma + '</td>' +
        '<td class="num">' + n2(qtd) + '</td>' +
        '<td class="num">' + brl(v.total) + '</td>';
      tbV.appendChild(tr);
    });
  }

  function renderTudo() {
    renderCatalogo();
    renderCupom();
    renderUltimaBaixa();
    renderAlertas();
    renderEstoque();
    renderRelatorios();
  }

  /* ---------------------------------------------------------------
     Ações
     --------------------------------------------------------------- */
  function lancar(gtin, quantidade) {
    var produto = buscarProduto(gtin);

    if (!produto) {
      aviso('msg-pdv', 'Código não encontrado no catálogo: ' + gtin, 'danger');
      return;
    }
    if (quantidade <= 0) {
      aviso('msg-pdv', 'Quantidade precisa ser maior que zero.', 'danger');
      return;
    }

    var jaNoCupom = 0;
    estado.cupom.forEach(function (i) { if (i.gtin === gtin) { jaNoCupom += i.qtd; } });

    var disponivel = estoqueTotal(produto) - jaNoCupom;

    if (quantidade > disponivel) {
      aviso('msg-pdv', 'Estoque insuficiente de ' + produto.descricao +
            ': disponível ' + n2(disponivel) + ' ' + produto.unidade + '.', 'danger');
      return;
    }

    var existente = null;
    estado.cupom.forEach(function (i) { if (i.gtin === gtin) { existente = i; } });

    if (existente) {
      existente.qtd = arred(existente.qtd + quantidade, 3);
    } else {
      estado.cupom.push({
        gtin: produto.gtin, descricao: produto.descricao,
        preco: produto.preco, qtd: quantidade
      });
    }

    aviso('msg-pdv', produto.descricao + ' — ' + n2(quantidade) + ' ' + produto.unidade +
          ' × ' + brl(produto.preco), 'ok');

    el('pdv-codigo').value = '';
    el('pdv-qtd').value = 1;
    el('pdv-codigo').focus();

    renderCupom();
    salvar();
  }

  function finalizar() {
    if (estado.cupom.length === 0) { return; }

    var total = 0;
    estado.cupom.forEach(function (i) { total += i.qtd * i.preco; });

    var forma = el('pg-forma').value;

    if (forma === 'dinheiro') {
      var recebido = parseFloat(el('pg-recebido').value) || 0;
      if (recebido < total - 0.001) {
        aviso('msg-venda', 'Valor recebido menor que o total do cupom.', 'danger');
        return;
      }
    }

    var custoVenda = 0;
    var baixa = [];
    var itensVenda = [];

    estado.cupom.forEach(function (item) {
      var produto = buscarProduto(item.gtin);
      var r = baixarEstoqueFEFO(produto, item.qtd);

      custoVenda += r.custo;

      r.consumo.forEach(function (c) {
        baixa.push({ produto: produto.descricao, lote: c.lote, qtd: c.qtd, validade: c.validade });
      });

      itensVenda.push({
        gtin: item.gtin, descricao: item.descricao,
        qtd: item.qtd, preco: item.preco,
        custo: r.custo   // custo no momento da venda
      });
    });

    var agora = new Date();

    estado.vendas.push({
      numero: estado.proximaVenda,
      hora: ('0' + agora.getHours()).slice(-2) + ':' + ('0' + agora.getMinutes()).slice(-2),
      forma: el('pg-forma').options[el('pg-forma').selectedIndex].textContent,
      itens: itensVenda,
      total: arred(total),
      custo: arred(custoVenda)
    });

    var margem = total > 0 ? (total - custoVenda) / total : 0;

    estado.proximaVenda++;
    estado.cupom = [];
    estado.ultimaBaixa = baixa;

    el('pg-recebido').value = 0;

    aviso('msg-venda', 'Venda registrada: ' + brl(total) +
          ' · custo ' + brl(custoVenda) + ' · margem ' + pct(margem), 'ok');

    renderTudo();
    salvar();
  }

  /* ---------------------------------------------------------------
     Eventos
     --------------------------------------------------------------- */
  document.querySelectorAll('[role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[role="tab"]').forEach(function (o) {
        o.setAttribute('aria-selected', o === b ? 'true' : 'false');
      });
      document.querySelectorAll('[data-panel]').forEach(function (p) {
        p.hidden = p.dataset.panel !== b.dataset.tab;
      });
      if (b.dataset.tab === 'relatorios') { renderRelatorios(); }
      if (b.dataset.tab === 'estoque') { renderAlertas(); renderEstoque(); }
    });
  });

  el('btn-add').addEventListener('click', function () {
    lancar(el('pdv-codigo').value.trim(), parseFloat(el('pdv-qtd').value) || 0);
  });

  el('pdv-codigo').addEventListener('keydown', function (ev) {
    // O leitor de código de barras "digita" o código e envia um Enter
    if (ev.key === 'Enter') {
      ev.preventDefault();
      lancar(el('pdv-codigo').value.trim(), parseFloat(el('pdv-qtd').value) || 0);
    }
  });

  el('catalogo').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-gtin]');
    if (!b) { return; }
    lancar(b.dataset.gtin, parseFloat(el('pdv-qtd').value) || 1);
  });

  el('tb-cupom').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-rm]');
    if (!b) { return; }
    estado.cupom.splice(parseInt(b.dataset.rm, 10), 1);
    renderCupom();
    salvar();
  });

  el('pg-forma').addEventListener('change', renderTroco);
  el('pg-recebido').addEventListener('input', renderTroco);
  el('btn-finalizar').addEventListener('click', finalizar);

  el('btn-cancelar').addEventListener('click', function () {
    estado.cupom = [];
    aviso('msg-venda', 'Cupom cancelado.', 'warn');
    renderCupom();
    salvar();
  });

  el('btn-reset').addEventListener('click', function () {
    if (!confirm('Reiniciar o protótipo? Estoque e vendas voltam ao estado inicial.')) { return; }
    try { localStorage.removeItem(CHAVE); } catch (e) {}
    location.reload();
  });

  /* ---------------------------------------------------------------
     Início
     --------------------------------------------------------------- */
  carregar();
  renderTudo();
  el('pdv-codigo').focus();
})();
