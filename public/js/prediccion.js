document.getElementById('uploadForm').onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const previewImage = document.getElementById('previewImage');
    const loadingText = document.getElementById('loading');
    const resultContainer = document.getElementById('result');

    // Mostrar animación de carga
    loadingText.classList.remove('hidden');
    resultContainer.innerHTML = '';

    try {
        // Cargar imagen seleccionada en la vista previa
        const file = formData.get('image');
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                previewImage.src = reader.result;
                previewImage.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }

        // Enviar la imagen al servidor y obtener los resultados
        const response = await fetch('/api/prediccion', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.statusText}`);
        }

        const result = await response.json();

        // Validar y mostrar resultados
        if (Array.isArray(result.predictions)) {
            resultContainer.innerHTML = result.predictions.map(prediction =>
                `<p>Etiqueta: ${prediction.label}, Confianza: ${prediction.confidence.toFixed(2)}</p>`
            ).join('');
        } else {
            resultContainer.innerHTML = '<p>No se obtuvieron predicciones válidas.</p>';
        }
    } catch (error) {
        console.error('Error en la predicción:', error);
        resultContainer.innerHTML = '<p>Error al procesar la predicción.</p>';
    } finally {
        loadingText.classList.add('hidden');
    }
};