// Engrana Digital · interacción. Sin dependencias. Todo lo animado respeta "reducir movimiento".
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Menú móvil
const btn = document.querySelector(".menu-btn");
const menu = document.getElementById("menu");
btn?.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  btn.setAttribute("aria-expanded", open);
  btn.textContent = open ? "Cerrar" : "Menú";
  document.documentElement.classList.toggle("menu-abierto", open);
});
// Al tocar un enlace del menú abierto, se cierra al momento
menu?.addEventListener("click", (e) => {
  if (e.target.closest("a") && menu.classList.contains("open")) btn.click();
});
// Desplegables del menú (clic y teclado; en escritorio también se abren al pasar el ratón)
const subs = document.querySelectorAll(".sub-btn");
const cerrarSubs = (salvo) => subs.forEach((b) => b !== salvo && b.setAttribute("aria-expanded", "false"));
subs.forEach((b) => b.addEventListener("click", (e) => {
  e.stopPropagation();
  cerrarSubs(b);
  b.setAttribute("aria-expanded", b.getAttribute("aria-expanded") !== "true");
}));
document.addEventListener("click", () => cerrarSubs());
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  cerrarSubs();
  if (menu?.classList.contains("open")) btn.click();
});

// Cabecera más opaca al bajar
const header = document.querySelector(".site-header");
const onScroll = () => header?.classList.toggle("scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Aparición suave al entrar en pantalla (escalonada dentro de cada grupo)
if (!quieto && "IntersectionObserver" in window) {
  const sel = ".section h2, .section .lead, .demo, .destacado, .ia-card, .member, .card, .plan, .case, .timeline li, .steps li, .service-row, .faq details, .compare-col, .pack, .newsletter, .related";
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(sel).forEach((el) => {
    const hermanos = [...el.parentElement.children].filter((c) => c.matches(sel));
    el.style.setProperty("--d", `${Math.min(hermanos.indexOf(el), 6) * 70}ms`);
    el.classList.add("reveal");
    io.observe(el);
  });
}

// Contadores de la portada
if (!quieto) {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const fin = +el.dataset.count;
    const t0 = performance.now() + 300;
    const paso = (t) => {
      const p = Math.min(Math.max((t - t0) / 1400, 0), 1);
      el.textContent = String(Math.round(fin * (1 - Math.pow(1 - p, 3)))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      if (p < 1) requestAnimationFrame(paso);
    };
    el.textContent = "0";
    requestAnimationFrame(paso);
  });
}

// Brillo que sigue al ratón en tarjetas y filas de servicio
document.querySelectorAll(".card, .service-row").forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

// Logo en las cargas: capturas de los casos (el logo se ve hasta que llega la imagen)
document.querySelectorAll(".shot-img img").forEach((img) => {
  const fin = () => img.closest("figure").classList.add("cargada");
  if (img.complete) fin(); else { img.addEventListener("load", fin, { once: true }); img.addEventListener("error", fin, { once: true }); }
});
// Botones: logo y "Preparando…" mientras se abre el correo o WhatsApp
const cargando = (btn, txt) => {
  const t = btn?.querySelector(".btn-txt");
  if (!t || btn.classList.contains("cargando")) return;
  const antes = t.textContent;
  btn.classList.add("cargando");
  t.textContent = txt;
  setTimeout(() => { btn.classList.remove("cargando"); t.textContent = antes; }, 2500);
};
// Newsletter con Substack: el alta se abre en otra pestaña
document.querySelectorAll(".news-form:not([data-mailto])").forEach((f) => {
  f.addEventListener("submit", () => cargando(f.querySelector("button"), "Un momento…"));
});

// Envío real: el servidor (Worker de Cloudflare en /api/formulario) nos lo manda por correo.
// Si falla (sin conexión, endpoint caído), se recurre al correo o WhatsApp del visitante: nunca se pierde un contacto.
const enviarFormulario = async (datos) => {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch("/api/formulario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos), signal: ctrl.signal });
    clearTimeout(t);
    return r.ok && (await r.json().catch(() => ({}))).ok === true;
  } catch { return false; }
};

