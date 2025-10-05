from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
import base64
import json
import cv2
import os

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
UPLOAD_FOLDER = '/tmp/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def detect_debris_objects(image):
    """Simplified debris detection"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Edge detection
    edges = cv2.Canny(gray, 50, 150)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    debris_objects = []
    for i, contour in enumerate(contours):
        area = cv2.contourArea(contour)
        if area > 100:  # Minimum area threshold
            x, y, w, h = cv2.boundingRect(contour)
            
            # Calculate properties
            aspect_ratio = w / h if h > 0 else 1
            circularity = 4 * np.pi * area / (cv2.arcLength(contour, True) ** 2) if cv2.arcLength(contour, True) > 0 else 0
            
            # Estimate size (simplified)
            estimated_size = np.sqrt(area) * 0.01  # Rough conversion to meters
            
            # Determine material based on color
            roi = image[y:y+h, x:x+w]
            mean_color = np.mean(roi, axis=(0, 1))
            
            if mean_color[0] > 150:  # High blue component
                material = 'aluminum'
            elif mean_color[2] > 150:  # High red component
                material = 'steel'
            else:
                material = 'composite'
            
            debris_objects.append({
                'id': i + 1,
                'position': [int(x + w/2), int(y + h/2), 0],
                'size': max(0.1, min(10.0, estimated_size)),
                'material': material,
                'feasible': estimated_size >= 0.5 and estimated_size <= 5.0,
                'confidence': min(0.95, 0.3 + (area / 1000) * 0.4),
                'priority': min(0.95, 0.5 + (area / 1000) * 0.3),
                'estimated_mass': estimated_size * 2.7,  # Rough density estimate
                'melting_point': 660 if material == 'aluminum' else 1370,
                'estimated_value': estimated_size * 1000
            })
    
    return debris_objects

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Space Debris Analyzer API is running',
        'version': '1.0.0'
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_debris():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Read image
        image_data = file.read()
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({'error': 'Could not decode image'}), 400
        
        # Analyze debris
        debris_objects = detect_debris_objects(image)
        
        # Calculate metrics
        total_objects = len(debris_objects)
        feasible_objects = len([obj for obj in debris_objects if obj['feasible']])
        
        analysis_result = {
            'debris_objects': debris_objects,
            'metadata': {
                'total_objects': total_objects,
                'feasible_objects': feasible_objects,
                'analysis_time': 1.2,
                'image_size': [image.shape[0], image.shape[1]]
            }
        }
        
        return jsonify(analysis_result)
        
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/api/plan-path', methods=['POST'])
def plan_path():
    try:
        data = request.get_json()
        debris_list = data.get('debris_list', [])
        start_position = data.get('start_position', [0, 0, 0])
        
        if not debris_list:
            return jsonify({'error': 'No debris objects provided'}), 400
        
        # Simple greedy path planning
        path = [{'position': start_position, 'type': 'start'}]
        remaining_debris = debris_list.copy()
        current_pos = start_position
        
        total_distance = 0
        
        while remaining_debris:
            # Find closest debris
            min_distance = float('inf')
            closest_debris = None
            closest_index = -1
            
            for i, debris in enumerate(remaining_debris):
                distance = np.sqrt(sum((a - b) ** 2 for a, b in zip(current_pos, debris['position'])))
                if distance < min_distance:
                    min_distance = distance
                    closest_debris = debris
                    closest_index = i
            
            if closest_debris:
                path.append({
                    'position': closest_debris['position'],
                    'type': 'debris',
                    'debris_data': closest_debris
                })
                total_distance += min_distance
                current_pos = closest_debris['position']
                remaining_debris.pop(closest_index)
        
        # Return to start
        return_distance = np.sqrt(sum((a - b) ** 2 for a, b in zip(current_pos, start_position)))
        path.append({'position': start_position, 'type': 'end'})
        total_distance += return_distance
        
        # Generate visualization data
        points = [step['position'] for step in path]
        connections = [[i, i + 1] for i in range(len(points) - 1)]
        metadata = []
        
        for step in path[1:-1]:  # Exclude start and end
            if step['type'] == 'debris':
                debris_data = step['debris_data']
                metadata.append({
                    'position': step['position'],
                    'size': debris_data.get('size', 1.0),
                    'material': debris_data.get('material', 'unknown'),
                    'priority': debris_data.get('priority', 0.5),
                    'feasible': debris_data.get('feasible', False),
                    'debris_id': debris_data.get('id', 0)
                })
        
        result = {
            'path': path,
            'total_distance': total_distance,
            'estimated_time': total_distance * 0.02,  # Rough time estimate
            'fuel_consumption': total_distance * 0.1,
            'visualization': {
                'points': points,
                'connections': connections,
                'metadata': metadata
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Path planning failed: {str(e)}'}), 500

# Vercel serverless function entry point
def handler(request):
    return app(request.environ, lambda *args: None)
