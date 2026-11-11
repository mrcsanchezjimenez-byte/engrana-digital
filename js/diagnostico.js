// Autodiagnóstico: calcula la puntuación en el navegador. No envía ni guarda nada.
{
const form = document.getElementById("diag");
if (form) {
  const areas = JSON.parse(document.getElementById("diag-areas").textContent);
  const total = form.querySelectorAll("fieldset").length;
  const barra = document.querySelector(".diag-progress i");
  const contador = document.querySelector(".diag-count");
  const out = document.getElementById("diag-result");
  const B = document.documentElement.dataset.base || "";

  const progreso = () => {
    const hechas = form.querySelectorAll("input:checked").length;
    barra.style.width = `${(hechas / total) * 100}%`;
    contador.textContent = `${hechas} de ${total}`;
  };
  form.addEventListener("change", (e) => {
    progreso();
    // al responder, baja suavemente a la siguiente pregunta
    const fs = e.target.closest("fieldset");
    const next = fs?.nextElementSibling;
    if (next?.tagName === "FIELDSET" && !next.querySelector("input:checked")) {
      setTimeout(() => next.scrollIntoView({ behavior: "smooth", block: "center" }), 180);
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const sinResponder = [...form.querySelectorAll("fieldset")].find((f) => !f.querySelector("input:checked"));
    if (sinResponder) {
      sinResponder.classList.add("missing");
      sinResponder.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => sinResponder.classList.remove("missing"), 1600);
      return;
    }
    const pts = {}, max = {};
    form.querySelectorAll("fieldset").forEach((f) => {
      const a = f.dataset.area;
      pts[a] = (pts[a] || 0) + +f.querySelector("input:checked").value;
      max[a] = (max[a] || 0) + 2;
    });
    const nota = Math.round((Object.values(pts).reduce((x, y) => x + y, 0) / (total * 2)) * 100);
    const orden = Object.keys(pts).sort((a, b) => pts[a] / max[a] - pts[b] / max[b]);
    const debiles = orden.filter((a) => pts[a] / max[a] < 0.75).slice(0, 2);
    const nivel = nota < 40 ? ["Hay mucho margen de mejora", "Tu empresa funciona a base de esfuerzo. La buena noticia: las primeras mejoras se notan muy rápido."]
      : nota < 70 ? ["Vas por buen camino", "Tienes una base, pero hay fugas de tiempo y oportunidades que se escapan."]
      : ["Tu empresa está bien engranada", "Estás por delante de la mayoría. Ahora se trata de afinar y crecer."];

    out.innerHTML = `
      <div class="diag-score">
        <div class="ring" style="--p:${nota}"><span>${nota}<small>/100</small></span></div>
        <div><p class="eyebrow">Tu resultado</p><h2>${nivel[0]}</h2><p>${nivel[1]}</p></div>
      </div>
      <ul class="diag-bars">${Object.keys(areas).map((a) => `<li><span>${areas[a].nombre}</span><i><b style="--w:${Math.round((pts[a] / max[a]) * 100)}%"></b></i><em>${Math.round((pts[a] / max[a]) * 100)}%</em></li>`).join("")}</ul>
      ${debiles.length ? `<h3>Por dónde empezaría yo</h3><div class="diag-recs">${debiles.map((a) => `<a class="card" href="${B}${areas[a].servicio[0]}"><p class="case-sector">${areas[a].nombre}</p><p>${areas[a].consejo}</p><span class="more">${areas[a].servicio[1]} →</span></a>`).join("")}</div>` : ""}
      <div class="hero-actions">
        <a class="btn" href="${B}/contacto/?asunto=auditoria&diag=${nota}&flojas=${encodeURIComponent(debiles.map((a) => areas[a].nombre).join(", "))}">Comentar mi resultado (gratis)</a>
        <a class="btn btn-ghost" target="_blank" rel="noopener" href="https://wa.me/${form.dataset.tel}?text=${encodeURIComponent(`Hola Marcos, he hecho el autodiagnóstico y he sacado ${nota}/100. Áreas más flojas: ${debiles.map((a) => areas[a].nombre).join(" y ") || "ninguna"}. ¿Lo hablamos?`)}">Enviarlo por WhatsApp</a>
      </div>`;
    out.hidden = false;
    requestAnimationFrame(() => out.classList.add("show"));
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  progreso();
}
}
