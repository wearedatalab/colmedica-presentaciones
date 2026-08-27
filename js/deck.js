/* ============================================================
   Colmédica Presenta — visor de presentación del cliente
   Un mismo link, dos experiencias:
   · Desktop  → deck panorámico 16:9
   · Móvil    → historias verticales 9:16 (arte fal.ai)
   ============================================================ */

(() => {
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- Cargar payload del link ---------- */
  const hz = location.hash.match(/z=([^&]+)/);   // formato comprimido (actual)
  const hd = location.hash.match(/d=([^&]+)/);   // formato base64 (links antiguos)
  let P = hz ? CMP.zdec(hz[1]) : hd ? CMP.b64dec(hd[1]) : null;
  if (!P) {
    // fallback demo: primera presentación semilla
    P = CMP.buildPayload(CMP.SEED[0]);
  }
  /* el payload viene de un link: neutralizar cualquier marcado en los campos de texto */
  const strip = (s) => String(s ?? '').replace(/[<>"`]/g, '').slice(0, 120);
  const num = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : ''; };
  P.c = strip(P.c); P.tr = strip(P.tr); P.ci = strip(P.ci); P.d = num(P.d);
  P.a = P.a || {}; P.a.n = strip(P.a.n) || 'Tu asesor'; P.a.cg = strip(P.a.cg); P.a.cl = strip(P.a.cl);
  (P.b || []).forEach(b => { b.n = strip(b.n); b.edad = num(b.edad); });

  const plan = CMP.planById(P.p);
  const total = CMP.totalBens(P.b);
  const bens = (P.b || []).filter(b => b.n || b.v);
  const ordenSlides = (P.s && P.s.length ? P.s : CMP.SLIDES.map(s => s.id));

  document.title = `Colmédica · Propuesta para ${P.c}`;

  /* contar vista (demo: solo cuenta en el mismo navegador del asesor) */
  try {
    const lista = CMP.getPresentaciones();
    const mia = lista.find(x => x.id === P.id);
    if (mia && !location.search.includes('m=')) {
      mia.vistas = (mia.vistas || 0) + 1;
      mia.ultimaVista = new Date().toISOString().slice(0, 10);
      if (mia.estado === 'borrador') mia.estado = 'enviada';
      CMP.savePresentaciones(lista);
    }
  } catch (e) { /* sin storage: visor del cliente */ }

  /* ---------- Modo: desktop (deck) o móvil (historias) ---------- */
  const qs = new URLSearchParams(location.search);
  const forzado = qs.get('m');
  const esMovilReal = matchMedia('(max-width: 820px)').matches;
  let modo = forzado === 'movil' ? 'movil' : forzado === 'desktop' ? 'desktop' : (esMovilReal ? 'movil' : 'desktop');
  document.body.dataset.modo = modo;

  const waLink = (txt) => {
    const num = '57' + (P.a.cl || '').replace(/\D/g, '');
    return `https://wa.me/${num}?text=${encodeURIComponent(txt || `Hola ${P.a.n}, vi la presentación de Colmédica que me enviaste y me interesa el plan ${plan.nombre}.`)}`;
  };
  const iniciales = (n) => n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
  const primerNombre = P.a.n.split(' ')[0];

  const soloFormatoBasico = (html) => {
    // solo formato básico: b/i/ul/li/br/p/div/span sin atributos
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    $$('script,style,iframe,object', tmp).forEach(n => n.remove());
    $$('*', tmp).forEach(n => {
      if (!/^(B|STRONG|I|EM|UL|OL|LI|BR|P|DIV|SPAN)$/.test(n.tagName)) n.replaceWith(...n.childNodes);
      else [...n.attributes].forEach(a => n.removeAttribute(a.name));
    });
    return tmp.innerHTML.trim();
  };
  const notasLimpias = soloFormatoBasico(P.nt);

  /* cifras animadas */
  const animarCifras = (raiz) => {
    $$('[data-cuenta]', raiz).forEach(el => {
      const fin = Number(el.dataset.cuenta);
      const suf = el.dataset.suf || '';
      const dur = 1400;
      const t0 = performance.now();
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        el.childNodes[0].textContent = Math.round(fin * eased).toLocaleString('es-CO') + suf;
        if (k < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
  };

  /* ============================================================
     DEFINICIÓN DE SLIDES (desktop + historia)
     ============================================================ */
  const bensFilas = bens.map(b => `
    <div class="prop-ben anim"><span><b>${b.n || 'Beneficiario'}</b><span class="edad">${b.edad ? b.edad + ' años' : ''}</span></span><b>${CMP.fmtCOP(b.v)}</b></div>`).join('');

  /* historias: con muchos beneficiarios, agrupar para no desbordar 360px */
  const bensStory = bens.length > 4
    ? [...bens.slice(0, 3), { n: (bens.length - 3) + ' beneficiarios más', edad: '', v: bens.slice(3).reduce((s, b) => s + (+b.v || 0), 0) }]
    : bens;

  /* asistencia en viajes: el monto depende de la gama (PPT slide 38) */
  const viajes = plan.id === 'diamante'
    ? { deck: 'Cobertura de urgencias hasta por <b>USD 50.000 / EUR 35.000</b> por usuario/viaje, hasta 60 días continuos.', story: '<b>Viajes:</b> urgencias hasta USD 50.000 / EUR 35.000' }
    : plan.id === 'zafiro'
      ? { deck: 'Cobertura de urgencias hasta por <b>USD/EUR 15.000</b> por usuario/viaje (hasta los 60 años), hasta 60 días continuos.', story: '<b>Viajes:</b> urgencias hasta USD/EUR 15.000' }
      : { deck: 'Asistencia médica de urgencias en el exterior, disponible en los planes de las gamas <b>Diamante y Zafiro</b>.', story: '<b>Viajes:</b> asistencia en gamas Diamante y Zafiro' };

  /* ---------- Contexto de tokens para las plantillas HTML administradas ---------- */
  const clinicasParaCtx = () => {
    const deCiudad = CMP.CLINICAS.filter(c => c.ciudad === P.ci);
    const resto = CMP.CLINICAS.filter(c => c.ciudad !== P.ci);
    return deCiudad.concat(resto).slice(0, 6);
  };
  const CTX = {
    cliente: P.c, ciudad: P.ci, fecha: CMP.fmtFecha(P.f),
    plan_nombre: plan.nombre, plan_gama: plan.gama,
    asesor_nombre: P.a.n, asesor_primer_nombre: P.a.n.split(' ')[0],
    asesor_cargo: P.a.cg, asesor_celular: P.a.cl,
    asesor_iniciales: P.a.n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase(),
    whatsapp_link: waLink(), telefono_link: 'tel:+57' + (P.a.cl || '').replace(/\D/g, ''),
    grid_clinicas: clinicasParaCtx().map(c => `
      <div class="clinica-card anim"><img src="img/clinicas/${c.img}" alt="${c.nombre}"><div class="cnom">${c.nombre}<span>${c.ciudad}</span></div></div>`).join(''),
    grid_clinicas_movil: clinicasParaCtx().map(c => `
      <div class="h-clinica"><img src="img/clinicas/${c.img}" alt="${c.nombre}"><div class="n">${c.nombre}</div></div>`).join(''),
    viajes_texto: viajes.deck, viajes_texto_movil: viajes.story,
  };
  /* render de un slide administrado, en su versión deck o story */
  const R = (id, modo) => CMP.renderHtml(CMP.htmlDe(id)[modo], CTX);

  const DEFS = {

    portada: {
      deck: `
        <img class="foto-fondo kb" src="img/ppt/image1.jpeg" alt="">
        <div class="velo-izq"></div><div class="velo-abajo"></div>
        <img class="logo-arriba" src="img/colmedica-logo-white.png" alt="Colmédica">
        <div class="lienzo">
          <span class="pill anim">Presentación exclusiva · ${CMP.fmtFecha(P.f)}</span>
          <h1 class="titulo anim"${P.c.length > 22 ? ' style="font-size:5cqi"' : ''}>Hola, ${P.c}<span class="punto">.</span></h1>
          <p class="sub anim">Preparamos esta propuesta pensando en lo más importante: <b>la salud de quienes más quieres</b>.</p>
          <div class="asesor-chip anim">
            <span class="ava">${iniciales(P.a.n)}</span>
            <span class="quien"><b>${P.a.n}</b><span>${P.a.cg} · Colmédica</span></span>
          </div>
        </div>`,
      story: {
        img: 'img/flux/portada-v.jpg',
        html: `
          <span class="h-pill h-anim">Presentación exclusiva</span>
          <h1 class="h-titulo h-anim">Hola, ${P.c}<span class="punto">.</span></h1>
          <p class="h-sub h-anim">${primerNombre} preparó esta propuesta de Colmédica pensando en ti. Toca para avanzar →</p>`,
      },
    },

    elegir: {
      deck: R('elegir', 'deck'),
      story: { img: 'img/flux/elegir-v.jpg', html: R('elegir', 'story') },
    },

    portafolio: {
      deck: R('portafolio', 'deck'),
      story: { img: 'img/flux/portafolio-v.jpg', html: R('portafolio', 'story') },
    },

    plan: {
      deck: `
        <div class="grano"></div>
        <div class="lienzo">
          <div class="split">
            <div class="col-txt">
              <span class="badge-reco anim">⭐ Recomendado para ${P.tr === 'Familia' ? 'tu familia' : 'ti'}</span>
              <div class="plan-card-hero anim">
                <div class="gama-mini">${plan.gama}</div>
                <div class="pnom">Plan ${plan.nombre}<span class="punto">.</span></div>
                <p class="pclaim">${plan.claim}</p>
                <div class="checks">
                  ${plan.bullets.slice(0, 5).map(b => `<div class="check">${b}</div>`).join('')}
                </div>
              </div>
            </div>
            <div class="foto-panel anim" style="aspect-ratio:auto;width:min(100%,31cqi);height:37cqi;margin:0 auto"><img src="img/flux/plan-v.jpg" alt=""></div>
          </div>
        </div>`,
      story: {
        img: 'img/flux/plan-v.jpg',
        html: `
          <span class="h-pill h-anim">⭐ Nuestra recomendación</span>
          <h2 class="h-titulo h-anim">Plan ${plan.nombre}<span class="punto">.</span></h2>
          <p class="h-sub h-anim">${plan.claim}</p>
          <div class="h-lista">
            ${plan.bullets.slice(0, 3).map(b => `<div class="h-item h-anim"><span class="hico">✓</span><span>${b}</span></div>`).join('')}
          </div>`,
      },
    },

    red: {
      deck: R('red', 'deck'),
      story: { img: 'img/flux/red-v.jpg', html: R('red', 'story') },
    },

    clinicas: {
      deck: R('clinicas', 'deck'),
      story: { img: 'img/flux/clinicas-v.jpg', html: R('clinicas', 'story') },
    },

    app: {
      deck: R('app', 'deck'),
      story: { img: 'img/flux/app-v.jpg', html: R('app', 'story') },
    },

    beneficios: {
      deck: R('beneficios', 'deck'),
      story: { img: 'img/flux/beneficios-v.jpg', html: R('beneficios', 'story') },
    },

    testimonios: {
      deck: R('testimonios', 'deck'),
      story: { video: 'video/testimonio-erica.mp4', poster: 'video/testimonio-erica.jpg', html: R('testimonios', 'story') },
    },

    propuesta: {
      deck: `
        <img class="foto-fondo" src="img/flux/propuesta-h.jpg" alt="" style="opacity:.5">
        <div class="velo-izq" style="background:linear-gradient(100deg,rgba(2,28,56,.94) 30%,rgba(2,28,56,.72) 100%)"></div>
        <div class="lienzo">
          <span class="pill anim">Propuesta económica</span>
          <h2 class="titulo anim" style="font-size:${('Plan ' + plan.nombre + ' para ' + P.c).length > 45 ? 3.2 : 4.2}cqi">Plan ${plan.nombre} para ${P.c}<span class="punto">.</span></h2>
          <div class="prop-grid">
            <div>
              <div class="prop-bens${bens.length > 3 ? ' compacto' : ''}">${bensFilas}</div>
              <div class="prop-total anim">
                <div><div class="etq">Cuota total mensual</div><div class="monto">${CMP.fmtCOP(total)}<small> /mes</small></div></div>
                ${P.d ? `<div class="prop-desc"><b>${P.d}% de descuento</b><br>por pago anual anticipado</div>` : ''}
              </div>
            </div>
            <div class="prop-lateral">
              ${notasLimpias ? `<div class="prop-caja notas anim"><div class="ptit">Notas de tu asesor${P.a.n ? ' · ' + primerNombre : ''}</div><div class="ptxt">${notasLimpias}</div></div>`
                : `<div class="prop-caja anim"><div class="ptit">Incluye</div><div class="ptxt">${plan.bullets.slice(0, 3).map(b => '· ' + b).join('<br>')}</div></div>`}
              <div class="prop-caja vigencia anim"><div class="ptit">Vigencia de la propuesta</div><div class="pfecha">Hasta el ${CMP.fmtFecha(P.vg)}</div></div>
            </div>
          </div>
          <div class="letra-mini anim">Valores mensuales por beneficiario según edad y plan seleccionado. Aplican condiciones contractuales. Prototipo de demostración: cifras no oficiales.</div>
        </div>`,
      story: {
        img: 'img/flux/propuesta-v.jpg',
        html: `
          <span class="h-pill h-anim">Propuesta económica</span>
          <h2 class="h-titulo h-anim" style="font-size:1.7rem">Plan ${plan.nombre}<span class="punto">.</span></h2>
          <div class="h-lista">
            ${bensStory.map(b => `<div class="h-item h-anim"><div class="h-fila-monto" style="width:100%"><span><b>${b.n}</b>${b.edad ? ' · ' + b.edad + ' años' : ''}</span><span class="monto">${CMP.fmtCOP(b.v)}</span></div></div>`).join('')}
            <div class="h-item total h-anim"><span><b>Total mensual</b></span><span class="monto">${CMP.fmtCOP(total)}</span></div>
          </div>
          <p class="h-sub h-anim" style="font-size:.8rem;opacity:.75;margin-top:.7rem">${P.d ? `<b>${P.d}% dcto.</b> por pago anual · ` : ''}Vigente hasta el ${CMP.fmtFecha(P.vg)}</p>`,
      },
    },

    cierre: {
      deck: R('cierre', 'deck'),
      story: { img: 'img/flux/cierre-v.jpg', html: R('cierre', 'story') },
    },
  };

  const slides = ordenSlides.filter(id => DEFS[id]);

  /* ============================================================
     RENDER DECK (desktop)
     ============================================================ */
  const marco = $('#deck-marco');
  let idx = 0;

  slides.forEach((id, i) => {
    const s = document.createElement('section');
    s.className = `slide s-${id}`;
    s.dataset.id = id;
    s.innerHTML = DEFS[id].deck + `
      <div class="barra-roja"></div>
      <div class="firma"><img src="img/colmedica-logo-white.png" alt="Colmédica"><span class="tag">te queremos<br>bien<b>.</b></span></div>
      <span class="vigilado">Vigilado Supersalud</span>`;
    marco.appendChild(s);
  });

  const puntos = $('#puntos');
  slides.forEach((id, i) => {
    const b = document.createElement('button');
    b.className = 'punto-nav';
    b.setAttribute('aria-label', `Ir al slide ${i + 1}`);
    b.addEventListener('click', () => irA(i));
    puntos.appendChild(b);
  });

  function pausarVideos(raiz) {
    $$('video', raiz).forEach(v => { v.pause(); });
    $$('[data-video]', raiz).forEach(m => m.classList.remove('reproduciendo'));
  }

  function irA(n) {
    idx = Math.max(0, Math.min(slides.length - 1, n));
    $$('.slide', marco).forEach((s, i) => {
      const activo = i === idx;
      if (!activo && s.classList.contains('activo')) pausarVideos(s);
      s.classList.toggle('activo', activo);
      if (activo) animarCifras(s);
    });
    $$('.punto-nav', puntos).forEach((p, i) => p.classList.toggle('activo', i === idx));
    $('#contador').textContent = `${String(idx + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    $('#prog-relleno').style.width = ((idx + 1) / slides.length * 100) + '%';
  }

  /* navegación por clic: clic avanza; el borde izquierdo (18%) retrocede.
     Los elementos interactivos (links, video, puntos) no navegan. */
  marco.addEventListener('click', (e) => {
    if (document.body.dataset.modo !== 'desktop') return;
    if (e.target.closest('a,button,video,.video-marco,.puntos,input')) return;
    const r = marco.getBoundingClientRect();
    irA((e.clientX - r.left) < r.width * 0.18 ? idx - 1 : idx + 1);
  });

  document.addEventListener('keydown', (e) => {
    if (document.body.dataset.modo !== 'desktop') return;
    // no secuestrar Espacio mientras el cliente controla el video del testimonio
    if (e.key === ' ' && (e.target.tagName === 'VIDEO' || marco.querySelector('.slide.activo [data-video].reproduciendo'))) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); irA(idx + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); irA(idx - 1); }
    if (e.key === 'Home') irA(0);
    if (e.key === 'End') irA(slides.length - 1);
  });

  /* wheel: solo gestos nuevos (delta creciente o pausa), para que la inercia del trackpad no dé doble salto */
  let wheelLock = 0, dPrev = 0, tPrev = 0;
  document.addEventListener('wheel', (e) => {
    if (document.body.dataset.modo !== 'desktop') return;
    const t = Date.now();
    const d = Math.abs(e.deltaY);
    const nuevoGesto = d > dPrev * 1.2 || t - tPrev > 200;
    dPrev = d; tPrev = t;
    if (d < 24 || !nuevoGesto || t - wheelLock < 900) return;
    wheelLock = t;
    irA(idx + (e.deltaY > 0 ? 1 : -1));
  }, { passive: true });

  /* videos deck: play al tocar */
  $$('[data-video]', marco).forEach(m => {
    const v = $('video', m);
    $('.video-play', m).addEventListener('click', () => {
      m.classList.add('reproduciendo');
      v.controls = true;
      v.play();
    });
    v.addEventListener('pause', () => { if (v.currentTime < v.duration) m.classList.remove('reproduciendo'); });
    v.addEventListener('play', () => m.classList.add('reproduciendo'));
  });

  /* ============================================================
     RENDER HISTORIAS (móvil)
     ============================================================ */
  const cont = $('#historias');
  let hIdx = 0;

  const prog = document.createElement('div');
  prog.className = 'h-progreso';
  prog.innerHTML = slides.map(() => '<span class="h-seg"><span class="fill"></span></span>').join('');
  cont.appendChild(prog);

  const cab = document.createElement('div');
  cab.className = 'h-cab';
  cab.innerHTML = `<img src="img/colmedica-logo-white.png" alt="Colmédica"><span class="paso" id="h-paso"></span>`;
  cont.appendChild(cab);

  slides.forEach((id, i) => {
    const def = DEFS[id].story;
    const p = document.createElement('section');
    p.className = `panel-historia ph-${id}`;
    if (def.video) {
      p.innerHTML = `
        <div class="h-video" data-video>
          <video src="${def.video}" poster="${def.poster}" playsinline preload="none"></video>
          <button class="video-play" aria-label="Reproducir"><span class="circulo">▶</span></button>
        </div>
        <span class="h-video-vigilado">Vigilado Supersalud</span>
        <div class="h-scrim" style="pointer-events:none"></div>
        <div class="h-contenido">${def.html}</div>`;
    } else {
      p.innerHTML = `
        <img class="h-fondo" src="${def.img}" alt="">
        <div class="h-scrim"></div>
        <div class="h-contenido">${def.html}</div>`;
    }
    cont.appendChild(p);
  });

  const zonas = document.createElement('div');
  zonas.className = 'h-zonas';
  zonas.innerHTML = `<button aria-label="Anterior"></button><button aria-label="Siguiente"></button>`;
  cont.appendChild(zonas);
  const [zIzq, zDer] = $$('button', zonas);
  zIzq.addEventListener('click', () => irH(hIdx - 1));
  zDer.addEventListener('click', () => irH(hIdx + 1));

  const asesorBar = document.createElement('div');
  asesorBar.className = 'h-asesor';
  asesorBar.innerHTML = `
    <span class="ava">${iniciales(P.a.n)}</span>
    <span class="quien"><b>${P.a.n}</b><span>${P.a.cg} · Colmédica</span></span>
    <a class="wa" href="${waLink()}" target="_blank" rel="noopener">💬 Escribir</a>`;
  cont.appendChild(asesorBar);

  let touchX = null, touchY = null;
  cont.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
  cont.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) irH(hIdx + (dx < 0 ? 1 : -1));
    touchX = null; touchY = null;
  }, { passive: true });

  function irH(n) {
    hIdx = Math.max(0, Math.min(slides.length - 1, n));
    $$('.panel-historia', cont).forEach((p, i) => {
      const activo = i === hIdx;
      if (!activo && p.classList.contains('activo')) pausarVideos(p);
      p.classList.toggle('activo', activo);
      if (activo) animarCifras(p);
    });
    $$('.h-seg', prog).forEach((s, i) => {
      s.classList.toggle('hecho', i < hIdx);
      s.classList.toggle('activo', i === hIdx);
    });
    $('#h-paso').textContent = `${hIdx + 1} / ${slides.length}`;
    asesorBar.style.display = slides[hIdx] === 'cierre' ? 'none' : 'flex';
  }

  $$('.h-video [data-video], .h-video', cont).forEach(m => {
    const v = $('video', m);
    const btn = $('.video-play', m);
    if (!v || !btn) return;
    btn.addEventListener('click', () => {
      m.classList.add('reproduciendo');
      v.controls = true;
      v.play();
    });
    v.addEventListener('play', () => m.classList.add('reproduciendo'));
    v.addEventListener('pause', () => { if (v.currentTime < v.duration) m.classList.remove('reproduciendo'); });
  });

  /* ---------- Toggle de modo (demo) ---------- */
  const toggle = $('#modo-toggle');
  const pintarToggle = () => {
    toggle.innerHTML = modo === 'desktop' ? '📱 Ver versión móvil' : '🖥️ Ver versión desktop';
  };
  toggle.addEventListener('click', () => {
    modo = modo === 'desktop' ? 'movil' : 'desktop';
    document.body.dataset.modo = modo;
    pintarToggle();
    pausarVideos(document);
    if (modo === 'desktop') irA(idx); else irH(hIdx);
  });
  pintarToggle();

  /* ============================================================
     DESCARGAR PDF — genera un archivo real desde el mismo HTML:
     cada slide se renderiza a imagen de alta resolución con el CSS
     del visor y se arma un PDF de una página 16:9 por slide.
     ============================================================ */
  const cargarScript = (src) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = () => rej(new Error('No cargó ' + src));
    document.head.appendChild(s);
  });

  let libsPdf = null;
  async function asegurarLibsPdf() {
    if (libsPdf) return libsPdf;
    if (!window.htmlToImage) await cargarScript('js/vendor/html-to-image.js');
    if (!window.jspdf) await cargarScript('js/vendor/jspdf.umd.min.js');
    libsPdf = { hti: window.htmlToImage, jsPDF: window.jspdf.jsPDF };
    return libsPdf;
  }

  async function descargarPdf() {
    const btn = $('#btn-pdf');
    if (btn.dataset.ocupado) return;
    btn.dataset.ocupado = '1';

    const overlay = document.createElement('div');
    overlay.className = 'pdf-overlay';
    overlay.innerHTML = `<div class="pdf-caja"><span class="pdf-spin"></span><span><b>Generando tu PDF…</b><br><span class="estado" id="pdf-estado">Preparando</span></span></div>`;
    document.body.appendChild(overlay);
    const estado = $('#pdf-estado', overlay);

    try {
      const { hti, jsPDF } = await asegurarLibsPdf();
      pausarVideos(document);
      document.body.classList.add('modo-pdf');

      /* contadores en su valor final para la captura */
      $$('[data-cuenta]', marco).forEach(el => {
        el.childNodes[0].textContent = Number(el.dataset.cuenta).toLocaleString('es-CO');
      });

      /* fuentes embebidas una sola vez (si falla, se captura con fallback) */
      let fuenteCss = '';
      try { fuenteCss = await hti.getFontEmbedCSS(marco); } catch (e) { /* sin fuente embebida */ }

      const slidesEls = $$('.slide', marco);
      const rect = marco.getBoundingClientRect();
      const ratio = Math.max(2, 2400 / rect.width);
      const PAGINA = [338.7, 190.5]; // 16:9 en mm
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: PAGINA, compress: true });

      for (let i = 0; i < slidesEls.length; i++) {
        const s = slidesEls[i];
        estado.textContent = `Slide ${i + 1} de ${slidesEls.length}`;
        s.classList.add('pdf-captura');
        /* dejar que el navegador aplique los estilos de captura antes de clonar */
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        /* los videos se capturan mostrando su poster */
        const swaps = [];
        $$('video', s).forEach(v => {
          const img = document.createElement('img');
          img.src = v.poster;
          img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1';
          v.style.visibility = 'hidden';
          v.parentElement.insertBefore(img, v);
          swaps.push({ v, img });
        });

        try {
          const jpg = await hti.toJpeg(s, { pixelRatio: ratio, quality: 0.93, fontEmbedCSS: fuenteCss, backgroundColor: '#032a52' });
          if (i > 0) pdf.addPage(PAGINA, 'landscape');
          pdf.addImage(jpg, 'JPEG', 0, 0, PAGINA[0], PAGINA[1], undefined, 'FAST');
        } finally {
          swaps.forEach(({ v, img }) => { img.remove(); v.style.visibility = ''; });
          s.classList.remove('pdf-captura');
        }
      }

      estado.textContent = 'Guardando archivo…';
      const nombre = (P.c || 'cliente').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w -]/g, '').trim().replace(/\s+/g, '-');
      pdf.save(`Colmedica-Propuesta-${nombre}.pdf`);
    } catch (e) {
      console.error('PDF:', e);
      alert('No fue posible generar el PDF. Intenta de nuevo o usa Imprimir (Ctrl+P) como alternativa.');
    } finally {
      document.body.classList.remove('modo-pdf');
      delete btn.dataset.ocupado;
      overlay.remove();
    }
  }

  $('#btn-pdf').addEventListener('click', descargarPdf);

  /* ============================================================
     BIENVENIDA — "estamos creando tu propuesta comercial"
     ============================================================ */
  const carga = $('#carga');
  const saludo = /^(Familia|Empresa)$/.test(P.tr) ? 'Bienvenidos'
    : /^(Sra\.|Dra\.)$/.test(P.tr) ? 'Bienvenida' : 'Bienvenido';
  $('.carga-titulo', carga).firstChild.textContent = '¡' + saludo;
  $('#carga-nombre').textContent = P.c ? ', ' + P.c : '';
  const MENSAJES_CARGA = [
    'Personalizando tu plan ' + plan.nombre,
    'Ajustando los valores acordados',
    'Dando los últimos toques',
  ];
  let msgIdx = 0;
  const detalle = $('#carga-detalle');
  const rotarMsg = setInterval(() => {
    msgIdx++;
    if (msgIdx >= MENSAJES_CARGA.length) return;
    detalle.classList.add('cambia');
    setTimeout(() => { detalle.textContent = MENSAJES_CARGA[msgIdx]; detalle.classList.remove('cambia'); }, 300);
  }, 1000);
  detalle.textContent = MENSAJES_CARGA[0];

  setTimeout(() => {
    clearInterval(rotarMsg);
    carga.classList.add('oculto');
    setTimeout(() => carga.remove(), 800);
    /* primera visita: mostrar cómo navegar */
    let visto = null;
    try { visto = localStorage.getItem('cmp_tour_v1'); } catch (e) { /* sin storage */ }
    if (!visto) mostrarTour();
  }, 3100);

  /* ============================================================
     WALKTHROUGH — cómo navegar la presentación
     ============================================================ */
  function pasosTour() {
    if (document.body.dataset.modo === 'movil') {
      return [
        { icono: '👆', titulo: 'Navega con un toque', texto: 'Toca el <b>lado derecho</b> de la pantalla para avanzar y el <b>lado izquierdo</b> para volver. También puedes deslizar.' },
        { icono: '📊', titulo: 'Tu avance', texto: 'Las barras de arriba te muestran en qué parte de la presentación vas.' },
        { icono: '💬', titulo: 'Tu asesor, siempre abajo', texto: 'En la parte inferior está el botón para <b>escribirle por WhatsApp</b> a tu asesor en cualquier momento.' },
      ];
    }
    return [
      { icono: '🖱️', titulo: 'Navega con un clic', texto: 'Haz <b>clic en la pantalla</b> para avanzar al siguiente slide, o usa las <b>flechas ← → del teclado</b>. El borde izquierdo te devuelve.' },
      { icono: '⚪', titulo: 'Salta a donde quieras', texto: 'Los <b>puntos de abajo</b> muestran tu avance: haz clic en cualquiera para ir directo a ese slide.' },
      { icono: '📄', titulo: 'Llévatela contigo', texto: 'Arriba a la izquierda puedes <b>descargar la propuesta en PDF</b>, y arriba a la derecha verla en <b>versión móvil</b>.' },
      { icono: '💬', titulo: 'Habla con tu asesor', texto: 'En el último slide encontrarás el <b>WhatsApp de tu asesor</b> para resolver cualquier duda al instante.' },
    ];
  }

  function mostrarTour() {
    if ($('.tour')) return;
    const pasos = pasosTour();
    let pi = 0;
    const t = document.createElement('div');
    t.className = 'tour';
    t.innerHTML = `
      <div class="tour-card">
        <span class="tour-icono"></span>
        <div class="tour-titulo"></div>
        <p class="tour-texto"></p>
        <div class="tour-pasos">${pasos.map(() => '<span></span>').join('')}</div>
        <div class="tour-botones">
          <button class="tour-btn saltar" data-saltar>Saltar</button>
          <button class="tour-btn principal" data-sig>Siguiente</button>
        </div>
      </div>`;
    document.body.appendChild(t);

    const pintar = () => {
      const p = pasos[pi];
      $('.tour-icono', t).textContent = p.icono;
      $('.tour-titulo', t).textContent = p.titulo;
      $('.tour-texto', t).innerHTML = p.texto;
      $$('.tour-pasos span', t).forEach((s, i) => s.classList.toggle('activo', i === pi));
      $('[data-sig]', t).textContent = pi === pasos.length - 1 ? '¡Empezar! 🚀' : 'Siguiente';
      $('[data-saltar]', t).style.visibility = pi === pasos.length - 1 ? 'hidden' : 'visible';
    };
    const cerrar = () => {
      try { localStorage.setItem('cmp_tour_v1', '1'); } catch (e) { /* sin storage */ }
      t.remove();
    };
    $('[data-sig]', t).addEventListener('click', () => {
      if (pi === pasos.length - 1) { cerrar(); return; }
      pi++; pintar();
    });
    $('[data-saltar]', t).addEventListener('click', cerrar);
    pintar();
  }

  $('#btn-ayuda').addEventListener('click', mostrarTour);

  /* ---------- Inicio ---------- */
  irA(0);
  irH(0);

  /* si pegan otro link sobre la misma página, recargar con el payload nuevo */
  window.addEventListener('hashchange', () => location.reload());
})();
