import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ImageDownloader from './components/ImageDownloader';
import LargeDatasetDownloader from './components/LargeDatasetDownloader';
import ORCAVisualization from './components/ORCAVisualization';
import ImageDownloadProcessor from './components/ImageDownloadProcessor';
import AnalysisResults from './components/AnalysisResults';
import PathVisualization from './components/PathVisualization';
import Dashboard from './components/Dashboard';
import NASADataExplorer from './components/NASADataExplorer';
import { analyzeImage, planPath, getHealthStatus } from './services/api';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
  color: #ffffff;
`;

const MainContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  min-height: calc(100vh - 80px);

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 15px;
  }
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StatusIndicator = styled.div`
  position: fixed;
  top: 100px;
  right: 20px;
  padding: 10px 15px;
  background: ${props => props.status === 'connected' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)'};
  border: 1px solid ${props => props.status === 'connected' ? '#00ff00' : '#ff0000'};
  border-radius: 8px;
  font-size: 12px;
  z-index: 1000;
  backdrop-filter: blur(10px);
`;

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [pathResult, setPathResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlanningPath, setIsPlanningPath] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDownloader, setShowDownloader] = useState(false);
  const [showLargeDownloader, setShowLargeDownloader] = useState(false);
  const [showORCA, setShowORCA] = useState(false);
  const [showImageProcessor, setShowImageProcessor] = useState(false);
  const [showNASAData, setShowNASAData] = useState(false);
  const [currentView, setCurrentView] = useState('main');

  // Check server health on component mount
  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkServerHealth = async () => {
    try {
      await getHealthStatus();
      setServerStatus('connected');
    } catch (error) {
      setServerStatus('disconnected');
    }
  };

  const handleImageAnalysis = async (imageFile) => {
    setIsAnalyzing(true);
    setSelectedImage(imageFile);
    
    try {
      const result = await analyzeImage(imageFile);
      setAnalysisResult(result);
      
      // If feasible debris found, automatically plan path
      if (result.feasible_objects > 0) {
        handlePathPlanning(result.feasible_debris);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePathPlanning = async (debrisList = null) => {
    setIsPlanningPath(true);
    
    try {
      const debris = debrisList || analysisResult?.feasible_debris || [];
      const result = await planPath(debris);
      setPathResult(result);
    } catch (error) {
      console.error('Path planning failed:', error);
    } finally {
      setIsPlanningPath(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setPathResult(null);
    setSelectedImage(null);
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
    // Reset all view states
    setShowDownloader(false);
    setShowLargeDownloader(false);
    setShowORCA(false);
    setShowImageProcessor(false);
    setShowNASAData(false);
    
    // Set the appropriate view
    switch(view) {
      case 'main':
        // Already reset above
        break;
      case 'download':
        setShowDownloader(true);
        break;
      case 'large-dataset':
        setShowLargeDownloader(true);
        break;
      case 'orca':
        setShowORCA(true);
        break;
      case 'processor':
        setShowImageProcessor(true);
        break;
      case 'nasa-data':
        setShowNASAData(true);
        break;
      default:
        break;
    }
  };

  const handleDownloadedImageSelect = (imagePath) => {
    // Convert the downloaded image path to a file object for analysis
    fetch(`http://localhost:5001/${imagePath}`)
      .then(response => response.blob())
      .then(blob => {
        const file = new File([blob], imagePath.split('/').pop(), { type: blob.type });
        handleImageAnalysis(file);
        handleNavigate('main');
      })
      .catch(error => {
        console.error('Error loading downloaded image:', error);
      });
  };

  return (
    <AppContainer>
      <Header currentView={currentView} onNavigate={handleNavigate} />
      
      <StatusIndicator status={serverStatus}>
        {serverStatus === 'connected' ? '🟢 Server Connected' : '🔴 Server Disconnected'}
      </StatusIndicator>

      <MainContent>
        <LeftPanel>
          {!showDownloader && !showLargeDownloader && !showORCA && !showImageProcessor && !showNASAData ? (
            <>
              <ImageUploader 
                onImageUpload={handleImageAnalysis}
                isAnalyzing={isAnalyzing}
                onReset={resetAnalysis}
              />
              
              {analysisResult && (
                <AnalysisResults 
                  result={analysisResult}
                  selectedImage={selectedImage}
                  onPlanPath={() => handlePathPlanning()}
                  isPlanningPath={isPlanningPath}
                />
              )}
            </>
          ) : showDownloader ? (
            <ImageDownloader 
              onImageSelect={handleDownloadedImageSelect}
            />
          ) : showLargeDownloader ? (
            <LargeDatasetDownloader />
        ) : showORCA ? (
          <ORCAVisualization />
        ) : showNASAData ? (
          <NASADataExplorer />
        ) : (
          <ImageDownloadProcessor />
        )}
        </LeftPanel>

        <RightPanel>
          <Dashboard 
            analysisResult={analysisResult}
            pathResult={pathResult}
            serverStatus={serverStatus}
          />
          
          {pathResult && (
            <PathVisualization 
              pathData={pathResult}
              analysisResult={analysisResult}
            />
          )}
          
          {!showDownloader && !showLargeDownloader && !showORCA && !showImageProcessor && (
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={() => handleNavigate('download')}
                style={{
                  background: 'rgba(0, 255, 255, 0.2)',
                  border: '1px solid #00ffff',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.3s ease',
                  marginBottom: '10px'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(0, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(0, 255, 255, 0.2)';
                }}
              >
                📥 Download Space Images
              </button>
              
              <button
                onClick={() => handleNavigate('large-dataset')}
                style={{
                  background: 'rgba(255, 165, 0, 0.2)',
                  border: '1px solid #ffa500',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.3s ease',
                  marginBottom: '10px'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 165, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 165, 0, 0.2)';
                }}
              >
                🚀 Large Dataset Downloader
              </button>
              
              <button
                onClick={() => handleNavigate('orca')}
                style={{
                  background: 'rgba(255, 0, 150, 0.2)',
                  border: '1px solid #ff0096',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.3s ease',
                  marginBottom: '10px'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 0, 150, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 0, 150, 0.2)';
                }}
              >
                🛰️ ORCA Hackathon Demo
              </button>
              
              <button
                onClick={() => handleNavigate('processor')}
                style={{
                  background: 'rgba(0, 255, 0, 0.2)',
                  border: '1px solid #00ff00',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.3s ease',
                  marginBottom: '10px'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(0, 255, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(0, 255, 0, 0.2)';
                }}
              >
                🔍 Download & Process Images
              </button>
              
              <button
                onClick={() => handleNavigate('nasa-data')}
                style={{
                  background: 'rgba(255, 215, 0, 0.2)',
                  border: '1px solid #ffd700',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 215, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 215, 0, 0.2)';
                }}
              >
                🚀 NASA Data Explorer
              </button>
            </div>
          )}
          
          {(showDownloader || showLargeDownloader || showORCA || showImageProcessor || showNASAData) && (
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={() => handleNavigate('main')}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                📤 Back to Upload
              </button>
            </div>
          )}
        </RightPanel>
      </MainContent>
    </AppContainer>
  );
}

export default App;
