//Codigo actualizado


import { map } from './map.js';

let drawingMode = false;
let quarantinePoints = [];
let quarantineCircle = null;
let quarantineCenter = null;
let isDeleting = false;
let currentPopup = null; // Variable para almacenar el popup actual

// Función para recoger el comentario del usuario
function getComment() {
  const commentElement = document.getElementById('quarantine-comment');
  return commentElement ? commentElement.value.trim() : '';
}

const cancelDrawing = () => {
  // Limpiar los puntos de cuarentena
  quarantinePoints = [];

  // Si hay un círculo de dibujo temporal, lo eliminamos
  if (quarantineCircle && quarantineCircle.id === 'temp-quarantine-circle') {
    map.removeLayer(quarantineCircle.id);
    map.removeSource(quarantineCircle.id);
    quarantineCircle = null;
  }

  // No reiniciamos quarantineCenter aquí

  // Eliminar los puntos y la línea del polígono temporal
  if (map.getSource('quarantine-points')) {
    map.removeLayer('quarantine-points');
    map.removeSource('quarantine-points');
  }
  
  if (map.getSource('quarantine-line')) {
    map.removeLayer('quarantine-line');
    map.removeSource('quarantine-line');
  }
  
  if (map.getSource('quarantine-polygon')) {
    map.removeLayer('quarantine-polygon');
    map.removeSource('quarantine-polygon');
  }

  // Reiniciar el modo de dibujo
  endDrawing();

  // Volver a mostrar las cuarentenas existentes
  fetchAndDisplayQuarantines();
};

const saveQuarantine = async () => {
  const comment = getComment();
  const type = quarantineCircle ? 'radius' : 'polygon';
  let points = [];

  if (type === 'polygon') {
    if (quarantinePoints.length < 3) {
      alert('Debe haber al menos tres puntos para guardar una cuarentena por trazado.');
      return;
    }
    points = quarantinePoints.map(point => point.coords);
  } else if (type === 'radius') {
    if (!quarantineCenter) {
      alert('Debe seleccionar un punto central para la cuarentena por radio.');
      return;
    }
    points.push(quarantineCenter);
  }

  const radiusInput = document.getElementById('quarantine-radius');
  const radius = radiusInput.value ? parseFloat(radiusInput.value) : null;

  const quarantineData = {
    points,
    comment,
    type,
    radius: radius !== null ? radius : 0
  };

  try {
    const response = await fetch('/quarantines/save-quarantine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quarantineData),
    });

    if (response.ok) {
      const result = await response.json();
      alert('Cuarentena guardada con éxito con ID: ' + result.id_cuarentena);
      fetchAndDisplayQuarantines();
      cancelDrawing(); // Cancelar el dibujo tras guardar
    } else {
      const errorData = await response.json();
      console.error('Error:', errorData);
      alert('Error al guardar la cuarentena: ' + errorData.error);
    }
  } catch (error) {
    console.error('Error al guardar la cuarentena:', error);
    alert('Se produjo un error al guardar la cuarentena.');
  }
};

document.getElementById('save-quarantine').addEventListener('click', saveQuarantine);

// Función para actualizar los puntos de cuarentena en el mapa
const updateQuarantinePoints = () => {
  if (quarantinePoints.length === 0) return;

  const pointsData = {
    type: 'FeatureCollection',
    features: quarantinePoints.map(point => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: point.coords }
    }))
  };

  if (!map.getSource('quarantine-points')) {
    map.addSource('quarantine-points', { type: 'geojson', data: pointsData });
    map.addLayer({
      id: 'quarantine-points',
      type: 'circle',
      source: 'quarantine-points',
      paint: { 'circle-radius': 6, 'circle-color': '#FF0000' }
    });
  } else {
    map.getSource('quarantine-points').setData(pointsData);
  }

  if (quarantinePoints.length > 1) {
    const lineData = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: quarantinePoints.map(point => point.coords)
      }
    };

    if (!map.getSource('quarantine-line')) {
      map.addSource('quarantine-line', { type: 'geojson', data: lineData });
      map.addLayer({
        id: 'quarantine-line',
        type: 'line',
        source: 'quarantine-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#FF0000', 'line-width': 2 }
      });
    } else {
      map.getSource('quarantine-line').setData(lineData);
    }
  }
};


