// Importa el mapa
import { map } from './map.js';


// Función para obtener parcelas desde la API
async function obtenerParcelas() {
  try {
    const response = await fetch('/api/get-comuna/parcelas');
    console.log('Respuesta de la API:', response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const parcelas = await response.json();
    console.log('Parcelas obtenidas:', parcelas);
    return parcelas;
  } catch (error) {
    console.error('Error al obtener parcelas:', error.message);
    throw error;
  }
}

// Función para generar el listado de parcelas agrupadas por comuna en un acordeón grande
function generarListadoParcelasPorComuna(parcelas) {
  const panel = document.getElementById('parcelacion-panel');
  panel.innerHTML = ''; // Limpia el panel antes de agregar nuevo contenido

  // Agrupar las parcelas por comuna
  const comunas = parcelas.reduce((acc, parcela) => {
    const { comuna } = parcela;
    if (!acc[comuna]) acc[comuna] = [];
    acc[comuna].push(parcela);
    return acc;
  }, {});

  // Crear un acordeón principal que englobe todas las comunas
  const acordeonGeneral = document.createElement('button');
  acordeonGeneral.classList.add('accordion');
  acordeonGeneral.textContent = `Parcelas (${Object.keys(comunas).length} comunas)`;

  const acordeonPanel = document.createElement('div');
  acordeonPanel.classList.add('panel');

  // Crear los elementos del sidebar por cada comuna
  Object.keys(comunas).forEach(comuna => {
    const comunaAccordion = document.createElement('button');
    comunaAccordion.classList.add('accordion');
    comunaAccordion.textContent = `${comuna} (${comunas[comuna].length})`;

    const parcelaPanel = document.createElement('div');
    parcelaPanel.classList.add('panel');

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
    acordeonPanel.appendChild(comunaAccordion);
    acordeonPanel.appendChild(parcelaPanel);

    // Añadir funcionalidad de acordeón para cada comuna
    comunaAccordion.addEventListener('click', function () {
      this.classList.toggle('active');
      const panel = this.nextElementSibling;
      panel.style.maxHeight = panel.style.maxHeight ? null : panel.scrollHeight + 'px';
    });
  });

  panel.appendChild(acordeonGeneral);
  panel.appendChild(acordeonPanel);

  // Añadir funcionalidad de acordeón para el acordeón principal
  acordeonGeneral.addEventListener('click', function () {
    this.classList.toggle('active');
    acordeonPanel.style.maxHeight = acordeonPanel.style.maxHeight ? null : acordeonPanel.scrollHeight + 'px';
  });
}



// Event listener para las parcelas
document.getElementById('parcelacion-panel').addEventListener('click', function (event) {
  const parcelaLink = event.target.closest('.parcela-link');
  if (parcelaLink) {
    const id = parcelaLink.getAttribute('data-id');
    const lat = parseFloat(parcelaLink.getAttribute('data-lat'));
    const lng = parseFloat(parcelaLink.getAttribute('data-lng'));
    volarAParcela(id, lat, lng);
  }
});

// Función para volar a una parcela en el mapa
function volarAParcela(id, lat, lng) {
  map.flyTo({
    center: [lng, lat],
    zoom: 14,
    essential: true
  });
}


// CUARENTENAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

let cuarentenasEnMapa = []; // Arreglo para mantener referencia a las cuarentenas en el mapa
let cuarentenaActiva = null; // Para mantener un registro de la cuarentena actualmente seleccionada

// Función para obtener cuarentenas desde la API
async function obtenerCuarentenas() {
  try {
    const response = await fetch('/quarantines/get-comentario');
    console.log('Respuesta de la API:', response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const cuarentenas = await response.json();
    console.log('Cuarentenas obtenidas:', cuarentenas);
    return cuarentenas;
  } catch (error) {
    console.error('Error al obtener cuarentenas:', error.message);
    throw error;
  }
}

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

  // Agregar los event listeners a los enlaces de cuarentena aquí
  document.querySelectorAll('.cuarentena-link').forEach(cuarentenaLink => {
    cuarentenaLink.addEventListener('click', function () {
      const id = this.dataset.id;
      const lat = parseFloat(this.dataset.lat);
      const lng = parseFloat(this.dataset.lng);
      volarACuarentena(id, lat, lng);
      
      // Volar a la ubicación en el mapa
      map.flyTo({
        center: [lng, lat],
        zoom: 15,
        essential: true
      });
      console.log(`Volando a la cuarentena ${id}`);
    });
  });
}


// Función para inicializar la aplicación y cargar parcelas y cuarentenas
async function init() {
  try {
    const [parcelas, cuarentenas] = await Promise.all([obtenerParcelas(), obtenerCuarentenas()]);
    generarListadoParcelasPorComuna(parcelas);
    generarListadoCuarentenasPorComentario(cuarentenas);
  } catch (error) {
    console.error('Error en la inicialización:', error);
  }
}

// Inicializa la aplicación
init();

// Función para volar a una cuarentena en el mapa
function volarACuarentena(id, lat, lng) {
  // Limpiar las cuarentenas existentes del mapa
  cuarentenasEnMapa.forEach(cuarentena => {
    map.removeLayer(cuarentena.layer);
    map.removeSource(cuarentena.source);
  });
  cuarentenasEnMapa = []; // Reiniciar el array

  // Volar a la ubicación de la cuarentena seleccionada
  map.flyTo({
    center: [lng, lat],
    zoom: 14,
    essential: true
  });
  console.log(`Volando a la cuarentena ${id}`);

  // Agregar la cuarentena seleccionada al mapa
  const sourceId = `cuarentena-${id}`;
  const layerId = `cuarentena-layer-${id}`;

  // Añadir la fuente de la cuarentena
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

  // Añadir la capa de la cuarentena
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
}

// Event listener para las cuarentenas
document.getElementById('cuarentena-panel').addEventListener('click', function (event) {
  const cuarentenaLink = event.target.closest('.cuarentena-link');
  if (cuarentenaLink) {
    const id = cuarentenaLink.getAttribute('data-id');
    const lat = parseFloat(cuarentenaLink.getAttribute('data-lat'));
    const lng = parseFloat(cuarentenaLink.getAttribute('data-lng'));
    
    // Ejecutar lógica para interactuar con el mapa
    volarACuarentena(id, lat, lng); // Cambia a esta función
  }
});