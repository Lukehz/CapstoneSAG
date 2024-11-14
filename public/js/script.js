// Load the table based on URL or button click on page load
const currentPath = window.location.pathname.split("/").pop();
let currentTable = currentPath || 'parcelacion'; // Use the URL path to determine the table, default to 'parcelacion'

document.addEventListener("DOMContentLoaded", () => loadTable(currentTable));

/******************** Sidebar Event Listener ********************/
// Attach event listeners to sidebar buttons
function setupSidebarListeners() {
    document.querySelectorAll(".sidebar-button").forEach(button => {
        button.addEventListener("click", event => {
            const tableName = event.target.dataset.table; // Get the table name from the button's data attribute
            if (tableName && tableName !== currentTable) {
                currentTable = tableName; // Update the current table
                history.pushState({}, "", `/crud/${tableName}`); // Update the URL dynamically
                loadTable(tableName); // Load the new table
            }
        });
    });
}
setupSidebarListeners();

/******************** Load Table Items ********************/
async function loadTable(tableName, filters = {}) {
    // Update the page title and add button based on the table name
    updatePageUI(tableName);

    // Build the URL with optional filters
    let url = `/api/${tableName}`;
    if (Object.keys(filters).length > 0) {
        const queryParams = new URLSearchParams(filters).toString();
        url = `${url}/filter?${queryParams}`;
    }

    try {
        console.log(`Loading data for table: ${tableName}`); // Debug log
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load data");

        const items = await response.json();
        renderTable(items);
    } catch (error) {
        console.error("Error loading table data:", error);
    }
}

/******************** Update Page UI ********************/
function updatePageUI(tableName) {
    const crudTitle = document.getElementById("crud-title");
    const addButton = document.getElementById("addButton");
    const filtersContainer = document.getElementById("filters");

    const tableConfigs = {
        parcelacion: {
            title: "Gestión de Parcelaciones",
            addButtonText: "Agregar Parcelación",
            filters: `
                <div class="flex flex-wrap gap-4">
                    <select id="filter_sector" class="filter-dropdown">
                        <option value="">Seleccione la zona</option>
                    </select>
                    <select id="filter_fase" class="filter-dropdown">
                        <option value="">Seleccione la fase</option>
                    </select>
                    <select id="filter_cultivo" class="filter-dropdown">
                        <option value="">Seleccione el cultivo</option>
                    </select>
                </div>`
        },
        region: {
            title: "Gestión de Regiones",
            addButtonText: "Agregar Región",
            filters: ""
        },
        provincia: {
            title: "Gestión de Provincias",
            addButtonText: "Agregar Provincia",
            filters: `
                <select id="filter_region" class="filter-dropdown">
                    <option value="">Seleccione la región</option>
                </select>`
        }
        // Add more configurations as needed
    };

    const config = tableConfigs[tableName] || {};

    crudTitle.textContent = config.title || "Gestión";
    addButton.textContent = config.addButtonText || "Agregar";
    filtersContainer.innerHTML = config.filters || "";

    if (config.filters) setupFilterListeners(tableName);

    addButton.onclick = () => openModal(tableName);
}

/******************** Render Table ********************/
function renderTable(items) {
    const tableHeaders = document.getElementById("tableHeaders");
    const itemList = document.getElementById("itemList");

    // Clear existing content
    tableHeaders.innerHTML = "";
    itemList.innerHTML = "";

    if (items.length === 0) {
        tableHeaders.innerHTML = "<th>No hay datos disponibles</th>";
        return;
    }

    // Create table headers dynamically
    const headers = Object.keys(items[0]);
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1);
        tableHeaders.appendChild(th);
    });

    // Add an "Acciones" header
    const actionsTh = document.createElement("th");
    actionsTh.textContent = "Acciones";
    tableHeaders.appendChild(actionsTh);

    // Populate table rows
    items.forEach(item => {
        const row = document.createElement("tr");

        headers.forEach(header => {
            const td = document.createElement("td");
            td.textContent = item[header];
            row.appendChild(td);
        });

        // Add actions
        const actionsTd = document.createElement("td");
        actionsTd.innerHTML = `
            <button class="action-button" onclick="editItem('${item.id}')">Editar</button>
            <button class="action-button" onclick="deleteItem('${item.id}')">Eliminar</button>
        `;
        row.appendChild(actionsTd);

        itemList.appendChild(row);
    });
}

