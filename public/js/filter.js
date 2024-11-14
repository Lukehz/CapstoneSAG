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
  