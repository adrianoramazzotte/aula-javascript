/* =========================================================================
   Controle Moveleiro — protótipo
   Orçamento por ambiente, consumo de chapas, formação de preço e ordem
   de produção. JavaScript puro, sem dependências.
   ========================================================================= */
(function () {
  'use strict';

  var CHAVE = 'moveleiro-v1';

  var ETAPAS = ['Corte', 'Usinagem', 'Fita de borda', 'Montagem', 'Entrega'];

  var TETO_DESCONTO = { vendedor: 0.05, gerente: 0.12, gestor: 0.20 };

  var MATERIAIS_PADRAO = [
    { id: 'mdf-branco',   descricao: 'MDF Branco 18mm',   preco: 289.00 },
    { id: 'mdf-amendoa',  descricao: 'MDF Amêndoa 18mm',  preco: 315.00 },
    { id: 'mdf-preto',    descricao: 'MDF Preto 18mm',    preco: 342.00 },
    { id: 'mdf-carvalho', descricao: 'MDF Carvalho 18mm', preco: 398.00 },
    { id: 'comp-15',      descricao: 'Compensado 15mm',   preco: 198.00 }
  ];

  var KIT_EXEMPLO = [
    { descricao: 'Corrediça telescópica 450mm', qtd: 8,  preco: 34.90 },
    { descricao: 'Dobradiça caneco 35mm',       qtd: 26, preco: 6.40 },
    { descricao: 'Puxador alumínio 160mm',      qtd: 14, preco: 12.00 }
  ];

  /* ---------------------------------------------------------------
     Estado
     --------------------------------------------------------------- */
  var estado = {
    config: { valorHora: 45, chapaLargura: 2.75, chapaAltura: 1.85 },
    materiais: MATERIAIS_PADRAO.slice(),
    ferragensRascunho: [],
    ambientes: [],
    orcamentos: [],
    ordens: [],
    proximoNumero: 2026001
  };

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (e) { /* navegador sem localStorage: o protótipo segue em memória */ }
  }

  function carregar() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (!bruto) { return; }
      var dados = JSON.parse(bruto);
      for (var k in dados) {
        if (Object.prototype.hasOwnProperty.call(dados, k)) { estado[k] = dados[k]; }
      }
    } catch (e) { /* dado corrompido: começa do zero */ }
  }

  /* ---------------------------------------------------------------
     Regras de negócio
     --------------------------------------------------------------- */
  function areaUtilDaChapa(perda) {
    var bruta = estado.config.chapaLargura * estado.config.chapaAltura;
    return bruta * (1 - perda);
  }

  function chapasNecessarias(area, perda) {
    if (area <= 0) { return 0; }
    return Math.ceil(area / areaUtilDaChapa(perda));
  }

  function custoDoAmbiente(ambiente) {
    var material = buscarMaterial(ambiente.materialId);
    var precoChapa = material ? material.preco : 0;
    var chapas = chapasNecessarias(ambiente.area, ambiente.perda);

    var custoMaterial = chapas * precoChapa;

    var custoFerragens = 0;
    ambiente.ferragens.forEach(function (f) {
      custoFerragens += f.qtd * f.preco;
    });

    var custoMao = ambiente.horas * estado.config.valorHora;

    return {
      chapas: chapas,
      material: custoMaterial,
      ferragens: custoFerragens,
      maoDeObra: custoMao,
      total: custoMaterial + custoFerragens + custoMao
    };
  }

  function precoDeVenda(custo, margem) {
    if (margem <= 0 || margem >= 1) { return custo; }
    return custo / (1 - margem);
  }

  function validarDesconto(perfil, desconto, precoTabela, custo) {
    var teto = TETO_DESCONTO[perfil];

    if (teto === undefined) {
      return { ok: false, motivo: 'Perfil desconhecido.' };
    }
    if (desconto > teto) {
      return {
        ok: false,
        motivo: 'Desconto de ' + pct(desconto) + ' acima do teto do perfil ' +
                perfil + ' (' + pct(teto) + ').'
      };
    }

    var precoFinal = precoTabela * (1 - desconto);

    if (precoFinal < custo) {
      return { ok: false, motivo: 'Preço final abaixo do custo — venda bloqueada.' };
    }

    return {
      ok: true,
      precoFinal: precoFinal,
      margemFinal: precoFinal > 0 ? (precoFinal - custo) / precoFinal : 0
    };
  }

  function concluirEtapa(ordem, indice) {
    if (ordem.etapas[indice].concluida) {
      return 'Etapa já concluída.';
    }
    if (indice > 0 && !ordem.etapas[indice - 1].concluida) {
      return 'Bloqueado: conclua antes a etapa "' + ETAPAS[indice - 1] + '".';
    }
    ordem.etapas[indice].concluida = true;
    return null;
  }

  /* ---------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------- */
  function brl(valor) {
    return 'R$ ' + (valor || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }

  function pct(fracao) {
    return (fracao * 100).toFixed(1).replace('.', ',') + '%';
  }

  function num(id) {
    var v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? 0 : v;
  }

  function txt(id) {
    return document.getElementById(id).value.trim();
  }

  function el(id) { return document.getElementById(id); }

  function aviso(id, texto, tipo) {
    var caixa = el(id);
    caixa.className = 'msg' + (tipo ? ' msg--' + tipo : '');
    caixa.textContent = texto || '';
  }

  function buscarMaterial(id) {
    for (var i = 0; i < estado.materiais.length; i++) {
      if (estado.materiais[i].id === id) { return estado.materiais[i]; }
    }
    return null;
  }

  /* ---------------------------------------------------------------
     Renderização
     --------------------------------------------------------------- */
  function renderMateriaisSelect() {
    var sel = el('amb-material');
    var atual = sel.value;
    sel.innerHTML = '';
    estado.materiais.forEach(function (m) {
      var o = document.createElement('option');
      o.value = m.id;
      o.textContent = m.descricao + ' — ' + brl(m.preco);
      sel.appendChild(o);
    });
    if (atual) { sel.value = atual; }
  }

  function renderFerragensRascunho() {
    var tb = el('tb-ferragens');
    tb.innerHTML = '';

    if (estado.ferragensRascunho.length === 0) {
      tb.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma ferragem lançada neste ambiente.</td></tr>';
      return;
    }

    estado.ferragensRascunho.forEach(function (f, i) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapar(f.descricao) + '</td>' +
        '<td class="num">' + f.qtd + '</td>' +
        '<td class="num">' + brl(f.preco) + '</td>' +
        '<td class="num">' + brl(f.qtd * f.preco) + '</td>' +
        '<td class="num"><button class="mini" data-rm-ferragem="' + i + '" type="button">remover</button></td>';
      tb.appendChild(tr);
    });
  }

  function renderAmbientes() {
    var tb = el('tb-ambientes');
    tb.innerHTML = '';

    if (estado.ambientes.length === 0) {
      tb.innerHTML = '<tr><td colspan="6" class="empty">Nenhum ambiente incluído. Preencha o formulário ao lado.</td></tr>';
      return;
    }

    estado.ambientes.forEach(function (a, i) {
      var c = custoDoAmbiente(a);
      var material = buscarMaterial(a.materialId);
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><b>' + escapar(a.nome) + '</b><br><span class="hint">' +
          a.ferragens.length + ' tipo(s) de ferragem · ' + a.horas + 'h · perda ' + Math.round(a.perda * 100) + '%</span></td>' +
        '<td>' + escapar(material ? material.descricao : '—') + '</td>' +
        '<td class="num">' + a.area.toFixed(1).replace('.', ',') + ' m²</td>' +
        '<td class="num">' + c.chapas + '</td>' +
        '<td class="num">' + brl(c.total) + '</td>' +
        '<td class="num"><button class="mini" data-rm-ambiente="' + i + '" type="button">remover</button></td>';
      tb.appendChild(tr);
    });
  }

  function renderResumo() {
    var soma = { chapas: 0, material: 0, ferragens: 0, maoDeObra: 0, total: 0 };

    estado.ambientes.forEach(function (a) {
      var c = custoDoAmbiente(a);
      soma.chapas    += c.chapas;
      soma.material  += c.material;
      soma.ferragens += c.ferragens;
      soma.maoDeObra += c.maoDeObra;
      soma.total     += c.total;
    });

    el('rs-chapas').textContent    = soma.chapas;
    el('rs-material').textContent  = brl(soma.material);
    el('rs-ferragens').textContent = brl(soma.ferragens);
    el('rs-mao').textContent       = brl(soma.maoDeObra);
    el('rs-custo').textContent     = brl(soma.total);

    var margem = num('orc-margem') / 100;
    var desconto = num('orc-desconto') / 100;
    var perfil = el('orc-perfil').value;

    var tabela = precoDeVenda(soma.total, margem);
    var r = validarDesconto(perfil, desconto, tabela, soma.total);

    el('rs-tabela').textContent = brl(tabela);

    if (r.ok) {
      el('rs-desc').textContent   = '− ' + brl(tabela - r.precoFinal);
      el('rs-final').textContent  = brl(r.precoFinal);
      el('rs-margem').textContent = pct(r.margemFinal);

      if (soma.total === 0) {
        aviso('msg-preco', '', '');
      } else if (r.margemFinal < margem - 0.05) {
        aviso('msg-preco', 'O desconto derrubou a margem de ' + pct(margem) +
              ' para ' + pct(r.margemFinal) + '.', 'warn');
      } else {
        aviso('msg-preco', 'Desconto dentro do limite do perfil ' + perfil + '.', 'ok');
      }
    } else {
      el('rs-desc').textContent   = '—';
      el('rs-final').textContent  = brl(tabela);
      el('rs-margem').textContent = pct(margem);
      aviso('msg-preco', r.motivo, 'danger');
    }

    el('btn-salvar').disabled = estado.ambientes.length === 0;
  }

  function renderOrcamentos() {
    var tb = el('tb-orcamentos');
    tb.innerHTML = '';

    if (estado.orcamentos.length === 0) {
      tb.innerHTML = '<tr><td colspan="5" class="empty">Nenhum orçamento salvo.</td></tr>';
      return;
    }

    estado.orcamentos.forEach(function (o) {
      var pill = o.situacao === 'aprovado'
        ? '<span class="pill pill--ok">aprovado</span>'
        : '<span class="pill">em aberto</span>';

      var acao = o.situacao === 'aprovado'
        ? '<span class="hint">ordem ' + o.numero + '</span>'
        : '<button class="mini" data-aprovar="' + o.numero + '" type="button">aprovar</button>';

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="mono">' + o.numero + '</td>' +
        '<td>' + escapar(o.cliente) + '<br><span class="hint">' + o.ambientes.length + ' ambiente(s)</span></td>' +
        '<td class="num">' + brl(o.precoFinal) + '<br><span class="hint">margem ' + pct(o.margemFinal) + '</span></td>' +
        '<td>' + pill + '</td>' +
        '<td class="num">' + acao + '</td>';
      tb.appendChild(tr);
    });
  }

  function renderOrdens() {
    var alvo = el('lista-ordens');
    alvo.innerHTML = '';

    if (estado.ordens.length === 0) {
      alvo.innerHTML = '<p class="empty">Nenhuma ordem aberta. Aprove um orçamento na aba anterior.</p>';
      return;
    }

    estado.ordens.forEach(function (ordem) {
      var feitas = 0;
      ordem.etapas.forEach(function (e) { if (e.concluida) { feitas++; } });
      var progresso = Math.round((feitas / ordem.etapas.length) * 100);

      var caixa = document.createElement('div');
      caixa.className = 'box';

      var etapasHtml = '';
      ordem.etapas.forEach(function (etapa, i) {
        var liberada = i === 0 || ordem.etapas[i - 1].concluida;
        etapasHtml +=
          '<div class="step' + (etapa.concluida ? ' is-done' : '') + '">' +
            '<span class="step__n">' + (etapa.concluida ? '✓' : (i + 1)) + '</span>' +
            '<span class="step__t">' + etapa.nome + '</span>' +
            (etapa.concluida
              ? '<span class="pill pill--ok">concluída</span>'
              : '<button class="act act--ghost" style="padding:5px 12px;font-size:13px" ' +
                'data-etapa="' + ordem.numero + ':' + i + '" type="button">' +
                (liberada ? 'concluir' : 'concluir (bloqueada)') + '</button>') +
          '</div>';
      });

      caixa.innerHTML =
        '<div class="box__hd">' +
          '<h2>Ordem ' + ordem.numero + ' · ' + escapar(ordem.cliente) + '</h2>' +
          '<span class="pill ' + (progresso === 100 ? 'pill--ok' : 'pill--info') + '">' + progresso + '% concluída</span>' +
        '</div>' +
        '<div class="box__bd">' +
          '<div class="stats" style="margin-bottom:16px">' +
            '<div class="stat"><b>' + ordem.chapas + '</b><span>Chapas</span></div>' +
            '<div class="stat"><b>' + ordem.ambientes.length + '</b><span>Ambientes</span></div>' +
            '<div class="stat"><b>' + brl(ordem.precoFinal).replace('R$ ', '') + '</b><span>Valor</span></div>' +
            '<div class="stat"><b>' + pct(ordem.margemFinal) + '</b><span>Margem</span></div>' +
          '</div>' +
          '<div class="steps">' + etapasHtml + '</div>' +
          '<div class="msg" id="msg-ordem-' + ordem.numero + '"></div>' +
        '</div>';

      alvo.appendChild(caixa);
    });
  }

  function renderMateriaisTabela() {
    var tb = el('tb-materiais');
    tb.innerHTML = '';

    estado.materiais.forEach(function (m, i) {
      var util = areaUtilDaChapa(0.15);
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapar(m.descricao) + '</td>' +
        '<td class="num"><input type="number" min="0" step="0.01" value="' + m.preco +
          '" name="preco-material-' + i + '" data-preco-material="' + i + '" style="max-width:120px;text-align:right"></td>' +
        '<td class="num">' + brl(m.preco / util) + '</td>';
      tb.appendChild(tr);
    });
  }

  function escapar(texto) {
    return String(texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderTudo() {
    renderMateriaisSelect();
    renderFerragensRascunho();
    renderAmbientes();
    renderResumo();
    renderOrcamentos();
    renderOrdens();
    renderMateriaisTabela();
  }

  /* ---------------------------------------------------------------
     Eventos
     --------------------------------------------------------------- */
  function trocarAba(nome) {
    document.querySelectorAll('[role="tab"]').forEach(function (b) {
      b.setAttribute('aria-selected', b.dataset.tab === nome ? 'true' : 'false');
    });
    document.querySelectorAll('[data-panel]').forEach(function (p) {
      p.hidden = p.dataset.panel !== nome;
    });
  }

  document.querySelectorAll('[role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { trocarAba(b.dataset.tab); });
  });

  el('btn-add-ferragem').addEventListener('click', function () {
    var desc = txt('fer-desc');
    var qtd = num('fer-qtd');
    var preco = num('fer-preco');

    if (!desc) { aviso('msg-ambiente', 'Informe a descrição da ferragem.', 'danger'); return; }
    if (qtd <= 0) { aviso('msg-ambiente', 'A quantidade precisa ser maior que zero.', 'danger'); return; }

    estado.ferragensRascunho.push({ descricao: desc, qtd: qtd, preco: preco });
    el('fer-desc').value = '';
    el('fer-qtd').value = 1;
    el('fer-preco').value = 0;

    aviso('msg-ambiente', '', '');
    renderFerragensRascunho();
    salvar();
  });

  el('btn-ferragens-exemplo').addEventListener('click', function () {
    KIT_EXEMPLO.forEach(function (f) {
      estado.ferragensRascunho.push({ descricao: f.descricao, qtd: f.qtd, preco: f.preco });
    });
    renderFerragensRascunho();
    salvar();
  });

  el('tb-ferragens').addEventListener('click', function (ev) {
    var alvo = ev.target.closest('[data-rm-ferragem]');
    if (!alvo) { return; }
    estado.ferragensRascunho.splice(parseInt(alvo.dataset.rmFerragem, 10), 1);
    renderFerragensRascunho();
    salvar();
  });

  el('btn-add-ambiente').addEventListener('click', function () {
    var nome = txt('amb-nome');
    var area = num('amb-area');

    if (!nome) { aviso('msg-ambiente', 'Dê um nome ao ambiente.', 'danger'); return; }
    if (area <= 0) { aviso('msg-ambiente', 'A área de chapa precisa ser maior que zero.', 'danger'); return; }

    estado.ambientes.push({
      nome: nome,
      area: area,
      materialId: el('amb-material').value,
      horas: num('amb-horas'),
      perda: num('amb-perda') / 100,
      ferragens: estado.ferragensRascunho.slice()
    });

    estado.ferragensRascunho = [];
    el('amb-nome').value = '';

    aviso('msg-ambiente', 'Ambiente “' + nome + '” incluído no orçamento.', 'ok');
    renderFerragensRascunho();
    renderAmbientes();
    renderResumo();
    salvar();
  });

  el('tb-ambientes').addEventListener('click', function (ev) {
    var alvo = ev.target.closest('[data-rm-ambiente]');
    if (!alvo) { return; }
    estado.ambientes.splice(parseInt(alvo.dataset.rmAmbiente, 10), 1);
    renderAmbientes();
    renderResumo();
    salvar();
  });

  ['orc-margem', 'orc-desconto', 'orc-perfil'].forEach(function (id) {
    el(id).addEventListener('input', renderResumo);
    el(id).addEventListener('change', renderResumo);
  });

  el('btn-salvar').addEventListener('click', function () {
    var cliente = txt('orc-cliente');
    if (!cliente) { aviso('msg-preco', 'Informe o cliente antes de salvar.', 'danger'); return; }
    if (estado.ambientes.length === 0) { return; }

    var soma = 0, chapas = 0;
    estado.ambientes.forEach(function (a) {
      var c = custoDoAmbiente(a);
      soma += c.total;
      chapas += c.chapas;
    });

    var margem = num('orc-margem') / 100;
    var desconto = num('orc-desconto') / 100;
    var tabela = precoDeVenda(soma, margem);
    var r = validarDesconto(el('orc-perfil').value, desconto, tabela, soma);

    if (!r.ok) { aviso('msg-preco', 'Não é possível salvar: ' + r.motivo, 'danger'); return; }

    estado.orcamentos.push({
      numero: estado.proximoNumero,
      cliente: cliente,
      ambientes: estado.ambientes.slice(),
      chapas: chapas,
      custo: soma,
      precoFinal: r.precoFinal,
      margemFinal: r.margemFinal,
      situacao: 'aberto'
    });

    estado.proximoNumero++;
    estado.ambientes = [];
    el('orc-cliente').value = '';
    el('orc-desconto').value = 0;

    renderTudo();
    salvar();

    // Depois de renderTudo, senão o recálculo do resumo apaga a mensagem
    aviso('msg-ambiente', '', '');
    aviso('msg-preco', 'Orçamento ' + (estado.proximoNumero - 1) +
          ' salvo. Aprove-o para gerar a ordem de produção.', 'ok');
  });

  el('btn-limpar').addEventListener('click', function () {
    estado.ambientes = [];
    estado.ferragensRascunho = [];
    el('orc-cliente').value = '';
    aviso('msg-preco', '', '');
    aviso('msg-ambiente', '', '');
    renderTudo();
    salvar();
  });

  el('tb-orcamentos').addEventListener('click', function (ev) {
    var alvo = ev.target.closest('[data-aprovar]');
    if (!alvo) { return; }

    var numero = parseInt(alvo.dataset.aprovar, 10);
    estado.orcamentos.forEach(function (o) {
      if (o.numero !== numero || o.situacao === 'aprovado') { return; }

      o.situacao = 'aprovado';

      var etapas = ETAPAS.map(function (nome) {
        return { nome: nome, concluida: false };
      });

      estado.ordens.push({
        numero: o.numero,
        cliente: o.cliente,
        ambientes: o.ambientes,
        chapas: o.chapas,
        precoFinal: o.precoFinal,
        margemFinal: o.margemFinal,
        etapas: etapas
      });
    });

    renderOrcamentos();
    renderOrdens();
    salvar();
    trocarAba('ordens');
  });

  el('lista-ordens').addEventListener('click', function (ev) {
    var alvo = ev.target.closest('[data-etapa]');
    if (!alvo) { return; }

    var partes = alvo.dataset.etapa.split(':');
    var numero = parseInt(partes[0], 10);
    var indice = parseInt(partes[1], 10);

    estado.ordens.forEach(function (ordem) {
      if (ordem.numero !== numero) { return; }

      var erro = concluirEtapa(ordem, indice);
      renderOrdens();
      salvar();

      if (erro) {
        var caixa = el('msg-ordem-' + numero);
        if (caixa) {
          caixa.className = 'msg msg--danger';
          caixa.textContent = erro;
        }
      }
    });
  });

  el('tb-materiais').addEventListener('input', function (ev) {
    var alvo = ev.target.closest('[data-preco-material]');
    if (!alvo) { return; }

    var i = parseInt(alvo.dataset.precoMaterial, 10);
    var valor = parseFloat(alvo.value);
    estado.materiais[i].preco = isNaN(valor) ? 0 : valor;

    renderMateriaisSelect();
    renderAmbientes();
    renderResumo();
    salvar();
  });

  el('btn-salvar-cfg').addEventListener('click', function () {
    estado.config.valorHora = num('cfg-hora');
    estado.config.chapaLargura = num('cfg-larg');
    estado.config.chapaAltura = num('cfg-alt');

    aviso('msg-cfg', 'Parâmetros salvos. Os cálculos foram atualizados.', 'ok');
    renderTudo();
    salvar();
  });

  el('btn-reset').addEventListener('click', function () {
    if (!confirm('Apagar todos os orçamentos, ordens e parâmetros deste protótipo?')) { return; }
    try { localStorage.removeItem(CHAVE); } catch (e) {}
    location.reload();
  });

  /* ---------------------------------------------------------------
     Início
     --------------------------------------------------------------- */
  carregar();

  el('cfg-hora').value = estado.config.valorHora;
  el('cfg-larg').value = estado.config.chapaLargura;
  el('cfg-alt').value  = estado.config.chapaAltura;

  renderTudo();
})();
