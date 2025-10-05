from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import cv2
import numpy as np
from PIL import Image
import io
import base64
import json
from datetime import datetime
import logging
from werkzeug.utils import secure_filename

# Import our custom modules
from debris_analyzer import DebrisAnalyzer
from path_planner import PathPlanner
from image_downloader import SpaceDebrisImageDownloader
from dataset_downloader import DatasetDownloader
from nasa_data_integration import NASADataIntegration

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize our analysis modules
debris_analyzer = DebrisAnalyzer()
path_planner = PathPlanner()
image_downloader = SpaceDebrisImageDownloader()
dataset_downloader = DatasetDownloader()
nasa_data = NASADataIntegration()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def encode_image_to_base64(image_array):
    """Convert numpy array to base64 string"""
    _, buffer = cv2.imencode('.jpg', image_array)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    return img_base64

@app.route('/')
def index():
    return send_from_directory('build', 'index.html')

@app.route('/manifest.json')
def manifest():
    return send_from_directory('frontend/public', 'manifest.json')

@app.route('/<path:path>')
def serve_static(path):
    # Check if it's a downloaded image
    if path.startswith('sample_images/'):
        return send_from_directory('.', path)
    # Check if it's an uploaded image
    if path.startswith('uploads/'):
        return send_from_directory('.', path)
    return send_from_directory('build', path)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_debris():
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Save the uploaded image
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        image_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(image_path)
        
        # Read and process the saved image
        image = cv2.imread(image_path)
        
        if image is None:
            return jsonify({'error': 'Could not decode image'}), 400
        
        # Analyze the debris
        logger.info(f"Analyzing image: {file.filename}")
        analysis_result = debris_analyzer.analyze_image(image)
        
        # Add metadata
        analysis_result['metadata'] = {
            'filename': file.filename,
            'timestamp': datetime.now().isoformat(),
            'image_size': image.shape
        }
        
        # Add image URL for visualization - always use HTTPS for production
        analysis_result['image_url'] = f'https://space-apps-backend.onrender.com/uploads/{unique_filename}'
        
        return jsonify(analysis_result)
        
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/api/plan-path', methods=['POST'])
def plan_path():
    try:
        data = request.get_json()
        
        if not data or 'debris_list' not in data:
            return jsonify({'error': 'Debris list required'}), 400
        
        debris_list = data['debris_list']
        start_position = data.get('start_position', [0, 0, 0])
        
        # Plan optimal path
        path_result = path_planner.plan_optimal_path(debris_list, start_position)
        
        return jsonify(path_result)
        
    except Exception as e:
        logger.error(f"Error planning path: {str(e)}")
        return jsonify({'error': f'Path planning failed: {str(e)}'}), 500

