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
   // Guardar el estado actual de los toggles
   const radiusToggle = document.getElementById('quarantine-circle-toggle');
   const polygonToggle = document.getElementById('quarantine-toggle');
   const wasRadiusActive = radiusToggle && radiusToggle.checked;
   const wasPolygonActive = polygonToggle && polygonToggle.checked;
 
   clearQuarantineForm();
   // Limpiar los puntos de cuarentena
   quarantinePoints = [];
 
   // Si hay un círculo de dibujo temporal, lo eliminamos
   if (quarantineCircle && quarantineCircle.id === 'temp-quarantine-circle') {
     map.removeLayer(quarantineCircle.id);
     map.removeSource(quarantineCircle.id);
     quarantineCircle = null;
   }
 
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
 
   // Restaurar el estado de visualización previo
   if (wasRadiusActive) {
     fetchAndDisplayQuarantines('radio');
   } else if (wasPolygonActive) {
     fetchAndDisplayQuarantines('trazado');
   }
 };

 // Asignar el evento al botón para cancelar el dibujo en proceso
document.getElementById('cancel-quarantine').addEventListener('click', cancelDrawing);



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
      
      document.getElementById('quarantine-type').value = 'seleccionar';
      clearQuarantineForm();

      // Activar el toggle correspondiente según el tipo de cuarentena
      const radiusToggle = document.getElementById('quarantine-circle-toggle');
      const polygonToggle = document.getElementById('quarantine-toggle');
      
      if (type === 'radius') {
        if (radiusToggle) {
          radiusToggle.checked = true;
          // Desactivar el toggle de polígonos si está activo
          if (polygonToggle) {
            polygonToggle.checked = false;
          }
          // Ocultar la capa de polígonos si existe
          if (map.getLayer('quarantine-layer')) {
            map.setLayoutProperty('quarantine-layer', 'visibility', 'none');
          }
          fetchAndDisplayQuarantines('radio');
        }
      } else {
        if (polygonToggle) {
          polygonToggle.checked = true;
          // Desactivar el toggle de radio si está activo
          if (radiusToggle) {
            radiusToggle.checked = false;
          }
          // Ocultar la capa de círculos si existe
          if (map.getLayer('quarantine-circle-layer')) {
            map.setLayoutProperty('quarantine-circle-layer', 'visibility', 'none');
          }
          fetchAndDisplayQuarantines('trazado');
        }
      }



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

// Nueva función para limpiar el formulario
function clearQuarantineForm() {
  // Limpiar el campo de comentario
  const commentElement = document.getElementById('quarantine-comment');
  if (commentElement) {
    commentElement.value = '';
  }

  // Limpiar el campo de radio
  const radiusElement = document.getElementById('quarantine-radius');
  if (radiusElement) {
    radiusElement.value = '';
  }

  // Resetear el tipo de cuarentena al valor por defecto
  const typeElement = document.getElementById('quarantine-type');
  if (typeElement) {
    typeElement.value = ''; // O el valor por defecto que prefieras
  }

  // Limpiar variables globales
  quarantinePoints = [];
  quarantineCenter = null;
  
  // Si hay un círculo temporal, eliminarlo
  if (quarantineCircle && quarantineCircle.id === 'temp-quarantine-circle') {
    map.removeLayer(quarantineCircle.id);
    map.removeSource(quarantineCircle.id);
    quarantineCircle = null;
  }

  // Limpiar capas temporales del mapa
  ['quarantine-points', 'quarantine-line', 'quarantine-polygon'].forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(layerId)) {
      map.removeSource(layerId);
    }
  });
}

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
  // Deshabilitar la interactividad de las capas durante el dibujo
  if (map.getLayer('quarantine-circle-layer')) {
    map.setLayoutProperty('quarantine-circle-layer', 'visibility', 'visible');
    map.setFilter('quzarantine-circle-layer', ['==', 'id', '']);
  }
  if (map.getLayer('quarantine-layer')) {
    map.setLayoutProperty('quarantine-layer', 'visibility', 'visible');
    map.setFilter('quarantine-layer', ['==', 'id', '']);
  }

  console.log(`Modo de dibujo activado: ${mode}`);
}




function endDrawing() {
  drawingMode = false;
  console.log("Modo de dibujo desactivado");
  // Restaurar la interactividad de las capas
  if (map.getLayer('quarantine-circle-layer')) {
    map.setFilter('quarantine-circle-layer', null);
  }
  if (map.getLayer('quarantine-layer')) {
    map.setFilter('quarantine-layer', null);
  }

  console.log("Modo de dibujo desactivado");
}

