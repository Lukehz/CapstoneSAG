document.getElementById('uploadForm').onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const previewImage = document.getElementById('previewImage');
    const loadingText = document.getElementById('loading');
    const resultContainer = document.getElementById('result');

    // Mostrar animación de carga
    loadingText.classList.remove('hidden');
    resultContainer.innerHTML = '';

    // Cargar imagen seleccionada en la vista previa
    const file = formData.get('image');
    const reader = new FileReader();
    reader.onload = () => {
        previewImage.src = reader.result;
        previewImage.classList.remove('hidden');
    };
    reader.readAsDataURL(file);

    // Enviar la imagen al servidor y obtener los resultados
    const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData
    });
    const result = await response.json();

    // Ocultar la animación de carga y mostrar los resultados
    loadingText.classList.add('hidden');
    resultContainer.innerHTML = result.predictions.map(prediction => 
        `<p>Etiqueta: ${prediction.label}, Confianza: ${prediction.confidence.toFixed(2)}</p>`
    ).join('');
};
