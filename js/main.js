// Engrana Digital · interacción. Sin dependencias. Todo lo animado respeta "reducir movimiento".
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Menú móvil
const btn = document.querySelector(".menu-btn");
const menu = document.getElementById("menu");
btn?.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  btn.setAttribute("aria-expanded", open);
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

  let via = "email";
  form.querySelectorAll("[data-via]").forEach((b) => b.addEventListener("click", () => (via = b.dataset.via)));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = form.querySelector(".form-msg");
    if (!form.checkValidity()) {
      msg.textContent = "Rellena nombre, contacto y mensaje, y acepta la política de privacidad.";
      return;
    }
    msg.textContent = "";
    const f = form.elements;
    const tema = sel.options[sel.selectedIndex].text;
    const texto = `Hola Marcos,\n\n${f.mensaje.value}\n\n— ${f.nombre.value}${f.empresa.value ? " (" + f.empresa.value + ")" : ""}\nContacto: ${f.contacto.value}`;
    if (via === "whatsapp") {
      window.open(`https://wa.me/${form.dataset.tel}?text=${encodeURIComponent(`[${tema}] ${texto}`)}`, "_blank", "noopener");
    } else {
      location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent("Consulta web: " + tema)}&body=${encodeURIComponent(texto)}`;
    }
  });
}
}
