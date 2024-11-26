mapboxgl.accessToken = 'pk.eyJ1Ijoibmljb2xlODAxIiwiYSI6ImNtMHdvdGE3MzAzbnQybG93aXRncnlqb2QifQ.9G8XyYyv4V1b0OJGRnpEZA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [-72.9369, -41.4717], // Coordenadas iniciales
  zoom: 11,
  maxZoom: 20,
  minZoom: 1,
  fitBoundsOptions: null,
});

const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  language: 'es',
});

map.addControl(directions, 'bottom-left');




// Coordenadas para centrar el mapa (modifica según tus necesidades)
const mainLocation = [-72.9369, -41.4717];

// Función para centrar el mapa en las coordenadas principales
document.getElementById('center-map').addEventListener('click', () => {
  map.flyTo({
    center: mainLocation,
    essential: true, // Este parámetro asegura que el vuelo se reproduzca en un navegador móvil
    zoom: 11, // Puedes ajustar el nivel de zoom que desees
    speed: 1, // Velocidad de animación
    curve: 1, // Curva de la animación
    easing: (t) => t, // Easing de la animación
  });
});

// Función de geocodificación
const coordinatesGeocoder = function (query) {
  const matches = query.match(/^(-?\d+\.?\d*)[, ]+(-?\d+\.?\d*)$/);
  if (!matches) return null;

  function coordinateFeature(lng, lat) {
    return {
      center: [lng, lat],
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      place_name: `Lat: ${lat} Lng: ${lng}`,
      place_type: ['coordinate'],
      properties: {},
      type: 'Feature',
    };
  };

  const coord1 = Number(matches[1]);
  const coord2 = Number(matches[2]);
  const geocodes = [];

  if (Math.abs(coord1) <= 90 && Math.abs(coord2) <= 180) {
    geocodes.push(coordinateFeature(coord2, coord1));
  }

  if (Math.abs(coord1) <= 180 && Math.abs(coord2) <= 90) {
    geocodes.push(coordinateFeature(coord1, coord2));
  }

  return geocodes;
};

// Configuración del control del buscador
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  localGeocoder: coordinatesGeocoder, // Habilita búsqueda de coordenadas
  placeholder: 'Ingrese coordenadas o lugar', // Cambia el texto del placeholder
  mapboxgl: mapboxgl, // Necesario para la integración
  reverseGeocode: true, // Habilita búsqueda inversa (lat/lng)
});

// Asigna el buscador al contenedor específico
document.getElementById('map-search').appendChild(geocoder.onAdd(map));


export { map, directions };