// Newsletter sin Substack: alta directa; si no se puede, abre el correo del visitante con el alta escrita
document.querySelectorAll(".news-form[data-mailto]").forEach((f) => {
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = f.querySelector("input[type=email]");
    if (!email.checkValidity()) { email.reportValidity(); return; }
    const btn = f.querySelector("button");
    cargando(btn, "Apuntándote…");
    let ok = f.parentElement.querySelector(".news-ok");
    if (!ok) {
      ok = document.createElement("p");
      ok.className = "news-ok";
      ok.setAttribute("role", "status");
      f.after(ok);
    }
    if (await enviarFormulario({ tipo: "newsletter", email: email.value, web: f.querySelector("[name=web]")?.value || "", pagina: location.pathname })) {
      ok.innerHTML = `<strong>¡Hecho!</strong> Te hemos apuntado a ${f.dataset.lista || "la newsletter"} con ${email.value.replace(/</g, "&lt;")}. Te llegará el próximo número.`;
      f.reset();
      return;
    }
    location.href = `mailto:${f.dataset.mailto}?subject=${encodeURIComponent("Alta en la newsletter Engranajes")}&body=${encodeURIComponent(`Hola, quiero recibir la newsletter Engranajes en este correo: ${email.value}`)}`;
    ok.innerHTML = `Se ha abierto tu correo con el alta preparada: solo falta pulsar <strong>Enviar</strong>. Si no se ha abierto, escríbenos a <a href="mailto:${f.dataset.mailto}">${f.dataset.mailto}</a> con el asunto «Alta en Engranajes».`;
  });
});

