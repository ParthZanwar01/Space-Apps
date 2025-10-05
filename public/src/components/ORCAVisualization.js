import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Container = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  background: #000;
  overflow: hidden;
`;

const ControlPanel = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 10px;
  color: white;
  z-index: 100;
  min-width: 300px;
`;

const ControlGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #00d4ff;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
  margin-bottom: 10px;
  font-size: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 212, 255, 0.4);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    transform: none;
  }
`;

const Slider = styled.input`
  width: 100%;
  margin: 10px 0;
`;

const InfoPanel = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 10px;
  color: white;
  z-index: 100;
  min-width: 250px;
`;

const Metric = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
`;

const MetricLabel = styled.span`
  color: #00d4ff;
`;

const MetricValue = styled.span`
  color: white;
  font-weight: bold;
`;

const StatusIndicator = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 15px;
  border-radius: 10px;
  color: white;
  z-index: 100;
`;

const ORCAVisualization = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationRef = useRef(null);
  
  const [debrisData, setDebrisData] = useState(null);
  const [missionData, setMissionData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedDebris, setSelectedDebris] = useState(null);
  const [viewMode, setViewMode] = useState('earth');
  const [metrics, setMetrics] = useState({
    totalDebris: 0,
    orcaFeasible: 0,
    materialsRecovered: 0,
    partsManufactured: 0,
    costSavings: 0
  });

  useEffect(() => {
    const initializeScene = () => {
      if (!mountRef.current) return;

      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000011);

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        10000
      );
      camera.position.set(0, 0, 1000);

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      mountRef.current.appendChild(renderer.domElement);

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1000, 1000, 1000);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      // Earth
      const earthGeometry = new THREE.SphereGeometry(100, 64, 64);
      const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x2563eb,
        shininess: 0.1
      });
      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      earth.receiveShadow = true;
      scene.add(earth);

      // Atmosphere
      const atmosphereGeometry = new THREE.SphereGeometry(105, 32, 32);
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.3
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      scene.add(atmosphere);

      // Clouds
      const cloudGeometry = new THREE.SphereGeometry(102, 32, 32);
      const cloudMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4
      });
      const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
      scene.add(clouds);

      sceneRef.current = scene;
      rendererRef.current = renderer;
      controlsRef.current = controls;

      animate();
    };

    loadData();
    initializeScene();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  const animate = useCallback(() => {
    animationRef.current = requestAnimationFrame(animate);
    
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    
    // Rotate Earth (only in Earth view)
    if (viewMode === 'earth') {
      const earth = sceneRef.current?.children.find(child => child.geometry.type === 'SphereGeometry');
      if (earth) {
        earth.rotation.y += 0.005;
      }
    }
    
    // Update debris positions
    if (debrisData) {
      updateDebrisPositions();
    }
    
    // Update camera position based on view mode
    updateCameraPosition();
    
    if (rendererRef.current && sceneRef.current) {
      rendererRef.current.render(sceneRef.current, sceneRef.current.children.find(child => child.type === 'PerspectiveCamera'));
    }
  }, [viewMode, debrisData, updateCameraPosition]);

  const updateCameraPosition = useCallback(() => {
    const camera = sceneRef.current?.children.find(child => child.type === 'PerspectiveCamera');
    if (!camera) return;
    
    switch (viewMode) {
      case 'earth':
        // Earth view - close to Earth
        camera.position.set(0, 0, 1000);
        break;
      case 'satellite':
        // Satellite view - from above
        camera.position.set(0, 2000, 0);
        break;
      case 'data':
        // Data view - overview
        camera.position.set(3000, 3000, 3000);
        break;
      default:
        camera.position.set(0, 0, 1000);
    }
  }, [viewMode]);

  const loadData = async () => {
    try {
      // Load orbital debris data
      const debrisResponse = await fetch('/api/orbital-debris-data');
      const debrisData = await debrisResponse.json();
      setDebrisData(debrisData);

      // Load mission data
      const missionResponse = await fetch('/api/orca-mission-data');
      const missionData = await missionResponse.json();
      setMissionData(missionData);

      // Update metrics
      setMetrics({
        totalDebris: debrisData.metadata.total_objects,
        orcaFeasible: debrisData.debris_objects.filter(d => d.feasible).length,
        materialsRecovered: missionData.materials_recovered || 0,
        partsManufactured: missionData.parts_manufactured?.length || 0,
        costSavings: missionData.economic_impact?.net_benefit_usd || 0
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };


  // const createEarth = (scene) => {
  //   // Earth geometry
  //   const earthGeometry = new THREE.SphereGeometry(100, 64, 64);
    
  //   // Earth material with texture
  //   const earthMaterial = new THREE.MeshPhongMaterial({
  //     color: 0x2563eb,
  //     shininess: 100
  //   });
    
  //   const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  //   scene.add(earth);

  //   // Add atmosphere
  //   const atmosphereGeometry = new THREE.SphereGeometry(105, 32, 32);
  //   const atmosphereMaterial = new THREE.MeshPhongMaterial({
  //     color: 0x00d4ff,
  //     transparent: true,
  //     opacity: 0.1
  //   });
  //   const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  //   scene.add(atmosphere);

  //   // Add clouds
  //   const cloudGeometry = new THREE.SphereGeometry(102, 32, 32);
  //   const cloudMaterial = new THREE.MeshPhongMaterial({
  //     color: 0xffffff,
  //     transparent: true,
  //     opacity: 0.3
  //   });
  //   const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
  //   scene.add(clouds);
  // };

  // const createDebrisObjects = (scene, debrisData) => {
  //   if (!debrisData) return;

  //   const debrisGroup = new THREE.Group();
    
  //   debrisData.debris_objects.forEach((debris, index) => {
  //     // Create debris geometry based on size
  //     const size = Math.max(0.5, Math.min(5, debris.size / 10));
  //     const geometry = new THREE.SphereGeometry(size, 8, 8);
      
  //     // Create material based on feasibility
  //     const color = debris.feasible ? 0x00ff00 : 0xff0000;
  //     const material = new THREE.MeshBasicMaterial({ 
  //       color: color,
  //       transparent: true,
  //       opacity: 0.8
  //     });
      
  //     const debrisMesh = new THREE.Mesh(geometry, material);
      
  //     // Position debris based on orbital parameters
  //     const altitude = debris.altitude + 100; // Earth radius + altitude
  //     const angle = (index / debrisData.debris_objects.length) * Math.PI * 2;
      
  //     debrisMesh.position.set(
  //       Math.cos(angle) * altitude,
  //       Math.sin(angle) * altitude * 0.3,
  //       Math.sin(angle) * altitude * 0.7
  //     );
      
  //     // Add user data for interaction
  //     debrisMesh.userData = {
  //       type: 'debris',
  //       debrisData: debris
  //     };
      
  //     debrisGroup.add(debrisMesh);
  //   });
    
  //   scene.add(debrisGroup);
  // };

  // const createORCADrone = (scene) => {
  //   // ORCA drone geometry
  //   const droneGeometry = new THREE.BoxGeometry(2, 1, 3);
  //   const droneMaterial = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
  //   const drone = new THREE.Mesh(droneGeometry, droneMaterial);
    
  //   // Position drone
  //   drone.position.set(0, 0, 200);
  //   drone.userData = { type: 'orca_drone' };
    
  //   scene.add(drone);
  //   return drone;
  // };

  const updateCameraPosition = useCallback(() => {
    const camera = sceneRef.current?.children.find(child => child.type === 'PerspectiveCamera');
    if (!camera) return;
    
    switch (viewMode) {
      case 'earth':
        // Earth view - close to Earth
        camera.position.set(0, 0, 1000);
        break;
      case 'satellite':
        // Satellite view - from above
        camera.position.set(0, 2000, 0);
        break;
      case 'data':
        // Data view - overview
        camera.position.set(3000, 3000, 3000);
        break;
      default:
        camera.position.set(0, 0, 1000);
    }
  }, [viewMode]);

  const updateDebrisPositions = () => {
    // Update debris orbital positions
    const debrisGroup = sceneRef.current?.children.find(child => child.type === 'Group');
    if (debrisGroup) {
      debrisGroup.children.forEach((debris, index) => {
        if (debris.userData.type === 'debris') {
          const time = Date.now() * 0.0001;
          const angle = (index / debrisGroup.children.length) * Math.PI * 2 + time;
          const altitude = debris.userData.debrisData.altitude + 100;
          
          debris.position.set(
            Math.cos(angle) * altitude,
            Math.sin(angle) * altitude * 0.3,
            Math.sin(angle) * altitude * 0.7
          );
        }
      });
    }
  };

  const handleDebrisClick = (event) => {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, sceneRef.current.children.find(child => child.type === 'PerspectiveCamera'));

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    
    if (intersects.length > 0) {
      const intersected = intersects[0].object;
      if (intersected.userData.type === 'debris') {
        setSelectedDebris(intersected.userData.debrisData);
      }
    }
  };

  const startMission = () => {
    setIsPlaying(true);
    // Start ORCA mission simulation
    if (missionData) {
      simulateORCAMission();
    }
  };

  const simulateORCAMission = () => {
    // Simulate ORCA capture mission
    let step = 0;
    const maxSteps = missionData.capture_results?.length || 10;
    
    const missionInterval = setInterval(() => {
      if (step >= maxSteps) {
        setIsPlaying(false);
        clearInterval(missionInterval);
        return;
      }
      
      // Update metrics
      const capture = missionData.capture_results[step];
      if (capture.success) {
        setMetrics(prev => ({
          ...prev,
          materialsRecovered: prev.materialsRecovered + capture.mass_recovered_kg,
          costSavings: prev.costSavings + capture.value_recovered_usd
        }));
      }
      
      step++;
      setCurrentTime(step);
    }, 2000);
  };

  const resetMission = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setMetrics({
      totalDebris: debrisData?.metadata.total_objects || 0,
      orcaFeasible: debrisData?.debris_objects.filter(d => d.feasible).length || 0,
      materialsRecovered: 0,
      partsManufactured: 0,
      costSavings: 0
    });
  };

  return (
    <Container>
      <div ref={mountRef} onClick={handleDebrisClick} />
      
      <ControlPanel>
        <h3 style={{ color: '#00d4ff', marginBottom: '20px' }}>🛰️ ORCA Mission Control</h3>
        
        <ControlGroup>
          <Label>Mission Controls</Label>
          <Button onClick={startMission} disabled={isPlaying}>
            🚀 Start Mission
          </Button>
          <Button onClick={resetMission} disabled={isPlaying}>
            🔄 Reset
          </Button>
        </ControlGroup>
        
        <ControlGroup>
          <Label>Time Control</Label>
          <Slider
            type="range"
            min="0"
            max="100"
            value={currentTime}
            onChange={(e) => setCurrentTime(parseInt(e.target.value))}
          />
        </ControlGroup>
        
        <ControlGroup>
          <Label>View Options</Label>
          <Button 
            onClick={() => setViewMode('earth')}
            style={{ background: viewMode === 'earth' ? 'rgba(0, 255, 255, 0.3)' : undefined }}
          >
            🌍 Earth View
          </Button>
          <Button 
            onClick={() => setViewMode('satellite')}
            style={{ background: viewMode === 'satellite' ? 'rgba(0, 255, 255, 0.3)' : undefined }}
          >
            🛰️ Satellite View
          </Button>
          <Button 
            onClick={() => setViewMode('data')}
            style={{ background: viewMode === 'data' ? 'rgba(0, 255, 255, 0.3)' : undefined }}
          >
            📊 Data View
          </Button>
        </ControlGroup>
      </ControlPanel>
      
      <InfoPanel>
        <h3 style={{ color: '#00d4ff', marginBottom: '15px' }}>📊 Mission Metrics</h3>
        
        <Metric>
          <MetricLabel>Total Debris:</MetricLabel>
          <MetricValue>{metrics.totalDebris.toLocaleString()}</MetricValue>
        </Metric>
        
        <Metric>
          <MetricLabel>ORCA Feasible:</MetricLabel>
          <MetricValue>{metrics.orcaFeasible.toLocaleString()}</MetricValue>
        </Metric>
        
        <Metric>
          <MetricLabel>Materials Recovered:</MetricLabel>
          <MetricValue>{metrics.materialsRecovered.toFixed(1)} kg</MetricValue>
        </Metric>
        
        <Metric>
          <MetricLabel>Parts Manufactured:</MetricLabel>
          <MetricValue>{metrics.partsManufactured}</MetricValue>
        </Metric>
        
        <Metric>
          <MetricLabel>Cost Savings:</MetricLabel>
          <MetricValue>${metrics.costSavings.toLocaleString()}</MetricValue>
        </Metric>
        
        {selectedDebris && (
          <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '5px' }}>
            <h4 style={{ color: '#00d4ff', marginBottom: '10px' }}>Selected Debris</h4>
            <p><strong>ID:</strong> {selectedDebris.id}</p>
            <p><strong>Material:</strong> {selectedDebris.material}</p>
            <p><strong>Size:</strong> {selectedDebris.size} cm</p>
            <p><strong>Mass:</strong> {selectedDebris.mass} kg</p>
            <p><strong>Feasible:</strong> {selectedDebris.feasible ? 'Yes' : 'No'}</p>
            <p><strong>Priority:</strong> {(selectedDebris.priority * 100).toFixed(1)}%</p>
          </div>
        )}
      </InfoPanel>
      
      <StatusIndicator>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            backgroundColor: isPlaying ? '#00ff00' : '#ff0000' 
          }} />
          <span>{isPlaying ? 'Mission Active' : 'Mission Standby'}</span>
        </div>
        <div style={{ fontSize: '12px', marginTop: '5px' }}>
          Step: {currentTime} / 100
        </div>
      </StatusIndicator>
    </Container>
  );
};

export default ORCAVisualization;
