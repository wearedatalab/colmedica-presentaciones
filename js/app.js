/* ============================================================
   Colmédica Presenta — lógica del panel comercial
   ============================================================ */

(() => {
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = texto; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
  };

  /* ---------- Sesión ---------- */
  const ses = CMP.getSesion();
  if (!ses) { location.href = 'index.html'; return; }
  if (ses.id === 'admin') { location.href = 'admin.html'; return; }
  const yo = CMP.comercialById(ses.id);

  $('#u-nombre').textContent = yo.nombre;
  $('#u-cargo').textContent = `${yo.cargo} · ${yo.ciudad}`;
  const av = $('#u-avatar'); av.textContent = yo.ini; av.style.background = yo.color;
  $('#s-nombre').textContent = yo.nombre.split(' ')[0];
  $('#btn-salir').addEventListener('click', () => { CMP.cerrarSesion(); location.href = 'index.html'; });

  /* ---------- Estado ---------- */
  let lista = CMP.getPresentaciones();
  let editando = null;       // pres en edición dentro del wizard
  let pasoActual = 1;

  const toast = (msg) => {
    const t = $('#toast'); t.textContent = msg; t.classList.add('visible');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('visible'), 2400);
  };

  const linkDe = (pres) => {
    const payload = CMP.zenc(CMP.buildPayload(pres));
    const base = location.href.replace(/panel\.html.*$/, 'p.html');
    return `${base}#z=${payload}`;
  };

  /* el mejor link disponible: el corto si ya existe; si no, el largo,
     y se acorta en segundo plano para la próxima vez */
  const mejorLink = (pres) => {
    if (pres.shortUrl) return pres.shortUrl;
    const largo = linkDe(pres);
    CMP.acortarLink(largo).then(corto => {
      if (!corto) return;
      pres.shortUrl = corto;
      CMP.savePresentaciones(lista);
    });
    return largo;
  };

  /* ---------- KPIs ---------- */
  function pintarKpis() {
    const mias = lista.filter(p => p.asesorId === yo.id);
    const enviadas = mias.filter(p => p.estado !== 'borrador').length;
    const vistas = mias.reduce((s, p) => s + (p.vistas || 0), 0);
    const planTop = (() => {
      const c = {};
      mias.forEach(p => c[p.planId] = (c[p.planId] || 0) + 1);
      const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
      return top ? CMP.planById(top[0]).nombre.split(' ')[0] : '—';
    })();
    $('#kpis').innerHTML = `
      <div class="kpi acento"><div class="icono">🗂️</div><div class="valor">${mias.length}</div><div class="etiqueta">Presentaciones creadas</div></div>
      <div class="kpi"><div class="icono">📤</div><div class="valor">${enviadas}</div><div class="etiqueta">Enviadas a clientes</div></div>
      <div class="kpi"><div class="icono">👀</div><div class="valor">${vistas}</div><div class="etiqueta">Vistas totales</div></div>
      <div class="kpi"><div class="icono">⭐</div><div class="valor" style="font-size:1.35rem;padding-top:.35rem">${planTop}</div><div class="etiqueta">Plan más propuesto</div></div>`;
  }

  /* ---------- Lista ---------- */
  function pintarLista() {
    const cont = $('#pres-lista');
    const mias = lista.filter(p => p.asesorId === yo.id).sort((a, b) => (b.creada || '').localeCompare(a.creada || ''));
    if (!mias.length) {
      cont.innerHTML = `<div style="text-align:center;color:var(--muted);padding:3rem 1rem">Aún no tienes presentaciones. ¡Crea la primera!</div>`;
      return;
    }
    cont.innerHTML = '';
    mias.forEach(p => {
      const plan = CMP.planById(p.planId);
      const total = CMP.totalBens(p.bens);
      const estadoCls = p.vistas > 0 ? 'estado-vista' : (p.estado === 'borrador' ? 'estado-borrador' : 'estado-enviada');
      const estadoTxt = p.vistas > 0 ? `Vista ${p.vistas} veces` : (p.estado === 'borrador' ? 'Borrador' : 'Enviada');
      const el = document.createElement('div');
      el.className = 'pres-card';
      el.innerHTML = `
        <div class="pres-gema" style="background:${plan.color}">${plan.gem}</div>
        <div class="pres-datos">
          <div class="nombre">${esc(p.cliente)} <span class="estado ${estadoCls}" style="margin-left:.5rem">${estadoTxt}</span></div>
          <div class="meta">
            <span>Plan <b>${plan.nombre}</b></span>
            <span><b>${(p.bens || []).length}</b> beneficiario${(p.bens || []).length === 1 ? '' : 's'}</span>
            <span>Total <b>${CMP.fmtCOP(total)}/mes</b></span>
            <span>Creada ${CMP.fmtFecha(p.creada)}</span>
          </div>
        </div>
        <div class="pres-acciones">
          <button class="accion" data-tip="Ver presentación" data-ver>🖥️</button>
          <button class="accion" data-tip="Copiar link" data-link>🔗</button>
          <button class="accion" data-tip="WhatsApp" data-wa>💬</button>
          <button class="accion" data-tip="Editar" data-editar>✏️</button>
          <button class="accion" data-tip="Duplicar" data-dup>⧉</button>
          <button class="accion" data-tip="Eliminar" data-borrar>🗑️</button>
        </div>`;
      const marcarEnviada = () => {
        if (p.estado === 'borrador') { p.estado = 'enviada'; CMP.savePresentaciones(lista); refrescar(); }
      };
      $('[data-ver]', el).addEventListener('click', () => window.open(linkDe(p), '_blank'));
      $('[data-link]', el).addEventListener('click', async () => {
        await copiar(mejorLink(p));
        marcarEnviada();
        toast(p.shortUrl ? 'Link corto copiado' : 'Link copiado al portapapeles');
      });
      $('[data-wa]', el).addEventListener('click', () => {
        const msg = `Hola ${p.cliente}, soy ${yo.nombre} de Colmédica. Te comparto la presentación que preparé especialmente para ti: ${mejorLink(p)}`;
        window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
        marcarEnviada();
      });
      $('[data-editar]', el).addEventListener('click', () => abrirWizard(p));
      $('[data-dup]', el).addEventListener('click', () => {
        const copia = JSON.parse(JSON.stringify(p));
        copia.id = 'p' + Date.now(); copia.cliente += ' (copia)'; copia.estado = 'borrador'; copia.vistas = 0;
        copia.creada = hoyISO();
        lista.push(copia); CMP.savePresentaciones(lista); refrescar(); toast('Presentación duplicada');
      });
      $('[data-borrar]', el).addEventListener('click', () => {
        if (!confirm(`¿Eliminar la presentación de ${p.cliente}?`)) return;
        lista = lista.filter(x => x.id !== p.id); CMP.savePresentaciones(lista); refrescar(); toast('Presentación eliminada');
      });
      cont.appendChild(el);
    });
  }

  const hoyISO = () => new Date().toISOString().slice(0, 10);
  const refrescar = () => { pintarKpis(); pintarLista(); };

  /* ============================================================
     WIZARD
     ============================================================ */
  const modalWz = $('#modal-wizard');

  function presVacia() {
    const vig = new Date(); vig.setDate(vig.getDate() + 30);
    return {
      id: 'p' + Date.now(), asesorId: yo.id, creada: hoyISO(), estado: 'borrador', vistas: 0,
      cliente: '', tratamiento: 'Familia', ciudad: yo.ciudad, planId: 'zafiro',
      bens: [{ n: '', edad: '', v: '' }], descAnual: 8, vigencia: vig.toISOString().slice(0, 10),
      notas: '', slides: CMP.guionActual(),
    };
  }

  let wzInicial = '';

  function abrirWizard(pres) {
    editando = pres ? JSON.parse(JSON.stringify(pres)) : presVacia();
    wzInicial = JSON.stringify(editando);
    $('#wz-titulo').textContent = pres ? `Editar · ${pres.cliente}` : 'Nueva presentación';
    // Paso 1
    $('#f-tratamiento').value = editando.tratamiento || 'Familia';
    $('#f-cliente').value = editando.cliente || '';
    $('#f-ciudad').value = editando.ciudad || 'Bogotá';
    $('#f-vigencia').value = editando.vigencia || '';
    pintarPlanes();
    pintarBens();
    $('#f-desc').value = editando.descAnual ?? 8;
    $('#f-notas').innerHTML = editando.notas || '';
    irPaso(1);
    modalWz.classList.add('abierto');
  }

  function pintarPlanes() {
    const cont = $('#f-planes'); cont.innerHTML = '';
    CMP.PLANES.forEach(pl => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'plan-opcion' + (editando.planId === pl.id ? ' elegido' : '');
      b.innerHTML = `
        <div class="gama"><span class="plan-punto" style="background:${pl.color}"></span>${pl.gama}</div>
        <div class="nom">${pl.nombre}</div>
        <div class="desde">desde <b>${CMP.fmtCOP(pl.desde)}</b>/mes por persona</div>`;
      b.addEventListener('click', () => { editando.planId = pl.id; pintarPlanes(); });
      cont.appendChild(b);
    });
  }

  /* El contenido del guion (slides estándar y opcionales) lo administra el rol admin;
     el comercial solo personaliza su slide de resumen. */

  /* ---------- Beneficiarios ---------- */
  function pintarBens() {
    const cont = $('#f-bens'); cont.innerHTML = '';
    editando.bens.forEach((b, i) => {
      const fila = document.createElement('div');
      fila.className = 'ben-fila';
      fila.innerHTML = `
        <input type="text" placeholder="Nombre" value="${esc(b.n || '')}" data-k="n">
        <input type="number" placeholder="Edad" min="0" max="110" value="${b.edad || ''}" data-k="edad">
        <input type="text" inputmode="numeric" placeholder="$ 0" value="${b.v ? CMP.fmtCOP(b.v) : ''}" data-k="v">
        <button class="ben-quitar" type="button" ${editando.bens.length === 1 ? 'disabled style="opacity:.3"' : ''}>✕</button>`;
      $$('input', fila).forEach(inp => {
        inp.addEventListener('input', () => {
          const k = inp.dataset.k;
          if (k === 'v') {
            const num = Number(inp.value.replace(/[^\d]/g, '')) || 0;
            b.v = num;
          } else if (k === 'edad') {
            b.edad = Number(inp.value) || '';
          } else {
            b.n = inp.value;
          }
          pintarPrevia();
        });
        if (inp.dataset.k === 'v') {
          inp.addEventListener('blur', () => { inp.value = b.v ? CMP.fmtCOP(b.v) : ''; });
        }
      });
      $('.ben-quitar', fila).addEventListener('click', () => {
        editando.bens.splice(i, 1); pintarBens(); pintarPrevia();
      });
      cont.appendChild(fila);
    });
  }

  $('#btn-add-ben').addEventListener('click', () => {
    editando.bens.push({ n: '', edad: '', v: '' });
    pintarBens(); pintarPrevia();
  });

  /* toolbar notas: preventDefault en mousedown para no robar el foco/selección del editor */
  $$('.tb-btn').forEach(b => {
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => {
      $('#f-notas').focus();
      document.execCommand(b.dataset.cmd, false, null);
      sincronizarNotas();
    });
  });
  $('#f-notas').addEventListener('input', sincronizarNotas);
  function sincronizarNotas() { editando.notas = $('#f-notas').innerHTML; pintarPrevia(); }

  $('#f-desc').addEventListener('input', () => { editando.descAnual = Number($('#f-desc').value) || 0; pintarPrevia(); });

  /* ---------- Vista previa en vivo (paso 3) ---------- */
  function notasSanitizadas() {
    const tmp = document.createElement('div');
    tmp.innerHTML = editando.notas || '';
    $$('script,style,iframe,object', tmp).forEach(n => n.remove());
    $$('*', tmp).forEach(n => {
      if (!/^(B|STRONG|I|EM|UL|OL|LI|BR|P|DIV|SPAN)$/.test(n.tagName)) n.replaceWith(...n.childNodes);
      else [...n.attributes].forEach(a => n.removeAttribute(a.name));
    });
    return tmp.innerHTML.trim();
  }

  function pintarPrevia() {
    const plan = CMP.planById(editando.planId);
    const total = CMP.totalBens(editando.bens);
    const notasHtml = notasSanitizadas();
    const bensHtml = editando.bens.filter(b => b.n || b.v).map(b => `
      <div class="ps-ben"><span><b>${esc(b.n) || 'Beneficiario'}</b><span class="edad">${b.edad ? b.edad + ' años' : ''}</span></span><b>${CMP.fmtCOP(b.v)}</b></div>`).join('');
    $('#previa-slide').innerHTML = `
      <div class="ps-inner">
        <span class="ps-pill">Propuesta económica</span>
        <div class="ps-titulo">Plan ${plan.nombre}<span class="punto">.</span></div>
        <div class="ps-cliente">Preparada para ${esc($('#f-cliente').value) || 'tu cliente'} · ${$('#f-ciudad').value}</div>
        <div class="ps-bens">${bensHtml || '<div class="ps-ben" style="opacity:.55">Agrega beneficiarios para ver los valores…</div>'}</div>
        ${notasHtml ? `<div class="ps-notas">${notasHtml}</div>` : ''}
        <div class="ps-total-fila">
          <div class="ps-total">
            <div class="etq2">Cuota total mensual</div>
            <div class="monto">${CMP.fmtCOP(total)}<small> /mes</small></div>
          </div>
          <div class="ps-vig">${editando.descAnual ? `<b>${editando.descAnual}% dcto.</b> por pago anual<br>` : ''}Vigente hasta ${CMP.fmtFecha($('#f-vigencia').value)}</div>
        </div>
        <div class="ps-barra"></div>
      </div>`;
  }
  $('#f-cliente').addEventListener('input', pintarPrevia);
  $('#f-ciudad').addEventListener('change', pintarPrevia);
  $('#f-vigencia').addEventListener('change', () => { editando.vigencia = $('#f-vigencia').value; pintarPrevia(); });

  /* ---------- Navegación de pasos ---------- */
  function irPaso(n) {
    pasoActual = n;
    $$('.paso-panel').forEach(p => p.classList.toggle('activo', p.dataset.panel == n));
    $$('.paso-punto').forEach(p => {
      p.classList.toggle('activo', p.dataset.paso == n);
      p.classList.toggle('hecho', Number(p.dataset.paso) < n);
    });
    $('#wz-atras').style.visibility = n === 1 ? 'hidden' : 'visible';
    $('#wz-sig').textContent = n === 2 ? 'Publicar ✨' : 'Siguiente →';
    if (n === 2) pintarPrevia();
  }

  $('#wz-atras').addEventListener('click', () => irPaso(Math.max(1, pasoActual - 1)));

  $('#wz-sig').addEventListener('click', () => {
    if (pasoActual === 1) {
      recogerPaso1();
      if (!editando.cliente.trim()) { toast('Escribe el nombre del cliente'); $('#f-cliente').focus(); return; }
      irPaso(2);
    } else {
      recogerPaso1();
      limpiarBens();
      if (!editando.bens.some(b => Number(b.v) > 0)) {
        pintarBens(); pintarPrevia();
        toast('Agrega al menos un beneficiario con su cuota mensual');
        const inp = $('#f-bens input[data-k="v"]');
        if (inp) inp.focus();
        return;
      }
      if (!editando.vigencia) {
        toast('Indica hasta cuándo es vigente la propuesta');
        irPaso(1); $('#f-vigencia').focus();
        return;
      }
      const eraEnviada = (lista.find(x => x.id === editando.id) || {}).estado === 'enviada';
      editando.slides = CMP.guionActual(); // el guion vigente lo define el admin
      editando.estado = 'enviada';
      guardar();
      publicar(eraEnviada);
    }
  });

  $('#wz-borrador').addEventListener('click', () => {
    recogerPaso1();
    limpiarBens();
    if (!editando.cliente.trim()) { toast('Escribe al menos el nombre del cliente'); return; }
    editando.estado = editando.estado === 'enviada' ? 'enviada' : 'borrador';
    guardar();
    wzInicial = JSON.stringify(editando);
    modalWz.classList.remove('abierto');
    toast('Guardado como borrador');
  });

  function recogerPaso1() {
    editando.tratamiento = $('#f-tratamiento').value;
    editando.cliente = $('#f-cliente').value.trim();
    editando.ciudad = $('#f-ciudad').value;
    editando.vigencia = $('#f-vigencia').value;
    editando.descAnual = Number($('#f-desc').value) || 0;
    editando.notas = $('#f-notas').innerHTML;
  }

  /* quitar filas vacías SOLO al guardar: mutar el array en sitio para no
     romper los objetos ya ligados a las filas del editor */
  function limpiarBens() {
    for (let i = editando.bens.length - 1; i >= 0; i--) {
      const b = editando.bens[i];
      if (!b.n && !b.v) editando.bens.splice(i, 1);
    }
    if (!editando.bens.length) editando.bens.push({ n: '', edad: '', v: '' });
  }

  function guardar() {
    delete editando.shortUrl; // el contenido cambió: el link corto anterior queda obsoleto
    const idx = lista.findIndex(x => x.id === editando.id);
    if (idx >= 0) lista[idx] = editando; else lista.push(editando);
    CMP.savePresentaciones(lista);
    refrescar();
  }

  /* ---------- Publicar: simulación de optimización IA ---------- */
  const modalPub = $('#modal-publicar');
  let pubTimer = 0;

  function publicar(eraEnviada) {
    clearTimeout(pubTimer);
    modalWz.classList.remove('abierto');
    modalPub.classList.add('abierto');
    $('#fase-ia').style.display = 'block';
    $('#fase-compartir').classList.remove('visible');

    const slidesActivos = CMP.SLIDES.filter(s => editando.slides.includes(s.id));
    const cont = $('#ia-lista');
    cont.innerHTML = '';
    const filas = slidesActivos.map(s => {
      const f = document.createElement('div');
      f.className = 'ia-item';
      f.innerHTML = `<span class="ia-pend"></span><span class="nombre-s">${s.icon} ${s.nombre}</span><span class="formatos"></span>`;
      cont.appendChild(f);
      return f;
    });

    let i = 0;
    const paso = () => {
      if (i > 0) {
        const prev = filas[i - 1];
        prev.querySelector('.ia-pend, .ia-spin').outerHTML = '<span class="ia-check">✓</span>';
        prev.querySelector('.formatos').innerHTML = '<span>🖥️ 1920×1080 <b>✓</b></span><span>📱 1080×1920 <b>✓ fal.ai</b></span>';
      }
      if (i < filas.length) {
        filas[i].querySelector('.ia-pend').outerHTML = '<span class="ia-spin"></span>';
        i++;
        pubTimer = setTimeout(paso, 260 + Math.random() * 420);
      } else {
        pubTimer = setTimeout(() => mostrarCompartir(eraEnviada), 350);
      }
    };
    pubTimer = setTimeout(paso, 300);
  }

  function mostrarCompartir(eraEnviada) {
    $('#fase-ia').style.display = 'none';
    const panel = $('#fase-compartir');
    panel.classList.add('visible');
    const avisoPrevio = $('.aviso-relink', panel);
    if (avisoPrevio) avisoPrevio.remove();
    if (eraEnviada) {
      const aviso = document.createElement('div');
      aviso.className = 'aviso-relink';
      aviso.innerHTML = '⚠️ Editaste una presentación ya enviada: este es un <b>link nuevo</b>. Compártelo otra vez con tu cliente; el link anterior seguirá mostrando la versión previa.';
      $('.link-caja', panel).before(aviso);
    }
    const link = linkDe(editando);
    $('#link-final').value = link;
    $('#btn-ver-desktop').href = link.replace('#', '?m=desktop#');
    $('#btn-ver-movil').href = link.replace('#', '?m=movil#');
    const armarWa = (url) => {
      const msg = `Hola ${editando.cliente}, soy ${yo.nombre} de Colmédica. Preparé esta presentación especialmente para ti: ${url}`;
      $('#btn-whatsapp').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
    };
    armarWa(link);

    /* acortar en segundo plano y reemplazar cuando esté listo */
    CMP.acortarLink(link).then(corto => {
      if (!corto) return;
      editando.shortUrl = corto;
      CMP.savePresentaciones(lista);
      $('#link-final').value = corto;
      armarWa(corto);
      const caja = $('#link-final').closest('.link-caja');
      if (caja && !$('.etq-corto', caja)) {
        const etq = document.createElement('span');
        etq.className = 'etq-corto';
        etq.textContent = '✂️ corto';
        caja.insertBefore(etq, $('#link-final'));
      }
      toast('Link corto generado ✂️');
    });
  }

  $('#btn-copiar').addEventListener('click', async () => {
    const inp = $('#link-final');
    inp.select();
    await copiar(inp.value);
    toast('Link copiado');
  });

  /* ---------- Cerrar modales ---------- */
  function cerrarWizard() {
    recogerPaso1();
    if (JSON.stringify(editando) !== wzInicial &&
        !confirm('Tienes cambios sin guardar. ¿Cerrar de todas formas? Puedes usar «Guardar borrador».')) return;
    modalWz.classList.remove('abierto');
  }
  function cerrarModal(m) {
    if (m === modalWz) { cerrarWizard(); return; }
    if (m === modalPub) clearTimeout(pubTimer);
    m.classList.remove('abierto');
  }
  $$('[data-cerrar]').forEach(b => b.addEventListener('click', () => cerrarModal(b.closest('.modal-fondo'))));
  $$('.modal-fondo').forEach(m => m.addEventListener('click', (e) => {
    if (e.target === m) cerrarModal(m);
  }));

  $('#btn-nueva').addEventListener('click', () => abrirWizard(null));

  /* ---------- Inicio ---------- */
  refrescar();
})();
