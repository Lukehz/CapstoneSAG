import { map } from './map.js';

let drawingMode = false;
let quarantinePoints = [];
let quarantineCircle = null;
let quarantineCenter = null;
let isDeleting = false;

// Función para recoger el comentario del usuario
const getComment = () => {
  const commentElement = document.getElementById('quarantine-comment');
  return commentElement.value.trim();
};

const cancelDrawing = () => {
  // Limpiar los puntos y el círculo de cuarentena
  quarantinePoints = [];
  quarantineCenter = null;

  // Si hay un círculo, lo eliminamos
  if (quarantineCircle) {
    map.removeLayer(quarantineCircle.id);
    map.removeSource(quarantineCircle.id);
    quarantineCircle = null;
  }

  // Eliminar los puntos y la línea del polígono
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
    const response = await fetch('/quarantine/save-quarantine', {
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

// Función para actualizar los puntos de cuarentena en el mapa
const updateQuarantinePoints = () => {
  if (quarantinePoints.length === 0) return;

  const pointsData = {
    type: 'FeatureCollection',
    features: quarantinePoints.map(point => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: point.coords
      }
    }))
  };

  if (map.getSource('quarantine-points')) {
    map.getSource('quarantine-points').setData(pointsData);
  } else {
    map.addSource('quarantine-points', {
      type: 'geojson',
      data: pointsData
    });

    map.addLayer({
      id: 'quarantine-points',
      type: 'circle',
      source: 'quarantine-points',
      paint: {
        'circle-radius': 6,
        'circle-color': '#FF0000'
      }
    });
  }
};

// Función para actualizar el polígono de cuarentena en el mapa
const updateQuarantinePolygon = () => {
  if (quarantinePoints.length === 0) return;

  const lineStringData = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: quarantinePoints.map(point => point.coords)
      }
    }]
  };

  if (map.getSource('quarantine-line')) {
    map.getSource('quarantine-line').setData(lineStringData);
  } else {
    map.addSource('quarantine-line', {
      type: 'geojson',
      data: lineStringData
    });

    map.addLayer({
      id: 'quarantine-line',
      type: 'line',
      source: 'quarantine-line',
      paint: {
        'line-color': '#FF0000',
        'line-width': 2
      }
    });
  }

  if (quarantinePoints.length >= 3) {
    const polygonData = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[...quarantinePoints.map(point => point.coords), quarantinePoints[0].coords]]
        }
      }]
    };

    if (map.getSource('quarantine-polygon')) {
      map.getSource('quarantine-polygon').setData(polygonData);
    } else {
      map.addSource('quarantine-polygon', {
        type: 'geojson',
        data: polygonData
      });

      map.addLayer({
        id: 'quarantine-polygon',
        type: 'fill',
        source: 'quarantine-polygon',
        paint: {
          'fill-color': '#FF0000',
          'fill-opacity': 0.2
        }
      });
    }
  }
};

// Evento del botón "Guardar Cuarentena"
document.getElementById('save-quarantine').addEventListener('click', saveQuarantine);



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

  saveQuarantine(quarantineData);
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
    type: 'radio',
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


// Modificación del evento de clic en el mapa
map.on('click', (e) => {
  console.log('Clic en el mapa', e.lngLat);
  if (drawingMode) {
    console.log('Modo de dibujo activado');
    const quarantineType = document.getElementById('quarantine-type').value;
    if (quarantineType === 'radio') {
      quarantineCenter = [e.lngLat.lng, e.lngLat.lat];
      console.log('Centro de cuarentena:', quarantineCenter);
      updateQuarantineCircle();
      // Activa automáticamente el checkbox del círculo
      document.getElementById('quarantine-circle-toggle').checked = true;
    } else {
      quarantinePoints.push({ coords: [e.lngLat.lng, e.lngLat.lat] });
      console.log('Puntos de cuarentena:', quarantinePoints);
      updateQuarantinePoints();
      updateQuarantinePolygon();
    }
  }
});





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

// Update the map click event handler
map.on('click', (e) => {
  console.log('Clic en el mapa', e.lngLat);
  if (drawingMode) {
    if (drawingMode === 'radio') {
      quarantineCenter = [e.lngLat.lng, e.lngLat.lat];
      updateQuarantineCircle();
    } else if (drawingMode === 'trazado') {
      quarantinePoints.push({ coords: [e.lngLat.lng, e.lngLat.lat] });
      updateQuarantinePoints();
      updateQuarantinePolygon();
    }
  }
});