/******************** Setup Filters ********************/
function setupFilterListeners(tableName) {
    const filterButton = document.getElementById("filterButton");
    if (!filterButton) return;

    filterButton.onclick = () => {
        const filters = {};

        if (tableName === "parcelacion") {
            filters.sector = document.getElementById("filter_sector").value;
            filters.fase = document.getElementById("filter_fase").value;
            filters.cultivo = document.getElementById("filter_cultivo").value;
        } else if (tableName === "provincia") {
            filters.region = document.getElementById("filter_region").value;
        }

        loadTable(tableName, filters);
    };
}

/******************** Modals ********************/
function openModal(tableName, item = null) {
    const modal = document.getElementById("myModal");
    const modalTitle = document.getElementById("modalTitle");
    const formFields = document.getElementById("formFields");

    modalTitle.textContent = item ? `Editar ${tableName}` : `Agregar ${tableName}`;
    formFields.innerHTML = getFormFields(tableName, item);

    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("myModal");
    modal.style.display = "none";
}

/******************** Form Fields ********************/
function getFormFields(tableName, item) {
    const fieldTemplates = {
        parcelacion: `
            <input type="hidden" id="itemId" value="${item ? item.id : ''}">
            <input type="number" id="latitud" placeholder="Latitud" value="${item ? item.latitud : ''}">
            <input type="number" id="longitud" placeholder="Longitud" value="${item ? item.longitud : ''}">
            <select id="id_sector">
                <option value="">Seleccione un Sector</option>
            </select>
        `,
        region: `
            <input type="hidden" id="itemId" value="${item ? item.id : ''}">
            <input type="text" id="nombre" placeholder="Nombre" value="${item ? item.nombre : ''}">
        `
    };

    return fieldTemplates[tableName] || "";
}

/******************** Delete Item ********************/
async function deleteItem(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este ítem?")) return;

    try {
        const response = await fetch(`/api/${currentTable}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete item");

        alert("Ítem eliminado con éxito.");
        loadTable(currentTable);
    } catch (error) {
        console.error("Error deleting item:", error);
    }
}

/******************** Edit Item ********************/
async function editItem(id) {
    try {
        const response = await fetch(`/api/${currentTable}/${id}`);
        if (!response.ok) throw new Error("Failed to fetch item");

        const item = await response.json();
        openModal(currentTable, item); // Pass the current table and fetched item to the modal
    } catch (error) {
        console.error("Error editing item:", error);
    }
}

/******************** Save Item ********************/
async function saveItem() {
    const formData = new FormData();
    const id = document.getElementById("itemId").value;

    // Add table-specific form data
    if (currentTable === "parcelacion") {
        formData.append("latitud", document.getElementById("latitud").value);
        formData.append("longitud", document.getElementById("longitud").value);
        formData.append("id_sector", document.getElementById("id_sector").value);
    } else if (currentTable === "region") {
        formData.append("nombre", document.getElementById("nombre").value);
    }

    try {
        const url = id
            ? `/api/${currentTable}/${id}` // Update existing item
            : `/api/${currentTable}`; // Create new item
        const method = id ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            body: formData,
        });

        if (!response.ok) throw new Error("Failed to save item");

        closeModal();
        loadTable(currentTable); // Reload the current table after saving
    } catch (error) {
        console.error("Error saving item:", error);
    }
}

/******************** Form Submission Listener ********************/
document.getElementById("itemForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    saveItem(); // Trigger save function when the form is submitted
});

/******************** Debugging Info ********************/
console.log("Debug: Current table is", currentTable);
document.querySelectorAll(".sidebar-button").forEach(button => {
    console.log("Debug: Sidebar button detected for table", button.dataset.table);
});
