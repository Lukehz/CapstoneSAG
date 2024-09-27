import { map } from './map.js';

let drawingMode = false;
let quarantinePoints = [];
let parcelaMarkers = [];

/* */ 

const updateParcelas = () => {
  console.log('Obteniendo parcelas...');
  fetch('http://localhost:3000/parcelas')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error HTTP! estado: ${response.status}`);
      }
      return response.json();
    })
    .then(parcelas => {
      console.log('Parcelas recibidas');
      if (!parcelas.length) {
        console.log('No se encontraron parcelas');
        return;
      }

      parcelaMarkers.forEach(marker => marker.remove());
      parcelaMarkers = [];

      const bounds = new mapboxgl.LngLatBounds();
      parcelas.forEach(parcela => {
        const lat = parcela.latitud;
        const lng = parcela.longitud;
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          const marker = new mapboxgl.Marker()
            .setLngLat([parcela.longitud, parcela.latitud])
            .setPopup(new mapboxgl.Popup().setHTML(`
              <h3>Parcela ID: ${parcela.ID}</h3>
              <p>Coordenadas: ${parcela.latitud}, ${parcela.longitud}</p>
              <p>Fase: ${parcela.Fase}</p>
              <p>Cultivo: ${parcela.Cultivo}</p>
              <p>Comuna: ${parcela.Comuna}</p>
              <p>Registrada: ${parcela.Registrada}</p>
            `))
            .addTo(map);

          parcelaMarkers.push(marker);
          bounds.extend([parcela.longitud, parcela.latitud]);
        }
      });
    })
    .catch(error => console.error('Error al obtener parcelas:', error));
};

// Función para actualizar los puntos de cuarentena
const updateQuarantinePoints = () => {
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

// Función para actualizar el polígono de cuarentena
const updateQuarantinePolygon = () => {
  if (quarantinePoints.length < 2) return; // No dibujar líneas con menos de 2 puntos

  const orderedPoints = quarantinePoints.sort((a, b) => a.order - b.order).map(point => point.coords);
  const lineData = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: orderedPoints
      }
    }]
  };

  if (map.getSource('quarantine-line')) {
    map.getSource('quarantine-line').setData(lineData);
  } else {
    map.addSource('quarantine-line', {
      type: 'geojson',
      data: lineData
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
    // Cerrar el polígono si hay al menos 3 puntos
    const closedPoints = [...orderedPoints, orderedPoints[0]];
    const polygonData = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [closedPoints]
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

     
      
    }
  }
};


// Función para eliminar capas y fuentes
const removeLayersAndSources = () => {
  ['quarantine-points', 'quarantine-line', 'quarantine-polygon'].forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(layerId)) {
      map.removeSource(layerId);
    }
  });
};
// Evento del botón "Crear Cuarentena"
document.getElementById('create-quarantine').addEventListener('click', () => {
  drawingMode = !drawingMode;

  if (drawingMode) {
    document.getElementById('create-quarantine').innerText = 'Cancelar creación';
    quarantinePoints = []; // Reiniciar puntos solo si es una nueva creación
    updateQuarantinePoints(); // Actualizar la capa de puntos
    updateQuarantinePolygon(); // Actualizar el polígono (estará vacío inicialmente)
  } else {
    document.getElementById('create-quarantine').innerText = 'Crear cuarentena';
    
    // Limpiar los puntos y las capas al cancelar
    removeLayersAndSources(['quarantine-points', 'quarantine-outline', 'quarantine-polygon'], 'quarantine-polygon');
    quarantinePoints = []; // Asegurarse de que los puntos se limpien al cancelar
  }
});

// Evento del botón "Guardar Cuarentena"
document.getElementById('save-quarantine').addEventListener('click', () => {
  if (quarantinePoints.length < 3) {
    alert('Debe haber al menos tres puntos para guardar una cuarentena.');
    return;
  }

  const orderedPoints = quarantinePoints.sort((a, b) => a.order - b.order).map(point => point.coords);
  const closedPoints = [...orderedPoints, orderedPoints[0]];
  const comentario = document.getElementById('quarantine-comment').value;

  fetch('http://localhost:3000/quarantine/save-quarantine', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      points: closedPoints,
      comment: comentario,
    }),
  })
  .then(response => response.json())
  .then(data => {
    alert(`Cuarentena guardada con éxito. ID: ${data.id_cuarentena}`);
    quarantinePoints = []; // Reiniciar puntos solo al guardar
    document.getElementById('quarantine-comment').value = '';
    removeLayersAndSources(['quarantine-points', 'quarantine-polygon', 'quarantine-outline'], 'quarantine-polygon');
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Hubo un error al guardar la cuarentena.');
  });
});

// Evento de clic en el mapa
document.addEventListener('DOMContentLoaded', () => {
  updateParcelas(); // Asegúrate de que esta función esté definida

  map.on('click', (e) => {
    if (drawingMode) {
      const coords = [e.lngLat.lng, e.lngLat.lat];
      const order = quarantinePoints.length + 1;
      quarantinePoints.push({ coords, order });
  
      updateQuarantinePoints();
      updateQuarantinePolygon();
    }
  });
})



function fetchAndDisplayQuarantines() {
  fetch('/quarantine/get-all-quarantines')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error HTTP! estado: ${response.status}`);
      }
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
          data: {
            type: 'FeatureCollection',
            features: features
          }
        });

        map.addLayer({
          id: 'quarantine-layer',
          type: 'fill',
          source: 'quarantine-source',
          paint: {
            'fill-color': '#FF0000',
            'fill-opacity': 0.5
          }
        });
      } else {
        const quarantineSource = map.getSource('quarantine-source');
        quarantineSource.setData({
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

function toggleQuarantines() {
  const isVisible = this.checked;
  map.setLayoutProperty('quarantine-layer', 'visibility', isVisible ? 'visible' : 'none');
  console.log(isVisible ? 'Cuarentenas mostradas en el mapa.' : 'Cuarentenas ocultadas del mapa.');
}

document.addEventListener('DOMContentLoaded', () => {
  const quarantineCheckbox = document.getElementById('quarantine-toggle');
  quarantineCheckbox.addEventListener('change', toggleQuarantines);
  
  fetchAndDisplayQuarantines();
});



