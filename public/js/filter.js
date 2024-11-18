document.addEventListener("DOMContentLoaded", () => {
    const filterButton = document.getElementById("filter-button");
    const filterPanel = document.getElementById("filter-panel");
    const applyFilterButton = document.getElementById("apply-filter");
  
    // Alternar visibilidad del panel de filtros
    filterButton.addEventListener("click", () => {
      filterPanel.classList.toggle("hidden");
    });
  
    // Aplicar filtros
    applyFilterButton.addEventListener("click", () => {
      const filters = [];
      document.querySelectorAll("#filter-options input[type='checkbox']:checked").forEach((checkbox) => {
        filters.push(checkbox.id);
      });
      console.log("Filtros aplicados:", filters);
  
      // Aquí puedes implementar la lógica para aplicar los filtros
      alert("Filtros aplicados: " + filters.join(", "));
  
      // Ocultar el panel después de aplicar los filtros
      filterPanel.classList.add("hidden");
    });
  });

  function setupSidebarLinks() {
    const sidebarLinks = document.querySelectorAll("a[data-load-table]");
    sidebarLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const tableName = link.getAttribute("data-load-table");
            loadItems(tableName);
            history.pushState(null, "", link.href); // Actualiza la URL sin recargar
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupSidebarLinks();
    const currentTable = getTableNameFromUrl(); // Obtén la tabla inicial
    if (currentTable) {
        loadItems(currentTable); // Carga la tabla inicial
    }
});
  
document.addEventListener("DOMContentLoaded", () => {
  const createQuarantineButton = document.getElementById("create-quarantine-button");
  const quarantinePanel = document.getElementById("quarantine-panel");
  const cancelQuarantineButton = document.getElementById("cancel-quarantine");

  // Alternar visibilidad del panel de cuarentena
  createQuarantineButton.addEventListener("click", () => {
      quarantinePanel.classList.toggle("hidden");
  });

  // Ocultar el panel de cuarentena al cancelar
  cancelQuarantineButton.addEventListener("click", () => {
      quarantinePanel.classList.add("hidden");
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const createParcelaButton = document.getElementById("create-parcela");
  const parcelacionModal = document.getElementById("parcelacion-modal");
  const cancelParcelaButton = document.getElementById("cancel-parcelacion");

  // Alternar visibilidad del modal de parcelación
  createParcelaButton.addEventListener("click", () => {
    parcelacionModal.classList.toggle("hidden");
  });

  // Ocultar el modal de parcelación al cancelar
  cancelParcelaButton.addEventListener("click", () => {
    parcelacionModal.classList.add("hidden");
  });
});
