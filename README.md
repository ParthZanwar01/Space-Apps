# Space Debris Analyzer

AI-powered space debris analysis and path planning system for NASA Space Apps Challenge.

## Project Structure

```
Space Apps/
├── backend/                 # Python Flask backend
│   ├── app.py              # Main Flask application
│   ├── debris_analyzer.py  # AI debris detection and analysis
│   ├── path_planner.py     # Path planning algorithms
│   ├── image_downloader.py # Image downloading utilities
│   ├── dataset_downloader.py # Large dataset management
│   ├── orbital_debris_tracker.py # Real-time debris tracking
│   ├── orca_simulator.py   # ORCA mission simulation
│   ├── hackathon_demo.py   # Hackathon demonstration
│   ├── nasa_data_integration.py # NASA data integration
│   └── requirements.txt    # Python dependencies
├── public/                 # React frontend
│   ├── src/               # React source code
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── App.js         # Main React app
│   │   ├── index.js       # Entry point
│   │   └── index.css      # Global styles
│   └── node_modules/      # Node.js dependencies
├── datasets/              # Downloaded datasets
├── sample_images/         # Sample images for testing
└── venv/                  # Python virtual environment
```

## Features

- **AI Image Analysis**: Computer vision for debris detection and material classification
- **Path Planning**: 3D path optimization for debris capture missions
- **Real-time Dashboard**: Live metrics and mission monitoring
- **NASA Data Integration**: Access to NASA APIs and datasets
- **ORCA Simulation**: Mission simulation and economic impact analysis
- **Image Downloading**: Automated image collection from various sources

## Quick Start

1. **Backend Setup**:
   ```bash
   cd backend
   source ../venv/bin/activate
   pip install -r requirements.txt
   python app.py
   ```

2. **Frontend Setup**:
   ```bash
   cd public
   npm install
   npm start
   ```

3. **Access Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## Usage

1. Upload or download space debris images
2. AI analyzes images for debris detection
3. View feasibility assessment and material classification
4. Generate optimized capture paths
5. Monitor mission metrics in real-time

## Technologies

- **Backend**: Python, Flask, OpenCV, NumPy, SciPy
- **Frontend**: React, Styled Components, Three.js
- **AI/ML**: Computer Vision, Path Planning Algorithms
- **Data Sources**: NASA APIs, USGS, ESA

## NASA Space Apps Challenge

This project addresses the challenge of space debris management through:
- Automated debris detection and analysis
- Optimized capture mission planning
- Economic impact assessment
- Integration with NASA data sources
- Real-time mission simulation

## License

MIT License - NASA Space Apps Challenge 2024
