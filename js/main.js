// Engrana Digital · interacción. Sin dependencias. Todo lo animado respeta "reducir movimiento".
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Menú móvil
const btn = document.querySelector(".menu-btn");
const menu = document.getElementById("menu");
btn?.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  btn.setAttribute("aria-expanded", open);
  btn.textContent = open ? "Cerrar" : "Menú";
  document.body.classList.toggle("menu-abierto", open);
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
  const sel = ".section h2, .section .lead, .demo, .card, .plan, .case, .timeline li, .steps li, .service-row, .faq details, .compare-col, .pack, .newsletter, .related";
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
      el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3)));
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

// Formulario de contacto: no guarda nada; abre el correo o WhatsApp del visitante con el mensaje ya escrito.
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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = form.querySelector(".form-msg");
    if (!form.checkValidity()) {
      const falta = form.querySelector(":invalid");
      msg.textContent = "Falta algo: a qué te dedicas, qué te frena, tu nombre, cómo contactarte y aceptar la privacidad.";
      falta?.focus();
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
    const texto = `Hola Marcos, me gustaría tener la llamada gratuita. Te dejo el cuestionario:\n\n${lineas.join("\n")}\n\n— ${f.nombre.value}\nContacto: ${f.contacto.value}`;
    if (via === "whatsapp") {
      window.open(`https://wa.me/${form.dataset.tel}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    } else {
      location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent("Llamada: " + tema + " · " + f.nombre.value)}&body=${encodeURIComponent(texto)}`;
    }
  });
}
}
