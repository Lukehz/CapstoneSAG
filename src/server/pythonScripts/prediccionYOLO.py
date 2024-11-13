# src/scripts/predict_yolo.py
import sys
from ultralytics import YOLO
import torch

def predict_image(img_path):
    # Configurar el dispositivo para GPU o CPU
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model = YOLO('C:/Users/jfovg/Documents/capstone_sag/src/server/modeloPrediccion/best.pt').to(device)  # Ajusta la ruta del modelo
    
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
    predictions = predict_image(img_path)
    print(predictions)  # Resultado para que lo capture el backend
