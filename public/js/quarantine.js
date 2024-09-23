/* quarantine.js*/

import { map } from './map.js';

let drawingMode = false;
let quarantinePoints = [];
let parcelaMarkers = [];
let quarantineLayerId = 'quarantine-layer';
let quarantineSourceId = 'quarantine-source';

const updateParcelas = () => {
  console.log('Fetching parcelas...');
  fetch('http://localhost:3000/parcelas')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(parcelas => {
      console.log('Received parcelas');
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

      map.fitBounds(bounds, { padding: 50, duration: 0 });
    })
    .catch(error => console.error('Error fetching parcelas:', error));
};

const updateQuarantinePoints = () => {
  if (map.getSource('quarantine-points')) {
    map.getSource('quarantine-points').setData({
      type: 'FeatureCollection',
      features: quarantinePoints.map(point => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: point
        }
      }))
    });
  } else {
    map.addSource('quarantine-points', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: quarantinePoints.map(point => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: point
          }
        }))
      }
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

document.addEventListener('DOMContentLoaded', () => {
  updateParcelas();

  map.on('click', (e) => {
    if (drawingMode) {
      const coords = [e.lngLat.lng, e.lngLat.lat];
      quarantinePoints.push(coords);

      if (quarantinePoints.length > 1) {
        const line = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: quarantinePoints
          }
        };

        map.getSource('line')?.setData(line);
      }

      updateQuarantinePoints();
    }
  });

  document.getElementById('create-quarantine').addEventListener('click', () => {
    drawingMode = !drawingMode;
    
    if (drawingMode) {
      document.getElementById('create-quarantine').innerText = 'Cancelar creación';
      quarantinePoints = [];

      if (map.getLayer('quarantine-points')) {
        map.removeLayer('quarantine-points');
      }
      if (map.getSource('quarantine-points')) {
        map.removeSource('quarantine-points');
      }

      if (map.getLayer('line')) {
        map.removeLayer('line');
      }
      if (map.getSource('line')) {
        map.removeSource('line');
      }

      map.addSource('line', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'line',
        type: 'line',
        source: 'line',
        paint: {
          'line-color': '#ff0000',
          'line-width': 3
        }
      });
    } else {
      document.getElementById('create-quarantine').innerText = 'Crear cuarentena';

      if (map.getLayer('line')) {
        map.removeLayer('line');
      }
      if (map.getSource('line')) {
        map.removeSource('line');
      }
      if (map.getLayer('quarantine-points')) {
        map.removeLayer('quarantine-points');
      }
      if (map.getSource('quarantine-points')) {
        map.removeSource('quarantine-points');
      }

      quarantinePoints = [];
    }
  });

  document.getElementById('save-quarantine').addEventListener('click', () => {
    if (quarantinePoints.length < 3) {
      alert('Debe haber al menos tres puntos para guardar una cuarentena.');
      return;
    }

    const closedPoints = [...quarantinePoints, quarantinePoints[0]];
    const comentario = document.getElementById('quarantine-comment').value;

    console.log('Puntos de cuarentena a enviar:', closedPoints);
    console.log('Comentario a enviar:', comentario);

   
    fetch('http://localhost:3000/quarantine/save-quarantine', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    body: JSON.stringify({
        points: quarantinePoints,
        comment: comentario,
        }),
    })
    
    


    .then(response => response.json())
    .then(data => {
      console.log('Datos recibidos del servidor:', data);
      alert(`Cuarentena guardada con éxito. ID: ${data.id_cuarentena}`);
      quarantinePoints = [];
      document.getElementById('quarantine-comment').value = '';
      if (map.getLayer('line')) {
        map.removeLayer('line');
      }
      if (map.getSource('line')) {
        map.removeSource('line');
      }
      if (map.getLayer('quarantine-points')) {
        map.removeLayer('quarantine-points');
      }
      if (map.getSource('quarantine-points')) {
        map.removeSource('quarantine-points');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Hubo un error al guardar la cuarentena.');
    });
  });
});



document.addEventListener('DOMContentLoaded', () => {
  // ... (código existente)

  const viewQuarantinesButton = document.createElement('button');
  viewQuarantinesButton.textContent = 'Ver Cuarentenas';
  viewQuarantinesButton.id = 'view-quarantines';
  document.body.appendChild(viewQuarantinesButton);

  document.getElementById('view-quarantines').addEventListener('click', fetchAndDisplayQuarantines);
});

function fetchAndDisplayQuarantines() {
  fetch('/quarantine/get-all-quarantines')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Datos recibidos:', data);
      const quarantines = Array.isArray(data) ? data : [data];
      
      // Remover capa y fuente existentes si ya existen
      if (map.getLayer(quarantineLayerId)) {
        map.removeLayer(quarantineLayerId);
      }
      if (map.getSource(quarantineSourceId)) {
        map.removeSource(quarantineSourceId);
      }

      // Función para verificar si una coordenada es válida
      const isValidCoordinate = (coord) => {
        return Array.isArray(coord) && coord.length === 2 && 
               !isNaN(coord[0]) && !isNaN(coord[1]) &&
               Math.abs(coord[0]) <= 180 && Math.abs(coord[1]) <= 90;
      };

      // Filtrar y limpiar las cuarentenas
      const validQuarantines = quarantines.map(quarantine => ({
        ...quarantine,
        vertices: quarantine.vertices.filter(isValidCoordinate)
      })).filter(quarantine => quarantine.vertices.length >= 3);

      // Crear un GeoJSON feature collection con los polígonos de cuarentena
      const features = validQuarantines.map(quarantine => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [quarantine.vertices]
        },
        properties: {
          id: quarantine.id,
          comentario: quarantine.comentario || 'Sin comentario'
        }
      }));

      // Añadir la fuente al mapa
      map.addSource(quarantineSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });

      // Añadir la capa de polígonos
      map.addLayer({
        id: quarantineLayerId,
        type: 'fill',
        source: quarantineSourceId,
        paint: {
          'fill-color': '#FF0000',
          'fill-opacity': 0.5
        }
      });

      // Añadir popups
      map.on('click', quarantineLayerId, (e) => {
        const properties = e.features[0].properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <h3>Cuarentena ID: ${properties.id}</h3>
            <p>Comentario: ${properties.comentario}</p>
          `)
          .addTo(map);
      });

      // Cambiar el cursor a pointer cuando esté sobre una cuarentena
      map.on('mouseenter', quarantineLayerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', quarantineLayerId, () => {
        map.getCanvas().style.cursor = '';
      });

      if (features.length > 0) {
        // Ajustar el mapa para mostrar todas las cuarentenas válidas
        const bounds = new mapboxgl.LngLatBounds();
        features.forEach(feature => {
          feature.geometry.coordinates[0].forEach(coord => {
            bounds.extend(coord);
          });
        });
        try {
          map.fitBounds(bounds, { padding: 50, maxZoom: 5 });
        } catch (error) {
          console.warn('No se pudo ajustar los límites del mapa:', error);
          map.setView([0, 0], 2); // Vista predeterminada en caso de error
        }
      } else {
        console.warn('No se encontraron cuarentenas válidas para mostrar.');
        map.setView([0, 0], 2); // Vista predeterminada si no hay cuarentenas válidas
      }
    })
    .catch(error => {
      console.error('Error al obtener cuarentenas:', error);
      alert(`Hubo un error al obtener las cuarentenas: ${error.message}`);
    });
}