function endDrawing() {
  drawingMode = false;
  console.log("Modo de dibujo desactivado");
}

function updateQuarantineCircle() {
  if (!quarantineCenter) {
    console.log("No hay centro de cuarentena definido.");
    return;
  }

  const radius = parseFloat(document.getElementById('quarantine-radius').value) || 1000;
  
  if (quarantineCircle) {
    map.removeLayer(quarantineCircle.id);
    map.removeSource(quarantineCircle.id);
  }

  const circleCoords = generateCircle(quarantineCenter, radius);

  quarantineCircle = {
    id: 'quarantine-circle',
    type: 'fill',
    source: {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: { 
          id: 'quarantine-circle-id',
          radius: radius,
          comment: ''
        },
        geometry: {
          type: 'Polygon',
          coordinates: [circleCoords]
        }
      }
    },
    paint: {
      'fill-color': '#FF0000',
      'fill-opacity': 0.5,
      'fill-outline-color': '#FF0000'
    }
  };

  map.addLayer(quarantineCircle);
  console.log('Círculo de cuarentena actualizado');
}


document.getElementById('quarantine-radius').addEventListener('input', updateQuarantineCircle);

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


map.on('click', (e) => {
  console.log('Clic en el mapa', e.lngLat); // Verifica si el clic es correcto
  if (drawingMode) {
    console.log('Modo de dibujo activado');
    const quarantineType = document.getElementById('quarantine-type').value;
    if (quarantineType === 'radio') {
      quarantineCenter = [e.lngLat.lng, e.lngLat.lat];
      console.log('Centro de cuarentena:', quarantineCenter);
      updateQuarantineCircle();
    } else {
      quarantinePoints.push({ coords: [e.lngLat.lng, e.lngLat.lat] });
      console.log('Puntos de cuarentena:', quarantinePoints);
      updateQuarantinePoints();
      updateQuarantinePolygon();
    }
  }
});

document.getElementById('quarantine-radius').addEventListener('input', updateQuarantineCircle);

