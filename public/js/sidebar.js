// Importa el mapa
import { map } from './map.js';

// Función para obtener parcelas desde la API
async function obtenerParcelas() {
  try {
    const response = await fetch('/api/get-comuna/parcelas');
    console.log('Respuesta de la API:', response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const parcelas = await response.json();
    console.log('Parcelas obtenidas:', parcelas);
    return parcelas;
  } catch (error) {
    console.error('Error al obtener parcelas:', error.message);
    throw error;
  }
}

// Función para obtener cuarentenas desde la API
async function obtenerCuarentenas() {
  try {
    const response = await fetch('/quarantines/get-comentario');
    console.log('Respuesta de la API:', response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const cuarentenas = await response.json();
    console.log('Cuarentenas obtenidas:', cuarentenas);
    return cuarentenas;
  } catch (error) {
    console.error('Error al obtener cuarentenas:', error.message);
    throw error;
  }
}

// Función para volar a una parcela en el mapa
function volarAParcela(id, lat, lng) {
  map.flyTo({
    center: [lng, lat],
    zoom: 14,
    essential: true,
  });
  console.log(`Volando a la parcela ${id}`);
}

// Función para volar a una cuarentena en el mapa
function volarACuarentena(id, lat, lng) {
  map.flyTo({
    center: [lng, lat],
    zoom: 14,
    essential: true,
  });
  console.log(`Volando a la cuarentena ${id}`);
}

// Rellenar dropdowns de parcelas y cuarentenas
async function cargarDropdowns() {
  try {
    const [parcelas, cuarentenas] = await Promise.all([obtenerParcelas(), obtenerCuarentenas()]);

    // Llenar dropdown de parcelas
    const parcelasDropdown = document.getElementById('parcelas-dropdown');
    parcelas.forEach(parcela => {
      const option = document.createElement('option');
      option.value = parcela.id_parcelacion;
      option.textContent = `Parcela ${parcela.id_parcelacion} - ${parcela.cultivo}`;
      parcelasDropdown.appendChild(option);
    });

    // Llenar dropdown de cuarentenas
    const cuarentenasDropdown = document.getElementById('cuarentenas-dropdown');
    cuarentenas.forEach(cuarentena => {
      const option = document.createElement('option');
      option.value = cuarentena.id_cuarentena;
      option.textContent = `Cuarentena ${cuarentena.id_cuarentena} - ${cuarentena.comentario || 'Sin comentario'}`;
      cuarentenasDropdown.appendChild(option);
    });

    // Añadir eventos a los dropdowns
    parcelasDropdown.addEventListener('change', (event) => {
      const selectedParcela = parcelas.find(p => p.id_parcelacion == event.target.value);
      if (selectedParcela) {
        volarAParcela(selectedParcela.id_parcelacion, selectedParcela.latitud, selectedParcela.longitud);
      }
    });

    cuarentenasDropdown.addEventListener('change', (event) => {
      const selectedCuarentena = cuarentenas.find(c => c.id_cuarentena == event.target.value);
      if (selectedCuarentena) {
        volarACuarentena(selectedCuarentena.id_cuarentena, selectedCuarentena.latitud, selectedCuarentena.longitud);
      }
    });
  } catch (error) {
    console.error('Error al cargar los dropdowns:', error);
  }
}

// Inicializa la carga de los dropdowns al cargar la página
document.addEventListener('DOMContentLoaded', cargarDropdowns);

export { obtenerParcelas, obtenerCuarentenas, cargarDropdowns, volarAParcela, volarACuarentena };
