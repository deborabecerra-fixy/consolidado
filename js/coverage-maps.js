document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-coverage-maps]").forEach((showcase) => {
    const tabs = [...showcase.querySelectorAll("[data-map-tab]")];
    const panels = [...showcase.querySelectorAll("[data-map-panel]")];

    const select = (name, focus = false) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.mapTab === name;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) tab.focus();
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.mapPanel !== name; });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(tab.dataset.mapTab));
      tab.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        select(tabs[(index + direction + tabs.length) % tabs.length].dataset.mapTab, true);
      });
    });
    select(tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.mapTab || "regional");
  });
});
