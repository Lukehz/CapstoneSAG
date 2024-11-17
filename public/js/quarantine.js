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
  const idSector = document.getElementById("SelectComuna").value; // Obtener el id_sector desde el dropdown
  const activa = 1;
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

  if (radius !== null && radius <= 0) {
    alert('El radio debe ser un valor positivo.');
    return;
  }

  const quarantineData = {
    points,
    comment,
    type,
    radius: radius !== null ? radius : 0,
    idSector, // Usar idSector para guardar el id de la comuna en la base de datos
    activa: activa
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
    map.setFilter('quarantine-circle-layer', ['==', 'id', '']);
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

document.getElementById('quarantine-type').addEventListener('change', function(e) {
  
  if (drawingMode) {
    // Prevenir el cambio de opción
    e.preventDefault();
    
    // Restaurar el valor anterior del select
    this.value = this.dataset.lastValue || '';
    
    // Mostrar alerta al usuario
    alert('Por favor termine o cancele el dibujo actual antes de cambiar de opción.');
    
    // Asegurarnos que el modo de dibujo sigue activo
    drawingMode = true;
    
    // Mantener visible el input de radio si estaba en ese modo
    const radiusInput = document.getElementById('quarantine-radius');
    if (this.value === 'radio') {
      radiusInput.style.display = 'block';
    }
    
    return;
  }

  this.dataset.lastValue = this.value;
  
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

      data.forEach(quarantine => {
      console.log(`Cuarentena completa: ${JSON.stringify(quarantine)}`);
    });

      const filteredQuarantines = quarantines.filter(quarantine => {
        const isActive = quarantine.activa === 1 || quarantine.activa === '1' || quarantine.activa === true;  // Verifica valores posibles
        
        if (type === 'radio') return quarantine.radio > 0 && isActive;
        if (type === 'trazado') return !quarantine.radio && isActive;
        return isActive;  // Solo cuarentenas activas
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
        <button class="deactivate-button" data-id="${properties.id}">Desactivar</button>
      `;
            // Agregar el evento click al botón de desactivar
        const deactivateButton = popupContent.querySelector('.deactivate-button');
        deactivateButton.addEventListener('click', () => {
          if (confirm('¿Estás seguro de desactivar esta cuarentena?')) {
          

            // Después de desactivar, eliminar la cuarentena del mapa
            deactivateQuarantine(properties.id);

            // Recargar el mapa con las cuarentenas actualizadas
            fetchAndDisplayQuarantines('radio');
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
        <button class="deactivate-button" data-id="${properties.id}">Inhabilitar</button>
      `;
      
    
      // Agregar el evento click al botón de desactivar
      const deactivateButton = popupContent.querySelector('.deactivate-button');
      deactivateButton.addEventListener('click', () => {
        if (confirm('¿Estás seguro de desactivar esta cuarentena?')) {
          // Aquí podrías hacer la lógica para marcar la cuarentena como inactiva en tu base de datos
          // Esto podría ser una llamada a una API o actualización local

          // Después de desactivar, eliminar la cuarentena del mapa
          deactivateQuarantine(properties.id);

          // Recargar el mapa con las cuarentenas actualizadas
          fetchAndDisplayQuarantines();
        }
      });
      
      // Crear y mostrar el popup
      currentPopup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setDOMContent(popupContent)
        .addTo(map); 
    });
    
  }   

  
  function deactivateQuarantine(id) {
    fetch(`/quarantines/deactivate-quarantine/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        }
        
    })
    
    .then(async response => {
        if (!response.ok) {
            // Intentar obtener el mensaje de error del servidor
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `Error ${response.status}`);
        }
        return response.json();
    })
    
    .then(data => {
        if (data.success) {
            alert(`Cuarentena ${id} desactivada exitosamente.`);
            fetchAndDisplayQuarantines(); // Refresca las cuarentenas en el mapa
        } else {
            alert(`Error al desactivar cuarentena: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Error al desactivar cuarentena:', error);
        alert(`Hubo un error al desactivar la cuarentena: ${error.message}`);
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

//document para inactivas
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('quarantine-inactive').addEventListener('change', function() {
    toggleInactiveQuarantines();
  });
});

function toggleInactiveQuarantines() {
  const inactiveCheckbox = document.getElementById('quarantine-inactive');
  const isChecked = inactiveCheckbox.checked;

  if (isChecked) {
    console.log('Mostrando cuarentenas inactivas');
    fetchInactiveRadioQuarantines();
    fetchInactiveTrazadoQuarantines();
  } else {
    console.log('Ocultando cuarentenas inactivas');
    hideInactiveQuarantines();
  }
}

function hideInactiveQuarantines() {
  if (map.getLayer('inactive-quarantine-fill')) {
    map.setLayoutProperty('inactive-quarantine-fill', 'visibility', 'none');
  }
  if (map.getLayer('inactive-quarantine-outline')) {
    map.setLayoutProperty('inactive-quarantine-outline', 'visibility', 'none');
  }
  if (map.getLayer('inactive-quarantine-radio-fill')) {
    map.setLayoutProperty('inactive-quarantine-radio-fill', 'visibility', 'none');
  }
  if (map.getLayer('inactive-quarantine-radio-outline')) {
    map.setLayoutProperty('inactive-quarantine-radio-outline', 'visibility', 'none');
  }
  if (map.getLayer('inactive-quarantine-trazado-fill')) {
    map.setLayoutProperty('inactive-quarantine-trazado-fill', 'visibility', 'none');
  }
  if (map.getLayer('inactive-quarantine-trazado-outline')) {
    map.setLayoutProperty('inactive-quarantine-trazado-outline', 'visibility', 'none');
  }
}


function updateInactiveQuarantinePolygons(features, type) {
  const sourceId = `inactive-quarantine-${type}-source`;
  const fillLayerId = `inactive-quarantine-${type}-fill`;
  const outlineLayerId = `inactive-quarantine-${type}-outline`;

  // Remover capas existentes si existen
  if (map.getLayer(fillLayerId)) {
    map.removeLayer(fillLayerId);
  }
  if (map.getLayer(outlineLayerId)) {
    map.removeLayer(outlineLayerId);
  }
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }

  // Agregar nueva fuente
  map.addSource(sourceId, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: features
    }
  });

  // Agregar capa de relleno
  map.addLayer({
    id: fillLayerId,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': type === 'radio' ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 0, 255, 0.4)',
      'fill-opacity': 0.4
    }
  });

  // Agregar capa de contorno
  map.addLayer({
    id: outlineLayerId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': type === 'radio' ? '#FF0000' : '#0000FF',
      'line-width': 2
    }
  });
  map.on('click', fillLayerId, (e) => {
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
    let contentHTML = `
      <h3>Cuarentena Inactiva ID: ${properties.id}</h3>
      <p>Comentario: ${properties.comentario || 'Sin comentario'}</p>
    `;
  
    // Agregar información del radio solo si es una cuarentena de tipo radio
    if (type === 'radio') {
      contentHTML += `<p>Radio: ${properties.radio} metros</p>`
    }
  
    contentHTML += `
      <button class="activate-button" data-id="${properties.id}">Activar</button>
    `;
  
    popupContent.innerHTML = contentHTML;
  
    // Agregar el evento click al botón de activar
    const activateButton = popupContent.querySelector('.activate-button');
    activateButton.addEventListener('click', () => {
      if (confirm('¿Estás seguro de activar esta cuarentena?')) {
        activateQuarantine(properties.id)
        fetchInactiveRadioQuarantines();
        fetchInactiveTrazadoQuarantines()
      
          .then(() => {
            // Cerrar el popup
            if (currentPopup) {
              currentPopup.remove();
            }
  
            // Remover la cuarentena activada del mapa
            const source = map.getSource(sourceId);
            if (source) {
              const currentFeatures = source._data.features;
              const updatedFeatures = currentFeatures.filter(f => f.properties.id !== properties.id);
              
              source.setData({
                type: 'FeatureCollection',
                features: updatedFeatures
              });
            }
  
            // Recargar las cuarentenas
            
          })
          .catch(error => {
            console.error('Error al activar la cuarentena:', error);
            alert(`Hubo un error al activar la cuarentena: ${error.message}`);
          });
      }
    });
  
    currentPopup = new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setDOMContent(popupContent)
      .addTo(map);
  });
}

