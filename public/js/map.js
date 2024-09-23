/* funcionalidad del mapa */

mapboxgl.accessToken = 'pk.eyJ1Ijoibmljb2xlODAxIiwiYSI6ImNtMHdvdGE3MzAzbnQybG93aXRncnlqb2QifQ.9G8XyYyv4V1b0OJGRnpEZA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [0, 0],
  zoom: 10,
  maxZoom: 20,
  minZoom: 1
});

const coordinatesGeocoder = function (query) {
  const matches = query.match(/^(-?\d+\.?\d*)[, ]+(-?\d+\.?\d*)$/);
  if (!matches) return null;

  function coordinateFeature(lng, lat) {
    return {
      center: [lng, lat],
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      place_name: `Lat: ${lat} Lng: ${lng}`,
      place_type: ['coordinate'],
      properties: {},
      type: 'Feature'
    };
  }

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

map.addControl(
  new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    localGeocoder: coordinatesGeocoder,
    zoom: 4,
    placeholder: 'Ingrese coordenadas',
    mapboxgl: mapboxgl,
    reverseGeocode: true
  })
);

// Exporta el mapa
export { map };
