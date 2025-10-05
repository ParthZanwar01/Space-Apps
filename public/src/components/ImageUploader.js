import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';

const UploaderContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  ${props => props.isDragActive && `
    border-color: #00ffff;
    background: rgba(0, 255, 255, 0.1);
    transform: scale(1.02);
  `}
  
  ${props => props.isAnalyzing && `
    border-color: #ffaa00;
    background: rgba(255, 170, 0, 0.1);
  `}
`;

const UploadContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const UploadIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #00ffff, #0080ff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #000;
  margin-bottom: 10px;
`;

const UploadText = styled.div`
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 20px;
  }
`;


const UploadButton = styled.button`
  background: linear-gradient(135deg, #00ffff, #0080ff);
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  color: #000;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 255, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResetButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 20px;
  border-radius: 20px;
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const FileInfo = styled.div`
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  text-align: left;
  
  h4 {
    font-size: 14px;
    color: #00ffff;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    margin: 4px 0;
  }
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #00ffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SupportedFormats = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 15px;
`;

function ImageUploader({ onImageUpload, isAnalyzing, onReset }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = React.useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.tiff']
    },
    multiple: false,
    disabled: isAnalyzing
  });


  const handleButtonClick = (e) => {
    e.stopPropagation();
    // Trigger the file input directly
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <UploaderContainer
      {...getRootProps()}
      isDragActive={isDragActive}
      isAnalyzing={isAnalyzing}
    >
      <input {...getInputProps()} ref={fileInputRef} />
      
      <UploadContent>
        <UploadIcon>
          {isAnalyzing ? <LoadingSpinner /> : '📸'}
        </UploadIcon>
        
        <UploadText>
          <h3>
            {isAnalyzing ? 'Analyzing Image...' : 
             isDragActive ? 'Drop the image here' : 
             'Upload Space Debris Image'}
          </h3>
          <p>
            {isAnalyzing ? 'Processing your image with AI analysis' :
             'Drag & drop an image or click to browse'}
          </p>
        </UploadText>
        
        {!isAnalyzing && (
          <UploadButton onClick={handleButtonClick}>
            Choose Image
          </UploadButton>
        )}
        
        {selectedFile && (
          <FileInfo>
            <h4>Selected File:</h4>
            <p><strong>Name:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
            <p><strong>Type:</strong> {selectedFile.type}</p>
            <p><strong>Last Modified:</strong> {new Date(selectedFile.lastModified).toLocaleString()}</p>
          </FileInfo>
        )}
        
        {selectedFile && !isAnalyzing && (
          <ResetButton onClick={onReset}>
            Reset & Upload New Image
          </ResetButton>
        )}
        
        <SupportedFormats>
          Supported formats: JPEG, PNG, GIF, BMP, TIFF
        </SupportedFormats>
      </UploadContent>
    </UploaderContainer>
  );
}

export default ImageUploader;
