/* ============================================================
   Colmédica Presenta — datos demo compartidos
   Prototipo conceptual. Cifras y precios de demostración.
   ============================================================ */

const CMP = (() => {

  /* ---------- Catálogo de planes (contenido tomado de la PPT corporativa) ---------- */
  const PLANES = [
    {
      id: 'diamante', nombre: 'Diamante Élite Superior', gama: 'Respaldo Superior',
      color: '#032a52', gem: '💎',
      claim: 'El plan más completo de Colmédica, con la red VIP más exclusiva del país.',
      bullets: [
        'Red de Atención VIP: acceso a las clínicas de más alto prestigio del país',
        'Centro Médico exclusivo en Usaquén, además de todos los Centros Médicos Colmédica',
        'Libre elección: reembolso por atención fuera de la guía médica propia',
        'Ahorro Directo: reembolsos para copagos y cuotas moderadoras',
        'Auxilio diario por hospitalización y auxilio de nueva tecnología',
        'Asistencia médica en viajes internacionales hasta USD 50.000 / EUR 35.000',
      ],
      desde: 980000,
    },
    {
      id: 'zafiro', nombre: 'Zafiro Élite', gama: 'Respaldo Superior',
      color: '#0058A2', gem: '🔷',
      claim: 'Respaldo superior con acceso VIP y cobertura pensada para tu familia.',
      bullets: [
        'Red de Atención VIP: clínicas de más alto prestigio del país',
        'Centro Médico exclusivo Zafiro Usaquén en Bogotá',
        'Asistencia médica en viajes internacionales',
        'Acceso a los 35 Centros Médicos Colmédica del país',
        'Más de 100 especialidades y subespecialidades médicas',
      ],
      desde: 760000,
    },
    {
      id: 'rubi', nombre: 'Rubí Élite', gama: 'Ambulatorio + Hospitalario',
      color: '#8e1f2f', gem: '❤️',
      claim: 'Coberturas ambulatorias y hospitalarias para un cuidado óptimo de tu salud.',
      bullets: [
        'Red de atención preferente con protección diferencial',
        '34 de los 35 Centros Médicos Colmédica del país',
        'Red hospitalaria preferente',
        'Más de 4.400 profesionales adscritos',
        'Más de 100 especialidades y subespecialidades médicas',
      ],
      desde: 520000,
    },
    {
      id: 'esmeralda', nombre: 'Esmeralda Élite', gama: 'Ambulatorio + Hospitalario',
      color: '#0e6e5c', gem: '💚',
      claim: 'Protección completa en municipios aledaños a Bogotá y otras ciudades del país.',
      bullets: [
        'Coberturas ambulatorias y hospitalarias',
        'Red de atención preferente',
        'Acceso a Centros Médicos Colmédica',
        'Más de 100 especialidades médicas',
      ],
      desde: 430000,
    },
    {
      id: 'ambar', nombre: 'Ámbar Vital', gama: 'Hospitalario',
      color: '#8a5712', gem: '🟠',
      claim: 'Protección hospitalaria con acceso directo a 4 clínicas VIP nacionales.',
      bullets: [
        'Red hospitalaria preferente',
        'Acceso directo a 4 clínicas VIP nacionales',
        'Se comercializa fuera de Bogotá y municipios aledaños',
        'Excluye maternidad y alto costo',
      ],
      desde: 310000,
    },
    {
      id: 'caobo', nombre: 'Caobo Integral', gama: 'Hospitalario',
      color: '#5b3a24', gem: '🟤',
      claim: 'Cobertura hospitalaria esencial en Bogotá y Chía, con urgencias a nivel nacional.',
      bullets: [
        'Red hospitalaria esencial',
        'Cobertura en Bogotá y Chía',
        'Urgencias a nivel nacional',
        'Incluye maternidad y alto costo',
      ],
      desde: 285000,
    },
    {
      id: 'esmeralda-amb', nombre: 'Esmeralda Ambulatorio', gama: 'Planes Livianos',
      color: '#009FE3', gem: '🩺',
      claim: 'Acceso ágil a más de 100 especialidades sin límite, al alcance de tu bolsillo.',
      bullets: [
        'Más de 100 especialidades sin límite de consultas',
        'Odontología preventiva y exámenes especializados',
        'Terapias y médico general a domicilio',
        'Se comercializa a nivel nacional',
      ],
      desde: 165000,
    },
    {
      id: 'domiciliario', nombre: 'Domiciliario Superior', gama: 'Planes Livianos',
      color: '#4fb8ea', gem: '🏠',
      claim: 'Tu médico en casa: atención domiciliaria y virtual de acceso directo.',
      bullets: [
        'Médico general a domicilio',
        'Acceso directo a 13 especialidades y psicología',
        'Consultas presenciales o virtuales',
        'Se comercializa a nivel nacional',
      ],
      desde: 98000,
    },
  ];

  /* ---------- Catálogo de slides ---------- */
  /* tipo: 'fijo' = estándar del guion (el admin edita sus textos) · 'opcional' = el admin lo activa/desactiva
     · 'auto' = se arma solo con los datos del cliente/plan · 'libre' = slide de libre uso del comercial */
  const SLIDES = [
    { id: 'portada',     nombre: 'Portada personalizada',        tipo: 'auto',     desc: 'Saludo con el nombre del cliente y datos del asesor.', icon: '👋' },
    { id: 'elegir',      nombre: 'Elegir Colmédica',             tipo: 'fijo',     desc: '35 años de respaldo, cifras de compañía.', icon: '🏛️' },
    { id: 'portafolio',  nombre: 'Portafolio de planes',         tipo: 'fijo',     desc: 'Las 4 gamas de soluciones en salud.', icon: '🗂️' },
    { id: 'plan',        nombre: 'Plan recomendado',             tipo: 'auto',     desc: 'El plan elegido para el cliente, con sus coberturas.', icon: '⭐' },
    { id: 'red',         nombre: 'Red de atención',              tipo: 'fijo',     desc: '35 Centros Médicos, cifras de infraestructura.', icon: '🏥' },
    { id: 'clinicas',    nombre: 'Mejores clínicas del país',    tipo: 'opcional', desc: 'Galería de clínicas de la red por ciudad.', icon: '🏨' },
    { id: 'app',         nombre: 'App y canales digitales',      tipo: 'opcional', desc: 'App Colmédica, telemedicina y orientación 24/7.', icon: '📱' },
    { id: 'beneficios',  nombre: 'Beneficios exclusivos',        tipo: 'opcional', desc: 'Viajes, bebé en gestación, amparo garantizado.', icon: '🎁' },
    { id: 'testimonios', nombre: 'Historias que hacen bien',     tipo: 'opcional', desc: 'Video testimonial real de usuarios.', icon: '🎬' },
    { id: 'propuesta',   nombre: 'Resumen de cotización',        tipo: 'libre',    desc: 'El slide de libre uso del comercial: valores acordados, beneficiarios y vigencia.', icon: '📝' },
    { id: 'cierre',      nombre: 'Cierre y contacto',            tipo: 'fijo',     desc: 'CTA de contacto directo con el asesor.', icon: '🤝' },
  ];

  /* ---------- Comerciales demo ---------- */
  const COMERCIALES = [
    { id: 'cperez',  nombre: 'Carolina Pérez',  cargo: 'Ejecutiva Comercial Senior', ciudad: 'Bogotá',       cel: '311 456 7890', color: '#0058A2', ini: 'CP' },
    { id: 'arojas',  nombre: 'Andrés Rojas',    cargo: 'Ejecutivo Comercial',        ciudad: 'Medellín',     cel: '315 222 8844', color: '#0e6e5c', ini: 'AR' },
    { id: 'lgomez',  nombre: 'Laura Gómez',     cargo: 'Gerente de Cuentas',         ciudad: 'Barranquilla', cel: '300 987 1234', color: '#8e1f2f', ini: 'LG' },
  ];

  /* Administrador del guion corporativo (rol distinto: gestiona las versiones HTML de los slides) */
  const ADMIN = { id: 'admin', nombre: 'Milena Duarte', cargo: 'Administradora del guion corporativo', ciudad: 'Bogotá', cel: '310 000 0000', color: '#021c38', ini: 'MD', rol: 'admin' };

  /* ============================================================
     PLANTILLAS HTML DE LOS SLIDES ESTÁNDAR
     El rol admin administra este HTML (versión desktop y móvil).
     Variables disponibles: se reemplazan al renderizar — ver TOKENS.
     ============================================================ */
  const TOKENS = [
    { t: '{{cliente}}',              d: 'Nombre del cliente' },
    { t: '{{ciudad}}',               d: 'Ciudad del cliente' },
    { t: '{{fecha}}',                d: 'Fecha de la presentación' },
    { t: '{{plan_nombre}}',          d: 'Plan recomendado' },
    { t: '{{plan_gama}}',            d: 'Gama del plan' },
    { t: '{{asesor_nombre}}',        d: 'Nombre del asesor' },
    { t: '{{asesor_primer_nombre}}', d: 'Primer nombre del asesor' },
    { t: '{{asesor_cargo}}',         d: 'Cargo del asesor' },
    { t: '{{asesor_celular}}',       d: 'Celular del asesor' },
    { t: '{{asesor_iniciales}}',     d: 'Iniciales del asesor' },
    { t: '{{whatsapp_link}}',        d: 'Link de WhatsApp del asesor' },
    { t: '{{telefono_link}}',        d: 'Link tel: del asesor' },
    { t: '{{grid_clinicas}}',        d: 'Galería de clínicas (desktop)' },
    { t: '{{grid_clinicas_movil}}',  d: 'Galería de clínicas (móvil)' },
    { t: '{{viajes_texto}}',         d: 'Cobertura de viajes según plan (desktop)' },
    { t: '{{viajes_texto_movil}}',   d: 'Cobertura de viajes según plan (móvil)' },
  ];

  const SLIDE_HTML = {
    elegir: {
      deck: `<div class="grano"></div>
<div class="lienzo">
  <div class="split">
    <div class="col-txt">
      <span class="pill anim">Quiénes somos</span>
      <h2 class="titulo anim">Elegir Colmédica<span class="punto">,</span></h2>
      <p class="sub anim">es hacer parte de una de las principales compañías de <b>medicina prepagada</b> del país, con más de <b>35 años en el mercado</b> y un modelo de servicio donde nuestros usuarios son el centro de todo.</p>
    </div>
    <div class="foto-panel anim"><img src="img/ppt/image112.jpeg" alt="Edificio Colmédica"></div>
  </div>
  <div class="cifras-fila">
    <div class="cifra anim"><div class="num" data-cuenta="35">0<small> años</small></div><div class="lbl">de experiencia en el país</div></div>
    <div class="cifra anim"><div class="num" data-cuenta="4400">0<small>+</small></div><div class="lbl">profesionales adscritos</div></div>
    <div class="cifra anim"><div class="num" data-cuenta="35">0</div><div class="lbl">Centros Médicos y de Diagnóstico</div></div>
    <div class="cifra anim"><div class="num" data-cuenta="100">0<small>+</small></div><div class="lbl">especialidades médicas</div></div>
  </div>
</div>`,
      story: `<span class="h-pill h-anim">Quiénes somos</span>
<h2 class="h-titulo h-anim">Elegir Colmédica<span class="punto">.</span></h2>
<p class="h-sub h-anim">Más de <b>35 años</b> cuidando la salud de los colombianos.</p>
<div class="h-cifras h-anim">
  <div class="h-cifra"><div class="num" data-cuenta="35">0</div><div class="lbl">años de experiencia</div></div>
  <div class="h-cifra"><div class="num" data-cuenta="4400">0<small>+</small></div><div class="lbl">profesionales</div></div>
  <div class="h-cifra"><div class="num" data-cuenta="35">0</div><div class="lbl">Centros Médicos</div></div>
  <div class="h-cifra"><div class="num" data-cuenta="100">0<small>+</small></div><div class="lbl">especialidades</div></div>
</div>`,
    },

    portafolio: {
      deck: `<div class="grano"></div>
<div class="lienzo">
  <span class="pill anim">Portafolio</span>
  <h2 class="titulo anim">Soluciones en salud para <span class="vital">cada momento de la vida</span><span class="punto">.</span></h2>
  <div class="gamas">
    <div class="gama-card anim" style="--gcolor:#7ec8ff"><div class="gico">💎</div><div class="gnom">Respaldo Superior</div><div class="gplanes"><b>Diamante Élite Superior</b><br>Zafiro Élite · Zafiro Exclusivo<br>Red VIP y libre elección</div></div>
    <div class="gama-card anim" style="--gcolor:#ff8a93"><div class="gico">🏥</div><div class="gnom">Ambulatorio + Hospitalario</div><div class="gplanes"><b>Rubí Élite · Rubí Integral</b><br>Esmeralda Élite<br>Red preferente</div></div>
    <div class="gama-card anim" style="--gcolor:#ffc46b"><div class="gico">🛏️</div><div class="gnom">Hospitalarios</div><div class="gplanes"><b>Ámbar Vital · Caobo Integral</b><br>Urgencias, hospitalización<br>y cirugía</div></div>
    <div class="gama-card anim" style="--gcolor:#7ef0c8"><div class="gico">🩺</div><div class="gnom">Planes Livianos</div><div class="gplanes"><b>Esmeralda Ambulatorio</b><br>Domiciliario Superior<br>Oncológico Vida Plus</div></div>
  </div>
</div>`,
      story: `<span class="h-pill h-anim">Portafolio</span>
<h2 class="h-titulo h-anim">Un plan para cada momento<span class="punto">.</span></h2>
<div class="h-lista">
  <div class="h-item h-anim"><span class="hico">💎</span><span><b>Respaldo Superior</b> · Diamante y Zafiro, red VIP</span></div>
  <div class="h-item h-anim"><span class="hico">🏥</span><span><b>Ambulatorio + Hospitalario</b> · Rubí y Esmeralda</span></div>
  <div class="h-item h-anim"><span class="hico">🛏️</span><span><b>Hospitalarios</b> · Ámbar y Caobo</span></div>
  <div class="h-item h-anim"><span class="hico">🩺</span><span><b>Planes Livianos</b> · desde opciones muy accesibles</span></div>
</div>`,
    },

    red: {
      deck: `<div class="grano"></div>
<div class="lienzo">
  <div class="split" style="grid-template-columns:1.1fr .9fr">
    <div class="col-txt">
      <span class="pill anim">Infraestructura</span>
      <h2 class="titulo anim">Siempre cerca de ti<span class="punto">.</span></h2>
      <p class="sub anim">Centros Médicos y de Diagnóstico operados por UMD en las principales ciudades del país.</p>
      <div class="cifras-grid">
        <div class="cifra anim"><div class="num" data-cuenta="35">0</div><div class="lbl">sedes en el país</div></div>
        <div class="cifra anim"><div class="num" data-cuenta="21">0</div><div class="lbl">sedes en Bogotá y Chía</div></div>
        <div class="cifra anim"><div class="num" data-cuenta="16">0</div><div class="lbl">Centros Odontológicos</div></div>
        <div class="cifra cifra-larga anim"><div class="num" data-cuenta="1332273">0</div><div class="lbl">citas presenciales al año</div></div>
        <div class="cifra cifra-larga anim"><div class="num" data-cuenta="44355">0</div><div class="lbl">citas por telemedicina</div></div>
        <div class="cifra anim"><div class="num" data-cuenta="18">0</div><div class="lbl">especialidades por telemedicina</div></div>
      </div>
    </div>
    <div class="foto-panel anim" style="aspect-ratio:4/4.2"><img src="img/flux/red-h.jpg" alt="Centro Médico"></div>
  </div>
</div>`,
      story: `<span class="h-pill h-anim">Infraestructura</span>
<h2 class="h-titulo h-anim">Siempre cerca de ti<span class="punto">.</span></h2>
<div class="h-cifras h-anim">
  <div class="h-cifra"><div class="num" data-cuenta="35">0</div><div class="lbl">sedes en el país</div></div>
  <div class="h-cifra"><div class="num" data-cuenta="21">0</div><div class="lbl">en Bogotá y Chía</div></div>
  <div class="h-cifra"><div class="num" data-cuenta="1332273">0</div><div class="lbl">citas al año</div></div>
  <div class="h-cifra"><div class="num" data-cuenta="18">0</div><div class="lbl">especialidades tele</div></div>
</div>`,
    },

    clinicas: {
      deck: `<div class="grano"></div>
<div class="lienzo">
  <span class="pill anim">Red hospitalaria</span>
  <h2 class="titulo anim">Atención en las mejores clínicas del país<span class="punto">.</span></h2>
  <div class="clinicas-grid">{{grid_clinicas}}</div>
</div>`,
      story: `<span class="h-pill h-anim">Red hospitalaria</span>
<h2 class="h-titulo h-anim">Las mejores clínicas<span class="punto">.</span></h2>
<p class="h-sub h-anim">Acceso a las instituciones de más alto prestigio del país.</p>
<div class="h-clinicas h-anim">{{grid_clinicas_movil}}</div>`,
    },

    app: {
      deck: `<div class="grano"></div>
<div class="lienzo">
  <div class="split" style="grid-template-columns:.8fr 1.2fr">
    <div class="telefono anim"><img src="img/ppt/image83.jpg" alt="App Colmédica"></div>
    <div class="col-txt">
      <span class="pill anim">Canales de atención</span>
      <h2 class="titulo anim">Tecnología para facilitar tu vida<span class="punto">.</span></h2>
      <div class="features">
        <div class="feature anim"><span class="fico">📱</span><span class="ftxt"><b>App Colmédica</b><span>Más de 30 funcionalidades: citas, autorizaciones, resultados y pagos en un clic.</span></span></div>
        <div class="feature anim"><span class="fico">🎥</span><span class="ftxt"><b>Telemedicina</b><span>Más de 18 especialidades por videollamada desde donde estés.</span></span></div>
        <div class="feature anim"><span class="fico">🩺</span><span class="ftxt"><b>Orientación médica 24/7</b><span>Ilimitada, por llamada o videollamada, todos los días del año.</span></span></div>
      </div>
      <div class="canales-chips anim">
        <span class="canal-chip">WhatsApp</span><span class="canal-chip">Oficina virtual</span><span class="canal-chip">colmedica.com</span><span class="canal-chip">Línea de asistencia</span><span class="canal-chip">Kioskos adulto mayor</span>
      </div>
    </div>
  </div>
</div>`,
      story: `<span class="h-pill h-anim">Canales digitales</span>
<h2 class="h-titulo h-anim">Todo desde tu celular<span class="punto">.</span></h2>
<div class="h-lista">
  <div class="h-item h-anim"><span class="hico">📱</span><span><b>App Colmédica</b> · +30 funcionalidades</span></div>
  <div class="h-item h-anim"><span class="hico">🎥</span><span><b>Telemedicina</b> · 18+ especialidades</span></div>
  <div class="h-item h-anim"><span class="hico">🩺</span><span><b>Orientación médica</b> · ilimitada 24/7</span></div>
  <div class="h-item h-anim"><span class="hico">💬</span><span><b>WhatsApp y oficina virtual</b> por videollamada</span></div>
</div>`,
    },

    beneficios: {
      deck: `<div class="grano"></div>
<div class="lienzo">
  <span class="pill anim">Beneficios exclusivos</span>
  <h2 class="titulo anim">Detalles que hacen la diferencia<span class="punto">.</span></h2>
  <div class="benef-grid">
    <div class="benef-card anim"><div class="bico">✈️</div><div class="bnom">Asistencia en viajes internacionales</div><div class="btxt">{{viajes_texto}}</div></div>
    <div class="benef-card anim"><div class="bico">🤰</div><div class="bnom">Bebé en gestación</div><div class="btxt">Afiliación desde el vientre <b>sin preexistencias ni carencias</b>, solicitándola a más tardar en la semana 25.</div></div>
    <div class="benef-card anim"><div class="bico">🛡️</div><div class="bnom">Amparo garantizado*</div><div class="btxt">Si el contratante fallece, su grupo familiar básico continúa protegido <b>un año sin pagar cuota</b>, solicitándolo dentro del año siguiente.</div></div>
  </div>
  <div class="letra-mini anim">*Beneficios no contractuales, aplican términos y condiciones según el plan. Amparo garantizado: requiere antigüedad mínima de 6 meses del contratante beneficiario.</div>
</div>`,
      story: `<span class="h-pill h-anim">Beneficios exclusivos</span>
<h2 class="h-titulo h-anim">Detalles que hacen la diferencia<span class="punto">.</span></h2>
<div class="h-lista">
  <div class="h-item h-anim"><span class="hico">✈️</span><span>{{viajes_texto_movil}}</span></div>
  <div class="h-item h-anim"><span class="hico">🤰</span><span><b>Bebé en gestación:</b> sin preexistencias</span></div>
  <div class="h-item h-anim"><span class="hico">🛡️</span><span><b>Amparo:</b> 1 año de protección sin cuota</span></div>
</div>`,
    },

    testimonios: {
      deck: `<div class="grano"></div>
<div class="lienzo">
  <div class="split" style="grid-template-columns:1.15fr .85fr">
    <div class="col-txt">
      <span class="pill anim">Historias que hacen bien</span>
      <h2 class="titulo anim">Testimonios reales de nuestros usuarios<span class="punto">.</span></h2>
      <p class="cita anim">“A mí me diagnosticaron cáncer y Colmédica estuvo ahí en cada paso: <b>sin trámites, sin demoras, con calidad humana</b>.”</p>
      <div class="cita-quien anim">Érica · usuaria Colmédica</div>
    </div>
    <div class="video-marco anim" data-video>
      <video src="video/testimonio-erica.mp4" poster="video/testimonio-erica.jpg" playsinline preload="none"></video>
      <span class="video-vigilado">Vigilado Supersalud</span>
      <button class="video-play" aria-label="Reproducir testimonio"><span class="circulo">▶</span></button>
    </div>
  </div>
</div>`,
      story: `<span class="h-pill h-anim">Historias que hacen bien</span>
<h2 class="h-titulo h-anim">Testimonios reales<span class="punto">.</span></h2>
<p class="h-sub h-anim">Toca el video para escuchar la historia de Érica.</p>`,
    },

    cierre: {
      deck: `<img class="foto-fondo kb" src="img/ppt/image202.jpeg" alt="">
<div class="velo-abajo" style="background:linear-gradient(180deg,rgba(2,28,56,.35),rgba(2,28,56,.88))"></div>
<div class="lienzo">
  <img class="logo-centro anim" src="img/colmedica-logo-white.png" alt="Colmédica" style="align-self:center">
  <h2 class="titulo anim" style="align-self:center;text-align:center">te queremos bien<span class="punto">.</span></h2>
  <p class="sub anim" style="align-self:center;text-align:center;max-width:56cqi">{{cliente}}, será un gusto acompañarles. Cualquier duda sobre esta propuesta, hablemos.</p>
  <div class="cta-fila anim">
    <a class="cta cta-wa" href="{{whatsapp_link}}" target="_blank" rel="noopener">💬 Escribir a {{asesor_primer_nombre}} por WhatsApp</a>
    <a class="cta cta-tel" href="{{telefono_link}}">📞 {{asesor_celular}}</a>
  </div>
  <div class="asesor-chip anim">
    <span class="ava">{{asesor_iniciales}}</span>
    <span class="quien"><b>{{asesor_nombre}}</b><span>{{asesor_cargo}} · Colmédica</span></span>
  </div>
</div>`,
      story: `<span class="h-pill h-anim">Hablemos</span>
<h2 class="h-titulo h-anim">te queremos bien<span class="punto">.</span></h2>
<p class="h-sub h-anim">{{cliente}}, {{asesor_primer_nombre}} está a un mensaje de distancia para resolver tus dudas.</p>
<div class="h-ctas h-anim">
  <a class="h-cta wa" href="{{whatsapp_link}}" target="_blank" rel="noopener">💬 Escribir por WhatsApp</a>
  <a class="h-cta tel" href="{{telefono_link}}">📞 Llamar a {{asesor_primer_nombre}}</a>
</div>`,
    },
  };

  /* ---------- Presentaciones semilla ---------- */
  const SEED = [
    {
      id: 'demo-ramirez', asesorId: 'cperez', creada: '2026-08-18', estado: 'enviada', vistas: 12, ultimaVista: '2026-08-24',
      cliente: 'Familia Ramírez', tratamiento: 'Familia', ciudad: 'Bogotá', planId: 'zafiro',
      bens: [
        { n: 'Jorge Ramírez', edad: 42, v: 812000 },
        { n: 'Diana Torres', edad: 39, v: 768000 },
        { n: 'Samuel Ramírez', edad: 9, v: 465000 },
      ],
      descAnual: 8, vigencia: '2026-09-30',
      notas: 'Incluye continuidad de antigüedad desde su plan anterior. Primera cuota con 50% de descuento por campaña de agosto.',
      slides: ['portada', 'elegir', 'portafolio', 'plan', 'red', 'clinicas', 'app', 'testimonios', 'propuesta', 'cierre'],
    },
    {
      id: 'demo-gutierrez', asesorId: 'cperez', creada: '2026-08-22', estado: 'enviada', vistas: 3, ultimaVista: '2026-08-25',
      cliente: 'Sr. Gutiérrez', tratamiento: 'Sr.', ciudad: 'Chía', planId: 'esmeralda-amb',
      bens: [ { n: 'Manuel Gutiérrez', edad: 61, v: 289000 } ],
      descAnual: 5, vigencia: '2026-09-15',
      notas: 'Interesado principalmente en consultas con especialistas sin remisión y médico a domicilio.',
      slides: ['portada', 'elegir', 'portafolio', 'plan', 'red', 'app', 'propuesta', 'cierre'],
    },
    {
      id: 'demo-salazar', asesorId: 'cperez', creada: '2026-08-26', estado: 'borrador', vistas: 0, ultimaVista: null,
      cliente: 'Sra. Salazar', tratamiento: 'Sra.', ciudad: 'Bogotá', planId: 'diamante',
      bens: [
        { n: 'Beatriz Salazar', edad: 55, v: 1180000 },
        { n: 'Camila Duarte', edad: 24, v: 720000 },
      ],
      descAnual: 10, vigencia: '2026-09-10',
      notas: '',
      slides: ['portada', 'elegir', 'portafolio', 'plan', 'red', 'clinicas', 'beneficios', 'testimonios', 'propuesta', 'cierre'],
    },
  ];

  /* ---------- Cifras corporativas (PPT 2026) ---------- */
  const CIFRAS = {
    anios: 35, profesionales: 4400, centros: 35, sedesBogota: 21,
    especialidades: 100, teleEspecialidades: 18,
    citasPresenciales: 1332273, citasTele: 44355,
    centrosMedicos: 31, centrosOdontologicos: 16, centrosDiagnostico: 3,
  };

  const CLINICAS = [
    { img: 'image152.jpeg', nombre: 'Fundación Santa Fe',  ciudad: 'Bogotá' },
    { img: 'image155.jpeg', nombre: 'Clínica del Country', ciudad: 'Bogotá' },
    { img: 'image154.jpeg', nombre: 'Clínica La Colina',   ciudad: 'Bogotá' },
    { img: 'image151.jpeg', nombre: 'Clínica Shaio',       ciudad: 'Bogotá' },
    { img: 'image156.jpeg', nombre: 'Clínica de Marly',    ciudad: 'Bogotá' },
    { img: 'image153.jpg',  nombre: 'Clínica de la Mujer', ciudad: 'Bogotá' },
    { img: 'image160.jpeg', nombre: 'Hospital Pablo Tobón Uribe', ciudad: 'Medellín' },
    { img: 'image159.jpeg', nombre: 'Clínica El Rosario',  ciudad: 'Medellín' },
    { img: 'image158.png',  nombre: 'Fundación Valle de Lilí', ciudad: 'Cali' },
    { img: 'image161.jpeg', nombre: 'Clínica Imbanaco',    ciudad: 'Cali' },
    { img: 'image163.jpeg', nombre: 'Clínica Porto Azul',  ciudad: 'Barranquilla' },
    { img: 'image162.jpeg', nombre: 'Serena del Mar',      ciudad: 'Cartagena' },
  ];

  /* ---------- Utilidades ---------- */
  const fmtCOP = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');

  const fmtFecha = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-').map(Number);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d} ${meses[m - 1]} ${y}`;
  };

  const b64enc = (obj) => {
    const json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const b64dec = (str) => {
    try {
      const b = str.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(b))));
    } catch (e) { return null; }
  };

  /* payload comprimido (LZ-String): URLs a la mitad del tamaño del base64 */
  const zenc = (obj) => LZString.compressToEncodedURIComponent(JSON.stringify(obj));
  const zdec = (str) => {
    try { return JSON.parse(LZString.decompressFromEncodedURIComponent(str)); }
    catch (e) { return null; }
  };

  /* Acortador de links (demo): TinyURL con respaldo en spoo.me.
     Devuelve la URL corta o null si ningún servicio responde. */
  const acortarLink = async (url) => {
    try {
      const r = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(url),
        { signal: AbortSignal.timeout(6000) });
      const t = (await r.text()).trim();
      if (r.ok && /^https:\/\/tinyurl\.com\/\S+$/.test(t)) return t;
    } catch (e) { /* siguiente servicio */ }
    try {
      const r = await fetch('https://spoo.me/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: 'url=' + encodeURIComponent(url),
        signal: AbortSignal.timeout(6000),
      });
      const j = await r.json();
      if (j && j.short_url) return j.short_url.replace(/^http:/, 'https:');
    } catch (e) { /* sin acortador */ }
    return null;
  };

  /* ---------- Persistencia (demo: localStorage con respaldo en memoria) ---------- */
  const LS_PRES = 'cmp_presentaciones_v1';
  const LS_SES = 'cmp_sesion_v1';

  const mem = {};
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return mem[k] ?? null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } };

  const getPresentaciones = () => {
    try {
      const raw = lsGet(LS_PRES);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* estado corrupto: re-siembra */ }
    lsSet(LS_PRES, JSON.stringify(SEED));
    return JSON.parse(JSON.stringify(SEED));
  };
  const savePresentaciones = (list) => lsSet(LS_PRES, JSON.stringify(list));

  const getSesion = () => {
    try { return JSON.parse(lsGet(LS_SES)); } catch (e) { return null; }
  };
  const setSesion = (id) => lsSet(LS_SES, JSON.stringify({ id, t: new Date().toISOString() }));
  const cerrarSesion = () => lsDel(LS_SES);

  const planById = (id) => PLANES.find(p => p.id === id) || PLANES[1];
  const comercialById = (id) => (id === 'admin' ? ADMIN : COMERCIALES.find(c => c.id === id) || COMERCIALES[0]);
  const totalBens = (bens) => (bens || []).reduce((s, b) => s + (Number(b.v) || 0), 0);

  /* ---------- Guion corporativo (lo administra el rol admin) ---------- */
  const LS_GUION = 'cmp_guion_v2';

  /* estructura: { activos: {clinicas:true,...}, html: {slideId:{deck,story}}, historial: {slideId:[{fecha,autor,deck,story}]} } */
  const getGuion = () => {
    let g = null;
    try { g = JSON.parse(lsGet(LS_GUION)); } catch (e) { /* re-siembra */ }
    if (!g || !g.activos) {
      g = { activos: { clinicas: true, app: true, beneficios: true, testimonios: true }, html: {}, historial: {} };
      lsSet(LS_GUION, JSON.stringify(g));
    }
    return g;
  };
  const saveGuion = (g) => lsSet(LS_GUION, JSON.stringify(g));

  /* HTML vigente de un slide estándar (versión del admin o plantilla original) */
  const htmlDe = (slideId) => {
    const g = getGuion();
    const base = SLIDE_HTML[slideId] || { deck: '', story: '' };
    const ov = (g.html || {})[slideId] || {};
    return { deck: ov.deck || base.deck, story: ov.story || base.story };
  };

  /* Neutraliza scripts y handlers en HTML administrado (defensa básica del visor) */
  const sanearHtml = (html) => String(html || '')
    .replace(/<\s*(script|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|link|meta)[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'\s>]*\2/gi, '$1="#"');

  /* Render de plantilla: reemplaza {{token}} con el contexto dado */
  const renderHtml = (tpl, ctx) => sanearHtml(tpl).replace(/\{\{(\w+)\}\}/g, (m, k) =>
    (ctx && ctx[k] !== undefined) ? ctx[k] : '');

  /* lista de slides del guion vigente, en orden canónico */
  const guionActual = () => {
    const g = getGuion();
    return SLIDES.filter(s => s.tipo !== 'opcional' || g.activos[s.id]).map(s => s.id);
  };

  /* Payload compacto que viaja en el link de la presentación.
     El HTML del guion no viaja en el link (sería enorme): el visor lo lee del
     guion vigente — en producción, del servidor. */
  const buildPayload = (pres) => {
    const asesor = comercialById(pres.asesorId);
    return {
      id: pres.id, c: pres.cliente, tr: pres.tratamiento, ci: pres.ciudad,
      p: pres.planId, b: pres.bens, d: pres.descAnual, vg: pres.vigencia,
      nt: pres.notas, s: pres.slides, f: pres.creada,
      a: { n: asesor.nombre, cg: asesor.cargo, cl: asesor.cel },
    };
  };

  return {
    PLANES, SLIDES, COMERCIALES, ADMIN, SEED, CIFRAS, CLINICAS, SLIDE_HTML, TOKENS,
    fmtCOP, fmtFecha, b64enc, b64dec, zenc, zdec, acortarLink,
    getPresentaciones, savePresentaciones, getSesion, setSesion, cerrarSesion,
    planById, comercialById, totalBens, buildPayload,
    getGuion, saveGuion, htmlDe, sanearHtml, renderHtml, guionActual,
  };
})();