// Botón de crear cuarentena
document.getElementById('create-quarantine').addEventListener('click', () => {
  console.log("Botón de crear cuarentena clickeado");
  const quarantineType = document.getElementById('quarantine-type').value;
  const comment = document.getElementById('quarantine-comment').value.trim();
  const radiusInput = document.getElementById('quarantine-radius').value;

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

function fetchAndDisplayQuarantines() {
  fetch('/quarantine/get-all-quarantines')
    .then(response => {
      if (!response.ok) throw new Error(`Error HTTP! estado: ${response.status}`);
      return response.json();
    })
    .then(data => {
      console.log('Datos recibidos:', data);
      const quarantines = Array.isArray(data) ? data : [data];
      const isValidCoordinate = (coord) => {
        return Array.isArray(coord) && coord.length === 2 &&
               !isNaN(coord[0]) && !isNaN(coord[1]) &&
               Math.abs(coord[0]) <= 180 && Math.abs(coord[1]) <= 90;
      };

      const validQuarantines = quarantines.filter(quarantine => {
        return quarantine.conexiones && quarantine.conexiones.length >= 3 &&
               quarantine.conexiones.every(conn => isValidCoordinate([conn.longitud_INI, conn.latitud_INI]));
      });

      const features = validQuarantines.map(quarantine => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            ...quarantine.conexiones.map(conn => [conn.longitud_INI, conn.latitud_INI]),
            [quarantine.conexiones[0].longitud_INI, quarantine.conexiones[0].latitud_INI]
          ]]
        },
        properties: {
          id: quarantine.id,
          comentario: quarantine.comentario || 'Sin comentario'
        }
      }));

      if (!map.getSource('quarantine-source')) {
        map.addSource('quarantine-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: features }
        });

        map.addLayer({
          id: 'quarantine-layer',
          type: 'fill',
          source: 'quarantine-source',
          paint: {
            'fill-color': '#FF0000',
            'fill-opacity': 0.5
          },
          layout: { visibility: 'none' }
        });
      } else {
        map.getSource('quarantine-source').setData({
          type: 'FeatureCollection',
          features: features
        });
      }

      map.on('click', 'quarantine-layer', (e) => {
        const properties = e.features[0].properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <h3>Cuarentena ID: ${properties.id}</h3>
            <p>Comentario: ${properties.comentario}</p>
            <button class="delete-button" data-id="${properties.id}">Eliminar</button>
          `)
          .addTo(map);
      });

      map.on('mouseenter', 'quarantine-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'quarantine-layer', () => {
        map.getCanvas().style.cursor = '';
      });

      if (features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        features.forEach(feature => {
          feature.geometry.coordinates[0].forEach(coord => {
            bounds.extend(coord);
          });
        });
      }
    })
    .catch(error => {
      console.error('Error al obtener cuarentenas:', error);
      alert(`Hubo un error al obtener las cuarentenas: ${error.message}`);
    });
}

function eliminarCuarentena(id) {
  if (isDeleting) return; // Evitar la eliminación si ya se está procesando
  isDeleting = true; // Marcar que se está procesando la eliminación
  console.log(`Intentando eliminar cuarentena con ID: ${id}`);
  fetch(`/quarantine/quarantines/${id}`, {
    method: 'DELETE',
  })
    .then(response => {
      if (!response.ok) throw new Error('Error al eliminar la cuarentena');
      return response.json();
    })
    .then(data => {
      console.log('Datos de respuesta:', data);
      if (data.success) {
        alert(data.message);
        removeQuarantineFromMap(id);
        fetchAndDisplayQuarantines();
      } else {
        throw new Error(data.message || 'Error al eliminar la cuarentena');
      }
    })
    .catch(error => {
      console.error('Error al eliminar la cuarentena:', error);
      alert(`Error al eliminar la cuarentena: ${error.message}`);
    })
    .finally(() => {
      isDeleting = false; // Reiniciar el estado al finalizar
    });
}


function removeQuarantineFromMap(quarantineId) {
  const currentSource = map.getSource('quarantine-source');
  if (currentSource) {
    const features = currentSource._data.features.filter(feature => feature.properties.id !== quarantineId);
    currentSource.setData({
      type: 'FeatureCollection',
      features: features
    });
  }
}

function toggleQuarantines() {
  const isVisible = this.checked;
  map.setLayoutProperty('quarantine-layer', 'visibility', isVisible ? 'visible' : 'none');

  // Si el checkbox está marcado, actualiza el círculo de cuarentena
  if (isVisible && quarantineCenter) {
    updateQuarantineCircle(); // Asegúrate de que el círculo se muestre
  }

  console.log(isVisible ? 'Cuarentenas mostradas en el mapa.' : 'Cuarentenas ocultadas del mapa.');
}

document.addEventListener('DOMContentLoaded', () => {
  const quarantineCheckbox = document.getElementById('quarantine-toggle');
  quarantineCheckbox.checked = false;
  quarantineCheckbox.addEventListener('change', toggleQuarantines);
  
  fetchAndDisplayQuarantines();

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-button')) {
      const id = e.target.dataset.id;
      if (confirm('¿Estás seguro de eliminar esta cuarentena?')) {
        eliminarCuarentena(id);
      }
    }
  });
});

// Modificación de la función toggleQuarantineCircle
function toggleQuarantineCircle() {
  const isChecked = document.getElementById('quarantine-circle-toggle').checked;

  if (isChecked) {
    if (quarantineCenter) {
      console.log('Mostrando círculo de cuarentena');
      updateQuarantineCircle();
    } else {
      console.log('No hay centro de cuarentena definido. Por favor, seleccione un centro en el mapa.');
      // Opcional: Puedes mostrar una alerta al usuario aquí
    }
  } else {
    if (quarantineCircle) {
      map.removeLayer(quarantineCircle.id);
      map.removeSource(quarantineCircle.id);
      quarantineCircle = null;
      console.log('Ocultando círculo de cuarentena');
    } else {
      console.log('No hay círculo de cuarentena para ocultar');
    }
  }
}
// Evento para manejar el cambio del checkbox
document.getElementById('quarantine-circle-toggle').addEventListener('change', toggleQuarantineCircle);

document.addEventListener('DOMContentLoaded', () => {
  const quarantineCheckbox = document.getElementById('quarantine-toggle');
  quarantineCheckbox.checked = false;
  quarantineCheckbox.addEventListener('change', toggleQuarantines);
  
  // Agregar el evento para el checkbox del círculo
  const circleCheckbox = document.getElementById('quarantine-circle-toggle');
  circleCheckbox.addEventListener('change', toggleQuarantineCircle);

  fetchAndDisplayQuarantines();

});


export { quarantinePoints };