// Función para actualizar el polígono de cuarentena en el mapa
const updateQuarantinePolygon = () => {
  if (quarantinePoints.length < 3) return;

  const polygonData = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[...quarantinePoints.map(point => point.coords), quarantinePoints[0].coords]]
    }
  };

  if (!map.getSource('quarantine-polygon')) {
    map.addSource('quarantine-polygon', { type: 'geojson', data: polygonData });
    map.addLayer({
      id: 'quarantine-polygon',
      type: 'fill',
      source: 'quarantine-polygon',
      paint: { 'fill-color': '#FF0000', 'fill-opacity': 0.2 }
    });
  } else {
    map.getSource('quarantine-polygon').setData(polygonData);
  }
};



function createQuarantineByPolygon() {
  if (quarantinePoints.length < 3) {
    alert("Por favor, dibuje al menos 3 puntos para crear un polígono.");
    return;
  }

  updateQuarantinePolygon();

  const quarantineData = {
    type: 'polygon',
    points: quarantinePoints.map(point => point.coords),
    comment: getComment(),
  };
  
  /// saveQuarantine(quarantineData);
}


function createQuarantineByRadius() {
  if (!quarantineCenter) {
    alert("Por favor, seleccione un centro para la cuarentena por radio.");
    return;
  }

  const radius = parseFloat(document.getElementById('quarantine-radius').value);
  if (isNaN(radius) || radius <= 0) {
    alert("Por favor, especifique un radio válido para la cuarentena.");
    return;
  }

  const quarantineData = {
    type: 'radius',
    points: [quarantineCenter],
    comentario: getComment(),
    radius: radius,
  };

  saveQuarantine(quarantineData);
}

// Update the create quarantine button event listener
document.getElementById('create-quarantine').addEventListener('click', () => {
  console.log("Botón de crear cuarentena clickeado");
  const quarantineType = document.getElementById('quarantine-type').value;
  const comment = document.getElementById('quarantine-comment').value.trim();

  if (!comment) {
    alert("Por favor, ingrese un comentario para la cuarentena.");
    return;
  }

  if (quarantineType === 'trazado') {
    createQuarantineByPolygon();
  } else if (quarantineType === 'radio') {
    createQuarantineByRadius();
  } else {
    alert("Por favor, seleccione un tipo de cuarentena válido.");
  }
});

// Asegúrate de que esta función esté definida correctamente
function generateCircle(center, radius) {
  const points = 64;
  const coords = [];
  const earthRadius = 6371000;

  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const offsetX = radius * Math.cos(angle);
    const offsetY = radius * Math.sin(angle);
    
    const newCoords = [
      center[0] + (offsetX / earthRadius) * (180 / Math.PI) / Math.cos(center[1] * Math.PI / 180),
      center[1] + (offsetY / earthRadius) * (180 / Math.PI)
    ];

    coords.push(newCoords);
  }

  return coords;
}








// Update the startDrawing function
function startDrawing(mode) {
  drawingMode = mode;
  quarantinePoints = [];
  quarantineCenter = null;
  if (quarantineCircle) {
    map.removeLayer(quarantineCircle.id);
    map.removeSource(quarantineCircle.id);
    quarantineCircle = null;
  }
  console.log(`Modo de dibujo activado: ${mode}`);
}




function endDrawing() {
  drawingMode = false;
  console.log("Modo de dibujo desactivado");
}

