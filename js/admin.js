/* ============================================================
   Colmédica Presenta — administración del guion corporativo
   Lista de slides, KPIs y switches de los opcionales.
   El editor de cada slide vive en su propia página (editor.html).
   Solo el rol admin puede entrar aquí.
   ============================================================ */

(() => {
  const $ = (s, c) => (c || document).querySelector(s);

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

  let guion = CMP.getGuion();

  /* ---------- KPIs ---------- */
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

  /* ---------- Lista de slides ---------- */
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
      const acciones = editable ? `<a class="btn btn-linea btn-xs" href="editor.html?slide=${s.id}">🎨 Editar slide</a>` : '';
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
      cont.appendChild(fila);
    });
  }

  /* ---------- Toast de confirmación al volver del editor ---------- */
  const okParam = new URLSearchParams(location.search).get('ok');
  if (okParam) {
    setTimeout(() => toast(`Nueva versión de «${okParam}» publicada ✨`), 300);
    history.replaceState(null, '', 'admin.html');
  }

  /* ---------- Inicio ---------- */
  pintarKpis();
  pintarSlides();
})();
