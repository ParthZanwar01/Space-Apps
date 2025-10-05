import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { downloadImages, downloadFromUrl, createSampleDataset, getDownloadedImages } from '../services/api';

const DownloaderContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const DownloaderHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const DownloaderTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DownloadSection = styled.div`
  margin-bottom: 25px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SectionTitle = styled.h4`
  font-size: 14px;
  color: #ffffff;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #00ffff;
    background: rgba(255, 255, 255, 0.15);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #00ffff;
  }
  
  option {
    background: #1a1a2e;
    color: #ffffff;
  }
`;

const Button = styled.button`
  background: ${props => props.primary ? 
    'linear-gradient(135deg, #00ffff, #0080ff)' : 
    'rgba(255, 255, 255, 0.1)'};
  border: ${props => props.primary ? 'none' : '1px solid rgba(255, 255, 255, 0.3)'};
  padding: 10px 20px;
  border-radius: 20px;
  color: ${props => props.primary ? '#000' : '#ffffff'};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusMessage = styled.div`
  padding: 10px 15px;
  border-radius: 8px;
  margin-top: 15px;
  font-size: 12px;
  background: ${props => props.type === 'success' ? 'rgba(0, 255, 0, 0.2)' : 
              props.type === 'error' ? 'rgba(255, 0, 0, 0.2)' : 
              'rgba(255, 170, 0, 0.2)'};
  border: 1px solid ${props => props.type === 'success' ? '#00ff00' : 
              props.type === 'error' ? '#ff0000' : 
              '#ffaa00'};
  color: ${props => props.type === 'success' ? '#00ff00' : 
              props.type === 'error' ? '#ff0000' : 
              '#ffaa00'};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 10px;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, #00ffff, #0080ff);
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const DownloadedImages = styled.div`
  margin-top: 20px;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

const ImageCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
`;

const ImagePreview = styled.img`
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 5px;
  margin-bottom: 8px;
`;

const ImageInfo = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
`;

function ImageDownloader({ onImageSelect }) {
  const [downloadCount, setDownloadCount] = useState(10);
  const [downloadSource, setDownloadSource] = useState('mixed');
  const [customUrl, setCustomUrl] = useState('');
  const [customFilename, setCustomFilename] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [downloadedImages, setDownloadedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDownloadedImages();
  }, []);

  const loadDownloadedImages = async () => {
    try {
      setIsLoading(true);
      const response = await getDownloadedImages();
      setDownloadedImages(response.images || []);
    } catch (error) {
      console.error('Error loading downloaded images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadImages = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      setStatusMessage('Downloading images...');

      const response = await downloadImages({
        count: downloadCount,
        source: downloadSource
      });

      if (response.success) {
        setStatusMessage(`Successfully downloaded ${response.downloaded_count} images!`);
        setDownloadProgress(100);
        await loadDownloadedImages();
      } else {
        setStatusMessage('Download failed. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsDownloading(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const handleDownloadFromUrl = async () => {
    if (!customUrl.trim()) {
      setStatusMessage('Please enter a valid URL');
      return;
    }

    try {
      setIsDownloading(true);
      setStatusMessage('Downloading image from URL...');

      const response = await downloadFromUrl({
        url: customUrl,
        filename: customFilename || undefined
      });

      if (response.success) {
        setStatusMessage(`Successfully downloaded: ${response.filename}`);
        setCustomUrl('');
        setCustomFilename('');
        await loadDownloadedImages();
      } else {
        setStatusMessage('Failed to download image from URL');
      }
    } catch (error) {
      console.error('URL download error:', error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsDownloading(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const handleCreateSampleDataset = async () => {
    try {
      setIsDownloading(true);
      setStatusMessage('Creating sample dataset...');

      const response = await createSampleDataset({
        total_images: downloadCount
      });

      if (response.success) {
        setStatusMessage(`Created sample dataset with ${response.dataset_count} images!`);
        await loadDownloadedImages();
      } else {
        setStatusMessage('Failed to create sample dataset');
      }
    } catch (error) {
      console.error('Sample dataset error:', error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsDownloading(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const handleImageClick = (imagePath) => {
    if (onImageSelect) {
      onImageSelect(imagePath);
    }
  };

  return (
    <DownloaderContainer>
      <DownloaderHeader>
        <DownloaderTitle>📥 Download Space Images</DownloaderTitle>
      </DownloaderHeader>

      <DownloadSection>
        <SectionTitle>🌌 Download from Online Sources</SectionTitle>
        
        <InputGroup>
          <Label>Number of Images</Label>
          <Input
            type="number"
            min="1"
            max="50"
            value={downloadCount}
            onChange={(e) => setDownloadCount(parseInt(e.target.value) || 1)}
          />
        </InputGroup>

        <InputGroup>
          <Label>Image Source</Label>
          <Select
            value={downloadSource}
            onChange={(e) => setDownloadSource(e.target.value)}
          >
            <option value="mixed">Mixed Sources (Recommended)</option>
            <option value="nasa_apod">NASA Astronomy Picture of the Day</option>
            <option value="nasa_images">NASA Image Library</option>
            <option value="space_debris">Space Debris Images</option>
          </Select>
        </InputGroup>

        <Button 
          primary 
          onClick={handleDownloadImages}
          disabled={isDownloading}
        >
          {isDownloading ? 'Downloading...' : 'Download Images'}
        </Button>

        {isDownloading && (
          <ProgressBar>
            <ProgressFill progress={downloadProgress} />
          </ProgressBar>
        )}
      </DownloadSection>

      <DownloadSection>
        <SectionTitle>🔗 Download from Custom URL</SectionTitle>
        
        <InputGroup>
          <Label>Image URL</Label>
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
          />
        </InputGroup>

        <InputGroup>
          <Label>Custom Filename (optional)</Label>
          <Input
            type="text"
            placeholder="my_image.jpg"
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
          />
        </InputGroup>

        <Button 
          onClick={handleDownloadFromUrl}
          disabled={isDownloading || !customUrl.trim()}
        >
          {isDownloading ? 'Downloading...' : 'Download from URL'}
        </Button>
      </DownloadSection>

      <DownloadSection>
        <SectionTitle>📊 Create Sample Dataset</SectionTitle>
        
        <Button 
          onClick={handleCreateSampleDataset}
          disabled={isDownloading}
        >
          {isDownloading ? 'Creating...' : 'Create Sample Dataset'}
        </Button>
      </DownloadSection>

      {statusMessage && (
        <StatusMessage type={statusMessage.includes('Success') ? 'success' : 
                          statusMessage.includes('Error') ? 'error' : 'info'}>
          {statusMessage}
        </StatusMessage>
      )}

      <DownloadedImages>
        <SectionTitle>📁 Downloaded Images ({downloadedImages.length})</SectionTitle>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Loading images...
          </div>
        ) : downloadedImages.length > 0 ? (
          <ImageGrid>
            {downloadedImages.map((imagePath, index) => (
              <ImageCard key={index} onClick={() => handleImageClick(imagePath)}>
                <ImagePreview 
                  src={`https://space-apps-backend.onrender.com/${imagePath}`} 
                  alt={`Downloaded image ${index + 1}`}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <ImageInfo>
                  {imagePath.split('/').pop()}
                </ImageInfo>
              </ImageCard>
            ))}
          </ImageGrid>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.5)' }}>
            No images downloaded yet. Use the options above to download some images!
          </div>
        )}
      </DownloadedImages>
    </DownloaderContainer>
  );
}

export default ImageDownloader;