function updateQuarantineCircle() {
  if (!quarantineCenter) return;

  const radius = parseFloat(document.getElementById('quarantine-radius').value) || 1000;
  const circleCoords = generateCircle(quarantineCenter, radius);

  if (quarantineCircle) {
    map.removeLayer(quarantineCircle.id);
    map.removeSource(quarantineCircle.id);
  }

  quarantineCircle = {
    id: 'temp-quarantine-circle',
    type: 'fill',
    source: {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: { radius: radius },
        geometry: { type: 'Polygon', coordinates: [circleCoords] }
      }
    },
    paint: {
      'fill-color': '#FF0000',
      'fill-opacity': 0.5,
      'fill-outline-color': '#FF0000'
    }
  };

  map.addLayer(quarantineCircle);
  map.addSource(quarantineCircle.id, quarantineCircle.source);
}
// Manejadores de eventos de clic en el mapa
map.on('click', 'quarantine-points', (e) => {
  const feature = e.features[0];
  const coordinates = feature.geometry.coordinates.slice();
  
  // Pop up con la información de la cuarentena
  const popup = new mapboxgl.Popup()
    .setLngLat(coordinates)
    .setHTML(`
      <h4>Información de la Cuarentena</h4>
      <p>Tipo: ${feature.properties.type}</p>
      <p>Comentario: ${feature.properties.comment}</p>
      <button id="delete-quarantine-${feature.properties.id}">Eliminar Cuarentena</button>
    `)
    .addTo(map);

  // Manejador de evento para eliminar la cuarentena
  document.getElementById(`delete-quarantine-${feature.properties.id}`).addEventListener('click', async () => {
    const confirmed = confirm("¿Está seguro de que desea eliminar esta cuarentena?");
    if (confirmed) {
      try {
        const response = await fetch(`/quarantines/delete-quarantine/${feature.properties.id}`, { method: 'DELETE' });
        if (response.ok) {
          alert('Cuarentena eliminada con éxito.');
          fetchAndDisplayQuarantines(); // Actualiza la lista de cuarentenas
        } else {
          alert('Error al eliminar la cuarentena.');
        }
      } catch (error) {
        console.error('Error al eliminar la cuarentena:', error);
        alert('Se produjo un error al eliminar la cuarentena.');
      }
      popup.remove();
    }
  });
});

document.getElementById('quarantine-type').addEventListener('change', function() {
  const radiusInput = document.getElementById('quarantine-radius');
  if (this.value === 'radio') {
    radiusInput.style.display = 'block';
    startDrawing('radio');
  } else if (this.value === 'trazado') {
    radiusInput.style.display = 'none';
    startDrawing('trazado');
  } else {
    radiusInput.style.display = 'none';
    endDrawing();
  }
});

document.getElementById('quarantine-radius').addEventListener('input', updateQuarantineCircle);

document.getElementById('create-quarantine').addEventListener('click', saveQuarantine);

map.on('click', (e) => {
  if (!drawingMode) return;

  const quarantineType = document.getElementById('quarantine-type').value;
  if (quarantineType === 'radio') {
    quarantineCenter = [e.lngLat.lng, e.lngLat.lat];
    updateQuarantineCircle();
  } else if (quarantineType === 'trazado') {
    quarantinePoints.push({ coords: [e.lngLat.lng, e.lngLat.lat] });
    updateQuarantinePoints();
    updateQuarantinePolygon();
    const comment = document.getElementById('quarantine-comment').value.trim();
    const radiusInput = document.getElementById('quarantine-radius').value;

  }

  if (!comment) {
    alert("Por favor, ingrese un comentario para la cuarentena.");
    return;
  }

  if (quarantineType === 'trazado') {
    createQuarantineByPolygon();
  } else if (quarantineType === 'radio') {
    const radius = parseFloat(radiusInput.value);
    if (quarantineCenter && !isNaN(radius) && radius > 0) {
      createQuarantineByRadius(quarantineCenter, radius);
    } else {
      alert("Por favor, seleccione un centro y especifique un radio válido para la cuarentena por radio.");
    }
  } else {
    alert("Por favor, seleccione un tipo de cuarentena válido.");
  }
});

