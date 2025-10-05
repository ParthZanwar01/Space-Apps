import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
  color: #00d4ff;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2.5em;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 25px;
  margin-bottom: 25px;
  border: 1px solid rgba(0, 212, 255, 0.2);
`;

const Button = styled.button`
  background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
  color: #ffffff;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 10px;
  margin-bottom: 10px;
  box-shadow: 0 5px 15px rgba(0, 212, 255, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &.secondary {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);

    &:hover {
      box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
    }
  }
`;

const ImagePreview = styled.div`
  margin: 20px 0;
  text-align: center;
`;

const Image = styled.img`
  max-width: 100%;
  max-height: 400px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

const StatusMessage = styled.div`
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
  color: #00d4ff;
  text-align: center;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
  color: #ff6b6b;
  text-align: center;
`;

const AnalysisResults = styled.div`
  background: rgba(46, 204, 113, 0.1);
  border: 1px solid rgba(46, 204, 113, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
`;

const ResultItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ResultLabel = styled.span`
  color: #00d4ff;
  font-weight: 500;
`;

const ResultValue = styled.span`
  color: #ffffff;
  font-weight: 600;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #00d4ff;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ImageDownloadProcessor = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadedImage, setDownloadedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const downloadImage = async (imageType) => {
    setIsDownloading(true);
    setError('');
    setStatus(`Downloading ${imageType} image...`);

    try {
      const response = await fetch('/api/download-sample-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_type: imageType }),
      });

      const data = await response.json();

      if (data.success) {
        setDownloadedImage({
          path: data.image_path,
          url: data.image_url,
          type: imageType
        });
        setStatus(`Successfully downloaded ${imageType} image!`);
      } else {
        setError(data.error || 'Failed to download image');
      }
    } catch (error) {
      setError(`Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const processImage = async () => {
    if (!downloadedImage) return;

    setIsProcessing(true);
    setError('');
    setStatus('Processing image for debris analysis...');

    try {
      const response = await fetch('/api/process-downloaded-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_path: downloadedImage.path }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.analysis_result);
        setStatus('Image processing completed successfully!');
      } else {
        setError(data.error || 'Failed to process image');
      }
    } catch (error) {
      setError(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setDownloadedImage(null);
    setAnalysisResult(null);
    setError('');
    setStatus('');
  };

  return (
    <Container>
      <Title>🛰️ Image Download & Processing</Title>
      
      <Section>
        <h3 style={{ color: '#00d4ff', marginBottom: '20px' }}>Download Sample Images</h3>
        <p style={{ color: '#ffffff', marginBottom: '20px' }}>
          Download sample space images for debris analysis and processing.
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <Button
            onClick={() => downloadImage('space_debris')}
            disabled={isDownloading}
          >
            {isDownloading ? <LoadingSpinner /> : '🛰️ Space Debris'}
          </Button>
          
          <Button
            onClick={() => downloadImage('nasa_apod')}
            disabled={isDownloading}
          >
            {isDownloading ? <LoadingSpinner /> : '🌌 NASA APOD'}
          </Button>
          
          <Button
            onClick={() => downloadImage('satellite')}
            disabled={isDownloading}
          >
            {isDownloading ? <LoadingSpinner /> : '🛰️ Satellite'}
          </Button>
          
          <Button
            onClick={() => downloadImage('astronomy')}
            disabled={isDownloading}
          >
            {isDownloading ? <LoadingSpinner /> : '🔭 Astronomy'}
          </Button>
        </div>
      </Section>

      {status && <StatusMessage>{status}</StatusMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {downloadedImage && (
        <Section>
          <h3 style={{ color: '#00d4ff', marginBottom: '20px' }}>Downloaded Image</h3>
          
          <ImagePreview>
            <Image
              src={`http://localhost:5001/${downloadedImage.path}`}
              alt={`Downloaded ${downloadedImage.type} image`}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </ImagePreview>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <Button
              onClick={processImage}
              disabled={isProcessing}
            >
              {isProcessing ? <LoadingSpinner /> : '🔍 Analyze Image'}
            </Button>
            
            <Button
              className="secondary"
              onClick={reset}
            >
              🔄 Reset
            </Button>
          </div>
        </Section>
      )}

      {analysisResult && (
        <AnalysisResults>
          <h3 style={{ color: '#2ecc71', marginBottom: '20px' }}>Analysis Results</h3>
          
          <ResultItem>
            <ResultLabel>Total Objects Detected:</ResultLabel>
            <ResultValue>{analysisResult.total_objects}</ResultValue>
          </ResultItem>
          
          <ResultItem>
            <ResultLabel>Feasible Objects:</ResultLabel>
            <ResultValue>{analysisResult.feasible_objects}</ResultValue>
          </ResultItem>
          
          <ResultItem>
            <ResultLabel>Feasibility Rate:</ResultLabel>
            <ResultValue>{(analysisResult.summary?.feasibility_rate * 100 || 0).toFixed(1)}%</ResultValue>
          </ResultItem>
          
          <ResultItem>
            <ResultLabel>Average Priority:</ResultLabel>
            <ResultValue>{(analysisResult.summary?.avg_priority || 0).toFixed(2)}</ResultValue>
          </ResultItem>
          
          {analysisResult.summary?.material_distribution && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: '#00d4ff', marginBottom: '10px' }}>Material Distribution:</h4>
              {Object.entries(analysisResult.summary.material_distribution).map(([material, count]) => (
                <ResultItem key={material}>
                  <ResultLabel>{material}:</ResultLabel>
                  <ResultValue>{count}</ResultValue>
                </ResultItem>
              ))}
            </div>
          )}
          
          {analysisResult.summary?.size_stats && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: '#00d4ff', marginBottom: '10px' }}>Size Statistics:</h4>
              <ResultItem>
                <ResultLabel>Min Size:</ResultLabel>
                <ResultValue>{analysisResult.summary.size_stats.min.toFixed(2)}m</ResultValue>
              </ResultItem>
              <ResultItem>
                <ResultLabel>Max Size:</ResultLabel>
                <ResultValue>{analysisResult.summary.size_stats.max.toFixed(2)}m</ResultValue>
              </ResultItem>
              <ResultItem>
                <ResultLabel>Average Size:</ResultLabel>
                <ResultValue>{analysisResult.summary.size_stats.avg.toFixed(2)}m</ResultValue>
              </ResultItem>
            </div>
          )}
        </AnalysisResults>
      )}
    </Container>
  );
};

export default ImageDownloadProcessor;
