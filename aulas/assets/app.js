/* =========================================================================
   Desenvolvimento em JavaScript — Unidade 1
   Interações: tema, progresso, sumário, realce de sintaxe, copiar e executar
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------- Tema ---------------- */
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem('u1-theme');
    if (saved) root.setAttribute('data-theme', saved);
    else if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) {
      root.setAttribute('data-theme', 'dark');
    }
  } catch (e) { /* localStorage indisponível */ }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest && ev.target.closest('[data-theme-toggle]');
    if (!btn) return;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('u1-theme', next); } catch (e) {}
  });

  /* ---------------- Menu de aulas: fechar ao clicar fora / Esc ---------------- */
  document.addEventListener('click', function (ev) {
    document.querySelectorAll('details.menu[open]').forEach(function (d) {
      if (!d.contains(ev.target)) d.removeAttribute('open');
    });
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      document.querySelectorAll('details.menu[open]').forEach(function (d) { d.removeAttribute('open'); });
    }
  });

  /* ---------------- Barra de progresso de leitura ---------------- */
  var bar = document.getElementById('progress');
  if (bar) {
    var tick = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, p)) + '%';
    };
    addEventListener('scroll', tick, { passive: true });
    addEventListener('resize', tick);
    tick();
  }

  /* ---------------- Realce de sintaxe ---------------- */
  var KEYWORDS = ('var|let|const|function|return|if|else|for|while|do|break|continue|in|of|new|' +
                  'typeof|instanceof|class|this|switch|case|default|try|catch|finally|throw|delete|void');
  var LITERALS = 'true|false|null|undefined|NaN|Infinity';

  var RE = new RegExp(
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)' +                                   // 1 comentário
    '|("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|`(?:\\\\.|[^`\\\\])*`' +
      '|“[^“”]*”|‘[^‘’]*’)' +            // 2 string
    '|\\b(' + LITERALS + ')\\b' +                                                // 3 literal
    '|\\b(' + KEYWORDS + ')\\b' +                                                // 4 palavra-chave
    '|\\b(\\d+(?:\\.\\d+)?)\\b' +                                                // 5 número
    '|([A-Za-z_$À-ɏ][\\w$À-ɏ-]*)(?=\\s*\\()' +               // 6 chamada
    '|(=>|===|!==|==|!=|>=|<=|&&|\\|\\||\\+\\+|--|[=+\\-*/%<>!&|?:])' +          // 7 operador
    '|([{}()\\[\\];,.])',                                                        // 8 pontuação
    'g'
  );

  var CLASSES = [null, 't-com', 't-str', 't-bool', 't-key', 't-num', 't-fn', 't-op', 't-punc'];

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlight(src) {
    var out = '', last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(src)) !== null) {
      if (m.index > last) out += esc(src.slice(last, m.index));
      for (var g = 1; g < CLASSES.length; g++) {
        if (m[g] !== undefined) { out += '<span class="' + CLASSES[g] + '">' + esc(m[g]) + '</span>'; break; }
      }
      last = m.index + m[0].length;
      if (m[0].length === 0) RE.lastIndex++;
    }
    out += esc(src.slice(last));
    return out;
  }

  function numberLines(html, showNumbers, start) {
    var lines = html.split('\n');
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    /* cada linha é um bloco; juntar com "\n" duplicaria o espaçamento dentro do <pre> */
    return lines.map(function (l, i) {
      return '<span class="ln"' + (showNumbers ? ' data-n="' + (i + start) + '"' : '') + '>' +
             (l === '' ? '​' : l) + '</span>';
    }).join('');
  }

  function dedent(src) {
    var lines = src.replace(/\t/g, '  ').split('\n');
    while (lines.length && lines[0].trim() === '') lines.shift();
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    var pad = lines.reduce(function (min, l) {
      if (!l.trim()) return min;
      var n = l.match(/^ */)[0].length;
      return n < min ? n : min;
    }, Infinity);
    if (!isFinite(pad)) pad = 0;
    return lines.map(function (l) { return l.slice(pad); }).join('\n');
  }

  /* ---------------- Formatação de valores (estilo console) ---------------- */
  function fmt(v, depth) {
    depth = depth || 0;
    if (typeof v === 'string') return depth === 0 ? v : "'" + v + "'";
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'function') return '[Function: ' + (v.name || 'anonymous') + ']';
    if (Array.isArray(v)) {
      if (depth > 3) return '[Array]';
      return '[ ' + v.map(function (x) { return fmt(x, depth + 1); }).join(', ') + ' ]';
    }
    if (typeof v === 'object') {
      if (depth > 3) return '[Object]';
      var ks = Object.keys(v);
      if (!ks.length) return '{}';
      return '{ ' + ks.map(function (k) {
        return (/^[A-Za-z_$][\w$]*$/.test(k) ? k : "'" + k + "'") + ': ' + fmt(v[k], depth + 1);
      }).join(', ') + ' }';
    }
    return String(v);
  }

  /* ---------------- Preparação dos blocos de código ---------------- */
  document.querySelectorAll('.snippet').forEach(function (box) {
    var code = box.querySelector('code');
    if (!code) return;

    var raw = dedent(code.textContent);
    code.dataset.raw = raw;

    var lang = code.getAttribute('data-lang') || 'js';
    var showNumbers = box.getAttribute('data-numbers') !== 'off';
    var start = parseInt(box.getAttribute('data-start') || '1', 10);
    var html = lang === 'text' ? esc(raw) : highlight(raw);
    code.innerHTML = numberLines(html, showNumbers, start);
    if (!showNumbers) box.classList.add('snippet--plain');

    var acts = box.querySelector('.snippet__acts');
    if (!acts) return;

    /* Executar */
    if (box.hasAttribute('data-run')) {
      var run = document.createElement('button');
      run.className = 'sbtn sbtn--run';
      run.type = 'button';
      run.innerHTML = '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">' +
                      '<path d="M8 5v14l11-7z"/></svg> Executar';
      run.addEventListener('click', function () { execute(box, raw); });
      acts.appendChild(run);
    }

    /* Copiar */
    var cp = document.createElement('button');
    cp.className = 'sbtn';
    cp.type = 'button';
    cp.textContent = 'Copiar';
    cp.addEventListener('click', function () {
      var done = function () { cp.textContent = 'Copiado!'; setTimeout(function () { cp.textContent = 'Copiar'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(raw).then(done, fallback);
      } else fallback();
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = raw; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
    acts.appendChild(cp);
  });

  /* ---------------- Palco: mini-DOM isolado para os exemplos ---------------- */
  function makeStage(box) {
    var stage = box.querySelector('.stage__box');
    if (!stage) return null;
    if (stage.dataset.initial === undefined) stage.dataset.initial = stage.innerHTML;
    stage.innerHTML = stage.dataset.initial;

    var wrap = function (el) { return el; };
    return {
      querySelector: function (s) { return stage.querySelector(s); },
      querySelectorAll: function (s) { return stage.querySelectorAll(s); },
      getElementById: function (id) { return stage.querySelector('#' + id); },
      getElementsByClassName: function (c) { return stage.getElementsByClassName(c); },
      getElementsByTagName: function (t) { return stage.getElementsByTagName(t); },
      createElement: function (t) { return wrap(document.createElement(t)); },
      createTextNode: function (t) { return document.createTextNode(t); },
      createDocumentFragment: function () { return document.createDocumentFragment(); },
      addEventListener: function (t, f, o) { return stage.addEventListener(t, f, o); },
      removeEventListener: function (t, f, o) { return stage.removeEventListener(t, f, o); },
      body: stage,
      documentElement: stage,
      title: 'palco'
    };
  }

  function execute(box, src) {
    var panel = box.querySelector('.console');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'console';
      panel.innerHTML = '<div class="console__t">Console</div><div class="console__out"></div>';
      box.appendChild(panel);
    }
    var out = panel.querySelector('.console__out');
    out.innerHTML = '';
    panel.classList.add('is-open');

    var buffer = [];
    var push = function (cls, text) {
      var d = document.createElement('div');
      d.className = 'l' + (cls ? ' ' + cls : '');
      d.textContent = text;
      out.appendChild(d);
    };
    var sandboxConsole = {
      log: function () { push('', [].map.call(arguments, function (a) { return fmt(a); }).join(' ')); },
      error: function () { push('err', [].map.call(arguments, function (a) { return fmt(a); }).join(' ')); },
      warn: function () { push('', [].map.call(arguments, function (a) { return fmt(a); }).join(' ')); },
      info: function () { push('', [].map.call(arguments, function (a) { return fmt(a); }).join(' ')); }
    };
    var sandboxAlert = function (m) { push('', '[alert] ' + fmt(m)); };

    var stageDoc = makeStage(box);
    var assincrono = false;

    /* temporizadores com teto de segurança */
    var st = function (f, ms) {
      assincrono = true;
      return setTimeout(f, Math.min(Math.max(ms || 0, 0), 4000));
    };
    var si = function (f, ms) {
      assincrono = true;
      return setInterval(f, Math.max(ms || 0, 150));
    };

    /* fetch simulado: nenhuma requisição real sai da página */
    var ROTAS = {
      '/api/candidatos': [
        { id: 1, nome: 'Ana Maria', acertos: 18, semestres: 4 },
        { id: 2, nome: 'Bruno Lucas', acertos: 10, semestres: 5 },
        { id: 3, nome: 'Carla Moreira', acertos: 16, semestres: 2 }
      ],
      '/api/vagas': { total: 24, preenchidas: 3, periodo: '09:00 às 17:00' }
    };
    var fakeFetch = function (url) {
      assincrono = true;
      return new Promise(function (resolve) {
        setTimeout(function () {
          var dados = ROTAS[url];
          var ok = dados !== undefined;
          resolve({
            ok: ok,
            status: ok ? 200 : 404,
            url: url,
            json: function () { return Promise.resolve(ok ? dados : { erro: 'Rota não encontrada' }); },
            text: function () { return Promise.resolve(JSON.stringify(ok ? dados : { erro: 'Rota não encontrada' })); }
          });
        }, 420);
      });
    };

    /* Os exemplos do livro declaram variáveis sem var/let/const, o que cria
       globais implícitas. Sem limpeza, um exemplo contaminaria o seguinte —
       e demonstrações de ReferenceError deixariam de funcionar. */
    var antes = Object.getOwnPropertyNames(window);

    try {
      var fn = new Function('console', 'alert', 'document', 'setTimeout', 'setInterval',
        'clearInterval', 'clearTimeout', 'fetch', src + '\n');
      fn(sandboxConsole, sandboxAlert, stageDoc, st, si, clearInterval, clearTimeout, fakeFetch);
    } catch (err) {
      push('err', (err && err.name ? err.name + ': ' : 'Erro: ') + (err && err.message ? err.message : String(err)));
    } finally {
      var conhecidas = Object.create(null);
      for (var k = 0; k < antes.length; k++) conhecidas[antes[k]] = true;
      var depois = Object.getOwnPropertyNames(window);
      for (var j = 0; j < depois.length; j++) {
        if (!conhecidas[depois[j]]) { try { delete window[depois[j]]; } catch (e) {} }
      }
    }

    if (!out.children.length && !assincrono && !box.querySelector('.stage__box')) {
      push('empty', 'Nenhuma saída no console.');
    }
    return buffer;
  }

  /* erros lançados dentro de temporizadores/promises não passam pelo try acima */
  addEventListener('unhandledrejection', function (ev) {
    var open = document.querySelector('.console.is-open .console__out');
    if (!open) return;
    var d = document.createElement('div');
    d.className = 'l err';
    d.textContent = 'Promise rejeitada: ' + (ev.reason && ev.reason.message ? ev.reason.message : ev.reason);
    open.appendChild(d);
  });

  /* ---------------- Sumário lateral + scrollspy ---------------- */
  var toc = document.querySelector('.toc ol');
  if (toc) {
    var heads = [].slice.call(document.querySelectorAll('.doc h2[id]'));
    heads.forEach(function (h) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      var num = h.querySelector('.num');
      a.textContent = (h.textContent || '').replace(num ? num.textContent : '', '').trim();
      li.appendChild(a);
      toc.appendChild(li);
    });

    var links = [].slice.call(toc.querySelectorAll('a'));
    var spy = function () {
      var y = window.scrollY + 130, active = 0;
      heads.forEach(function (h, i) { if (h.offsetTop <= y) active = i; });
      links.forEach(function (a, i) { a.classList.toggle('is-active', i === active); });
    };
    addEventListener('scroll', spy, { passive: true });
    addEventListener('resize', spy);
    spy();
  }

  /* ---------------- Ano no rodapé ---------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
