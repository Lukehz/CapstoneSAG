/* parcela.js*/
import { map } from './map.js';

let parcelaMarkers = [];

/* */ 

const updateParcelas = () => {
  alert('Obteniendo parcelas...');
  fetch('http://localhost:3000/parcelas')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error HTTP! estado: ${response.status}`);
      }
      return response.json();
    })
    .then(parcelas => {
     alert('Parcelas recibidas');
      if (!parcelas.length) {
        console.log('No se encontraron parcelas');
        return;
      }

      // Limpiar marcadores existentes
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
            <button id="delete-btn-${parcela.ID}" class="close-btn">Eliminar</button>
          `))
          .addTo(map);

          // Agregar event listener cuando el popup se abra
  marker.getPopup().on('open', () => {
    const deleteButton = document.getElementById(`delete-btn-${parcela.ID}`);
    if (deleteButton) {
      deleteButton.addEventListener('click', function() {
        eliminarParcela(parcela.ID, deleteButton);
      });
    }
  });
    
          parcelaMarkers.push(marker); // Agregar el marcador al array
          bounds.extend([parcela.longitud, parcela.latitud]); // Ajustar los límites del mapa
        }
      });
    })
    .catch(error => console.error('Error al obtener parcelas:', error));
};

// Función para alternar la visibilidad de las parcelas
function toggleParcelas() {
  const isVisible = this.checked; // Obtener estado del checkbox
  
  if (isVisible) {
    updateParcelas(); // Actualizar y mostrar parcelas si está marcado
  } else {
    // Si no está marcado, eliminar todos los marcadores
    parcelaMarkers.forEach(marker => marker.remove());
    parcelaMarkers = [];
    console.log('Parcelas ocultadas del mapa.');
  }
}

// Evento de carga de DOM
document.addEventListener('DOMContentLoaded', () => {
  const parcelaCheckbox = document.getElementById('parcela-toggle');
    // Checkbox esté desmarcado al cargar la página
    parcelaCheckbox.checked = false;
  parcelaCheckbox.addEventListener('change', toggleParcelas); // Agregar evento al checkbox
});

function eliminarParcela(idParcela, boton) {
  console.log("Intentando eliminar parcela con ID:", idParcela);

  fetch(`/parcelas/delete-parcela/${idParcela}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.ok) {
      alert("Parcela eliminada correctamente.");
      boton.parentElement.style.display = 'none'; // Oculta el recuadro del mapa
    } else {
      // Captura el error del backend y muéstralo en la consola
      return response.text().then(text => { throw new Error(text) });
    }
  })
  .catch(error => {
    console.error("Error al eliminar la parcela:", error.message); // Mostrar el error detallado
    alert("No se pudo eliminar la parcela. Intenta nuevamente.");
  });
}