function updateQuarantinePolygons(features, type) {
  const sourceId = type === 'radio' ? 'quarantine-circle-source' : 'quarantine-source';
  const layerId = type === 'radio' ? 'quarantine-circle-layer' : 'quarantine-layer';

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: features }
    });

    map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': type === 'radio' ? '#FFFF00' : '#FF0000',
        'fill-opacity': 0.5
      }
    });
  } else {
    map.getSource(sourceId).setData({
      type: 'FeatureCollection',
      features: features
    });
  }

  // Asegúrate de que la capa sea visible
  map.setLayoutProperty(layerId, 'visibility', 'visible');
}

async function fetchAllQuarantines() {
  const response = await fetch('/quarantines/get-all-quarantines');
  if (!response.ok) throw new Error(`Error HTTP! estado: ${response.status}`);
  return response.json();
}

async function fetchAllRadiusQuarantines() {
  const response = await fetch('/quarantines/radius');
  if (!response.ok) throw new Error(`Error HTTP! estado: ${response.status}`);
  return response.json();
}

function fetchAndDisplayQuarantines(type = null) {
  console.log('Iniciando fetchAndDisplayQuarantines', type ? `para tipo: ${type}` : 'para todos los tipos');

  const fetchFunction = type === 'radio' ? fetchAllRadiusQuarantines : fetchAllQuarantines;

  fetchFunction()
    .then(data => {
      console.log('Datos de cuarentenas recibidos:', data);
      const quarantines = Array.isArray(data) ? data : [data];
      const filteredQuarantines = quarantines.filter(quarantine => {
        if (type === 'radio') return quarantine.radio > 0;
        if (type === 'trazado') return !quarantine.radio;
        return true;
      });
      console.log('Cuarentenas filtradas:', filteredQuarantines);


      const features = filteredQuarantines.map(quarantine => {
        if (quarantine.radio) {
          const center = [quarantine.longitud, quarantine.latitud];
        
          const circleCoords = generateCircle(center, quarantine.radio);
          return {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [circleCoords]
            },
            properties: {
              id: quarantine.id,
              comentario: quarantine.comentario || 'Sin comentario',
              tipo: 'radio',
              radio: quarantine.radio
            }
          };
        } else if (quarantine.conexiones && quarantine.conexiones.length >= 3) {
          return {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                ...quarantine.conexiones.map(conn => [conn.longitud_INI, conn.latitud_INI]),
                [quarantine.conexiones[0].longitud_INI, quarantine.conexiones[0].latitud_INI] // Cerrar el polígono
              ]]
            },
            properties: {
              id: quarantine.id,
              comentario: quarantine.comentario || 'Sin comentario',
              tipo: 'trazado'
            }
          };
        }
        return null; // Retornar null para cuarentenas que no cumplen con ninguna condición
        
      }).filter(Boolean);

      console.log('Features generadas:', features);
      updateQuarantinePolygons(features, type);
    })
    
    .catch(error => {
      console.error('Error al obtener cuarentenas:', error);
      alert(`Hubo un error al obtener las cuarentenas: ${error.message}`);
    });

    map.on('click', 'quarantine-circle-layer', (e) => {
      if (!e.features.length) return;
    
      const feature = e.features[0];
      const properties = feature.properties;
    
      // Cerrar el popup anterior si existe
      if (currentPopup) {
        currentPopup.remove();
      }
    
      // Crear el contenido del popup
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <h3>Cuarentena ID: ${properties.id}</h3>
        <p>Comentario: ${properties.comentario || 'Sin comentario'}</p>
        <p>Radio: ${properties.radio} metros</p>
        <button class="delete-button" data-id="${properties.id}">Eliminar</button>
      `;
    
      // Agregar el evento click al botón de eliminar
      const deleteButton = popupContent.querySelector('.delete-button');
      deleteButton.addEventListener('click', () => {
        if (confirm('¿Estás seguro de eliminar esta cuarentena?')) {
          eliminarCuarentena(properties.id);
        }
      });
    
      // Crear y mostrar el popup
      currentPopup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setDOMContent(popupContent)
        .addTo(map);
    });
    map.on('click', 'quarantine-layer', (e) => {
      if (!e.features.length) return;
    
      const feature = e.features[0];
      const properties = feature.properties;
    
      // Cerrar el popup anterior si existe
      if (currentPopup) {
        currentPopup.remove();
      }
    
      // Crear el contenido del popup
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <h3>Cuarentena ID: ${properties.id}</h3>
        <p>Comentario: ${properties.comentario || 'Sin comentario'}</p>
        <button class="delete-button" data-id="${properties.id}">Eliminar</button>
      `;
    
      // Agregar el evento click al botón de eliminar
      const deleteButton = popupContent.querySelector('.delete-button');
      deleteButton.addEventListener('click', () => {
        if (confirm('¿Estás seguro de eliminar esta cuarentena?')) {
          eliminarCuarentena(properties.id);
        }
      });
    
      // Crear y mostrar el popup
      currentPopup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setDOMContent(popupContent)
        .addTo(map);
    });
    
  }    
  function eliminarCuarentena(id) {
    if (isDeleting) return;
    isDeleting = true;
    
    console.log('Intentando eliminar cuarentena con ID:', id);
    
    // Usar la ruta correcta
    fetch(`/quarantines/delete-quarantine/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Respuesta del servidor:', data);
      if (data.success) {
        // Cerrar el popup si existe
        if (currentPopup) {
          currentPopup.remove();
        }
        // Actualizar el mapa
        fetchAndDisplayQuarantines();
        alert('Cuarentena eliminada con éxito');
      } else {
        throw new Error(data.message || 'Error al eliminar la cuarentena');
      }
    })
    .catch(error => {
      console.error('Error al eliminar cuarentena:', error);
      alert(`Error al eliminar la cuarentena: ${error.message}`);
    })
    .finally(() => {
      isDeleting = false;
    });
  }


function toggleQuarantines() {
  const isVisible = this.checked;
  map.setLayoutProperty('quarantine-layer', 'visibility', isVisible ? 'visible' : 'none');
  console.log(isVisible ? 'Cuarentenas mostradas en el mapa.' : 'Cuarentenas ocultadas del mapa.');
}

document.addEventListener('DOMContentLoaded', () => {
  const quarantineCheckbox = document.getElementById('quarantine-toggle');
  
  // Verifica si el checkbox existe antes de agregar el evento
  if (quarantineCheckbox) {
    quarantineCheckbox.checked = false; // Establece el estado inicial
    quarantineCheckbox.addEventListener('change', toggleQuarantines);
  } else {
    console.error('El checkbox con id "quarantine-toggle" no fue encontrado.');
  }
  
  // Cargar las cuarentenas al iniciar
  fetchAndDisplayQuarantines();


});

// Modificación de la función toggleQuarantineCircle
// Modificación de la función toggleQuarantineCircle
function toggleQuarantineCircle() {
  const quarantineCheckbox = document.getElementById('quarantine-circle-toggle');
  const isChecked = quarantineCheckbox.checked;

  if (isChecked) {
    console.log('Mostrando círculos de cuarentena');
    fetchAndDisplayQuarantines('radio'); // Muestra solo las cuarentenas con radio
  } else {
    console.log('Ocultando círculos de cuarentena');
    if (map.getLayer('quarantine-circle-layer')) {
      map.setLayoutProperty('quarantine-circle-layer', 'visibility', 'none'); // Oculta la capa
    }
  }
}

// Asignar el evento al checkbox
document.addEventListener('DOMContentLoaded', () => {
  const quarantineCheckbox = document.getElementById('quarantine-circle-toggle');
  
  if (quarantineCheckbox) {
    quarantineCheckbox.addEventListener('change', toggleQuarantineCircle);
  } else {
    console.error('El checkbox con id "quarantine-circle-toggle" no fue encontrado.');
  }
});



export { quarantinePoints, saveQuarantine, startDrawing, endDrawing };