// Actualizar el manejador de eventos del mapa
map.on('click', (e) => {
  if (!drawingMode) return;

  // Si estamos en modo dibujo, prevenir que se propague el evento a otras capas
  e.originalEvent.stopPropagation();
  
  const quarantineType = document.getElementById('quarantine-type').value;
  if (quarantineType === 'radio') {
    quarantineCenter = [e.lngLat.lng, e.lngLat.lat];
    updateQuarantineCircle();
  } else if (quarantineType === 'trazado') {
    quarantinePoints.push({ coords: [e.lngLat.lng, e.lngLat.lat] });
    updateQuarantinePoints();
    updateQuarantinePolygon();
  }
});


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
      if (drawingMode) return;
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
      if (drawingMode) return;
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

        const radiusToggle = document.getElementById('quarantine-circle-toggle');
        const polygonToggle = document.getElementById('quarantine-toggle');

        if (radiusToggle && radiusToggle.checked) {
          fetchAndDisplayQuarantines('radio');
        } else if (polygonToggle && polygonToggle.checked) {
          fetchAndDisplayQuarantines('trazado');
        } else {
          // Si ningún toggle está activo, no mostramos nada
          if (map.getLayer('quarantine-circle-layer')) {
            map.setLayoutProperty('quarantine-circle-layer', 'visibility', 'none');
          }
          if (map.getLayer('quarantine-layer')) {
            map.setLayoutProperty('quarantine-layer', 'visibility', 'none');
          }
        }
        
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
  const quarantineCheckbox = document.getElementById('quarantine-toggle');
  const isChecked = quarantineCheckbox.checked;

  if (isChecked) {
    console.log('Mostrando trazados de cuarentena');
    fetchAndDisplayQuarantines(); // Muestra solo las cuarentenas con radio
  } else {
    console.log('Ocultando trazados de cuarentena');
    if (map.getLayer('quarantine-layer')) {
      map.setLayoutProperty('quarantine-layer', 'visibility', 'none'); // Oculta la capa
    }
  }
}

// Asignar el evento al checkbox
document.addEventListener('DOMContentLoaded', () => {
  const quarantineCheckbox = document.getElementById('quarantine-toggle');
  
  if (quarantineCheckbox) {
    quarantineCheckbox.addEventListener('change', toggleQuarantines);
  } else {
    console.error('El checkbox con id "quarantine-toggle" no fue encontrado.');
  }
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

// Función auxiliar para activar un toggle y actualizar la visualización
function activateToggle(type) {
  const radiusToggle = document.getElementById('quarantine-circle-toggle');
  const polygonToggle = document.getElementById('quarantine-toggle');
  
  if (type === 'radio') {
    if (radiusToggle) {
      radiusToggle.checked = true;
      if (polygonToggle) {
        polygonToggle.checked = false;
      }
      toggleQuarantineCircle();
    }
  } else {
    if (polygonToggle) {
      polygonToggle.checked = true;
      if (radiusToggle) {
        radiusToggle.checked = false;
      }
      toggleQuarantines();
    }
  }
}

// Nueva función de inicialización
function initializeQuarantineState() {
  // Resetear variables globales
  drawingMode = false;
  quarantinePoints = [];
  quarantineCircle = null;
  quarantineCenter = null;
  isDeleting = false;
  currentPopup = null;

  // Resetear formularios
  const commentElement = document.getElementById('quarantine-comment');
  if (commentElement) {
    commentElement.value = '';
  }

  const radiusElement = document.getElementById('quarantine-radius');
  if (radiusElement) {
    radiusElement.value = '';
    radiusElement.style.display = 'none';
  }

  const typeElement = document.getElementById('quarantine-type');
  if (typeElement) {
    typeElement.value = 'seleccionar';
  }

  // Resetear toggles
  const radiusToggle = document.getElementById('quarantine-circle-toggle');
  const polygonToggle = document.getElementById('quarantine-toggle');
  
  if (radiusToggle) {
    radiusToggle.checked = false;
  }
  
  if (polygonToggle) {
    polygonToggle.checked = false;
  }

  // Limpiar capas del mapa
  const layersToRemove = [
    'quarantine-points',
    'quarantine-line',
    'quarantine-polygon',
    'temp-quarantine-circle'
  ];

  layersToRemove.forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(layerId)) {
      map.removeSource(layerId);
    }
  });

  // Ocultar capas de cuarentena
  if (map.getLayer('quarantine-circle-layer')) {
    map.setLayoutProperty('quarantine-circle-layer', 'visibility', 'none');
  }
  
  if (map.getLayer('quarantine-layer')) {
    map.setLayoutProperty('quarantine-layer', 'visibility', 'none');
  }
}


// Agregar evento para cuando se carga la página
document.addEventListener('DOMContentLoaded', initializeQuarantineState);

// Agregar evento para cuando se recarga la página
window.addEventListener('beforeunload', () => {
  initializeQuarantineState();
});







export { quarantinePoints, saveQuarantine, startDrawing, endDrawing, initializeQuarantineState};
