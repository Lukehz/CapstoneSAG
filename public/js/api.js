/* api.js*/

const API_URL = 'http://localhost:3000';
/*
function updateParcelas() {
    console.log('Fetching parcelas...');
    fetch(`${API_URL}/parcelas`)
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

            updateParcelasOnMap(parcelas);
        })
        .catch(error => console.error('Error fetching parcelas:', error));
}

function updateParcelasOnMap(parcelas) {
    parcelaMarkers.forEach(marker => marker.remove());
    parcelaMarkers = [];

    const bounds = new mapboxgl.LngLatBounds();
    parcelas.forEach(parcela => {
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
    });

    map.fitBounds(bounds, { padding: 50, duration: 0 });
}

function saveQuarantineAPI(points, comentario) {
    return fetch(`${API_URL}/save-quarantine`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            points: points,
            comentario: comentario
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Datos recibidos del servidor:', data);
        return data;
    });
}
*/