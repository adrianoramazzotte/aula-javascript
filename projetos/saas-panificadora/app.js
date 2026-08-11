/* =========================================================================
   SaaS para Panificadora — protótipo
   Ficha técnica com custo por unidade, plano de produção por média móvel
   e controle de sobra. JavaScript puro, sem dependências.
   ========================================================================= */
(function () {
  'use strict';

  var CHAVE = 'panificadora-v1';

  var DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
              'Quinta-feira', 'Sexta-feira', 'Sábado'];

  var INSUMOS_SEED = [
    { id: 'farinha',  descricao: 'Farinha de trigo',   embalagem: 'Saco 25 kg',    preco: 132.00, qtdEmbalagem: 25000,   unidade: 'g' },
    { id: 'agua',     descricao: 'Água',               embalagem: '1000 L',        preco: 8.40,   qtdEmbalagem: 1000000, unidade: 'ml' },
    { id: 'sal',      descricao: 'Sal refinado',       embalagem: 'Pacote 1 kg',   preco: 3.20,   qtdEmbalagem: 1000,    unidade: 'g' },
    { id: 'fermento', descricao: 'Fermento biológico', embalagem: 'Pacote 500 g',  preco: 18.90,  qtdEmbalagem: 500,     unidade: 'g' },
    { id: 'acucar',   descricao: 'Açúcar refinado',    embalagem: 'Pacote 5 kg',   preco: 21.50,  qtdEmbalagem: 5000,    unidade: 'g' },
    { id: 'gordura',  descricao: 'Gordura vegetal',    embalagem: 'Caixa 15 kg',   preco: 168.00, qtdEmbalagem: 15000,   unidade: 'g' },
    { id: 'ovo',      descricao: 'Ovo',                embalagem: 'Caixa 360 un',  preco: 198.00, qtdEmbalagem: 360,     unidade: 'un' },
    { id: 'leite',    descricao: 'Leite integral',     embalagem: 'Caixa 12 L',    preco: 62.40,  qtdEmbalagem: 12000,   unidade: 'ml' },
    { id: 'queijo',   descricao: 'Queijo meia cura',   embalagem: 'Peça 5 kg',     preco: 218.00, qtdEmbalagem: 5000,    unidade: 'g' },
    { id: 'polvilho', descricao: 'Polvilho azedo',     embalagem: 'Pacote 5 kg',   preco: 42.00,  qtdEmbalagem: 5000,    unidade: 'g' },
    { id: 'fuba',     descricao: 'Fubá',               embalagem: 'Pacote 5 kg',   preco: 24.50,  qtdEmbalagem: 5000,    unidade: 'g' },
    { id: 'creme',    descricao: 'Creme de confeiteiro', embalagem: 'Pacote 2 kg', preco: 46.00,  qtdEmbalagem: 2000,    unidade: 'g' }
  ];

  var RECEITAS_SEED = [
    {
      id: 'pao-frances', nome: 'Pão francês', rendimento: 200, unidade: 'un', precoPraticado: 0.85,
      itens: [
        { insumo: 'farinha',  qtd: 10000 },
        { insumo: 'agua',     qtd: 6000 },
        { insumo: 'sal',      qtd: 200 },
        { insumo: 'fermento', qtd: 150 },
        { insumo: 'acucar',   qtd: 100 },
        { insumo: 'gordura',  qtd: 300 }
      ]
    },
    {
      id: 'pao-queijo', nome: 'Pão de queijo', rendimento: 120, unidade: 'un', precoPraticado: 2.90,
      itens: [
        { insumo: 'polvilho', qtd: 3000 },
        { insumo: 'queijo',   qtd: 1500 },
        { insumo: 'leite',    qtd: 900 },
        { insumo: 'ovo',      qtd: 12 },
        { insumo: 'gordura',  qtd: 400 },
        { insumo: 'sal',      qtd: 40 }
      ]
    },
    {
      id: 'sonho', nome: 'Sonho', rendimento: 60, unidade: 'un', precoPraticado: 4.50,
      itens: [
        { insumo: 'farinha',  qtd: 3000 },
        { insumo: 'acucar',   qtd: 600 },
        { insumo: 'ovo',      qtd: 8 },
        { insumo: 'leite',    qtd: 800 },
        { insumo: 'fermento', qtd: 90 },
        { insumo: 'gordura',  qtd: 500 },
        { insumo: 'creme',    qtd: 900 }
      ]
    },
    {
      id: 'bolo-fuba', nome: 'Bolo de fubá (kg)', rendimento: 8, unidade: 'kg', precoPraticado: 32.00,
      itens: [
        { insumo: 'fuba',    qtd: 2000 },
        { insumo: 'farinha', qtd: 1200 },
        { insumo: 'acucar',  qtd: 1600 },
        { insumo: 'ovo',     qtd: 16 },
        { insumo: 'leite',   qtd: 1500 },
        { insumo: 'gordura', qtd: 600 }
      ]
    }
  ];

  /* Vendas das últimas 4 semanas, por dia da semana (0 = domingo) */
  var HISTORICO_SEED = {
    'pao-frances': { 0: [980, 1020, 940, 1010], 1: [640, 610, 665, 630], 2: [720, 700, 745, 690],
                     3: [710, 735, 690, 720], 4: [730, 760, 705, 745], 5: [820, 860, 790, 835], 6: [860, 900, 880, 910] },
    'pao-queijo':  { 0: [180, 210, 195, 205],   1: [96, 104, 92, 108],   2: [120, 118, 132, 126],
                     3: [124, 130, 118, 128],   4: [132, 128, 140, 136], 5: [150, 158, 144, 152], 6: [160, 155, 172, 168] },
    'sonho':       { 0: [90, 105, 88, 96],      1: [34, 40, 30, 36],     2: [45, 52, 48, 44],
                     3: [46, 44, 50, 48],       4: [52, 56, 48, 54],     5: [64, 70, 60, 66],     6: [70, 78, 66, 74] },
    'bolo-fuba':   { 0: [12, 14, 11, 13],       1: [4, 5, 4, 3],         2: [6, 7, 5, 6],
                     3: [6, 6, 7, 5],           4: [7, 8, 6, 7],         5: [9, 8, 10, 9],        6: [10, 9, 11, 10] }
  };

  var ENCOMENDAS_SEED = { 'pao-frances': 0, 'pao-queijo': 40, 'sonho': 0, 'bolo-fuba': 5 };
  var SOBRA_ONTEM_SEED = { 'pao-frances': 65, 'pao-queijo': 8, 'sonho': 12, 'bolo-fuba': 1 };

  /* ---------------------------------------------------------------
     Estado
     --------------------------------------------------------------- */
  var estado = {
    config: { indireto: 0.35 },
    insumos: INSUMOS_SEED.slice(),
    receitas: RECEITAS_SEED.slice(),
    historico: HISTORICO_SEED,
    encomendas: ENCOMENDAS_SEED,
    sobraOntem: SOBRA_ONTEM_SEED,
    producaoAtual: null,
    fechamentos: []
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
  function buscarInsumo(id) {
    for (var i = 0; i < estado.insumos.length; i++) {
      if (estado.insumos[i].id === id) { return estado.insumos[i]; }
    }
    return null;
  }

  function buscarReceita(id) {
    for (var i = 0; i < estado.receitas.length; i++) {
      if (estado.receitas[i].id === id) { return estado.receitas[i]; }
    }
    return null;
  }

  function precoUnitario(insumo) {
    return insumo.preco / insumo.qtdEmbalagem;
  }

  function custoDireto(receita) {
    var total = 0;
    receita.itens.forEach(function (item) {
      var ins = buscarInsumo(item.insumo);
      if (ins) { total += item.qtd * precoUnitario(ins); }
    });
    return total;
  }

  function custoPorUnidade(receita) {
    var direto = custoDireto(receita);
    return (direto * (1 + estado.config.indireto)) / receita.rendimento;
  }

  function precoPelaMargem(custo, margem) {
    if (margem <= 0 || margem >= 1) { return custo; }
    return custo / (1 - margem);
  }

  function margemReal(preco, custo) {
    if (preco <= 0) { return 0; }
    return (preco - custo) / preco;
  }

  function media(valores) {
    if (!valores || valores.length === 0) { return 0; }
    var soma = 0;
    for (var i = 0; i < valores.length; i++) { soma += valores[i]; }
    return soma / valores.length;
  }

  function sugerirProducao(receitaId, diaSemana, fator) {
    var serie = estado.historico[receitaId] ? estado.historico[receitaId][diaSemana] : null;
    var base = media(serie);
    var encomendas = estado.encomendas[receitaId] || 0;
    var sobra = estado.sobraOntem[receitaId] || 0;

    var sugestao = base * fator + encomendas - sobra;
    if (sugestao < 0) { sugestao = 0; }

    return { media: base, encomendas: encomendas, sobraOntem: sobra, sugestao: Math.ceil(sugestao) };
  }

  function indiceSobra(produzido, sobrou) {
    if (produzido <= 0) { return 0; }
    return sobrou / produzido;
  }

  function classificarSobra(indice) {
    if (indice > 0.12) { return 'CRÍTICO'; }
    if (indice > 0.08) { return 'ALTO'; }
    if (indice < 0.01) { return 'RISCO DE FALTA'; }
    return 'OK';
  }

  /* ---------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------- */
  function brl(v, casas) {
    var c = casas === undefined ? 2 : casas;
    return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  }

  function n2(v) {
    return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pct(f) { return (f * 100).toFixed(1).replace('.', ',') + '%'; }

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

  /* ---------------------------------------------------------------
     Ficha técnica
     --------------------------------------------------------------- */
  function renderSelects() {
    var sel = el('fic-receita');
    var atual = sel.value;
    sel.innerHTML = '';
    estado.receitas.forEach(function (r) {
      var o = document.createElement('option');
      o.value = r.id;
      o.textContent = r.nome;
      sel.appendChild(o);
    });
    if (atual) { sel.value = atual; }

    var sim = el('sim-insumo');
    var atualSim = sim.value;
    sim.innerHTML = '';
    estado.insumos.forEach(function (i) {
      var o = document.createElement('option');
      o.value = i.id;
      o.textContent = i.descricao;
      sim.appendChild(o);
    });
    if (atualSim) { sim.value = atualSim; }
  }

  function renderFicha() {
    var receita = buscarReceita(el('fic-receita').value) || estado.receitas[0];
    if (!receita) { return; }

    var tb = el('tb-ficha');
    tb.innerHTML = '';

    var direto = custoDireto(receita);

    receita.itens.forEach(function (item) {
      var ins = buscarInsumo(item.insumo);
      if (!ins) { return; }

      var custo = item.qtd * precoUnitario(ins);
      var parte = direto > 0 ? custo / direto : 0;

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapar(ins.descricao) + '</td>' +
        '<td class="num">' + n2(item.qtd) + ' ' + ins.unidade + '</td>' +
        '<td class="num">' + brl(precoUnitario(ins), 4) + '</td>' +
        '<td class="num">' + brl(custo) + '</td>' +
        '<td class="num">' + pct(parte) + '</td>';
      tb.appendChild(tr);
    });

    var indireto = direto * estado.config.indireto;
    var unitario = custoPorUnidade(receita);
    var margem = (parseFloat(el('fic-margem').value) || 0) / 100;
    var sugerido = precoPelaMargem(unitario, margem);
    var real = margemReal(receita.precoPraticado, unitario);

    el('fi-direto').textContent     = brl(direto);
    el('fi-indireto').textContent   = brl(indireto);
    el('fi-rendimento').textContent = receita.rendimento + ' ' + receita.unidade;
    el('fi-unitario').textContent   = brl(unitario, 4);
    el('fi-preco').textContent      = brl(sugerido);
    el('fi-praticado').textContent  = brl(receita.precoPraticado);
    el('fi-margem-real').textContent = pct(real);

    if (receita.precoPraticado < unitario) {
      aviso('msg-ficha', 'O preço praticado está ABAIXO do custo: cada ' + receita.unidade +
            ' vendido dá prejuízo de ' + brl(unitario - receita.precoPraticado, 4) + '.', 'danger');
    } else if (real < margem - 0.05) {
      aviso('msg-ficha', 'Margem real de ' + pct(real) + ', ' +
            ((margem - real) * 100).toFixed(1).replace('.', ',') +
            ' pontos abaixo do alvo. Preço sugerido: ' + brl(sugerido) + '.', 'warn');
    } else {
      aviso('msg-ficha', 'Margem real dentro do alvo.', 'ok');
    }

    el('pill-indireto').textContent = 'indiretos ' + Math.round(estado.config.indireto * 100) + '%';
  }

  function renderInsumos() {
    var tb = el('tb-insumos');
    tb.innerHTML = '';

    estado.insumos.forEach(function (i, idx) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapar(i.descricao) + '</td>' +
        '<td class="hint">' + escapar(i.embalagem) + '</td>' +
        '<td class="num"><input type="number" min="0" step="0.01" value="' + i.preco +
          '" name="preco-insumo-' + idx + '" data-preco="' + idx + '" style="max-width:110px;text-align:right"></td>' +
        '<td class="num">' + brl(precoUnitario(i), 4) + '/' + i.unidade + '</td>';
      tb.appendChild(tr);
    });
  }

  function simular() {
    var id = el('sim-insumo').value;
    var aumento = (parseFloat(el('sim-aumento').value) || 0) / 100;
    var insumo = buscarInsumo(id);
    if (!insumo) { return; }

    var antes = estado.receitas.map(function (r) {
      return { nome: r.nome, unidade: r.unidade, custo: custoPorUnidade(r), preco: r.precoPraticado };
    });

    var precoOriginal = insumo.preco;
    insumo.preco = precoOriginal * (1 + aumento);

    var depois = estado.receitas.map(function (r) { return custoPorUnidade(r); });

    insumo.preco = precoOriginal;   // simulação não altera o cadastro

    var html = '<div class="tbl"><table><thead><tr>' +
               '<th>Receita</th><th class="num">Custo atual</th><th class="num">Custo simulado</th>' +
               '<th class="num">Variação</th><th class="num">Margem depois</th></tr></thead><tbody>';

    antes.forEach(function (a, i) {
      var novo = depois[i];
      var variacao = a.custo > 0 ? (novo / a.custo) - 1 : 0;
      var margemDepois = margemReal(a.preco, novo);

      var classe = variacao > 0.05 ? 'pill--danger' : (variacao > 0.01 ? 'pill--warn' : 'pill--ok');

      html += '<tr>' +
        '<td>' + escapar(a.nome) + '</td>' +
        '<td class="num">' + brl(a.custo, 4) + '</td>' +
        '<td class="num">' + brl(novo, 4) + '</td>' +
        '<td class="num"><span class="pill ' + classe + '">' +
          (variacao >= 0 ? '+' : '') + pct(variacao) + '</span></td>' +
        '<td class="num">' + pct(margemDepois) + '</td>' +
      '</tr>';
    });

    html += '</tbody></table></div>' +
      '<p class="hint">Um aumento de ' + (aumento * 100).toFixed(0) + '% em ' + escapar(insumo.descricao) +
      ' não significa aumentar o preço na mesma proporção: cada receita usa o insumo em peso diferente.</p>';

    el('res-simulacao').innerHTML = html;
  }

  /* ---------------------------------------------------------------
     Produção
     --------------------------------------------------------------- */
  function renderPlano() {
    var dia = parseInt(el('pl-dia').value, 10);
    var fator = (parseFloat(el('pl-fator').value) || 100) / 100;

    el('pill-dia').textContent = DIAS[dia];

    var tb = el('tb-plano');
    tb.innerHTML = '';

    estado.receitas.forEach(function (r) {
      var s = sugerirProducao(r.id, dia, fator);

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><b>' + escapar(r.nome) + '</b></td>' +
        '<td class="num">' + s.media.toFixed(0) + '</td>' +
        '<td class="num">+' + s.encomendas + '</td>' +
        '<td class="num">−' + s.sobraOntem + '</td>' +
        '<td class="num"><b>' + s.sugestao + '</b></td>' +
        '<td class="num"><input type="number" min="0" step="1" value="' + s.sugestao +
          '" name="produzir-' + r.id + '" data-produzir="' + r.id + '" style="max-width:100px;text-align:right"></td>';
      tb.appendChild(tr);
    });

    aviso('msg-plano', '', '');
  }

  function renderHistorico() {
    var dia = parseInt(el('pl-dia').value, 10);
    var tb = el('tb-historico');
    tb.innerHTML = '';

    estado.receitas.forEach(function (r) {
      var serie = estado.historico[r.id] ? estado.historico[r.id][dia] : null;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapar(r.nome) + '</td>' +
        '<td class="mono">' + (serie ? serie.join(' · ') : 'sem histórico') + '</td>' +
        '<td class="num">' + (serie ? media(serie).toFixed(1).replace('.', ',') : '—') + '</td>';
      tb.appendChild(tr);
    });
  }

  function confirmarProducao() {
    var itens = [];

    document.querySelectorAll('[data-produzir]').forEach(function (input) {
      var id = input.dataset.produzir;
      var receita = buscarReceita(id);
      var qtd = parseInt(input.value, 10) || 0;

      if (qtd > 0 && receita) {
        itens.push({
          id: id, nome: receita.nome, unidade: receita.unidade,
          produzido: qtd, custoUnit: custoPorUnidade(receita)
        });
      }
    });

    if (itens.length === 0) {
      aviso('msg-plano', 'Informe ao menos uma quantidade a produzir.', 'danger');
      return;
    }

    estado.producaoAtual = { dia: parseInt(el('pl-dia').value, 10), itens: itens };

    aviso('msg-plano', 'Produção confirmada. Registre a sobra na aba “Sobra e indicadores” ao fechar o dia.', 'ok');
    renderSobra();
    salvar();
  }

  /* ---------------------------------------------------------------
     Sobra
     --------------------------------------------------------------- */
  function renderSobra() {
    var tb = el('tb-sobra');
    tb.innerHTML = '';

    if (!estado.producaoAtual) {
      el('pill-producao').textContent = 'nenhuma produção confirmada';
      el('pill-producao').className = 'pill';
      tb.innerHTML = '<tr><td colspan="6" class="empty">Confirme a produção do dia na aba anterior.</td></tr>';
      el('btn-fechar').disabled = true;
      renderIndicadores();
      return;
    }

    el('pill-producao').textContent = DIAS[estado.producaoAtual.dia] + ' · ' + estado.producaoAtual.itens.length + ' produto(s)';
    el('pill-producao').className = 'pill pill--info';
    el('btn-fechar').disabled = false;

    estado.producaoAtual.itens.forEach(function (item) {
      var sobrou = item.sobrou === undefined ? 0 : item.sobrou;
      var indice = indiceSobra(item.produzido, sobrou);
      var situacao = classificarSobra(indice);
      var perda = sobrou * item.custoUnit;

      var classe = situacao === 'CRÍTICO' ? 'pill--danger'
                 : (situacao === 'ALTO' ? 'pill--warn'
                 : (situacao === 'RISCO DE FALTA' ? 'pill--info' : 'pill--ok'));

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><b>' + escapar(item.nome) + '</b></td>' +
        '<td class="num">' + item.produzido + ' ' + item.unidade + '</td>' +
        '<td class="num"><input type="number" min="0" step="1" value="' + sobrou +
          '" name="sobrou-' + item.id + '" data-sobrou="' + item.id + '" style="max-width:100px;text-align:right"></td>' +
        '<td class="num" data-cel-indice="' + item.id + '">' + pct(indice) + '</td>' +
        '<td data-cel-situacao="' + item.id + '"><span class="pill ' + classe + '">' + situacao + '</span></td>' +
        '<td class="num" data-cel-perda="' + item.id + '">' + brl(perda) + '</td>';
      tb.appendChild(tr);
    });

    renderIndicadores();
  }

  /* Atualiza só as células derivadas da linha editada. Redesenhar a tabela
     inteira a cada tecla trocaria o campo sob o cursor e embaralharia o que
     está sendo digitado. */
  function atualizarLinhaSobra(item) {
    var indice = indiceSobra(item.produzido, item.sobrou || 0);
    var situacao = classificarSobra(indice);
    var classe = situacao === 'CRÍTICO' ? 'pill--danger'
               : (situacao === 'ALTO' ? 'pill--warn'
               : (situacao === 'RISCO DE FALTA' ? 'pill--info' : 'pill--ok'));

    var celIndice = document.querySelector('[data-cel-indice="' + item.id + '"]');
    var celSituacao = document.querySelector('[data-cel-situacao="' + item.id + '"]');
    var celPerda = document.querySelector('[data-cel-perda="' + item.id + '"]');

    if (celIndice) { celIndice.textContent = pct(indice); }
    if (celSituacao) { celSituacao.innerHTML = '<span class="pill ' + classe + '">' + situacao + '</span>'; }
    if (celPerda) { celPerda.textContent = brl((item.sobrou || 0) * item.custoUnit); }

    renderIndicadores();
  }

  function fecharDia() {
    if (!estado.producaoAtual) { return; }

    var produzido = 0, sobrou = 0, perda = 0;

    estado.producaoAtual.itens.forEach(function (item) {
      produzido += item.produzido;
      sobrou += item.sobrou || 0;
      perda += (item.sobrou || 0) * item.custoUnit;

      // A sobra de hoje entra no cálculo do plano de amanhã
      estado.sobraOntem[item.id] = item.sobrou || 0;
    });

    estado.fechamentos.push({
      dia: estado.producaoAtual.dia,
      produzido: produzido, sobrou: sobrou, perda: perda,
      itens: estado.producaoAtual.itens.slice()
    });

    var indice = indiceSobra(produzido, sobrou);
    estado.producaoAtual = null;

    aviso('msg-sobra', 'Dia fechado: índice de sobra de ' + pct(indice) +
          ' e perda de ' + brl(perda) + '. A sobra já foi lançada no plano de amanhã.',
          indice > 0.08 ? 'warn' : 'ok');

    renderSobra();
    renderPlano();
    salvar();
  }

  function renderIndicadores() {
    var produzido = 0, sobrou = 0, perda = 0;

    estado.fechamentos.forEach(function (f) {
      produzido += f.produzido;
      sobrou += f.sobrou;
      perda += f.perda;
    });

    var indice = indiceSobra(produzido, sobrou);
    var dias = estado.fechamentos.length;
    var perdaSemanal = dias > 0 ? (perda / dias) * 7 : 0;

    el('in-dias').textContent      = dias;
    el('in-produzido').textContent = produzido;
    el('in-sobra').textContent     = sobrou;
    el('in-indice').textContent    = pct(indice);
    el('in-perda').textContent     = n2(perda);
    el('in-ano').textContent       = n2(perdaSemanal * 52);
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
      if (b.dataset.tab === 'producao') { renderPlano(); renderHistorico(); }
      if (b.dataset.tab === 'sobra') { renderSobra(); }
    });
  });

  el('fic-receita').addEventListener('change', renderFicha);
  el('fic-margem').addEventListener('input', renderFicha);

  el('tb-insumos').addEventListener('input', function (ev) {
    var alvo = ev.target.closest('[data-preco]');
    if (!alvo) { return; }

    var i = parseInt(alvo.dataset.preco, 10);
    var v = parseFloat(alvo.value);
    estado.insumos[i].preco = isNaN(v) ? 0 : v;

    renderFicha();
    salvar();
  });

  el('btn-simular').addEventListener('click', simular);

  el('btn-cfg').addEventListener('click', function () {
    estado.config.indireto = (parseFloat(el('cfg-indireto').value) || 0) / 100;
    renderFicha();
    renderInsumos();
    salvar();
  });

  el('btn-reset').addEventListener('click', function () {
    if (!confirm('Reiniciar o protótipo? Preços, produção e fechamentos voltam ao estado inicial.')) { return; }
    try { localStorage.removeItem(CHAVE); } catch (e) {}
    location.reload();
  });

  el('pl-dia').addEventListener('change', function () { renderPlano(); renderHistorico(); });
  el('pl-fator').addEventListener('input', renderPlano);
  el('btn-gerar').addEventListener('click', function () { renderPlano(); renderHistorico(); });
  el('btn-confirmar').addEventListener('click', confirmarProducao);

  el('tb-sobra').addEventListener('input', function (ev) {
    var alvo = ev.target.closest('[data-sobrou]');
    if (!alvo || !estado.producaoAtual) { return; }

    var id = alvo.dataset.sobrou;
    var v = parseInt(alvo.value, 10) || 0;

    estado.producaoAtual.itens.forEach(function (item) {
      if (item.id !== id) { return; }

      if (v > item.produzido) {
        v = item.produzido;   // não se joga fora mais do que se produziu
        alvo.value = v;
      }

      item.sobrou = v;
      atualizarLinhaSobra(item);
    });

    salvar();
  });

  el('btn-fechar').addEventListener('click', fecharDia);

  /* ---------------------------------------------------------------
     Início
     --------------------------------------------------------------- */
  carregar();

  el('cfg-indireto').value = Math.round(estado.config.indireto * 100);
  el('pl-dia').value = new Date().getDay();

  renderSelects();
  renderInsumos();
  renderFicha();
  renderPlano();
  renderHistorico();
  renderSobra();
})();
