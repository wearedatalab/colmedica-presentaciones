/* ============================================================
   Colmédica Presenta — administración del guion corporativo
   El rol admin administra el HTML de cada slide estándar en sus
   dos versiones (desktop 16:9 y móvil 9:16): edita el código con
   variables {{token}}, previsualiza en vivo, publica versiones,
   restaura anteriores y activa u oculta los opcionales del guion.
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
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('visible'), 2400);
  };
  const hoyISO = () => new Date().toISOString().slice(0, 10);

  let guion = CMP.getGuion();
  let slideActual = null;
  let tabActual = 'deck';
  let borrador = { deck: '', story: '' };

  /* ---------- Contexto de ejemplo para la vista previa ---------- */
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

  /* fondo de la versión móvil por slide (estructural del visor) */
  const FONDO_STORY = {
    elegir: 'img/flux/elegir-v.jpg', portafolio: 'img/flux/portafolio-v.jpg', red: 'img/flux/red-v.jpg',
    clinicas: 'img/flux/clinicas-v.jpg', app: 'img/flux/app-v.jpg', beneficios: 'img/flux/beneficios-v.jpg',
    testimonios: 'video/testimonio-erica.jpg', cierre: 'img/flux/cierre-v.jpg',
  };

  /* ---------- KPIs ---------- */
  function pintarKpis() {
    const activos = CMP.guionActual().length;
    const editados = Object.keys(guion.html || {}).length;
    const versiones = Object.values(guion.historial || {}).reduce((s, h) => s + h.length, 0);
    const pres = CMP.getPresentaciones().length;
    $('#kpis-admin').innerHTML = `
      <div class="kpi acento"><div class="icono">🎞️</div><div class="valor">${activos}</div><div class="etiqueta">Slides en el guion vigente</div></div>
      <div class="kpi"><div class="icono">✏️</div><div class="valor">${editados}</div><div class="etiqueta">Slides con HTML editado</div></div>
      <div class="kpi"><div class="icono">🗂️</div><div class="valor">${versiones}</div><div class="etiqueta">Versiones publicadas</div></div>
      <div class="kpi"><div class="icono">📤</div><div class="valor">${pres}</div><div class="etiqueta">Presentaciones de comerciales</div></div>`;
  }

  /* ---------- Lista de slides ---------- */
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
      const acciones = editable
        ? `<button class="btn btn-linea btn-xs" data-editar>&lt;/&gt; Editar HTML</button>`
        : '';
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
     EDITOR HTML
     ============================================================ */
  const modal = $('#modal-slide');
  const codigo = $('#ms-codigo');

  function abrirEditor(s) {
    slideActual = s;
    const h = CMP.htmlDe(s.id);
    borrador = { deck: h.deck, story: h.story };
    $('#ms-titulo').textContent = `${s.icon} ${s.nombre}`;
    irTab('deck');
    pintarTokens();
    pintarHistorial();
    modal.classList.add('abierto');
  }

  function irTab(tab) {
    tabActual = tab;
    $$('.tab-btn').forEach(b => b.classList.toggle('activo', b.dataset.tab === tab));
    $('#ms-tab-nombre').textContent = tab === 'deck' ? '· versión desktop (16:9)' : '· versión móvil (9:16)';
    codigo.value = borrador[tab];
    $('#ms-previa-deck').style.display = tab === 'deck' ? 'block' : 'none';
    $('#ms-previa-story').style.display = tab === 'story' ? 'block' : 'none';
    pintarPrevia();
  }
  $$('.tab-btn').forEach(b => b.addEventListener('click', () => {
    borrador[tabActual] = codigo.value;
    irTab(b.dataset.tab);
  }));

  codigo.addEventListener('input', () => {
    borrador[tabActual] = codigo.value;
    clearTimeout(codigo._t);
    codigo._t = setTimeout(pintarPrevia, 350);
  });

  /* ---------- Tokens ---------- */
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

  /* ---------- Vista previa (iframe con el CSS real del visor) ---------- */
  const SCRIPT_PREVIA = `<script>
    document.querySelectorAll('[data-cuenta]').forEach(el => {
      const fin = Number(el.dataset.cuenta); const t0 = performance.now();
      const paso = (t) => { const k = Math.min(1, (t - t0) / 1200); const e = 1 - Math.pow(1 - k, 3);
        el.childNodes[0].textContent = Math.round(fin * e).toLocaleString('es-CO');
        if (k < 1) requestAnimationFrame(paso); };
      requestAnimationFrame(paso);
    });
  <\/script>`;

  const CABECERA_PREVIA = `<meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/deck.css">
    <base href="${location.origin}/">`;

  function pintarPrevia() {
    if (!slideActual) return;
    const id = slideActual.id;
    if (tabActual === 'deck') {
      const html = CMP.renderHtml(borrador.deck, CTX_DEMO);
      $('#ms-previa-deck').srcdoc = `<!DOCTYPE html><html><head>${CABECERA_PREVIA}
        <style>body{overflow:hidden}.deck-marco{width:100vw}</style></head>
        <body data-modo="desktop"><div class="deck-escenario"><div class="deck-marco">
          <section class="slide activo s-${id}">${html}
            <div class="barra-roja"></div>
            <div class="firma"><img src="img/colmedica-logo-white.png" alt=""><span class="tag">te queremos<br>bien<b>.</b></span></div>
            <span class="vigilado">Vigilado Supersalud</span>
          </section>
        </div></div>${SCRIPT_PREVIA}</body></html>`;
    } else {
      const html = CMP.renderHtml(borrador.story, CTX_DEMO);
      $('#ms-previa-story').srcdoc = `<!DOCTYPE html><html><head>${CABECERA_PREVIA}
        <style>body{overflow:hidden}.h-contenido{padding-bottom:1.6rem}</style></head>
        <body data-modo="movil"><div class="historias" style="display:block">
          <section class="panel-historia activo ph-${id}">
            <img class="h-fondo" src="${FONDO_STORY[id] || ''}" alt="">
            <div class="h-scrim"></div>
            <div class="h-contenido">${html}</div>
          </section>
        </div>${SCRIPT_PREVIA}</body></html>`;
    }
  }

  /* ---------- Volver al original ---------- */
  $('#ms-original').addEventListener('click', () => {
    if (!slideActual) return;
    if (!confirm('¿Reemplazar el contenido del editor con la plantilla original de este slide (versión desktop y móvil)?')) return;
    borrador = {
      deck: CMP.SLIDE_HTML[slideActual.id].deck,
      story: CMP.SLIDE_HTML[slideActual.id].story,
    };
    codigo.value = borrador[tabActual];
    pintarPrevia();
    toast('Plantilla original cargada: publica para restaurarla');
  });

  /* ---------- Historial ---------- */
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
        <span style="flex:1;color:var(--muted)">${CMP.fmtFecha(v.fecha)} · ${esc(v.autor)} · ${Math.round((v.deck.length + v.story.length) / 1024 * 10) / 10} KB</span>
        <button class="btn btn-linea btn-xs" data-rest>Cargar en el editor</button>`;
      $('[data-rest]', fila).addEventListener('click', () => {
        borrador = { deck: v.deck, story: v.story };
        codigo.value = borrador[tabActual];
        pintarPrevia();
        toast(`Versión v${n + 1} cargada: publica para restaurarla`);
      });
      cont.appendChild(fila);
    });
  }

  /* ---------- Publicar nueva versión ---------- */
  $('#ms-guardar').addEventListener('click', () => {
    if (!slideActual) return;
    borrador[tabActual] = codigo.value;
    if (!borrador.deck.trim() || !borrador.story.trim()) { toast('Ninguna de las dos versiones puede quedar vacía'); return; }
    const id = slideActual.id;
    guion.historial[id] = guion.historial[id] || [];
    guion.historial[id].push({ fecha: hoyISO(), autor: yo.nombre, deck: borrador.deck, story: borrador.story });
    guion.html[id] = { deck: borrador.deck, story: borrador.story };
    CMP.saveGuion(guion);
    modal.classList.remove('abierto');
    pintarSlides(); pintarKpis();
    toast(`Nueva versión HTML de «${slideActual.nombre}» publicada ✨`);
  });

  $$('[data-cerrar]').forEach(b => b.addEventListener('click', () => b.closest('.modal-fondo').classList.remove('abierto')));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('abierto'); });

  /* ---------- Inicio ---------- */
  pintarKpis();
  pintarSlides();
})();
