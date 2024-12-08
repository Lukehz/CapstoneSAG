// Importa el mapa
import { map } from './map.js';

// Obtener el contenedor del dropdown
const dropdown = document.getElementById('parcelas-dropdown');

document.addEventListener('DOMContentLoaded', () => {
  obtenerParcelas();
});
// Función para obtener parcelas desde la API
async function obtenerParcelas() {
  try {
    const response = await fetch('/api/get-comuna/parcelas');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const parcelas = await response.json();

    // Llenar el dropdown con las parcelas agrupadas por comuna
    llenarDropdownConParcelasAgrupadas(parcelas);

    // Generar el acordeón con las parcelas agrupadas por comuna
    generarListadoParcelasPorComuna(parcelas);

    return parcelas;
  } catch (error) {
    console.error('Error al obtener parcelas:', error.message);
    throw error;
  }
}

// Función para llenar el dropdown con las parcelas agrupadas por comuna
function llenarDropdownConParcelasAgrupadas(parcelas) {
  dropdown.innerHTML = '<option value="">Seleccione una parcela</option>'; // Limpia el dropdown

  // Agrupar las parcelas por comuna
  const comunas = parcelas.reduce((acc, parcela) => {
    const { comuna } = parcela;
    if (!acc[comuna]) acc[comuna] = [];
    acc[comuna].push(parcela);
    return acc;
  }, {});

  // Ordenar las comunas alfabéticamente
  Object.keys(comunas).sort().forEach(comuna => {
    // Crear el grupo de opciones para la comuna
    const optgroup = document.createElement('optgroup');
    optgroup.label = comuna;

    // Agregar las parcelas de esta comuna al grupo
    comunas[comuna].forEach(parcela => {
      const option = document.createElement('option');
      option.value = parcela.id_parcelacion;
      option.textContent = `Parcela ${parcela.id_parcelacion} - ${parcela.cultivo}`;
      option.setAttribute('data-lat', parcela.latitud);
      option.setAttribute('data-lng', parcela.longitud);
      optgroup.appendChild(option);
    });

    dropdown.appendChild(optgroup);
  });
}