@app.route('/api/batch-analyze', methods=['POST'])
def batch_analyze():
    try:
        if 'images' not in request.files:
            return jsonify({'error': 'No images provided'}), 400
        
        files = request.files.getlist('images')
        results = []
        
        for file in files:
            if file.filename == '' or not allowed_file(file.filename):
                continue
            
            try:
                # Read and process the image
                image_data = file.read()
                nparr = np.frombuffer(image_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if image is not None:
                    analysis_result = debris_analyzer.analyze_image(image)
                    analysis_result['metadata'] = {
                        'filename': file.filename,
                        'timestamp': datetime.now().isoformat()
                    }
                    results.append(analysis_result)
                    
            except Exception as e:
                logger.error(f"Error processing {file.filename}: {str(e)}")
                continue
        
        return jsonify({
            'results': results,
            'total_processed': len(results),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        return jsonify({'error': f'Batch analysis failed: {str(e)}'}), 500

@app.route('/api/visualize', methods=['POST'])
def visualize_analysis():
    try:
        data = request.get_json()
        
        if not data or 'image_data' not in data:
            return jsonify({'error': 'Image data required'}), 400
        
        # Decode base64 image
        image_data = data['image_data']
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Generate visualization
        visualization = debris_analyzer.create_visualization(image, data.get('analysis', {}))
        
        # Encode result as base64
        result_base64 = encode_image_to_base64(visualization)
        
        return jsonify({
            'visualization': result_base64,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error creating visualization: {str(e)}")
        return jsonify({'error': f'Visualization failed: {str(e)}'}), 500

@app.route('/api/download-images', methods=['POST'])
def download_images():
    try:
        data = request.get_json() or {}
        
        # Get parameters
        count = data.get('count', 10)
        source = data.get('source', 'mixed')  # 'nasa_apod', 'nasa_images', 'space_debris', 'mixed'
        
        logger.info(f"Downloading {count} images from source: {source}")
        
        downloaded_images = []
        
        if source == 'nasa_apod':
            downloaded_images = image_downloader.download_nasa_apod(count)
        elif source == 'nasa_images':
            downloaded_images = image_downloader.download_nasa_images('space debris', count)
        elif source == 'space_debris':
            downloaded_images = image_downloader.download_space_debris_images(count)
        else:  # mixed
            # Download from multiple sources
            apod_count = min(3, count // 3)
            nasa_count = min(5, count // 2)
            debris_count = count - apod_count - nasa_count
            
            if apod_count > 0:
                downloaded_images.extend(image_downloader.download_nasa_apod(apod_count))
            if nasa_count > 0:
                downloaded_images.extend(image_downloader.download_nasa_images('space debris', nasa_count))
            if debris_count > 0:
                downloaded_images.extend(image_downloader.download_space_debris_images(debris_count))
        
        return jsonify({
            'success': True,
            'downloaded_count': len(downloaded_images),
            'images': downloaded_images,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error downloading images: {str(e)}")
        return jsonify({'error': f'Image download failed: {str(e)}'}), 500

@app.route('/api/download-from-url', methods=['POST'])
def download_from_url():
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL required'}), 400
        
        url = data['url']
        filename = data.get('filename')
        
        logger.info(f"Downloading image from URL: {url}")
        
        image_path = image_downloader.download_from_url(url, filename)
        
        if image_path:
            return jsonify({
                'success': True,
                'image_path': image_path,
                'filename': os.path.basename(image_path),
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({'error': 'Failed to download image'}), 400
        
    except Exception as e:
        logger.error(f"Error downloading image from URL: {str(e)}")
        return jsonify({'error': f'URL download failed: {str(e)}'}), 500

@app.route('/api/sample-dataset', methods=['POST'])
def create_sample_dataset():
    try:
        data = request.get_json() or {}
        total_images = data.get('total_images', 20)
        
        logger.info(f"Creating sample dataset with {total_images} images")
        
        images = image_downloader.create_sample_dataset(total_images)
        
        return jsonify({
            'success': True,
            'dataset_count': len(images),
            'images': images,
            'download_directory': image_downloader.download_dir,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error creating sample dataset: {str(e)}")
        return jsonify({'error': f'Sample dataset creation failed: {str(e)}'}), 500

@app.route('/api/downloaded-images', methods=['GET'])
def get_downloaded_images():
    try:
        images = image_downloader.get_downloaded_images()
        
        # Get metadata if available
        metadata_file = os.path.join(image_downloader.download_dir, "dataset_metadata.json")
        metadata = []
        
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load metadata: {str(e)}")
        
        return jsonify({
            'success': True,
            'images': images,
            'metadata': metadata,
            'count': len(images),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting downloaded images: {str(e)}")
        return jsonify({'error': f'Failed to get downloaded images: {str(e)}'}), 500

@app.route('/api/download-large-dataset', methods=['POST'])
def download_large_dataset():
    try:
        data = request.get_json() or {}
        
        # Get parameters
        total_images = data.get('total_images', 100)
        dataset_type = data.get('dataset_type', 'comprehensive')  # 'nasa_apod', 'nasa_images', 'nasa_earth', 'comprehensive'
        
        logger.info(f"Downloading large dataset: {dataset_type} with {total_images} images")
        
        if dataset_type == 'comprehensive':
            result = dataset_downloader.create_comprehensive_dataset(total_images)
        elif dataset_type == 'nasa_apod':
            images = dataset_downloader.download_nasa_dataset('apod', total_images)
            result = {
                'total_images': len(images),
                'images': images,
                'download_directory': dataset_downloader.download_dir
            }
        elif dataset_type == 'nasa_images':
            images = dataset_downloader.download_nasa_dataset('images', total_images)
            result = {
                'total_images': len(images),
                'images': images,
                'download_directory': dataset_downloader.download_dir
            }
        elif dataset_type == 'nasa_earth':
            images = dataset_downloader.download_nasa_dataset('earth', total_images)
            result = {
                'total_images': len(images),
                'images': images,
                'download_directory': dataset_downloader.download_dir
            }
        else:
            return jsonify({'error': 'Invalid dataset type'}), 400
        
        return jsonify({
            'success': True,
            'dataset_type': dataset_type,
            'total_images': result['total_images'],
            'download_directory': result['download_directory'],
            'images': result.get('images', []),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error downloading large dataset: {str(e)}")
        return jsonify({'error': f'Large dataset download failed: {str(e)}'}), 500

@app.route('/api/dataset-info', methods=['GET'])
def get_dataset_info():
    try:
        info = dataset_downloader.get_dataset_info()
        
        return jsonify({
            'success': True,
            'info': info,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting dataset info: {str(e)}")
        return jsonify({'error': f'Failed to get dataset info: {str(e)}'}), 500

@app.route('/api/cleanup-datasets', methods=['POST'])
def cleanup_datasets():
    try:
        data = request.get_json() or {}
        days_old = data.get('days_old', 30)
        
        removed_count = dataset_downloader.cleanup_old_datasets(days_old)
        
        return jsonify({
            'success': True,
            'removed_files': removed_count,
            'days_old': days_old,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error cleaning up datasets: {str(e)}")
        return jsonify({'error': f'Dataset cleanup failed: {str(e)}'}), 500

@app.route('/api/orbital-debris-data', methods=['GET'])
def get_orbital_debris_data():
    try:
        from orbital_debris_tracker import OrbitalDebrisTracker
        tracker = OrbitalDebrisTracker()
        
        # Get debris data
        debris_data = tracker.get_real_orbital_debris_data(100)
        viz_data = tracker.export_for_visualization(debris_data)
        
        return jsonify({
            'success': True,
            'data': viz_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting orbital debris data: {str(e)}")
        return jsonify({'error': f'Failed to get orbital debris data: {str(e)}'}), 500

@app.route('/api/orca-mission-data', methods=['POST'])
def get_orca_mission_data():
    try:
        from orbital_debris_tracker import OrbitalDebrisTracker
        from orca_simulator import ORCASimulator
        
        data = request.get_json() or {}
        num_targets = data.get('num_targets', 20)
        
        # Initialize components
        tracker = OrbitalDebrisTracker()
        simulator = ORCASimulator()
        
        # Get debris data and simulate mission
        debris_data = tracker.get_real_orbital_debris_data(num_targets)
        mission = simulator.initialize_mission(debris_data)
        mission_results = simulator.simulate_capture_mission(mission)
        
        # Generate comprehensive report
        report = simulator.export_mission_report(mission_results)
        
        return jsonify({
            'success': True,
            'mission_data': report,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting ORCA mission data: {str(e)}")
        return jsonify({'error': f'Failed to get ORCA mission data: {str(e)}'}), 500

@app.route('/api/orca-demo', methods=['POST'])
def run_orca_demo():
    try:
        from hackathon_demo import ORCAHackathonDemo
        demo = ORCAHackathonDemo()
        demo_results = demo.run_complete_demo()
        
        return jsonify({
            'success': True,
            'demo_results': demo_results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error running ORCA demo: {str(e)}")
        return jsonify({'error': f'ORCA demo failed: {str(e)}'}), 500

@app.route('/api/download-sample-image', methods=['POST'])
def download_sample_image():
    try:
        data = request.get_json() or {}
        image_type = data.get('image_type', 'space_debris')
        
        # Return an existing sample image
        sample_images = [
            'sample_images/nasa_1.jpg',
            'sample_images/nasa_2.jpg', 
            'sample_images/nasa_3.jpg',
            'sample_images/nasa_4.jpg',
            'sample_images/nasa_apod_1.jpg',
            'sample_images/nasa_apod_2.jpg'
        ]
        
        import random
        image_path = random.choice(sample_images)
        
        # Check if image exists
        if os.path.exists(image_path):
            return jsonify({
                'success': True,
                'image_path': image_path,
                'image_url': f'https://space-apps-backend.onrender.com/{image_path}',
                'message': f'Selected {image_type} image for processing',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({'error': 'Sample image not found'}), 404
        
    except Exception as e:
        logger.error(f"Error getting sample image: {str(e)}")
        return jsonify({'error': f'Failed to get sample image: {str(e)}'}), 500

@app.route('/api/process-downloaded-image', methods=['POST'])
def process_downloaded_image():
    try:
        data = request.get_json() or {}
        image_path = data.get('image_path')
        
        if not image_path:
            return jsonify({'error': 'No image path provided'}), 400
        
        # Check if image exists
        full_path = os.path.join('.', image_path)
        if not os.path.exists(full_path):
            return jsonify({'error': 'Image file not found'}), 404
        
        # Process the image through our debris analyzer
        logger.info(f"Processing downloaded image: {image_path}")
        
        # Analyze the image directly from file path
        analysis_result = debris_analyzer.analyze_image_from_path(full_path)
        
        return jsonify({
            'success': True,
            'image_path': image_path,
            'analysis_result': analysis_result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error processing downloaded image: {str(e)}")
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 500

# NASA Data Integration Endpoints
@app.route('/api/nasa/odpo-data', methods=['GET'])
def get_nasa_odpo_data():
    """Get orbital debris data from NASA ODPO"""
    try:
        data_type = request.args.get('type', 'current')
        result = nasa_data.get_orbital_debris_data(data_type)
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting NASA ODPO data: {str(e)}")
        return jsonify({'error': f'Failed to get NASA ODPO data: {str(e)}'}), 500

@app.route('/api/nasa/open-data', methods=['GET'])
def get_nasa_open_data():
    """Get data from NASA Open Data Portal"""
    try:
        dataset_id = request.args.get('dataset_id')
        search_term = request.args.get('search_term')
        
        result = nasa_data.get_nasa_open_data(dataset_id, search_term)
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting NASA open data: {str(e)}")
        return jsonify({'error': f'Failed to get NASA open data: {str(e)}'}), 500

@app.route('/api/nasa/worldview', methods=['GET'])
def get_nasa_worldview():
    """Get satellite imagery from NASA Worldview"""
    try:
        layer = request.args.get('layer', 'MODIS_Terra_CorrectedReflectance_TrueColor')
        date = request.args.get('date')
        bbox = request.args.get('bbox')
        
        if bbox:
            bbox = [float(x) for x in bbox.split(',')]
        
        result = nasa_data.get_worldview_imagery(layer, date, bbox)
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting NASA Worldview data: {str(e)}")
        return jsonify({'error': f'Failed to get NASA Worldview data: {str(e)}'}), 500

@app.route('/api/nasa/usgs-landsat', methods=['GET'])
def get_usgs_landsat():
    """Get Landsat data from USGS EarthExplorer"""
    try:
        scene_id = request.args.get('scene_id')
        date_range = request.args.get('date_range')
        bbox = request.args.get('bbox')
        
        if date_range:
            start_date, end_date = date_range.split(',')
            date_range = (start_date, end_date)
        
        if bbox:
            bbox = [float(x) for x in bbox.split(',')]
        
        result = nasa_data.get_usgs_landsat_data(scene_id, date_range, bbox)
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting USGS Landsat data: {str(e)}")
        return jsonify({'error': f'Failed to get USGS Landsat data: {str(e)}'}), 500

@app.route('/api/nasa/commercialization', methods=['GET'])
def get_nasa_commercialization():
    """Get NASA space commercialization data"""
    try:
        result = nasa_data.get_space_commercialization_data()
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting NASA commercialization data: {str(e)}")
        return jsonify({'error': f'Failed to get NASA commercialization data: {str(e)}'}), 500

@app.route('/api/nasa/integrated-analysis', methods=['GET'])
def get_nasa_integrated_analysis():
    """Get integrated analysis from multiple NASA data sources"""
    try:
        result = nasa_data.get_integrated_debris_analysis()
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting NASA integrated analysis: {str(e)}")
        return jsonify({'error': f'Failed to get NASA integrated analysis: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=False, host='0.0.0.0', port=port)

# Vercel serverless function entry point
def handler(request):
    return app(request.environ, lambda *args: None)