function activateQuarantine(id) {
  return fetch(`/quarantines/activa/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(async response => {
    if (!response.ok) {
      // Intentar obtener el mensaje de error del servidor
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `Error ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      alert(`Cuarentena ${id} activada exitosamente.`);
      return data; // Retornamos los datos para la cadena de promesas
    } else {
      throw new Error(data.error || 'Error desconocido al activar la cuarentena');
    }
  });
}

function displayInactiveRadioQuarantines(quarantines) {
  console.log('Cuarentenas radio recibidas:', quarantines); // Debug log

  const features = quarantines.map(quarantine => {
    if (quarantine.radio) {
      const center = [quarantine.longitud, quarantine.latitud];
      const circleCoords = generateCircle(center, quarantine.radio);
      
      // Log para debug
      console.log('Creando feature para cuarentena:', quarantine);
      
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [circleCoords]
        },
        properties: {
          id: quarantine.id_cuarentena || quarantine.id, // Asegurarse de usar el campo correcto
          comentario: quarantine.comentario || 'Sin comentario',
          tipo: 'radio',
          radio: quarantine.radio,
          inactive: true
        }
      };
    }
    return null;
  }).filter(Boolean);

  console.log('Features de cuarentenas inactivas por radio generadas:', features); // Debug log
  updateInactiveQuarantinePolygons(features, 'radio');
}

