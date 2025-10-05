import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { downloadLargeDataset, getDatasetInfo, cleanupDatasets } from '../services/api';

const Container = styled.div`
  max-width: 1200px;
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

const SectionTitle = styled.h3`
  color: #00d4ff;
  margin-bottom: 20px;
  font-size: 1.5em;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  color: #ffffff;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #00d4ff;
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
  }

  option {
    background: #1a1a2e;
    color: #ffffff;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #00d4ff;
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
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

const ProgressContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  border: 1px solid rgba(0, 212, 255, 0.2);
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  margin: 10px 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #00d4ff 0%, #0099cc 100%);
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
  border-radius: 10px;
`;

const StatusText = styled.div`
  color: #ffffff;
  text-align: center;
  margin: 10px 0;
  font-size: 14px;
`;

const DatasetInfo = styled.div`
  background: rgba(0, 212, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
  border-left: 4px solid #00d4ff;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 15px 0;
`;

const InfoItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
`;

const InfoLabel = styled.div`
  color: #00d4ff;
  font-size: 12px;
  text-transform: uppercase;
  margin-bottom: 5px;
`;

const InfoValue = styled.div`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
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

const SuccessMessage = styled.div`
  background: rgba(46, 204, 113, 0.1);
  border: 1px solid rgba(46, 204, 113, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
  color: #2ecc71;
  text-align: center;
`;

const LargeDatasetDownloader = () => {
  const [datasetType, setDatasetType] = useState('comprehensive');
  const [totalImages, setTotalImages] = useState(100);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [cleanupDays, setCleanupDays] = useState(30);

  useEffect(() => {
    loadDatasetInfo();
  }, []);

  const loadDatasetInfo = async () => {
    try {
      const response = await getDatasetInfo();
      setDatasetInfo(response.info);
    } catch (error) {
      console.error('Error loading dataset info:', error);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setProgress(0);
    setError('');
    setSuccess('');
    setStatus('Starting download...');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 1000);

      const response = await downloadLargeDataset({
        dataset_type: datasetType,
        total_images: totalImages
      });

      clearInterval(progressInterval);
      setProgress(100);
      setStatus('Download completed!');
      setSuccess(`Successfully downloaded ${response.total_images} images from ${datasetType} dataset.`);
      
      // Reload dataset info
      await loadDatasetInfo();

    } catch (error) {
      setError(`Download failed: ${error.message}`);
      setStatus('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setError('');
      setSuccess('');
      
      const response = await cleanupDatasets(cleanupDays);
      setSuccess(`Cleaned up ${response.removed_files} old files (older than ${cleanupDays} days).`);
      
      // Reload dataset info
      await loadDatasetInfo();

    } catch (error) {
      setError(`Cleanup failed: ${error.message}`);
    }
  };

  const datasetTypes = [
    { value: 'comprehensive', label: 'Comprehensive Dataset (Mixed Sources)', description: 'NASA APOD + Images + Earth (200+ images)' },
    { value: 'nasa_apod', label: 'NASA APOD Only', description: 'Astronomy Picture of the Day images' },
    { value: 'nasa_images', label: 'NASA Image Library', description: 'Space and satellite images from NASA' },
    { value: 'nasa_earth', label: 'NASA Earth Imagery', description: 'Satellite views of Earth locations' }
  ];

  return (
    <Container>
      <Title>Large Dataset Downloader</Title>
      
      <Section>
        <SectionTitle>🚀 Download Configuration</SectionTitle>
        
        <FormGroup>
          <Label>Dataset Type</Label>
          <Select
            value={datasetType}
            onChange={(e) => setDatasetType(e.target.value)}
            disabled={isDownloading}
          >
            {datasetTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.description}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Total Images to Download</Label>
          <Input
            type="number"
            value={totalImages}
            onChange={(e) => setTotalImages(parseInt(e.target.value) || 100)}
            min="10"
            max="1000"
            disabled={isDownloading}
            placeholder="Enter number of images (10-1000)"
          />
        </FormGroup>

        <Button
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? 'Downloading...' : 'Download Large Dataset'}
        </Button>
      </Section>

      {(isDownloading || progress > 0) && (
        <ProgressContainer>
          <SectionTitle>📊 Download Progress</SectionTitle>
          <ProgressBar>
            <ProgressFill progress={progress} />
          </ProgressBar>
          <StatusText>{status}</StatusText>
        </ProgressContainer>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {datasetInfo && (
        <Section>
          <SectionTitle>📈 Dataset Information</SectionTitle>
          
          <InfoGrid>
            <InfoItem>
              <InfoLabel>Total Datasets</InfoLabel>
              <InfoValue>{datasetInfo.total_datasets || 0}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Download Directory</InfoLabel>
              <InfoValue>{datasetInfo.download_directory || 'N/A'}</InfoValue>
            </InfoItem>
          </InfoGrid>

          {datasetInfo.datasets && Object.keys(datasetInfo.datasets).length > 0 && (
            <div>
              <h4 style={{ color: '#00d4ff', marginBottom: '15px' }}>Available Datasets:</h4>
              {Object.entries(datasetInfo.datasets).map(([key, dataset]) => (
                <DatasetInfo key={key}>
                  <div style={{ color: '#ffffff', marginBottom: '10px' }}>
                    <strong>{key.replace('_metadata.json', '')}</strong>
                  </div>
                  <div style={{ color: '#00d4ff', fontSize: '14px' }}>
                    Source: {dataset.source} | Type: {dataset.dataset_type} | 
                    Images: {dataset.total_images} | 
                    Date: {new Date(dataset.download_date * 1000).toLocaleDateString()}
                  </div>
                  {dataset.statistics && (
                    <div style={{ color: '#ffffff', fontSize: '12px', marginTop: '5px' }}>
                      Size: {Math.round(dataset.statistics.total_size / 1024 / 1024)} MB | 
                      Sources: {dataset.statistics.sources?.join(', ')} | 
                      Types: {dataset.statistics.file_types?.join(', ')}
                    </div>
                  )}
                </DatasetInfo>
              ))}
            </div>
          )}
        </Section>
      )}

      <Section>
        <SectionTitle>🧹 Dataset Management</SectionTitle>
        
        <FormGroup>
          <Label>Cleanup Files Older Than (Days)</Label>
          <Input
            type="number"
            value={cleanupDays}
            onChange={(e) => setCleanupDays(parseInt(e.target.value) || 30)}
            min="1"
            max="365"
            placeholder="Enter number of days"
          />
        </FormGroup>

        <Button
          className="secondary"
          onClick={handleCleanup}
        >
          Cleanup Old Datasets
        </Button>
      </Section>

      <Section>
        <SectionTitle>ℹ️ Information</SectionTitle>
        
        <div style={{ color: '#ffffff', lineHeight: '1.6' }}>
          <p><strong>Comprehensive Dataset:</strong> Downloads from multiple NASA sources to create a diverse collection of space-related images.</p>
          <p><strong>NASA APOD:</strong> High-quality astronomy images from NASA's Astronomy Picture of the Day.</p>
          <p><strong>NASA Images:</strong> Space and satellite imagery from NASA's image library.</p>
          <p><strong>NASA Earth:</strong> Satellite views of various Earth locations.</p>
          <p><strong>Note:</strong> Large downloads may take several minutes. Progress is shown during download.</p>
        </div>
      </Section>
    </Container>
  );
};

export default LargeDatasetDownloader;
