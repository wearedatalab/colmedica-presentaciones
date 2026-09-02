/* ============================================================
   Colmédica Presenta — administración del guion corporativo
   Editor de slides con dos modos:
   · 🎨 Visual (tipo Canva): clic selecciona, doble clic edita el
     texto en el lugar, arrastrar mueve, galería de imágenes,
     agregar texto/imagen, deshacer. Las variables {{token}} se
     protegen como chips y los bloques dinámicos quedan sellados.
   · </> Código: HTML completo con variables y vista previa.
   Ambos modos guardan en el mismo historial de versiones.
   Solo el rol admin puede entrar aquí.
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

  $('#u-nombre').textContent = yo.nombre;
  $('#u-cargo').textContent = yo.cargo;
  $('#u-avatar').style.background = yo.color;
  $('#btn-salir').addEventListener('click', () => { CMP.cerrarSesion(); location.href = 'index.html'; });

  const toast = (msg) => {
    const t = $('#toast'); t.textContent = msg; t.classList.add('visible');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('visible'), 2600);
  };
  const hoyISO = () => new Date().toISOString().slice(0, 10);

  let guion = CMP.getGuion();
  let slideActual = null;
  let tabActual = 'deck';      // deck | story
  let modoActual = 'visual';   // visual | codigo
  let borrador = { deck: '', story: '' };

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

  /* ---------- Galería de imágenes del proyecto ---------- */
  const GALERIA = [
    { sec: 'Arte vertical (fal.ai)', items: ['portada-v', 'elegir-v', 'portafolio-v', 'plan-v', 'red-v', 'clinicas-v', 'app-v', 'beneficios-v', 'testimonios-v', 'propuesta-v', 'cierre-v'].map(n => `img/flux/${n}.jpg`).concat(['img/flux/red-h.jpg', 'img/flux/propuesta-h.jpg']) },
    { sec: 'Fotos corporativas', items: ['image1.jpeg', 'image112.jpeg', 'image21.jpeg', 'image195.jpeg', 'image202.jpeg', 'image199.jpeg', 'image192.jpeg', 'image52.png', 'image83.jpg', 'image167.jpeg', 'image209.jpeg', 'image145.jpeg', 'image47.jpeg', 'image49.jpeg', 'image171.jpeg', 'image197.jpeg', 'image25.jpeg', 'hero-bg.jpg'].map(n => `img/ppt/${n}`) },
    { sec: 'Clínicas', items: CMP.CLINICAS.map(c => `img/clinicas/${c.img}`) },
  ];

  /* ============================================================
     KPIs y lista de slides
     ============================================================ */
  function pintarKpis() {
    const activos = CMP.guionActual().length;
    const editados = Object.keys(guion.html || {}).length;
    const versiones = Object.values(guion.historial || {}).reduce((s, h) => s + h.length, 0);
    const pres = CMP.getPresentaciones().length;
    $('#kpis-admin').innerHTML = `
      <div class="kpi acento"><div class="icono">🎞️</div><div class="valor">${activos}</div><div class="etiqueta">Slides en el guion vigente</div></div>
      <div class="kpi"><div class="icono">🎨</div><div class="valor">${editados}</div><div class="etiqueta">Slides con versión editada</div></div>
      <div class="kpi"><div class="icono">🗂️</div><div class="valor">${versiones}</div><div class="etiqueta">Versiones publicadas</div></div>
      <div class="kpi"><div class="icono">📤</div><div class="valor">${pres}</div><div class="etiqueta">Presentaciones de comerciales</div></div>`;
  }

  function versionDe(id) {
    const h = guion.historial[id] || [];
    return h.length ? `v${h.length + 1} · ${CMP.fmtFecha(h[h.length - 1].fecha)}` : 'v1 · original';
  }

  function pintarSlides() {
    const cont = $('#admin-slides'); cont.innerHTML = '';
    CMP.SLIDES.forEach(s => {
      const editable = !!CMP.SLIDE_HTML[s.id];
      const activo = s.tipo !== 'opcional' || guion.activos[s.id];
      const fila = document.createElement('div');
      fila.className = 'slide-item' + (activo ? '' : ' apagado');
      const etq = s.tipo === 'fijo' ? '<span class="etq etq-fijo">Estándar</span>'
        : s.tipo === 'opcional' ? '<span class="etq etq-opcional">Opcional del guion</span>'
        : s.tipo === 'libre' ? '<span class="etq etq-editable">Libre uso del comercial</span>'
        : '<span class="etq etq-fijo">Se arma con datos del cliente</span>';
      const version = editable ? `<span style="font-size:.72rem;color:var(--muted);font-weight:700;white-space:nowrap">${versionDe(s.id)}</span>` : '';
      const acciones = editable ? `<button class="btn btn-linea btn-xs" data-editar>🎨 Editar slide</button>` : '';
      const control = s.tipo === 'opcional'
        ? `<label class="switch" title="Incluir en el guion"><input type="checkbox" ${activo ? 'checked' : ''}><span class="pista"></span><span class="bola"></span></label>`
        : `<span class="candado" title="Siempre en el guion">🔒</span>`;
      fila.innerHTML = `
        <span class="icono">${s.icon}</span>
        <div class="textos"><div class="n">${s.nombre} ${etq}</div><div class="d">${s.desc}</div></div>
        ${version}
        ${acciones}
        ${control}`;
      if (s.tipo === 'opcional') {
        $('input[type=checkbox]', fila).addEventListener('change', (e) => {
          guion.activos[s.id] = e.target.checked;
          CMP.saveGuion(guion);
          fila.classList.toggle('apagado', !e.target.checked);
          pintarKpis();
          toast(e.target.checked ? `«${s.nombre}» entra al guion` : `«${s.nombre}» sale del guion`);
        });
      }
      const btnE = $('[data-editar]', fila);
      if (btnE) btnE.addEventListener('click', () => abrirEditor(s));
      cont.appendChild(fila);
    });
  }

  /* ============================================================
     PLANTILLAS DEL CANVAS / PREVIEW
     ============================================================ */
  const CABECERA = `<meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/deck.css">
    <base href="${location.origin}${location.pathname.replace(/admin\.html.*$/, '')}">`;

  const SCRIPT_CONTADORES = `<script>
    document.querySelectorAll('[data-cuenta]').forEach(el => {
      el.childNodes[0].textContent = Number(el.dataset.cuenta).toLocaleString('es-CO');
    });
  <\/script>`;

  function srcdocDeck(id, html, editor) {
    return `<!DOCTYPE html><html><head>${CABECERA}
      <style>body{overflow:hidden}.deck-marco{width:100vw}${editor ? ESTILO_EDITOR : ''}</style></head>
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
      <style>body{overflow:hidden}.h-contenido{padding-bottom:1.6rem}${editor ? ESTILO_EDITOR : ''}</style></head>
      <body data-modo="movil"><div class="historias" style="display:block">
        <section class="panel-historia activo ph-${id}">
          <img class="h-fondo" src="${FONDO_STORY[id] || ''}" alt="">
          <div class="h-scrim"></div>
          <div class="h-contenido" id="ed-cont"><div id="ed-root" style="display:contents">${html}</div></div>
        </section>
      </div>${editor ? '' : SCRIPT_CONTADORES}</body></html>`;
  }

  /* ============================================================
     EDITOR VISUAL
     ============================================================ */
  const ESTILO_EDITOR = `
    *{animation:none !important;transition:none !important}
    .h-scrim{pointer-events:none}
    [data-fijo]{pointer-events:none}
    .ed-sel{outline:2px solid #00d2ff !important;outline-offset:2px;cursor:move}
    .ed-edit{outline:2px solid #ffd34d !important;outline-offset:2px;cursor:text}
    .ed-tk{background:rgba(0,159,227,.28);outline:1px dashed rgba(120,215,255,.85);border-radius:.3em;padding:0 .12em}
    #ed-tb{
      position:absolute;z-index:9999;display:none;align-items:center;gap:4px;
      background:#0e1a2b;border:1px solid rgba(255,255,255,.25);border-radius:12px;
      padding:6px 8px;box-shadow:0 12px 30px rgba(0,0,0,.5);
      font-family:'Red Hat Display',system-ui,sans-serif;
    }
    #ed-tb button{
      border:none;background:rgba(255,255,255,.08);color:#fff;border-radius:8px;
      min-width:30px;height:30px;font-size:14px;font-weight:800;cursor:pointer;padding:0 7px;
      font-family:inherit;
    }
    #ed-tb button:hover{background:rgba(0,159,227,.5)}
    #ed-tb .sw{width:18px;height:18px;min-width:18px;border-radius:50%;border:2px solid rgba(255,255,255,.5);padding:0}
  `;

  const ev = {
    idoc: null, sel: null, editando: null,
    undo: [], drag: null, listo: false,
  };

  const canvas = () => $('#ev-canvas');

  /* --- expansión de tokens a chips / bloques dentro del canvas --- */
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
          div.setAttribute('data-tkb', tk);
          div.setAttribute('contenteditable', 'false');
          div.style.display = 'contents';
          div.innerHTML = CTX_DEMO[tk] || '';
          frag.appendChild(div);
        } else {
          const span = ev.idoc.createElement('span');
          span.setAttribute('data-tk', tk);
          span.setAttribute('contenteditable', 'false');
          span.className = 'ed-tk';
          span.title = 'Variable: se reemplaza con el dato real de cada cliente';
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

  /* --- unidades que escalan con el slide: cqi en deck, vw/vh en historias.
     Se miden contra el contenedor real (documentElement da 0 en el iframe). --- */
  function refRect() {
    // el tamaño visual del iframe = el viewport interno (100vw/100cqi), medido
    // desde el documento padre porque dentro del iframe reporta 0
    const r = canvas().getBoundingClientRect();
    return { w: r.width || 1, h: r.height || 1 };
  }
  function aUnidadX(px) {
    const { w } = refRect();
    return (px * 100 / w).toFixed(2) + (tabActual === 'deck' ? 'cqi' : 'vw');
  }
  function aUnidadY(px) {
    const { w, h } = refRect();
    return tabActual === 'deck' ? (px * 100 / w).toFixed(2) + 'cqi' : (px * 100 / h).toFixed(2) + 'vh';
  }
  const uAPx = (valor) => {
    if (!valor) return 0;
    const { w, h } = refRect();
    const n = parseFloat(valor);
    if (valor.endsWith('cqi') || valor.endsWith('vw')) return n * w / 100;
    if (valor.endsWith('vh')) return n * h / 100;
    return n;
  };

  /* --- selección ---- */
  const CONTENEDORES = '.cifra,.h-cifra,.gama-card,.benef-card,.feature,.h-item,.check,.asesor-chip,.video-marco,.telefono,.foto-panel,.clinica-card,.h-clinica';

  function elegirObjetivo(t) {
    const root = ev.idoc.getElementById('ed-root');
    if (!root || !root.contains(t)) {
      // fondo de historia: es hermano del contenido
      if (t.tagName === 'IMG' && t.classList.contains('h-fondo')) return t;
      return null;
    }
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
    if (ev.undo.length > 40) ev.undo.shift();
    $('#ev-deshacer').disabled = false;
  }

  function deseleccionar() {
    if (ev.editando) terminarEdicion();
    if (ev.sel) ev.sel.classList.remove('ed-sel');
    ev.sel = null;
    const tb = ev.idoc.getElementById('ed-tb');
    if (tb) tb.style.display = 'none';
  }

  function seleccionar(el) {
    deseleccionar();
    ev.sel = el;
    el.classList.add('ed-sel');
    pintarToolbar();
  }

  function pintarToolbar() {
    const tb = ev.idoc.getElementById('ed-tb');
    const el = ev.sel;
    if (!tb || !el) return;
    const esImg = el.tagName === 'IMG';
    const esChip = el.hasAttribute('data-tk');
    const esFondo = esImg && el.classList.contains('h-fondo');
    let html = '';
    if (esImg) {
      html += `<button data-a="img" title="Cambiar imagen">🖼️</button>`;
    } else if (!esChip) {
      html += `<button data-a="b" title="Negrita">B</button>`;
      html += `<button data-a="i" title="Cursiva" style="font-style:italic">I</button>`;
      html += `<button data-a="a-" title="Texto más pequeño">A−</button>`;
      html += `<button data-a="a+" title="Texto más grande">A＋</button>`;
      [['#ffffff', 'blanco'], ['#8fd8ff', 'celeste'], ['#E30613', 'rojo'], ['#ffd34d', 'dorado']].forEach(([c, n]) => {
        html += `<button class="sw" data-a="col" data-c="${c}" title="${n}" style="background:${c}"></button>`;
      });
    }
    if (!esFondo) html += `<button data-a="reset" title="Devolver a su posición">⤾</button>`;
    if (!esFondo) html += `<button data-a="del" title="Eliminar">🗑️</button>`;
    tb.innerHTML = html;
    tb.style.display = 'flex';
    const r = el.getBoundingClientRect();
    const tbAlto = 44;
    let top = r.top - tbAlto - 6;
    if (top < 4) top = r.bottom + 6;
    tb.style.top = Math.min(top, ev.idoc.documentElement.clientHeight - tbAlto) + 'px';
    tb.style.left = Math.max(4, Math.min(r.left, ev.idoc.documentElement.clientWidth - 330)) + 'px';
  }

  function accionToolbar(a, boton) {
    const el = ev.sel;
    if (!el) return;
    if (a === 'del') { snapshot(); deseleccionar(); el.remove(); return; }
    if (a === 'reset') { snapshot(); el.style.translate = ''; pintarToolbar(); return; }
    if (a === 'img') {
      abrirGaleria(src => { snapshot(); el.src = src; });
      return;
    }
    snapshot();
    const cs = ev.idoc.defaultView.getComputedStyle(el);
    if (a === 'b') el.style.fontWeight = parseInt(cs.fontWeight) >= 700 ? '400' : '800';
    if (a === 'i') el.style.fontStyle = cs.fontStyle === 'italic' ? 'normal' : 'italic';
    if (a === 'a+' || a === 'a-') {
      const px = parseFloat(cs.fontSize) * (a === 'a+' ? 1.12 : 0.9);
      el.style.fontSize = aUnidadX(px);
    }
    if (a === 'col') el.style.color = boton.dataset.c;
  }

  /* --- edición de texto en el lugar --- */
  function empezarEdicion(el) {
    if (el.tagName === 'IMG' || el.hasAttribute('data-tk')) return;
    snapshot(); // el estado previo queda registrado para deshacer
    ev.editando = el;
    el.setAttribute('contenteditable', 'true');
    el.classList.add('ed-edit');
    el.classList.remove('ed-sel');
    ev._antesEdicion = el.innerHTML;
    el.focus();
  }

  function terminarEdicion() {
    const el = ev.editando;
    if (!el) return;
    ev.editando = null;
    el.removeAttribute('contenteditable');
    el.classList.remove('ed-edit');
    if (ev._antesEdicion === el.innerHTML) {
      // no cambió nada: descartar el snapshot de la edición
      ev.undo.pop();
      $('#ev-deshacer').disabled = !ev.undo.length;
    } else {
      // si editó una cifra animada, sincronizar el número objetivo
      const cuenta = el.hasAttribute('data-cuenta') ? el : el.querySelector('[data-cuenta]');
      if (cuenta) {
        const n = parseInt(cuenta.textContent.replace(/\D/g, ''), 10);
        if (Number.isFinite(n)) cuenta.setAttribute('data-cuenta', String(n));
      }
    }
  }

  /* --- eventos del canvas --- */
  function conectarCanvas() {
    const idoc = ev.idoc;

    idoc.addEventListener('click', (e) => {
      if (e.target.closest('#ed-tb')) return;
      e.preventDefault();
    }, true);

    idoc.addEventListener('mousedown', (e) => {
      const tb = e.target.closest('#ed-tb');
      if (tb) {
        const b = e.target.closest('button');
        if (b) { e.preventDefault(); accionToolbar(b.dataset.a, b); }
        return;
      }
      if (ev.editando) {
        if (e.target === ev.editando || ev.editando.contains(e.target)) return; // seguir editando
        terminarEdicion();
      }
      const obj = elegirObjetivo(e.target);
      if (obj === 'bloque') { deseleccionar(); toast('Este bloque es dinámico (variable): edítalo en modo </> Código'); return; }
      if (!obj) { deseleccionar(); return; }
      if (obj !== ev.sel) seleccionar(obj);
      // preparar arrastre
      if (!obj.classList.contains('h-fondo')) {
        const t = (obj.style.translate || '').split(/\s+/);
        ev.drag = {
          el: obj, x0: e.clientX, y0: e.clientY, movio: false,
          tx: uAPx(t[0] || '', false), ty: uAPx(t[1] || '', true),
        };
      }
      e.preventDefault();
    }, true);

    idoc.addEventListener('mousemove', (e) => {
      if (!ev.drag) return;
      const dx = e.clientX - ev.drag.x0;
      const dy = e.clientY - ev.drag.y0;
      if (!ev.drag.movio && Math.hypot(dx, dy) < 4) return;
      if (!ev.drag.movio) { ev.drag.movio = true; snapshot(); }
      ev.drag.el.style.translate = `${aUnidadX(ev.drag.tx + dx)} ${aUnidadY(ev.drag.ty + dy)}`;
      pintarToolbar();
    }, true);

    idoc.addEventListener('mouseup', () => { ev.drag = null; }, true);

    idoc.addEventListener('dblclick', (e) => {
      if (e.target.closest('#ed-tb')) return;
      e.preventDefault();
      const obj = elegirObjetivo(e.target);
      if (obj && obj !== 'bloque') { seleccionar(obj); empezarEdicion(obj); }
    }, true);

    idoc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); ev.editando ? terminarEdicion() : deseleccionar(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && ev.sel && !ev.editando) {
        e.preventDefault(); accionToolbar('del');
      }
    });
  }

  function montarCanvas() {
    ev.listo = false; ev.sel = null; ev.editando = null; ev.drag = null;
    const ifr = canvas();
    ifr.classList.toggle('movil', tabActual === 'story');
    ifr.onload = () => {
      ev.idoc = ifr.contentDocument;
      const root = ev.idoc.getElementById('ed-root');
      expandirTokens(root);
      if (tabActual === 'story') {
        const fondo = ev.idoc.querySelector('.h-fondo');
        if (fondo) fondo.removeAttribute('data-fijo');
      }
      contadoresEstaticos(ev.idoc);
      const tb = ev.idoc.createElement('div');
      tb.id = 'ed-tb';
      ev.idoc.body.appendChild(tb);
      conectarCanvas();
      ev.listo = true;
    };
    const html = borrador[tabActual];
    ifr.srcdoc = tabActual === 'deck' ? srcdocDeck(slideActual.id, html, true) : srcdocStory(slideActual.id, html, true);
    ev.undo = [];
    $('#ev-deshacer').disabled = true;
  }

  /* --- serialización: canvas → HTML con {{tokens}} --- */
  function serializarVisual() {
    if (!ev.idoc || !ev.listo) return borrador[tabActual];
    if (ev.editando) terminarEdicion();
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
    const tbi = clon.querySelector('#ed-tb'); if (tbi) tbi.remove();
    return clon.innerHTML.trim();
  }

  /* --- agregar elementos --- */
  $('#ev-add-texto').addEventListener('click', () => {
    if (!ev.listo) return;
    snapshot();
    const root = ev.idoc.getElementById('ed-root');
    const div = ev.idoc.createElement('div');
    if (tabActual === 'deck') {
      div.setAttribute('style', 'position:absolute;left:34cqi;top:24cqi;font-size:2.4cqi;font-weight:700;max-width:44cqi;z-index:6');
    } else {
      div.setAttribute('style', 'position:absolute;left:8vw;top:20vh;font-size:1.05rem;font-weight:700;max-width:80vw;z-index:6');
    }
    div.textContent = 'Escribe aquí tu texto…';
    root.appendChild(div);
    seleccionar(div);
    empezarEdicion(div);
  });

  $('#ev-add-imagen').addEventListener('click', () => {
    if (!ev.listo) return;
    abrirGaleria(src => {
      snapshot();
      const root = ev.idoc.getElementById('ed-root');
      const img = ev.idoc.createElement('img');
      img.src = src;
      img.setAttribute('style', tabActual === 'deck'
        ? 'position:absolute;left:36cqi;top:16cqi;width:26cqi;border-radius:1.6cqi;box-shadow:0 2cqi 5cqi rgba(0,0,0,.45);z-index:6'
        : 'position:absolute;left:25vw;top:16vh;width:50vw;border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,.45);z-index:6');
      root.appendChild(img);
      seleccionar(img);
    });
  });

  $('#ev-deshacer').addEventListener('click', () => {
    if (!ev.undo.length || !ev.listo) return;
    deseleccionar();
    const root = ev.idoc.getElementById('ed-root');
    root.innerHTML = ev.undo.pop();
    $('#ev-deshacer').disabled = !ev.undo.length;
  });

  /* --- galería --- */
  let galeriaCb = null;
  function abrirGaleria(cb) {
    galeriaCb = cb;
    const grid = $('#galeria-grid');
    if (!grid.childElementCount) {
      GALERIA.forEach(g => {
        const sec = document.createElement('div');
        sec.className = 'galeria-sec'; sec.textContent = g.sec;
        grid.appendChild(sec);
        g.items.forEach(src => {
          const b = document.createElement('button');
          b.className = 'galeria-item';
          b.innerHTML = `<img src="${src}" loading="lazy" alt="">`;
          b.addEventListener('click', () => {
            $('#modal-galeria').classList.remove('abierto');
            if (galeriaCb) galeriaCb(src);
            galeriaCb = null;
          });
          grid.appendChild(b);
        });
      });
    }
    $('#modal-galeria').classList.add('abierto');
  }
  $('[data-cerrar-galeria]').addEventListener('click', () => $('#modal-galeria').classList.remove('abierto'));
  $('#modal-galeria').addEventListener('click', (e) => { if (e.target === $('#modal-galeria')) $('#modal-galeria').classList.remove('abierto'); });

  /* ============================================================
     MODO CÓDIGO (vista previa + tokens)
     ============================================================ */
  const codigo = $('#ms-codigo');

  function pintarPrevia() {
    if (!slideActual) return;
    const id = slideActual.id;
    if (tabActual === 'deck') {
      $('#ms-previa-deck').srcdoc = srcdocDeck(id, CMP.renderHtml(borrador.deck, CTX_DEMO), false);
    } else {
      $('#ms-previa-story').srcdoc = srcdocStory(id, CMP.renderHtml(borrador.story, CTX_DEMO), false);
    }
  }

  codigo.addEventListener('input', () => {
    borrador[tabActual] = codigo.value;
    clearTimeout(codigo._t);
    codigo._t = setTimeout(pintarPrevia, 350);
  });

  function pintarTokens() {
    const cont = $('#ms-tokens'); cont.innerHTML = '';
    CMP.TOKENS.forEach(tk => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'token-chip';
      b.title = tk.d;
      b.textContent = tk.t;
      b.addEventListener('click', () => {
        const ini = codigo.selectionStart, fin = codigo.selectionEnd;
        codigo.setRangeText(tk.t, ini, fin, 'end');
        codigo.focus();
        borrador[tabActual] = codigo.value;
        pintarPrevia();
      });
      cont.appendChild(b);
    });
  }

  /* ============================================================
     ORQUESTACIÓN DEL EDITOR
     ============================================================ */
  const modal = $('#modal-slide');

  function commitActual() {
    if (!slideActual) return;
    if (modoActual === 'visual') borrador[tabActual] = serializarVisual();
    else borrador[tabActual] = codigo.value;
  }

  function renderModo() {
    $$('.modo-btn').forEach(b => b.classList.toggle('activo', b.dataset.modo === modoActual));
    $$('.tab-btn[data-tab]').forEach(b => b.classList.toggle('activo', b.dataset.tab === tabActual));
    $('#modo-visual').style.display = modoActual === 'visual' ? 'block' : 'none';
    $('#modo-codigo').style.display = modoActual === 'codigo' ? 'block' : 'none';
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
    commitActual();
    tabActual = b.dataset.tab;
    renderModo();
  }));

  $$('.modo-btn').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.modo === modoActual) return;
    commitActual();
    modoActual = b.dataset.modo;
    renderModo();
  }));

  function abrirEditor(s) {
    slideActual = s;
    const h = CMP.htmlDe(s.id);
    borrador = { deck: h.deck, story: h.story };
    tabActual = 'deck';
    modoActual = 'visual';
    $('#ms-titulo').textContent = `${s.icon} ${s.nombre}`;
    pintarTokens();
    pintarHistorial();
    renderModo();
    modal.classList.add('abierto');
  }

  $('#ms-original').addEventListener('click', () => {
    if (!slideActual) return;
    if (!confirm('¿Reemplazar el contenido del editor con la plantilla original de este slide (versión desktop y móvil)?')) return;
    borrador = {
      deck: CMP.SLIDE_HTML[slideActual.id].deck,
      story: CMP.SLIDE_HTML[slideActual.id].story,
    };
    renderModo();
    toast('Plantilla original cargada: publica para restaurarla');
  });

  function pintarHistorial() {
    const cont = $('#ms-historial');
    const h = guion.historial[slideActual.id] || [];
    if (!h.length) {
      cont.innerHTML = '<div style="font-size:.82rem;color:var(--muted)">Aún no hay versiones editadas: está vigente la plantilla original.</div>';
      return;
    }
    cont.innerHTML = '';
    h.slice().reverse().forEach((v, ri) => {
      const n = h.length - ri;
      const fila = document.createElement('div');
      fila.style.cssText = 'display:flex;align-items:center;gap:.7rem;border:1.5px solid var(--line);border-radius:10px;padding:.5rem .8rem;font-size:.82rem';
      fila.innerHTML = `
        <b style="color:var(--azul)">v${n + 1}</b>
        <span style="flex:1;color:var(--muted)">${CMP.fmtFecha(v.fecha)} · ${esc(v.autor)}</span>
        <button class="btn btn-linea btn-xs" data-rest>Cargar en el editor</button>`;
      $('[data-rest]', fila).addEventListener('click', () => {
        borrador = { deck: v.deck, story: v.story };
        renderModo();
        toast(`Versión v${n + 1} cargada: publica para restaurarla`);
      });
      cont.appendChild(fila);
    });
  }

  $('#ms-guardar').addEventListener('click', () => {
    if (!slideActual) return;
    commitActual();
    if (!borrador.deck.trim() || !borrador.story.trim()) { toast('Ninguna de las dos versiones puede quedar vacía'); return; }
    const id = slideActual.id;
    guion.historial[id] = guion.historial[id] || [];
    guion.historial[id].push({ fecha: hoyISO(), autor: yo.nombre, deck: borrador.deck, story: borrador.story });
    guion.html[id] = { deck: borrador.deck, story: borrador.story };
    CMP.saveGuion(guion);
    modal.classList.remove('abierto');
    pintarSlides(); pintarKpis();
    toast(`Nueva versión de «${slideActual.nombre}» publicada ✨`);
  });

  $$('[data-cerrar]').forEach(b => b.addEventListener('click', () => b.closest('.modal-fondo').classList.remove('abierto')));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('abierto'); });

  /* ---------- Inicio ---------- */
  pintarKpis();
  pintarSlides();
})();
