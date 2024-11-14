# src/scripts/predict_yolo.py
import sys
from ultralytics import YOLO
import torch
import json
import os
import warnings

# Ignorar advertencias y silenciar logs de PyTorch y otras librerías
warnings.filterwarnings("ignore")
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Silenciar logs de TensorFlow

# Desactivar la salida de Ultralytics para evitar mensajes innecesarios
YOLO.verbose = False

def predict_image(img_path):
    # Configurar el dispositivo para GPU o CPU
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model = YOLO('src/server/modeloPrediccion/best.pt').to(device)  # Ajusta la ruta del modelo

    # Realizar la predicción
    results = model(img_path)

    # Extraer información relevante de los resultados
    predictions = []
    for result in results:
        for box in result.boxes:
            predictions.append({
                'label': model.names[int(box.cls)],  # Nombre de la clase
                'confidence': float(box.conf),       # Confianza de la predicción
                'bbox': box.xyxy.tolist()            # Coordenadas del cuadro de detección
            })

    return predictions

if __name__ == "__main__":
    img_path = sys.argv[1]  # Ruta de la imagen enviada como argumento

    # Validar si el archivo existe antes de continuar
    if not os.path.exists(img_path):
        print(json.dumps({"error": f"Archivo no encontrado: {img_path}"}), file=sys.stderr)
        sys.exit(1)  # Salir con un error

    try:
        # Realizar la predicción
        predictions = predict_image(img_path)
        # Convertir las predicciones a JSON y escribir en stdout
        print(json.dumps(predictions))
    except Exception as e:
        # En caso de error, imprimir el error en stderr y salir con error
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
