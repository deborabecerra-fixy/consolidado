(function () {
  "use strict";

  const desktopHeader = document.querySelector("header.nav");
  if (!desktopHeader) return;

  const scriptSource = document.currentScript?.getAttribute("src") || "./js/navigation.js";
  const root = scriptSource.replace(/js\/navigation\.js(?:\?.*)?$/, "");
  const slug = location.pathname.match(/\/servicios\/([^/]+)/)?.[1] || "";
  const pageKey = {
    "same-day": "sameDay",
    "next-day": "nextDay",
    flex: "flex",
    fixyfull: "fixyFull",
    fixypoints: "fixyPoints",
    fixypay: "fixyPay"
  }[slug] || "home";
  const pathname = location.pathname
    .replace(/\/index\.html$/, "/")
    .replace(/^\/consolidado(?=\/|$)/, "") || "/";
  const isHome = pathname === "/";
  const isTechnology = pathname.startsWith("/tecnologia");
  const isResources = pathname.startsWith("/recursos");
  const isSolutions = pathname.startsWith("/servicios") || pathname.startsWith("/operar-en-argentina");
  const mobileQuery = matchMedia("(max-width: 1023px)");
  const iconFile = `${root}img/navigation-icons.svg`;
  const homeUrl = `${root}index.html`;

  const services = [
    ["fixyFull", "fixyfull", "FixyFull", "Stock, preparación y despacho.", "warehouse"],
    ["flex", "flex", "Flex", "Operación para entregas Flex.", "route"],
    ["sameDay", "same-day", "Same Day", "Entregas prioritarias en el día.", "bolt"],
    ["nextDay", "next-day", "Next Day", "Entregas al día siguiente.", "calendar"],
    ["fixyPoints", "fixypoints", "FixyPoints", "Puntos de retiro y despacho.", "points"],
    ["fixyPay", "fixypay", "FixyPay", "Cobro QR contraentrega.", "qr"]
  ];
  const whatsappMessages = {
    home: "Hola Fixy, quiero evaluar mi operación logística.",
    sameDay: "Hola Fixy, quiero evaluar Same Day en CABA.",
    nextDay: "Hola Fixy, quiero cotizar Next Day en CABA y GBA.",
    flex: "Hola Fixy, quiero evaluar Flex.",
    fixyFull: "Hola Fixy, quiero evaluar FixyFull (fulfillment).",
    fixyPoints: "Hola Fixy, quiero evaluar FixyPoints (puntos de retiro).",
    fixyPay: "Hola Fixy, quiero evaluar FixyPay para mi operación contraentrega."
  };

  const icon = (name, className = "fixy-navigation-icon") => `
    <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <use href="${iconFile}#${name}"></use>
    </svg>`;

  const serviceList = services.map(([key, serviceSlug, name, description, iconName]) => `
    <li>
      <a class="fixy-service-link" href="${root}servicios/${serviceSlug}/"${pageKey === key ? ' aria-current="page"' : ""}>
        ${icon(iconName, "fixy-service-icon")}
        <span class="fixy-service-copy"><strong>${name}</strong><small>${description}</small></span>
        ${icon("arrow", "fixy-service-icon fixy-service-arrow")}
      </a>
    </li>`).join("");

  const mobileLink = (key, href, label, accessibleLabel, iconName) => {
    const extra = accessibleLabel !== label
      ? ` aria-label="${accessibleLabel}" title="${accessibleLabel}"`
      : "";
    return `<a class="fixy-navigation-item" href="${href}" data-fixy-nav="${key}"${extra}>
      ${icon(iconName)}<span>${label}</span>
    </a>`;
  };

  const whatsappUrl = `https://wa.me/5491150069182?text=${encodeURIComponent(whatsappMessages[pageKey])}`;
  const servicesCurrent = isSolutions ? ' aria-current="page"' : "";
  const mobileMarkup = `<div class="fixy-mobile-navigation">
    <header class="fixy-mobile-topbar">
      <a class="fixy-site-logo" href="${homeUrl}" aria-label="Fixy Logística, inicio">
        <img src="${root}img/Logo%20Fixy.png" alt="" width="606" height="188">
      </a>
      <a class="fixy-whatsapp-button" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer"
        aria-label="Hablar con Fixy por WhatsApp" title="Hablar con Fixy por WhatsApp">
        <img class="fixy-utility-icon" src="${root}img/whatsapp-white.png" alt="" width="25" height="25">
      </a>
    </header>
    <nav class="fixy-mobile-bottom-navigation" aria-label="Navegación principal móvil">
      ${mobileLink("inicio", homeUrl, "Inicio", "Inicio", "home")}
      ${mobileLink("tecnologia", `${root}tecnologia/`, "Tecnología", "Tecnología", "technology")}
      <button class="fixy-navigation-item fixy-navigation-services${isSolutions ? " is-current" : ""}"
        id="fixy-mobile-services-trigger" type="button" aria-expanded="false"
        aria-controls="fixy-services-sheet" data-fixy-nav="soluciones"${servicesCurrent}>
        <span class="fixy-navigation-services__orb">${icon("network")}</span>
        <span class="fixy-navigation-label">Soluciones</span>
      </button>
      ${mobileLink("recursos", `${root}recursos/`, "Recursos", "Recursos", "resources")}
      ${mobileLink("contacto", "#contacto", "Contacto", "Contacto", "contact")}
    </nav>
    <div class="fixy-sheet-layer" id="fixy-sheet-layer" hidden>
      <section class="fixy-services-sheet" id="fixy-services-sheet" role="dialog" aria-modal="true"
        aria-labelledby="fixy-sheet-title" tabindex="-1">
        <div class="fixy-sheet-handle" aria-hidden="true"></div>
        <header class="fixy-sheet-header">
          <h2 id="fixy-sheet-title">Soluciones Fixy</h2>
          <button class="fixy-sheet-close" type="button" aria-label="Cerrar servicios">${icon("close")}</button>
        </header>
        <ul class="fixy-services-list">${serviceList}</ul>
      </section>
    </div>
  </div>`;

  desktopHeader.insertAdjacentHTML("afterend", mobileMarkup);
  document.body.classList.add("fixy-mobile-navigation-ready");

  const trigger = document.querySelector("#fixy-mobile-services-trigger");
  const layer = document.querySelector("#fixy-sheet-layer");
  const sheet = document.querySelector("#fixy-services-sheet");
  const closeButton = sheet.querySelector(".fixy-sheet-close");
  let lockedY = 0;

  const visible = (element) => !element.hidden && element.getClientRects().length > 0;
  const focusable = () => [...sheet.querySelectorAll("a[href],button:not([disabled]),[tabindex]:not([tabindex='-1'])")].filter(visible);
  const closeSheet = (restoreFocus = true) => {
    if (layer.hidden) return;
    layer.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    scrollTo({ top: lockedY, behavior: "instant" });
    if (restoreFocus) requestAnimationFrame(() => trigger.focus({ preventScroll: true }));
  };
  const openSheet = () => {
    lockedY = scrollY;
    layer.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedY}px`;
    document.body.style.width = "100%";
    closeButton.focus({ preventScroll: true });
  };

  trigger.addEventListener("click", openSheet);
  closeButton.addEventListener("click", () => closeSheet());
  layer.addEventListener("pointerdown", (event) => {
    if (event.target === layer) closeSheet();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !layer.hidden) {
      event.preventDefault();
      closeSheet();
      return;
    }
    if (event.key !== "Tab" || layer.hidden) return;
    const items = focusable();
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  mobileQuery.addEventListener("change", () => closeSheet(false));

  document.addEventListener("focusin", (event) => {
    if (mobileQuery.matches && event.target.matches("input,textarea,[contenteditable=true]")) {
      document.body.classList.add("fixy-navigation-keyboard-open");
    }
  });
  document.addEventListener("focusout", () => {
    setTimeout(() => {
      if (!document.activeElement.matches?.("input,textarea,[contenteditable=true]")) {
        document.body.classList.remove("fixy-navigation-keyboard-open");
      }
    }, 0);
  });

  const setActive = () => {
    const active = location.hash === "#contacto" ? "contacto" :
      isHome ? "inicio" :
      isTechnology ? "tecnologia" :
      isResources ? "recursos" :
      isSolutions ? "soluciones" : "";
    document.querySelectorAll("[data-fixy-nav]").forEach((link) => {
      if (link.dataset.fixyNav === active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };
  setActive();
  addEventListener("hashchange", setActive);
}());