// Función para generar el listado de parcelas agrupadas por comuna en un acordeón
function generarListadoParcelasPorComuna(parcelas) {
  const panel = document.getElementById('parcelacion-panel');
  if (panel) {
  panel.innerHTML = ''; // Limpia el panel antes de agregar nuevo contenido

  // Agrupar las parcelas por comuna
  const comunas = parcelas.reduce((acc, parcela) => {
    const { comuna } = parcela;
    if (!acc[comuna]) acc[comuna] = [];
    acc[comuna].push(parcela);
    return acc;
  }, {});

  // Crear los elementos del acordeón por cada comuna
  Object.keys(comunas).sort().forEach(comuna => {
    // Crear el botón de acordeón para la comuna
    const comunaAccordion = document.createElement('button');
    comunaAccordion.classList.add('accordion');
    comunaAccordion.textContent = `${comuna} (${comunas[comuna].length})`;

    // Crear el panel asociado al acordeón
    const parcelaPanel = document.createElement('div');
    parcelaPanel.classList.add('panel');

    // Crear la lista de parcelas dentro del panel
    const listaParcelas = document.createElement('ul');
    comunas[comuna].forEach(parcela => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="parcela-link" data-id="${parcela.id_parcelacion}" data-lat="${parcela.latitud}" data-lng="${parcela.longitud}">
          Parcela ${parcela.id_parcelacion} - Cultivo: ${parcela.cultivo}
        </span>
      `;
      listaParcelas.appendChild(li);
    });

    parcelaPanel.appendChild(listaParcelas);
    panel.appendChild(comunaAccordion);
    panel.appendChild(parcelaPanel);

    // Añadir funcionalidad de acordeón a cada comuna
    comunaAccordion.addEventListener('click', function() {
      this.classList.toggle('active');
      const panel = this.nextElementSibling;
      panel.style.maxHeight = panel.style.maxHeight ? null : panel.scrollHeight + 'px';
    });
  });
}
}

// Manejar la selección del dropdown
dropdown.addEventListener('change', function() {
  const selectedOption = dropdown.options[dropdown.selectedIndex];
  const id = selectedOption.value;
  const lat = parseFloat(selectedOption.getAttribute('data-lat'));
  const lng = parseFloat(selectedOption.getAttribute('data-lng'));

  if (id) {
    volarAParcela(id, lat, lng);
  }
});

// Función para centrar el mapa o realizar acciones al seleccionar una parcela
function volarAParcela(id, lat, lng) {
  console.log(`Volando a parcela ID: ${id}, Lat: ${lat}, Lng: ${lng}`);
  map.flyTo([lat, lng], 15); // Centra el mapa en las coordenadas y aplica un zoom de 15
}

// Cargar las parcelas al iniciar la página
obtenerParcelas();

// CUARENTENAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA


// Variables globales
let cuarentenasEnMapa = []; // Arreglo para mantener referencia a las cuarentenas en el mapa
let cuarentenaActiva = 1; // Para mantener un registro de la cuarentena actualmente seleccionada

const dropdownCuarentenas = document.getElementById('cuarentenas-dropdown');



// Función para obtener cuarentenas desde la API
async function obtenerCuarentenas() {
  try {
    const response = await fetch('/quarantines/get-comentario');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const cuarentenas = await response.json();
    return cuarentenas;
  } catch (error) {
    console.error('Error al obtener cuarentenas:', error.message);
    throw error;
  }
}



// Función para llenar el dropdown con las cuarentenas agrupadas por zona
function llenarDropdownConCuarentenasAgrupadas(cuarentenas) {
  dropdownCuarentenas.innerHTML = '<option value="">Seleccione una cuarentena</option>'; // Limpia el dropdown

  // Agrupar las cuarentenas por zona (usando comuna)
  const zonas = cuarentenas.reduce((acc, cuarentena) => {
    const zona = cuarentena.comuna || 'Sin zona';
    if (!acc[zona]) acc[zona] = [];
    acc[zona].push(cuarentena);
    return acc;
  }, {});

  // Ordenar las zonas alfabéticamente
  Object.keys(zonas).sort().forEach(zona => {
    // Crear el grupo de opciones para la zona
    const optgroup = document.createElement('optgroup');
    optgroup.label = zona;

    // Agregar las cuarentenas de esta zona al grupo
    zonas[zona].forEach(cuarentena => {
      const option = document.createElement('option');
      option.value = cuarentena.id_cuarentena;
      option.textContent = `Cuarentena ${cuarentena.id_cuarentena} - ${cuarentena.comentario || 'Sin comentario'}`;
      option.setAttribute('data-lat', cuarentena.latitud);
      option.setAttribute('data-lng', cuarentena.longitud);
      optgroup.appendChild(option);
    });

    dropdownCuarentenas.appendChild(optgroup);
  });
}

// Función para generar el listado de cuarentenas por comentario
function generarListadoCuarentenasPorComentario(cuarentenas) {
  const panel = document.getElementById('cuarentena-panel');
  if (!panel) {
    console.error('No se encontró el panel de cuarentenas');
    return;
  }
  panel.innerHTML = '';

  const zonas = {}; // Agrupar por zona

  // Agrupar las cuarentenas por zona
  cuarentenas.forEach(cuarentena => {
    const comentario = cuarentena.comentario || 'Sin comentario';
    const zona = cuarentena.comuna || 'Sin zona';

    if (!zonas[zona]) {
      zonas[zona] = [];
    }
    zonas[zona].push(cuarentena);
  });

  // Crear un acordeón principal que englobe todas las zonas
  const acordeonGeneral = document.createElement('button');
  acordeonGeneral.classList.add('accordion');
  acordeonGeneral.textContent = `Cuarentenas (${Object.keys(zonas).length} zonas)`;

  const acordeonPanel = document.createElement('div');
  acordeonPanel.classList.add('panel');

  // Crear los elementos del sidebar por cada zona
  Object.keys(zonas).forEach(zona => {
    const zonaAccordion = document.createElement('button');
    zonaAccordion.classList.add('accordion');
    zonaAccordion.textContent = `${zona} (${zonas[zona].length} cuarentenas)`;

    const zonaPanel = document.createElement('div');
    zonaPanel.classList.add('panel');

    // Añadir funcionalidad para mostrar las cuarentenas al hacer clic en la zona
    zonaAccordion.addEventListener('click', function () {
      this.classList.toggle('active');
      const panel = this.nextElementSibling;

      // Limpiar el panel anterior
      zonaPanel.innerHTML = '';

      // Si el panel estaba cerrado, mostrar las cuarentenas
      if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
      } else {
        // Mostrar detalles de cada cuarentena
        zonas[zona].forEach(cuarentena => {
          const li = document.createElement('li');
          li.innerHTML = `
            <span class="cuarentena-link" data-id="${cuarentena.id_cuarentena}" data-lat="${cuarentena.latitud}" data-lng="${cuarentena.longitud}">
              Cuarentena ${cuarentena.id_cuarentena} - Comentario: ${cuarentena.comentario || 'Sin comentario'}
            </span>
          `;
          zonaPanel.appendChild(li);
        });
        panel.style.maxHeight = panel.scrollHeight + 'px'; // Ajustar la altura del panel
      }
    });

    acordeonPanel.appendChild(zonaAccordion);
    acordeonPanel.appendChild(zonaPanel);
  });

  panel.appendChild(acordeonGeneral);
  panel.appendChild(acordeonPanel);

  // Añadir funcionalidad de acordeón para el acordeón principal
  acordeonGeneral.addEventListener('click', function () {
    this.classList.toggle('active');
    acordeonPanel.style.maxHeight = acordeonPanel.style.maxHeight ? null : acordeonPanel.scrollHeight + 'px';
  });
}

function volarACuarentenaDesdeDropdown(id, lat, lng) {
  console.log(`Volando a cuarentena ID: ${id}, Lat: ${lat}, Lng: ${lng}`);
  
  try {
    // Limpiar cuarentenas existentes
    cuarentenasEnMapa.forEach(cuarentena => {
      map.removeLayer(cuarentena.layer);
      map.removeSource(cuarentena.source);
    });
    cuarentenasEnMapa = []; // Reiniciar el array

    // Volar a la ubicación
    map.flyTo({
      center: [lng, lat],
      zoom: 15,
      essential: true
    });

    // Agregar marcador de la cuarentena
    const sourceId = `cuarentena-${id}`;
    const layerId = `cuarentena-layer-${id}`;

    map.addSource(sourceId, {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': [lng, lat]
        }
      }
    });

    map.addLayer({
      'id': layerId,
      'type': 'circle',
      'source': sourceId,
      'paint': {
        'circle-radius': 10,
        'circle-color': '#FF0000' // Color rojo para destacar
      }
    });

    // Guardar la cuarentena en el array
    cuarentenasEnMapa.push({ source: sourceId, layer: layerId });

  } catch (error) {
    console.error('Error al volar a la cuarentena:', error);
  }
}


dropdownCuarentenas.addEventListener('change', function() {
  const selectedOption = dropdownCuarentenas.options[dropdownCuarentenas.selectedIndex];
  const id = selectedOption.value;
  const lat = parseFloat(selectedOption.getAttribute('data-lat'));
  const lng = parseFloat(selectedOption.getAttribute('data-lng'));

  if (id) {
    volarACuarentenaDesdeDropdown(id, lat, lng);
  }
});

// Función para inicializar la aplicación y cargar parcelas y cuarentenas
async function init() {
  try {
    const [parcelas, cuarentenas] = await Promise.all([obtenerParcelas(), obtenerCuarentenas()]);
    generarListadoParcelasPorComuna(parcelas);
    generarListadoCuarentenasPorComentario(cuarentenas);
    
    // Llenar los dropdowns
    llenarDropdownConParcelasAgrupadas(parcelas);
    llenarDropdownConCuarentenasAgrupadas(cuarentenas);
  } catch (error) {
    console.error('Error en la inicialización:', error);
  }
}

// Inicializar la aplicación cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', init);