function displayInactiveTrazadoQuarantines(quarantines) {
  console.log('Cuarentenas trazado recibidas:', quarantines); // Debug log

  const features = quarantines.map(quarantine => {
    if (quarantine.conexiones && quarantine.conexiones.length >= 3) {
      // Log para debug
      console.log('Creando feature para cuarentena trazado:', quarantine);
      
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            ...quarantine.conexiones.map(conn => [conn.longitud_INI, conn.latitud_INI]),
            [quarantine.conexiones[0].longitud_INI, quarantine.conexiones[0].latitud_INI]
          ]]
        },
        properties: {
          id: quarantine.id_cuarentena || quarantine.id, // Asegurarse de usar el campo correcto
          comentario: quarantine.comentario || 'Sin comentario',
          tipo: 'trazado',
          inactive: true
        }
      };
    }
    return null;
  }).filter(Boolean);

  console.log('Features de cuarentenas inactivas por trazado generadas:', features); // Debug log
  updateInactiveQuarantinePolygons(features, 'trazado');
}
function fetchInactiveRadioQuarantines() {
  fetch('/quarantines/inactiva')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      console.log('Datos de cuarentenas inactivas por radio recibidos:', data);
      const quarantines = Array.isArray(data) ? data : data.data;
      displayInactiveRadioQuarantines(quarantines);
    })
    .catch(error => {
      console.error('Error al obtener cuarentenas inactivas por radio:', error);
      alert('Hubo un error al obtener las cuarentenas inactivas por radio');
    });
}

function fetchInactiveTrazadoQuarantines() {
  fetch('/quarantines/inactiva-trazado')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      console.log('Datos de cuarentenas inactivas por trazado recibidos:', data);
      const quarantines = Array.isArray(data) ? data : data.data;
      displayInactiveTrazadoQuarantines(quarantines);
    })
    .catch(error => {
      console.error('Error al obtener cuarentenas inactivas por trazado:', error);
      alert('Hubo un error al obtener las cuarentenas inactivas por trazado');
    });
}
// Función auxiliar para activar un toggle y actualizar la visualización
function activateToggle(type) {
  const radiusToggle = document.getElementById('quarantine-circle-toggle');
  const polygonToggle = document.getElementById('quarantine-toggle');
  
  cancelDrawing();

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

  const Select = document.getElementById("SelectComuna"); 
  if (Select) {
    selectElement.value = 'seleccionar';
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
    'temp-quarantine-circle',
    
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

document.addEventListener("DOMContentLoaded", function() {
  console.log('DOM completamente cargado');
  
  const Select = document.getElementById("SelectComuna"); 
  console.log('Elemento select encontrado:', Select);

  if (Select) { 
      fetch('/quarantines/comuna')  // Asegúrate de que esta URL coincida con la configuración en tu servidor
          .then(response => {
              console.log('Respuesta recibida:', response);
              return response.json();
          })
          .then(data => {
              console.log('Datos recibidos:', data);
              if (data.success) {
                  data.comunas.forEach(comuna => {
                      const option = document.createElement("option");
                      option.value = comuna.id_sector;
                      option.textContent = comuna.comuna;
                      Select.appendChild(option);
                      console.log('Opción agregada:', comuna.comuna);
                  });
              } else {
                  console.error("Error en los datos:", data.error);
              }
          })
          .catch(error => console.error("Error al cargar las comunas:", error));
  } else {
      console.error("No se encontró el elemento SelectComuna");
  }
});

export { quarantinePoints, saveQuarantine, startDrawing, endDrawing, initializeQuarantineState};