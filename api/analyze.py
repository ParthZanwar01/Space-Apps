from flask import Flask, request, jsonify
import json

app = Flask(__name__)

@app.route('/api/analyze', methods=['POST'])
def analyze():
    # Mock analysis for demo purposes
    return jsonify({
        'debris_objects': [
            {
                'id': 1,
                'position': [100, 150, 0],
                'size': 2.5,
                'material': 'aluminum',
                'feasible': True,
                'confidence': 0.85,
                'priority': 0.9
            },
            {
                'id': 2,
                'position': [300, 200, 0],
                'size': 1.8,
                'material': 'steel',
                'feasible': True,
                'confidence': 0.78,
                'priority': 0.7
            }
        ],
        'metadata': {
            'total_objects': 2,
            'feasible_objects': 2,
            'analysis_time': 1.2
        }
    })

@app.route('/api/plan-path', methods=['POST'])
def plan_path():
    data = request.get_json()
    debris_list = data.get('debris_list', [])
    
    # Mock path planning
    path = [
        {'position': [0, 0, 0], 'type': 'start'},
        {'position': debris_list[0]['position'], 'type': 'debris', 'debris_data': debris_list[0]},
        {'position': debris_list[1]['position'], 'type': 'debris', 'debris_data': debris_list[1]},
        {'position': [0, 0, 0], 'type': 'end'}
    ]
    
    return jsonify({
        'path': path,
        'total_distance': 450.5,
        'estimated_time': 12.3,
        'visualization': {
            'points': [[0, 0, 0], debris_list[0]['position'], debris_list[1]['position'], [0, 0, 0]],
            'connections': [[0, 1], [1, 2], [2, 3]],
            'metadata': [
                {'position': debris_list[0]['position'], 'size': debris_list[0]['size'], 'material': debris_list[0]['material']},
                {'position': debris_list[1]['position'], 'size': debris_list[1]['size'], 'material': debris_list[1]['material']}
            ]
        }
    })

# Vercel serverless function entry point
def handler(request):
    return app(request.environ, lambda *args: None)
