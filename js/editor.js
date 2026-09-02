/* ============================================================
   Colmédica Presenta — Editor de slide (página dedicada)
   Layout tipo PowerPoint: Insertar (izq) · Slide (centro) ·
   Propiedades del elemento (der). Modo Visual (arrastrar/soltar)
   y modo Código. Solo el rol admin. Recibe ?slide=<id>.
   ============================================================ */

(() => {
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Sesión: solo admin ---------- */
  const ses = CMP.getSesion();
  if (!ses) { location.href = 'index.html'; return; }
  if (ses.id !== 'admin') { location.href = 'panel.html'; return; }
  const yo = CMP.ADMIN;

  /* ---------- Slide a editar ---------- */
  const slideId = new URLSearchParams(location.search).get('slide');
  const slideActual = CMP.SLIDES.find(s => s.id === slideId && CMP.SLIDE_HTML[s.id]);
  if (!slideActual) { location.href = 'admin.html'; return; }

  const toast = (msg) => {
    const t = $('#toast'); t.textContent = msg; t.classList.add('visible');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('visible'), 2600);
  };
  const hoyISO = () => new Date().toISOString().slice(0, 10);

  let guion = CMP.getGuion();
  let tabActual = 'deck';
  let modoActual = 'visual';
  const h0 = CMP.htmlDe(slideActual.id);
  let borrador = { deck: h0.deck, story: h0.story };

  $('#ed-nombre').textContent = slideActual.nombre;
  $('#ed-icono').textContent = slideActual.icon;

  /* ---------- Contexto de ejemplo ---------- */
  const asesorDemo = CMP.COMERCIALES[0];
  const planDemo = CMP.planById('zafiro');
  const clinicasDemo = CMP.CLINICAS.slice(0, 6);
  const CTX_DEMO = {
    cliente: 'Familia Ramírez', ciudad: 'Bogotá', fecha: CMP.fmtFecha(hoyISO()),
    plan_nombre: planDemo.nombre, plan_gama: planDemo.gama,
    asesor_nombre: asesorDemo.nombre, asesor_primer_nombre: asesorDemo.nombre.split(' ')[0],
    asesor_cargo: asesorDemo.cargo, asesor_celular: asesorDemo.cel, asesor_iniciales: asesorDemo.ini,
    whatsapp_link: '#', telefono_link: '#',
    grid_clinicas: clinicasDemo.map(c => `
      <div class="clinica-card anim"><img src="img/clinicas/${c.img}" alt="${c.nombre}"><div class="cnom">${c.nombre}<span>${c.ciudad}</span></div></div>`).join(''),
    grid_clinicas_movil: clinicasDemo.map(c => `
      <div class="h-clinica"><img src="img/clinicas/${c.img}" alt="${c.nombre}"><div class="n">${c.nombre}</div></div>`).join(''),
    viajes_texto: 'Cobertura de urgencias hasta por <b>USD/EUR 15.000</b> por usuario/viaje (hasta los 60 años), hasta 60 días continuos.',
    viajes_texto_movil: '<b>Viajes:</b> urgencias hasta USD/EUR 15.000',
  };
  const TOKENS_BLOQUE = ['grid_clinicas', 'grid_clinicas_movil', 'viajes_texto', 'viajes_texto_movil'];
  const FONDO_STORY = {
    elegir: 'img/flux/elegir-v.jpg', portafolio: 'img/flux/portafolio-v.jpg', red: 'img/flux/red-v.jpg',
    clinicas: 'img/flux/clinicas-v.jpg', app: 'img/flux/app-v.jpg', beneficios: 'img/flux/beneficios-v.jpg',
    testimonios: 'video/testimonio-erica.jpg', cierre: 'img/flux/cierre-v.jpg',
  };

  const GALERIA = [
    { sec: 'Arte vertical (fal.ai)', items: ['portada-v', 'elegir-v', 'portafolio-v', 'plan-v', 'red-v', 'clinicas-v', 'app-v', 'beneficios-v', 'testimonios-v', 'propuesta-v', 'cierre-v'].map(n => `img/flux/${n}.jpg`).concat(['img/flux/red-h.jpg', 'img/flux/propuesta-h.jpg']) },
    { sec: 'Fotos corporativas', items: ['image1.jpeg', 'image112.jpeg', 'image21.jpeg', 'image195.jpeg', 'image202.jpeg', 'image199.jpeg', 'image192.jpeg', 'image52.png', 'image83.jpg', 'image167.jpeg', 'image209.jpeg', 'image145.jpeg', 'image47.jpeg', 'image49.jpeg', 'image171.jpeg', 'image197.jpeg', 'image25.jpeg', 'hero-bg.jpg'].map(n => `img/ppt/${n}`) },
    { sec: 'Clínicas', items: CMP.CLINICAS.map(c => `img/clinicas/${c.img}`) },
  ];

  /* ============================================================
     PLANTILLAS DEL CANVAS
     ============================================================ */
  const CABECERA = `<meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/deck.css">
    <base href="${location.origin}${location.pathname.replace(/[^/]*$/, '')}">`;

  const SCRIPT_CONTADORES = `<script>
    document.querySelectorAll('[data-cuenta]').forEach(el => {
      el.childNodes[0].textContent = Number(el.dataset.cuenta).toLocaleString('es-CO');
    });
  <\/script>`;

  const ESTILO_EDITOR = `
    *{animation:none !important;transition:none !important}
    .h-scrim{pointer-events:none}
    [data-fijo]{pointer-events:none}
    .ed-sel{outline:2px solid #00d2ff !important;outline-offset:2px;cursor:move}
    .ed-edit{outline:2px solid #ffd34d !important;outline-offset:2px;cursor:text}
    .ed-tk{background:rgba(0,159,227,.28);outline:1px dashed rgba(120,215,255,.85);border-radius:.3em;padding:0 .12em}
    #ed-rz{position:fixed;display:none;width:16px;height:16px;z-index:9998;background:#00d2ff;border:2px solid #fff;border-radius:3px;cursor:nwse-resize;box-shadow:0 1px 4px rgba(0,0,0,.4)}
  `;

  function srcdocDeck(id, html, editor) {
    return `<!DOCTYPE html><html><head>${CABECERA}
      <style>body{overflow:hidden;margin:0}.deck-marco{width:100vw}${editor ? ESTILO_EDITOR : ''}</style></head>
      <body data-modo="desktop"><div class="deck-escenario"><div class="deck-marco">
        <section class="slide activo s-${id}">
          <div id="ed-root" style="display:contents">${html}</div>
          <div class="barra-roja" data-fijo></div>
          <div class="firma" data-fijo><img src="img/colmedica-logo-white.png" alt=""><span class="tag">te queremos<br>bien<b>.</b></span></div>
          <span class="vigilado" data-fijo>Vigilado Supersalud</span>
        </section>
      </div></div>${editor ? '' : SCRIPT_CONTADORES}</body></html>`;
  }

  function srcdocStory(id, html, editor) {
    return `<!DOCTYPE html><html><head>${CABECERA}
      <style>body{overflow:hidden;margin:0}.h-contenido{padding-bottom:1.6rem}${editor ? ESTILO_EDITOR : ''}</style></head>
      <body data-modo="movil"><div class="historias" style="display:block">
        <section class="panel-historia activo ph-${id}">
          <img class="h-fondo" src="${FONDO_STORY[id] || ''}" alt="">
          <div class="h-scrim"></div>
          <div class="h-contenido" id="ed-cont"><div id="ed-root" style="display:contents">${html}</div></div>
        </section>
      </div>${editor ? '' : SCRIPT_CONTADORES}</body></html>`;
  }

  /* ============================================================
     MOTOR VISUAL
     ============================================================ */
  const ev = { idoc: null, sel: null, editando: null, undo: [], drag: null, listo: false, redim: false };
  const canvas = () => $('#ev-canvas');
  const DECK = () => tabActual === 'deck';

  function expandirTokens(root) {
    const walker = ev.idoc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodos = [];
    while (walker.nextNode()) if (/\{\{\w+\}\}/.test(walker.currentNode.textContent)) nodos.push(walker.currentNode);
    nodos.forEach(nodo => {
      const partes = nodo.textContent.split(/(\{\{\w+\}\})/);
      const frag = ev.idoc.createDocumentFragment();
      partes.forEach(p => {
        const m = p.match(/^\{\{(\w+)\}\}$/);
        if (!m) { if (p) frag.appendChild(ev.idoc.createTextNode(p)); return; }
        const tk = m[1];
        if (TOKENS_BLOQUE.includes(tk)) {
          const div = ev.idoc.createElement('div');
          div.setAttribute('data-tkb', tk); div.setAttribute('contenteditable', 'false');
          div.style.display = 'contents'; div.innerHTML = CTX_DEMO[tk] || '';
          frag.appendChild(div);
        } else {
          const span = ev.idoc.createElement('span');
          span.setAttribute('data-tk', tk); span.setAttribute('contenteditable', 'false');
          span.className = 'ed-tk'; span.title = 'Variable: se reemplaza con el dato real de cada cliente';
          span.textContent = CTX_DEMO[tk] ?? tk;
          frag.appendChild(span);
        }
      });
      nodo.parentNode.replaceChild(frag, nodo);
    });
  }

  function contadoresEstaticos(root) {
    $$('[data-cuenta]', root).forEach(el => {
      if (el.childNodes[0] && el.childNodes[0].nodeType === 3) {
        el.childNodes[0].textContent = Number(el.dataset.cuenta).toLocaleString('es-CO');
      }
    });
  }

  function refW() { return canvas().getBoundingClientRect().width || 1; }
  const aFont = (px) => (px * 100 / refW()).toFixed(2) + 'cqi';
  function contRect(el) {
    const c = el.offsetParent || ev.idoc.querySelector(DECK() ? '.slide' : '.h-contenido') || ev.idoc.body;
    const r = c.getBoundingClientRect();
    return { w: r.width || 1, h: r.height || 1 };
  }
  const pct = (v) => parseFloat(v) || 0;
  const esLibre = (el) => el && el.dataset && el.dataset.libre === '1';

  const CONTENEDORES = '.cifra,.h-cifra,.gama-card,.benef-card,.feature,.h-item,.check,.asesor-chip,.video-marco,.telefono,.foto-panel,.clinica-card,.h-clinica';

  function elegirObjetivo(t) {
    const root = ev.idoc.getElementById('ed-root');
    if (t.classList && t.classList.contains('h-fondo')) return t;
    if (t.closest && t.closest('[data-libre]')) return t.closest('[data-libre]');
    if (!root || !root.contains(t)) return null;
    const chip = t.closest('[data-tk]');
    if (chip) return chip;
    if (t.closest('[data-tkb]')) return 'bloque';
    if (t.tagName === 'IMG') return t;
    let n = t;
    while (n && n !== root) {
      const directo = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
      if (directo || n.matches(CONTENEDORES)) return n;
      n = n.parentElement;
    }
    return null;
  }

  function snapshot() {
    const root = ev.idoc.getElementById('ed-root');
    ev.undo.push(root.innerHTML);
    if (ev.undo.length > 60) ev.undo.shift();
    $('#ev-deshacer').disabled = false;
  }

  function quitarHandle() { const h = ev.idoc && ev.idoc.getElementById('ed-rz'); if (h) h.style.display = 'none'; }

  function deseleccionar() {
    if (ev.editando) terminarEdicion();
    quitarHandle();
    if (ev.sel) ev.sel.classList.remove('ed-sel');
    ev.sel = null;
    cerrarVarMenu();
    pintarPanel();
  }

  function seleccionar(el) {
    deseleccionar();
    ev.sel = el;
    el.classList.add('ed-sel');
    ev.redim = (esLibre(el) || el.tagName === 'IMG') && !el.classList.contains('h-fondo') && !el.hasAttribute('data-tk');
    pintarPanel();
    posHandle();
  }

  function tipoDe(el) {
    if (el.classList.contains('h-fondo')) return 'fondo';
    if (el.hasAttribute('data-tk')) return 'chip';
    if (el.tagName === 'IMG') return 'img';
    if (el.dataset.forma === '1' || el.classList.contains('pill') || el.classList.contains('gama-card') || el.classList.contains('benef-card') || el.classList.contains('cifra')) return 'forma';
    return 'texto';
  }

  const NOMBRE_TIPO = { img: '🖼️ Imagen', texto: '🅣 Texto', forma: '▢ Forma', chip: '{ } Variable', fondo: '🌅 Fondo' };

  /* ---------- PANEL DERECHO DE PROPIEDADES ---------- */
  function pintarPanel() {
    const panel = $('#ed-panel');
    const el = ev.sel;
    if (!el) { pintarSinSeleccion(panel); return; }
    const tipo = tipoDe(el);
    let h = `<div class="ed-prop-tit">Propiedades</div><div class="ed-prop-tipo">${NOMBRE_TIPO[tipo] || 'Elemento'}</div>`;

    if (tipo === 'texto') {
      h += grupo('Formato', [
        `<button class="ed-pb" data-a="b" title="Negrita">B</button>`,
        `<button class="ed-pb" data-a="i" title="Cursiva" style="font-style:italic">I</button>`,
        `<button class="ed-pb" data-a="a-" title="Más pequeño">A−</button>`,
        `<button class="ed-pb" data-a="a+" title="Más grande">A＋</button>`,
        `<button class="ed-pb" data-a="ali" title="Alineación">⬌</button>`,
      ]);
      h += grupo('Color de texto', swatches([['#ffffff', 'blanco'], ['#8fd8ff', 'celeste'], ['#0058A2', 'azul'], ['#E30613', 'rojo'], ['#ffd34d', 'dorado']], 'col'));
      h += grupo('Datos del cliente', [`<button class="ed-pb ancho" data-a="var">{ } Insertar variable</button>`]);
    } else if (tipo === 'img') {
      h += grupo('Imagen', [
        `<button class="ed-pb ancho" data-a="img">🖼️ Cambiar imagen</button>`,
        `<button class="ed-pb ancho" data-a="rad">⬭ Redondear esquinas</button>`,
      ]);
    } else if (tipo === 'forma') {
      h += grupo('Color de fondo', swatches([['rgba(255,255,255,.08)', 'vidrio'], ['#0058A2', 'azul'], ['#009FE3', 'cian'], ['#E30613', 'rojo'], ['#032a52', 'navy']], 'bg'));
      h += grupo('Estilo', [`<button class="ed-pb ancho" data-a="rad">⬭ Redondear esquinas</button>`]);
    } else if (tipo === 'chip') {
      h += `<div class="ed-vacio"><span class="emoji">{ }</span>Esta es una <b>variable</b>: se reemplaza automáticamente con el dato real de cada cliente. Puedes moverla o eliminarla.</div>`;
    }

    if (tipo !== 'fondo') {
      h += grupo('Orden (capa)', [
        `<button class="ed-pb" data-a="front" title="Traer al frente">⤒ Frente</button>`,
        `<button class="ed-pb" data-a="back" title="Enviar atrás">⤓ Atrás</button>`,
      ]);
      const acc = [];
      if (esLibre(el)) acc.push(`<button class="ed-pb ancho" data-a="dup">⧉ Duplicar</button>`);
      acc.push(`<button class="ed-pb ancho" data-a="reset">⤾ Restablecer posición</button>`);
      acc.push(`<button class="ed-pb ancho rojo" data-a="del">🗑️ Eliminar</button>`);
      h += grupo('Acciones', acc);
    }
    panel.innerHTML = h;
  }

  function pintarSinSeleccion(panel) {
    let h = `<div class="ed-prop-tit">Propiedades</div>
      <div class="ed-vacio"><span class="emoji">👆</span>Haz clic en un elemento del slide para editarlo, o usa <b>Insertar</b> para agregar uno nuevo.</div>`;
    const hist = guion.historial[slideActual.id] || [];
    h += `<div class="ed-prop-grupo" style="margin-top:1.4rem"><div class="ed-prop-lbl">Historial de versiones</div>`;
    if (!hist.length) {
      h += `<div style="font-size:.82rem;color:var(--muted)">Aún no hay versiones editadas: está vigente la plantilla original.</div>`;
    } else {
      hist.slice().reverse().forEach((v, ri) => {
        const n = hist.length - ri;
        h += `<div class="ed-hist-item"><b>v${n + 1}</b><span>${CMP.fmtFecha(v.fecha)} · ${esc(v.autor)}</span><button class="btn btn-linea btn-xs" data-rest="${hist.length - 1 - ri}">Cargar</button></div>`;
      });
    }
    h += `</div>`;
    panel.innerHTML = h;
    $$('[data-rest]', panel).forEach(b => b.addEventListener('click', () => {
      const v = hist[Number(b.dataset.rest)];
      borrador = { deck: v.deck, story: v.story };
      renderModo();
      toast('Versión cargada: publica para restaurarla');
    }));
  }

  const grupo = (lbl, botones) => `<div class="ed-prop-grupo"><div class="ed-prop-lbl">${lbl}</div><div class="ed-prop-fila">${botones.join('')}</div></div>`;
  const swatches = (cols, a) => cols.map(([c, n]) => `<button class="ed-sw" data-a="${a}" data-c="${c}" title="${n}" style="background:${c}"></button>`);

  // delegación de clics del panel derecho
  $('#ed-panel').addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (b) accionToolbar(b.dataset.a, b);
  });

  function posHandle() {
    const rz = ev.idoc && ev.idoc.getElementById('ed-rz');
    if (!rz || !ev.sel) { if (rz) rz.style.display = 'none'; return; }
    if (!ev.redim) { rz.style.display = 'none'; return; }
    const r = ev.sel.getBoundingClientRect();
    rz.style.display = 'block';
    rz.style.left = (r.right - 8) + 'px';
    rz.style.top = (r.bottom - 8) + 'px';
  }

  function accionToolbar(a, boton) {
    const el = ev.sel;
    if (!el) return;
    if (a === 'del') { snapshot(); const p = el; deseleccionar(); p.remove(); return; }
    if (a === 'dup') {
      snapshot();
      const c = el.cloneNode(true); c.classList.remove('ed-sel');
      c.style.left = (pct(el.style.left) + 3) + '%'; c.style.top = (pct(el.style.top) + 3) + '%';
      el.parentElement.appendChild(c); seleccionar(c); return;
    }
    if (a === 'front') { snapshot(); el.style.zIndex = 20; return; }
    if (a === 'back') { snapshot(); el.style.zIndex = 1; return; }
    if (a === 'reset') { snapshot(); el.style.translate = ''; if (esLibre(el)) { el.style.left = '30%'; el.style.top = '35%'; } posHandle(); return; }
    if (a === 'img') { abrirGaleria(src => { snapshot(); el.src = src; posHandle(); }); return; }
    if (a === 'rad') { snapshot(); const act = pct(getComputedStyle(el).borderRadius); el.style.borderRadius = act > 0 ? '0' : '2cqi'; return; }
    if (a === 'var') { abrirVarMenu(boton); return; }
    snapshot();
    const cs = ev.idoc.defaultView.getComputedStyle(el);
    if (a === 'b') el.style.fontWeight = parseInt(cs.fontWeight) >= 700 ? '400' : '800';
    if (a === 'i') el.style.fontStyle = cs.fontStyle === 'italic' ? 'normal' : 'italic';
    if (a === 'a+' || a === 'a-') el.style.fontSize = aFont(parseFloat(cs.fontSize) * (a === 'a+' ? 1.12 : 0.9));
    if (a === 'ali') el.style.textAlign = cs.textAlign === 'center' ? 'left' : 'center';
    if (a === 'col') el.style.color = boton.dataset.c;
    if (a === 'bg') { el.style.background = boton.dataset.c; if (boton.dataset.c.startsWith('rgba')) el.style.backdropFilter = 'blur(6px)'; }
    posHandle();
  }

  /* ---------- menú de variables ---------- */
  function cerrarVarMenu() { const m = $('#ev-var-menu'); if (m) m.classList.remove('abierto'); }
  function abrirVarMenu(boton) {
    const m = $('#ev-var-menu'); m.innerHTML = '';
    CMP.TOKENS.filter(tk => !TOKENS_BLOQUE.includes(tk.t.replace(/[{}]/g, ''))).forEach(tk => {
      const b = document.createElement('button');
      b.innerHTML = `<span>{ }</span> ${tk.d}`;
      b.addEventListener('click', () => { insertarVariable(tk.t.replace(/[{}]/g, '')); cerrarVarMenu(); });
      m.appendChild(b);
    });
    const br = boton.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(br.left - 200, window.innerWidth - 260)) + 'px';
    m.style.top = (br.bottom + 6) + 'px';
    m.classList.add('abierto');
  }
  function insertarVariable(tk) {
    const el = ev.sel; if (!el) return;
    snapshot();
    const span = ev.idoc.createElement('span');
    span.setAttribute('data-tk', tk); span.setAttribute('contenteditable', 'false');
    span.className = 'ed-tk'; span.textContent = CTX_DEMO[tk] ?? tk;
    const sel = ev.idoc.getSelection();
    if (ev.editando === el && sel && sel.rangeCount && el.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0); range.deleteContents(); range.insertNode(span);
      range.setStartAfter(span); range.collapse(true); sel.removeAllRanges(); sel.addRange(range);
    } else { el.appendChild(ev.idoc.createTextNode(' ')); el.appendChild(span); }
  }
  document.addEventListener('click', (e) => { if (!e.target.closest('#ev-var-menu') && !e.target.closest('[data-a="var"]')) cerrarVarMenu(); });

  /* ---------- edición de texto ---------- */
  function empezarEdicion(el) {
    if (el.tagName === 'IMG' || el.hasAttribute('data-tk')) return;
    quitarHandle();
    snapshot();
    ev.editando = el;
    el.setAttribute('contenteditable', 'true');
    el.classList.add('ed-edit'); el.classList.remove('ed-sel');
    ev._antesEdicion = el.innerHTML; el.focus();
  }
  function terminarEdicion() {
    const el = ev.editando; if (!el) return;
    ev.editando = null;
    el.removeAttribute('contenteditable'); el.classList.remove('ed-edit');
    if (ev._antesEdicion === el.innerHTML) { ev.undo.pop(); $('#ev-deshacer').disabled = !ev.undo.length; }
    else {
      const cuenta = el.hasAttribute('data-cuenta') ? el : el.querySelector('[data-cuenta]');
      if (cuenta) { const n = parseInt(cuenta.textContent.replace(/\D/g, ''), 10); if (Number.isFinite(n)) cuenta.setAttribute('data-cuenta', String(n)); }
    }
  }

  /* ---------- eventos del canvas ---------- */
  function conectarCanvas() {
    const idoc = ev.idoc;
    idoc.addEventListener('click', (e) => { e.preventDefault(); }, true);

    idoc.addEventListener('mousedown', (e) => {
      if (e.target.id === 'ed-rz') {
        e.preventDefault();
        const el = ev.sel;
        ev.drag = { modo: 'resize', el, x0: e.clientX, y0: e.clientY, movio: false, w0: el.offsetWidth, h0: el.offsetHeight, cont: contRect(el), altura: tipoDe(el) === 'forma' };
        return;
      }
      if (ev.editando) {
        if (e.target === ev.editando || ev.editando.contains(e.target)) return;
        terminarEdicion();
      }
      cerrarVarMenu();
      const obj = elegirObjetivo(e.target);
      if (obj === 'bloque') { deseleccionar(); toast('Bloque dinámico (variable): edítalo en modo </> Código'); return; }
      if (!obj) { deseleccionar(); return; }
      if (obj !== ev.sel) seleccionar(obj);
      if (obj.classList.contains('h-fondo')) { e.preventDefault(); return; }
      if (esLibre(obj)) {
        ev.drag = { modo: 'move-libre', el: obj, x0: e.clientX, y0: e.clientY, movio: false, l0: pct(obj.style.left), t0: pct(obj.style.top), cont: contRect(obj) };
      } else {
        const t = (obj.style.translate || '').split(/\s+/); const w = refW();
        ev.drag = { modo: 'move-flujo', el: obj, x0: e.clientX, y0: e.clientY, movio: false, tx: (parseFloat(t[0]) || 0) * w / 100, ty: (parseFloat(t[1]) || 0) * w / 100 };
      }
      e.preventDefault();
    }, true);

    idoc.addEventListener('mousemove', (e) => {
      if (!ev.drag) return;
      const d = ev.drag;
      const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if (!d.movio && Math.hypot(dx, dy) < 4) return;
      if (!d.movio) { d.movio = true; snapshot(); }
      if (d.modo === 'resize') {
        d.el.style.width = Math.max(4, (d.w0 + dx) / d.cont.w * 100).toFixed(2) + '%';
        if (d.altura) d.el.style.height = Math.max(4, (d.h0 + dy) / d.cont.h * 100).toFixed(2) + '%';
      } else if (d.modo === 'move-libre') {
        d.el.style.left = (d.l0 + dx / d.cont.w * 100).toFixed(2) + '%';
        d.el.style.top = (d.t0 + dy / d.cont.h * 100).toFixed(2) + '%';
      } else {
        const w = refW();
        d.el.style.translate = `${((d.tx + dx) * 100 / w).toFixed(2)}cqi ${((d.ty + dy) * 100 / w).toFixed(2)}cqi`;
      }
      posHandle();
    }, true);

    idoc.addEventListener('mouseup', () => { ev.drag = null; }, true);
    idoc.addEventListener('dblclick', (e) => {
      e.preventDefault();
      const obj = elegirObjetivo(e.target);
      if (obj && obj !== 'bloque') { seleccionar(obj); empezarEdicion(obj); }
    }, true);
    idoc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); ev.editando ? terminarEdicion() : deseleccionar(); }
      if (e.key === 'Delete' && ev.sel && !ev.editando) { e.preventDefault(); accionToolbar('del'); }
    });
  }
  window.addEventListener('resize', posHandle);

  function montarCanvas() {
    ev.listo = false; ev.sel = null; ev.editando = null; ev.drag = null;
    const ifr = canvas();
    ifr.classList.toggle('movil', tabActual === 'story');
    ifr.classList.toggle('deck', tabActual === 'deck');
    ifr.onload = () => {
      ev.idoc = ifr.contentDocument;
      const root = ev.idoc.getElementById('ed-root');
      expandirTokens(root);
      if (tabActual === 'story') { const f = ev.idoc.querySelector('.h-fondo'); if (f) f.removeAttribute('data-fijo'); }
      contadoresEstaticos(ev.idoc);
      const rz = ev.idoc.createElement('div'); rz.id = 'ed-rz'; ev.idoc.body.appendChild(rz);
      conectarCanvas();
      ev.listo = true;
      pintarPanel();
    };
    ifr.srcdoc = DECK() ? srcdocDeck(slideActual.id, borrador.deck, true) : srcdocStory(slideActual.id, borrador.story, true);
    ev.undo = [];
    $('#ev-deshacer').disabled = true;
  }

  function serializarVisual() {
    if (!ev.idoc || !ev.listo) return borrador[tabActual];
    if (ev.editando) terminarEdicion();
    quitarHandle();
    const root = ev.idoc.getElementById('ed-root');
    const clon = root.cloneNode(true);
    $$('[data-tk]', clon).forEach(ch => ch.replaceWith(ev.idoc.createTextNode(`{{${ch.getAttribute('data-tk')}}}`)));
    $$('[data-tkb]', clon).forEach(bl => bl.replaceWith(ev.idoc.createTextNode(`{{${bl.getAttribute('data-tkb')}}}`)));
    $$('*', clon).forEach(n => {
      n.removeAttribute('contenteditable');
      n.classList.remove('ed-sel', 'ed-edit', 'ed-tk');
      if (!n.classList.length) n.removeAttribute('class');
      if (n.getAttribute('style') === '') n.removeAttribute('style');
    });
    return clon.innerHTML.trim();
  }

  /* ---------- paleta: crear elementos ---------- */
  function nuevoElemento(tipo) {
    if (!ev.listo) return;
    snapshot();
    const root = ev.idoc.getElementById('ed-root');
    const d = ev.idoc.createElement('div');
    d.dataset.libre = '1';
    const base = 'position:absolute;left:28%;top:34%;z-index:8;';
    if (tipo === 'titulo') { d.setAttribute('style', base + (DECK() ? 'font-size:5cqi;' : 'font-size:8vw;') + 'font-weight:800;color:#fff;max-width:60%;line-height:1.05;letter-spacing:-.02em'); d.textContent = 'Título nuevo'; }
    else if (tipo === 'subtitulo') { d.setAttribute('style', base + (DECK() ? 'font-size:2.6cqi;' : 'font-size:4.6vw;') + 'font-weight:700;color:#fff;max-width:55%'); d.textContent = 'Subtítulo'; }
    else if (tipo === 'parrafo') { d.setAttribute('style', base + (DECK() ? 'font-size:1.6cqi;' : 'font-size:3.4vw;') + 'font-weight:500;color:#dbe8f7;max-width:48%;line-height:1.5'); d.textContent = 'Escribe aquí un párrafo descriptivo para tu slide.'; }
    else if (tipo === 'pill') { d.className = 'pill'; d.dataset.forma = '1'; d.setAttribute('style', base + 'display:inline-flex;background:#E30613;color:#fff;font-weight:800;' + (DECK() ? 'font-size:1.35cqi;padding:.5cqi 1.8cqi;' : 'font-size:3vw;padding:.4em 1.1em;') + 'border-radius:999px;letter-spacing:.04em'); d.textContent = 'ETIQUETA'; }
    else if (tipo === 'tarjeta') { d.dataset.forma = '1'; d.setAttribute('style', base + 'width:32%;height:26%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:2cqi;backdrop-filter:blur(6px)'); }
    else if (tipo === 'cifra') {
      d.dataset.forma = '1';
      d.setAttribute('style', base + 'background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:1.6cqi;' + (DECK() ? 'padding:1.6cqi 2.4cqi;' : 'padding:3vw 4vw;') + 'backdrop-filter:blur(6px);color:#fff');
      d.innerHTML = DECK()
        ? '<div style="font-size:3.6cqi;font-weight:800;line-height:1">100<small style="font-size:1.7cqi">+</small></div><div style="font-size:1.15cqi;font-weight:600;opacity:.78;margin-top:.5cqi">tu etiqueta aquí</div>'
        : '<div style="font-size:7vw;font-weight:800;line-height:1">100<small style="font-size:3.5vw">+</small></div><div style="font-size:2.6vw;font-weight:600;opacity:.78;margin-top:1vw">tu etiqueta aquí</div>';
    }
    else if (tipo === 'icono') { d.setAttribute('style', base + (DECK() ? 'font-size:7cqi;' : 'font-size:14vw;') + 'line-height:1'); d.textContent = '⭐'; }
    root.appendChild(d);
    seleccionar(d);
    if (['titulo', 'subtitulo', 'parrafo', 'pill', 'icono'].includes(tipo)) empezarEdicion(d);
  }

  function nuevaImagen() {
    if (!ev.listo) return;
    abrirGaleria(src => {
      snapshot();
      const img = ev.idoc.createElement('img');
      img.src = src; img.dataset.libre = '1';
      img.setAttribute('style', 'position:absolute;left:30%;top:22%;width:34%;border-radius:1.6cqi;box-shadow:0 2cqi 5cqi rgba(0,0,0,.45);z-index:8;object-fit:cover');
      ev.idoc.getElementById('ed-root').appendChild(img);
      seleccionar(img);
    });
  }

  function nuevaVariable() {
    if (!ev.listo) return;
    snapshot();
    const d = ev.idoc.createElement('div');
    d.dataset.libre = '1';
    d.setAttribute('style', 'position:absolute;left:30%;top:38%;z-index:8;' + (DECK() ? 'font-size:2.4cqi;' : 'font-size:4.6vw;') + 'font-weight:700;color:#fff');
    const span = ev.idoc.createElement('span');
    span.setAttribute('data-tk', 'cliente'); span.setAttribute('contenteditable', 'false');
    span.className = 'ed-tk'; span.textContent = CTX_DEMO.cliente;
    d.appendChild(span);
    ev.idoc.getElementById('ed-root').appendChild(d);
    seleccionar(d);
  }

  $$('.ed-tool[data-el]').forEach(b => b.addEventListener('click', () => {
    if (modoActual !== 'visual') return;
    const el = b.dataset.el;
    if (el === 'imagen') nuevaImagen();
    else if (el === 'variable') nuevaVariable();
    else nuevoElemento(el);
  }));

  /* ---------- fondo / blanco / original ---------- */
  $('#ev-fondo').addEventListener('click', () => {
    if (!ev.listo) return;
    abrirGaleria(src => {
      snapshot();
      if (tabActual === 'story') { const f = ev.idoc.querySelector('.h-fondo'); if (f) f.src = src; toast('Fondo actualizado'); return; }
      let f = ev.idoc.querySelector('.foto-fondo');
      if (!f) {
        f = ev.idoc.createElement('img'); f.className = 'foto-fondo';
        f.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0');
        const root = ev.idoc.getElementById('ed-root'); root.insertBefore(f, root.firstChild);
      }
      f.src = src; toast('Fondo actualizado');
    });
  });

  $('#ev-blanco').addEventListener('click', () => {
    if (!ev.listo) return;
    if (!confirm('¿Vaciar este slide para rediseñarlo desde cero? Se conserva la marca inferior. Podrás deshacer.')) return;
    snapshot(); deseleccionar();
    ev.idoc.getElementById('ed-root').innerHTML = '';
    toast('Slide en blanco: agrega elementos desde el panel Insertar');
  });

  $('#ms-original').addEventListener('click', () => {
    if (!confirm('¿Reemplazar el contenido del editor con la plantilla original de este slide (desktop y móvil)?')) return;
    borrador = { deck: CMP.SLIDE_HTML[slideActual.id].deck, story: CMP.SLIDE_HTML[slideActual.id].story };
    renderModo();
    toast('Plantilla original cargada: publica para restaurarla');
  });

  $('#ev-deshacer').addEventListener('click', () => {
    if (!ev.undo.length || !ev.listo) return;
    deseleccionar();
    ev.idoc.getElementById('ed-root').innerHTML = ev.undo.pop();
    $('#ev-deshacer').disabled = !ev.undo.length;
  });

  /* ---------- galería ---------- */
  let galeriaCb = null;
  function abrirGaleria(cb) {
    galeriaCb = cb;
    const grid = $('#galeria-grid');
    if (!grid.childElementCount) {
      GALERIA.forEach(g => {
        const sec = document.createElement('div'); sec.className = 'galeria-sec'; sec.textContent = g.sec; grid.appendChild(sec);
        g.items.forEach(src => {
          const b = document.createElement('button'); b.className = 'galeria-item';
          b.innerHTML = `<img src="${src}" loading="lazy" alt="">`;
          b.addEventListener('click', () => { $('#modal-galeria').classList.remove('abierto'); if (galeriaCb) galeriaCb(src); galeriaCb = null; });
          grid.appendChild(b);
        });
      });
    }
    $('#modal-galeria').classList.add('abierto');
  }
  $('[data-cerrar-galeria]').addEventListener('click', () => $('#modal-galeria').classList.remove('abierto'));
  $('#modal-galeria').addEventListener('click', (e) => { if (e.target === $('#modal-galeria')) $('#modal-galeria').classList.remove('abierto'); });

  /* ============================================================
     MODO CÓDIGO
     ============================================================ */
  const codigo = $('#ms-codigo');
  function pintarPrevia() {
    const id = slideActual.id;
    if (tabActual === 'deck') $('#ms-previa-deck').srcdoc = srcdocDeck(id, CMP.renderHtml(borrador.deck, CTX_DEMO), false);
    else $('#ms-previa-story').srcdoc = srcdocStory(id, CMP.renderHtml(borrador.story, CTX_DEMO), false);
  }
  codigo.addEventListener('input', () => { borrador[tabActual] = codigo.value; clearTimeout(codigo._t); codigo._t = setTimeout(pintarPrevia, 350); });
  function pintarTokens() {
    const cont = $('#ms-tokens'); cont.innerHTML = '';
    CMP.TOKENS.forEach(tk => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'token-chip'; b.title = tk.d; b.textContent = tk.t;
      b.addEventListener('click', () => { const i = codigo.selectionStart, f = codigo.selectionEnd; codigo.setRangeText(tk.t, i, f, 'end'); codigo.focus(); borrador[tabActual] = codigo.value; pintarPrevia(); });
      cont.appendChild(b);
    });
  }

  /* ============================================================
     ORQUESTACIÓN
     ============================================================ */
  function commitActual() {
    if (modoActual === 'visual') borrador[tabActual] = serializarVisual();
    else borrador[tabActual] = codigo.value;
  }

  function renderModo() {
    $$('.modo-btn').forEach(b => b.classList.toggle('activo', b.dataset.modo === modoActual));
    $$('.tab-btn[data-tab]').forEach(b => b.classList.toggle('activo', b.dataset.tab === tabActual));
    $('.ed-page').dataset.modoEditor = modoActual;
    $('#ed-visual').style.display = modoActual === 'visual' ? 'grid' : 'none';
    $('#ed-codigo').style.display = modoActual === 'codigo' ? 'grid' : 'none';
    if (modoActual === 'visual') {
      montarCanvas();
    } else {
      $('#ms-tab-nombre').textContent = tabActual === 'deck' ? '· versión desktop (16:9)' : '· versión móvil (9:16)';
      codigo.value = borrador[tabActual];
      $('#ms-previa-deck').style.display = tabActual === 'deck' ? 'block' : 'none';
      $('#ms-previa-story').style.display = tabActual === 'story' ? 'block' : 'none';
      pintarPrevia();
    }
  }

  $$('.tab-btn[data-tab]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.tab === tabActual) return;
    commitActual(); tabActual = b.dataset.tab; renderModo();
  }));
  $$('.modo-btn').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.modo === modoActual) return;
    commitActual(); modoActual = b.dataset.modo; renderModo();
  }));

  $('#ms-guardar').addEventListener('click', () => {
    commitActual();
    if (!borrador.deck.trim() || !borrador.story.trim()) { toast('Ninguna de las dos versiones puede quedar vacía'); return; }
    const id = slideActual.id;
    guion.historial[id] = guion.historial[id] || [];
    guion.historial[id].push({ fecha: hoyISO(), autor: yo.nombre, deck: borrador.deck, story: borrador.story });
    guion.html[id] = { deck: borrador.deck, story: borrador.story };
    CMP.saveGuion(guion);
    location.href = 'admin.html?ok=' + encodeURIComponent(slideActual.nombre);
  });

  /* ---------- Inicio ---------- */
  pintarTokens();
  renderModo();
})();
