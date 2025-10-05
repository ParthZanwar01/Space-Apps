import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';

const VisualizationContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const VisualizationHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const VisualizationTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ViewControls = styled.div`
  display: flex;
  gap: 10px;
`;

const ViewButton = styled.button`
  background: ${props => props.active ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.active ? '#00ffff' : 'rgba(255, 255, 255, 0.3)'};
  padding: 6px 12px;
  border-radius: 15px;
  color: #ffffff;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 255, 255, 0.2);
    border-color: #00ffff;
  }
`;

const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
`;

const PathInfo = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
`;

const InfoCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const InfoLabel = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 5px;
`;

const InfoValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
`;

const Legend = styled.div`
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const PathSteps = styled.div`
  margin-top: 20px;
  max-height: 200px;
  overflow-y: auto;
`;

const StepItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
  border-left: 3px solid ${props => props.color};
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
`;

function PathVisualization({ pathData, analysisResult }) {
  const canvasRef = useRef(null);
  const [viewMode, setViewMode] = useState('3d');
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [showOnImage, setShowOnImage] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });

  const drawPath = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pathData.visualization) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

        // Clear canvas or draw background image
        if (showOnImage && analysisResult && analysisResult.image_url) {
          // Draw the original image as background with zoom and pan
          const img = new Image();
          img.onload = () => {
            // Calculate image dimensions with zoom
            const imgWidth = img.width * zoom;
            const imgHeight = img.height * zoom;
            
            // Calculate image position with pan
            const imgX = (rect.width - imgWidth) / 2 + pan.x;
            const imgY = (rect.height - imgHeight) / 2 + pan.y;
            
            // Clear canvas
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, rect.width, rect.height);
            
            // Draw image with zoom and pan
            ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
            
            // Draw path overlay with same zoom and pan
            drawPathOverlay(ctx, rect, imgX, imgY, imgWidth, imgHeight);
          };
          img.src = analysisResult.image_url;
          return;
        } else {
          // Clear canvas with background
          ctx.fillStyle = viewMode === '3d' ? 'rgba(0, 0, 20, 0.3)' : 'rgba(0, 0, 0, 0.1)';
          ctx.fillRect(0, 0, rect.width, rect.height);
        }

    drawPathOverlay(ctx, rect);
  }, [pathData, viewMode, rotation, showOnImage, zoom, pan, analysisResult, drawPathOverlay]);

  const drawPathOverlay = useCallback((ctx, rect, imgX = 0, imgY = 0, imgWidth = 0, imgHeight = 0) => {

    const points = pathData.visualization.points;
    const connections = pathData.visualization.connections;

    if (!points || points.length === 0) return;

    // Calculate bounds
    const bounds = calculateBounds(points);
    const scale = Math.min(rect.width, rect.height) / Math.max(bounds.width, bounds.height) * 0.8;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Project 3D points to 2D with view mode consideration
    const projectedPoints = points.map(point => {
      const [x, y, z] = point;
      
      if (showOnImage && analysisResult && analysisResult.image_url) {
        // When showing on image, map path coordinates to image space
        // Path coordinates are in image pixel space (x, y, z=0)
        // We need to scale them to match the displayed image size
        
        // Get the original image dimensions from the analysis result
        const originalWidth = analysisResult.metadata?.image_size?.[1] || bounds.width;
        const originalHeight = analysisResult.metadata?.image_size?.[0] || bounds.height;
        
        // Scale the path coordinates to match the displayed image
        const scaleX = imgWidth / originalWidth;
        const scaleY = imgHeight / originalHeight;
        
        // Apply scaling and positioning
        const imageX = imgX + x * scaleX;
        const imageY = imgY + y * scaleY;
        
        return { x: imageX, y: imageY, z: 0 };
      }
      
      if (viewMode === '2d') {
        // Simple 2D projection (ignore Z) with zoom and pan
        const projectedX = centerX + (x - bounds.centerX) * scale * zoom + pan.x;
        const projectedY = centerY + (y - bounds.centerY) * scale * zoom + pan.y;
        return { x: projectedX, y: projectedY, z: 0 };
      } else {
        // 3D perspective projection with rotation (improved) and zoom
        const cosX = Math.cos(rotation.x * 0.5);
        const sinX = Math.sin(rotation.x * 0.5);
        const cosY = Math.cos(rotation.y * 0.5);
        const sinY = Math.sin(rotation.y * 0.5);
        
        // Apply rotation with better scaling
        const rotatedX = x * cosY - z * sinY;
        const rotatedY = y * cosX + (x * sinY + z * cosY) * sinX;
        const rotatedZ = (x * sinY + z * cosY) * cosX - y * sinX;
        
        // Perspective projection with better depth handling and zoom
        const perspective = 1000;
        const depth = Math.max(1, rotatedZ + perspective);
        const projectedX = centerX + (rotatedX / depth) * scale * 200 * zoom + pan.x;
        const projectedY = centerY + (rotatedY / depth) * scale * 200 * zoom + pan.y;
        
        return { x: projectedX, y: projectedY, z: rotatedZ };
      }
    });

    // Draw connections
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    for (const connection of connections) {
      const [startIdx, endIdx] = connection;
      if (startIdx < projectedPoints.length && endIdx < projectedPoints.length) {
        const start = projectedPoints[startIdx];
        const end = projectedPoints[endIdx];
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    }

    // Reset line dash
    ctx.setLineDash([]);

    // Draw points
    projectedPoints.forEach((point, index) => {
      const isStart = index === 0;
      const isEnd = index === projectedPoints.length - 1;
      const metadata = pathData.visualization.metadata?.[index - 1]; // -1 because start point has no metadata
      

      let color, radius;
      
      if (isStart) {
        color = '#00ff00';
        radius = 8;
      } else if (isEnd && projectedPoints.length > 2) {
        color = '#ff0000';
        radius = 8;
      } else if (metadata) {
        color = metadata.feasible ? '#00ffff' : '#ffaa00';
        radius = Math.max(4, Math.min(12, metadata.size * 2));
      } else {
        // Default for intermediate points without metadata
        color = '#00ffff';
        radius = 6;
      }

      // Draw point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw labels
      if (metadata || isStart || isEnd) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        const label = isStart ? 'START' : 
                     (isEnd && projectedPoints.length > 2) ? 'END' : 
                     metadata ? `D${metadata.debris_id || index}` :
                     `D${index}`;
        
        ctx.fillText(label, point.x, point.y - radius - 10);
      }
    });

    // Draw coordinate axes (only in 3D mode and not on image)
    if (viewMode === '3d' && !showOnImage) {
      drawAxes(ctx, centerX, centerY, scale);
    }
  }, [pathData, viewMode, rotation, showOnImage, zoom, pan, analysisResult]);

  useEffect(() => {
    if (pathData && pathData.visualization) {
      drawPath();
    }
  }, [pathData, viewMode, rotation, showOnImage, zoom, pan]);

  const calculateBounds = (points) => {
    if (points.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, centerX: 0, centerY: 0, width: 0, height: 0 };

    const xCoords = points.map(p => p[0]);
    const yCoords = points.map(p => p[1]);
    
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);
    
    return {
      minX, maxX, minY, maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const drawAxes = (ctx, centerX, centerY, scale) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // X axis
    ctx.beginPath();
    ctx.moveTo(centerX - 50, centerY);
    ctx.lineTo(centerX + 50, centerY);
    ctx.stroke();
    
    // Y axis
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 50);
    ctx.lineTo(centerX, centerY + 50);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '8px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('X', centerX + 55, centerY + 3);
    ctx.fillText('Y', centerX + 3, centerY - 55);
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    if (isPanning) {
      // Handle panning
      const deltaX = e.clientX - lastPanPos.x;
      const deltaY = e.clientY - lastPanPos.y;
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPos({ x: e.clientX, y: e.clientY });
    } else if (viewMode === '3d' && !showOnImage) {
      // Handle 3D rotation
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      setRotation({
        x: (y - 0.5) * Math.PI,
        y: (x - 0.5) * Math.PI
      });
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+left click for panning
      setIsPanning(true);
      setLastPanPos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    } else if (e.button === 0 && viewMode === '3d' && !showOnImage) {
      // Left click for 3D rotation
      // setIsDragging(true);
      // setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    // setIsDragging(false);
    setIsPanning(false);
  };

  const handleCanvasWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(10, prev * delta)));
  };

  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setRotation({ x: 0, y: 0 });
  };

  if (!pathData || !pathData.visualization) {
    return (
      <VisualizationContainer>
        <VisualizationHeader>
          <VisualizationTitle>🗺️ Path Visualization</VisualizationTitle>
        </VisualizationHeader>
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.5)' }}>
          No path data available
        </div>
      </VisualizationContainer>
    );
  }

  const metrics = pathData.metrics || {};

  return (
    <VisualizationContainer>
      <VisualizationHeader>
        <VisualizationTitle>🗺️ Path Visualization</VisualizationTitle>
        <ViewControls>
          <ViewButton 
            active={viewMode === '3d'} 
            onClick={() => setViewMode('3d')}
          >
            3D View
          </ViewButton>
          <ViewButton 
            active={viewMode === '2d'} 
            onClick={() => setViewMode('2d')}
          >
            2D View
          </ViewButton>
          <ViewButton 
            active={showOnImage} 
            onClick={() => setShowOnImage(!showOnImage)}
          >
            📸 On Image
          </ViewButton>
          <ViewButton 
            onClick={() => setZoom(prev => Math.min(10, prev * 1.2))}
            title="Zoom In"
          >
            🔍+
          </ViewButton>
          <ViewButton 
            onClick={() => setZoom(prev => Math.max(0.1, prev * 0.8))}
            title="Zoom Out"
          >
            🔍-
          </ViewButton>
          <ViewButton 
            onClick={resetView}
            title="Reset View"
          >
            🏠 Reset
          </ViewButton>
        </ViewControls>
      </VisualizationHeader>

      <CanvasContainer>
        <Canvas
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onWheel={handleCanvasWheel}
        />
      </CanvasContainer>

      <Legend>
        <LegendItem>
          <LegendColor color="#00ff00" />
          <span>Start Position</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#00ffff" />
          <span>Feasible Debris</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#ffaa00" />
          <span>Non-feasible</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#ff0000" />
          <span>End Position</span>
        </LegendItem>
        <LegendItem>
          <div style={{ width: '12px', height: '2px', background: 'rgba(0, 255, 255, 0.6)', margin: '5px 0' }}></div>
          <span>Path Connection</span>
        </LegendItem>
        <LegendItem>
          <span>🔍 Zoom: {Math.round(zoom * 100)}%</span>
        </LegendItem>
        <LegendItem>
          <span>Controls: Scroll=Zoom, Ctrl+Drag=Pan, Drag=Rotate(3D)</span>
        </LegendItem>
        {showOnImage && (
          <LegendItem>
            <span>📸 Image Mode: Zoom and pan work with the image</span>
          </LegendItem>
        )}
      </Legend>

      <PathInfo>
        <InfoCard>
          <InfoLabel>Path Length</InfoLabel>
          <InfoValue>{pathData.path_length || 0} steps</InfoValue>
        </InfoCard>
        
        <InfoCard>
          <InfoLabel>Total Distance</InfoLabel>
          <InfoValue>{metrics.total_distance ? `${(metrics.total_distance / 1000).toFixed(1)} km` : '0 km'}</InfoValue>
        </InfoCard>
        
        <InfoCard>
          <InfoLabel>Mission Time</InfoLabel>
          <InfoValue>{metrics.total_time ? `${(metrics.total_time / 3600).toFixed(1)} hours` : '0 hours'}</InfoValue>
        </InfoCard>
        
        <InfoCard>
          <InfoLabel>Fuel Required</InfoLabel>
          <InfoValue>{metrics.total_fuel ? `${metrics.total_fuel.toFixed(1)} kg` : '0 kg'}</InfoValue>
        </InfoCard>
      </PathInfo>

      <PathSteps>
        <h4 style={{ color: '#ffffff', marginBottom: '10px', fontSize: '14px' }}>
          Path Steps:
        </h4>
        
        {pathData.path?.map((step, index) => (
          <StepItem 
            key={index}
            color={index === 0 ? '#00ff00' : index === pathData.path.length - 1 ? '#ff0000' : '#00ffff'}
          >
            <strong>Step {step.step}:</strong> {index === 0 ? 'Start' : `Debris ${step.debris_id}`} 
            {step.distance_from_previous && (
              <span style={{ float: 'right', color: 'rgba(255, 255, 255, 0.6)' }}>
                {step.distance_from_previous.toFixed(1)}m
              </span>
            )}
          </StepItem>
        ))}
      </PathSteps>
    </VisualizationContainer>
  );
}

export default PathVisualization;