// Formulario de contacto: lo envía al servidor; si no se puede, abre el correo o WhatsApp del visitante con el mensaje escrito.
{
const form = document.getElementById("form-contacto");
if (form) {
  const asunto = new URLSearchParams(location.search).get("asunto") || "";
  const sel = form.elements.asunto;
  const match = [...sel.options].filter((o) => asunto.startsWith(o.value)).sort((a, b) => b.value.length - a.value.length)[0];
  if (match) sel.value = match.value;

  // Resultado del autodiagnóstico, si viene de ahí
  const q = new URLSearchParams(location.search);
  const diag = q.get("diag");
  const avisoDiag = form.querySelector(".aviso-diag");
  if (diag && /^\d{1,3}$/.test(diag)) {
    avisoDiag.textContent = `Incluiré tu resultado del autodiagnóstico (${diag}/100${q.get("flojas") ? ", áreas más flojas: " + q.get("flojas") : ""}).`;
    avisoDiag.hidden = false;
  }

  // Barra de progreso: cuántas preguntas obligatorias y de opción llevas
  const bar = form.querySelector(".q-bar i");
  const grupos = ["negocio", "equipo", "herramientas", "freno", "cuando", "presupuesto", "nombre", "contacto"];
  const lleno = (n) => [...form.querySelectorAll(`[name="${n}"]`)].some((el) => (el.type === "radio" || el.type === "checkbox") ? el.checked : el.value.trim());
  const progreso = () => { if (bar) bar.style.width = `${(grupos.filter(lleno).length / grupos.length) * 100}%`; };
  form.addEventListener("input", progreso);
  form.addEventListener("change", progreso);

  let via = "email";
  form.querySelectorAll("[data-via]").forEach((b) => b.addEventListener("click", () => (via = b.dataset.via)));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = form.querySelector(".form-msg");
    form.querySelector(".form-ok")?.remove();
    if (!form.checkValidity()) {
      const nombres = { negocio: "a qué se dedica tu negocio", freno: "qué te frena", nombre: "tu nombre", contacto: "un correo o teléfono", privacidad: "aceptar la política de privacidad" };
      const faltan = [...form.querySelectorAll(":invalid")].map((el) => nombres[el.name]).filter(Boolean);
      const lista = faltan.length > 1 ? `${faltan.slice(0, -1).join(", ")} y ${faltan.at(-1)}` : faltan[0];
      msg.textContent = `Para poder enviarlo, falta ${lista}.`;
      form.querySelector(":invalid")?.focus();
      return;
    }
    msg.textContent = "";
    const f = form.elements;
    const tema = sel.options[sel.selectedIndex].text;
    const val = (n) => [...form.querySelectorAll(`[name="${n}"]:checked`)].map((x) => x.value).join(", ") || "—";
    const lineas = [
      `Interés: ${tema}`,
      `Negocio: ${f.negocio.value}${f.empresa.value ? " (" + f.empresa.value + ")" : ""}`,
      `Equipo: ${val("equipo")}`,
      `Trabajamos con: ${val("herramientas")}`,
      `Lo que más nos frena: ${f.freno.value}`,
      f.objetivo.value ? `En 6 meses querría: ${f.objetivo.value}` : "",
      `Cuándo empezar: ${val("cuando")}`,
      `Presupuesto orientativo: ${val("presupuesto")}`,
      !avisoDiag.hidden ? `Autodiagnóstico: ${diag}/100${q.get("flojas") ? " (flojas: " + q.get("flojas") + ")" : ""}` : "",
    ].filter(Boolean);
    const texto = `Hola, quiero engranar mi empresa y me gustaría tener la llamada gratuita. Os dejo el cuestionario:\n\n${lineas.join("\n")}\n\n— ${f.nombre.value}\nContacto: ${f.contacto.value}`;
    cargando(e.submitter, via === "whatsapp" ? "Abriendo WhatsApp…" : "Enviando…");
    const urlWa = `https://wa.me/${form.dataset.tel}?text=${encodeURIComponent(texto)}`;
    if (via !== "whatsapp" && await enviarFormulario({ tipo: "contacto", asunto: `Llamada: ${tema} · ${f.nombre.value}`, texto, nombre: f.nombre.value, contacto: f.contacto.value, web: f.web?.value || "", pagina: location.pathname + location.search })) {
      const ok = document.createElement("div");
      ok.className = "form-ok";
      ok.setAttribute("role", "status");
      ok.innerHTML = `<p><strong>Recibido, ${f.nombre.value.replace(/</g, "&lt;").split(" ")[0]}.</strong> Revisamos tus respuestas y te escribimos en menos de 24 horas laborables para fijar la llamada.</p><p>¿Prefieres adelantarlo? <a href="${urlWa}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>.</p>`;
      msg.after(ok);
      form.querySelectorAll("input,select,textarea,button").forEach((el) => (el.disabled = true));
      ok.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (via === "whatsapp") {
      window.open(urlWa, "_blank", "noopener");
    } else {
      location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent("Llamada: " + tema + " · " + f.nombre.value)}&body=${encodeURIComponent(texto)}`;
    }
    // Confirmación y plan B: el mensaje queda a la vista para copiarlo si no se abrió el correo o WhatsApp
    const ok = document.createElement("div");
    ok.className = "form-ok";
    ok.setAttribute("role", "status");
    ok.innerHTML = `<p><strong>${via === "whatsapp" ? "Se ha abierto WhatsApp" : "Se ha abierto tu programa de correo"} con el mensaje preparado.</strong> Solo falta pulsar <strong>Enviar</strong>. Te respondemos en menos de 24 horas laborables.</p>
      <p>¿No se ha abierto? Copia el mensaje y envíalo a <a href="mailto:${form.dataset.email}">${form.dataset.email}</a> o <a href="${urlWa}" target="_blank" rel="noopener">por WhatsApp</a>.</p>
      <textarea readonly rows="6" aria-label="Tu mensaje"></textarea>
      <button type="button" class="btn btn-ghost btn-copiar">Copiar mensaje</button>`;
    ok.querySelector("textarea").value = texto;
    ok.querySelector(".btn-copiar").addEventListener("click", async (ev) => {
      const ta = ok.querySelector("textarea");
      try { await navigator.clipboard.writeText(texto); } catch { ta.select(); document.execCommand("copy"); }
      ev.target.textContent = "Mensaje copiado ✓";
    });
    msg.after(ok);
  });
}
}

// Ejemplos: muestra de la voz del agente de voz (se descarga solo al pulsar)
document.querySelectorAll(".btn-audio").forEach((b) => {
  let audio;
  const demo = b.closest(".demo");
  const dur = b.querySelector(".ba-dur");
  const total = dur.textContent;
  const t = b.querySelector(".ba-t");
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const estado = (sonando) => {
    b.setAttribute("aria-pressed", sonando);
    t.textContent = sonando ? "Pausar" : "Escuchar la voz";
    demo?.classList.toggle("sonando", sonando);
  };
  b.addEventListener("click", () => {
    if (!audio) {
      audio = new Audio((document.documentElement.dataset.base || "") + b.dataset.audio);
      audio.addEventListener("play", () => estado(true));
      audio.addEventListener("pause", () => estado(false));
      audio.addEventListener("ended", () => { estado(false); dur.textContent = total; });
      audio.addEventListener("timeupdate", () => { if (audio.duration) dur.textContent = mmss(audio.duration - audio.currentTime); });
    }
    audio.paused ? audio.play().catch(() => estado(false)) : audio.pause();
  });
});
