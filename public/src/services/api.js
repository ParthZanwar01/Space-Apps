import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const analyzeImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Image analysis failed:', error);
    throw new Error(error.response?.data?.error || 'Image analysis failed');
  }
};

export const planPath = async (debrisList, startPosition = [0, 0, 0]) => {
  try {
    const response = await api.post('/plan-path', {
      debris_list: debrisList,
      start_position: startPosition,
    });

    return response.data;
  } catch (error) {
    console.error('Path planning failed:', error);
    throw new Error(error.response?.data?.error || 'Path planning failed');
  }
};

export const batchAnalyze = async (imageFiles) => {
  try {
    const formData = new FormData();
    imageFiles.forEach((file, index) => {
      formData.append('images', file);
    });

    const response = await api.post('/batch-analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Batch analysis failed:', error);
    throw new Error(error.response?.data?.error || 'Batch analysis failed');
  }
};

export const createVisualization = async (imageData, analysis) => {
  try {
    const response = await api.post('/visualize', {
      image_data: imageData,
      analysis: analysis,
    });

    return response.data;
  } catch (error) {
    console.error('Visualization creation failed:', error);
    throw new Error(error.response?.data?.error || 'Visualization creation failed');
  }
};

export const getHealthStatus = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw new Error('Server is not responding');
  }
};

export const getAlternativePaths = async (debrisList, startPosition = [0, 0, 0], numAlternatives = 3) => {
  try {
    const response = await api.post('/alternative-paths', {
      debris_list: debrisList,
      start_position: startPosition,
      num_alternatives: numAlternatives,
    });

    return response.data;
  } catch (error) {
    console.error('Alternative paths failed:', error);
    throw new Error(error.response?.data?.error || 'Alternative paths failed');
  }
};

export const exportAnalysis = async (analysisData, format = 'json') => {
  try {
    const response = await api.post('/export', {
      data: analysisData,
      format: format,
    }, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `debris-analysis.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error(error.response?.data?.error || 'Export failed');
  }
};

export const getMissionHistory = async () => {
  try {
    const response = await api.get('/mission-history');
    return response.data;
  } catch (error) {
    console.error('Mission history failed:', error);
    throw new Error(error.response?.data?.error || 'Mission history failed');
  }
};

export const saveMission = async (missionData) => {
  try {
    const response = await api.post('/save-mission', missionData);
    return response.data;
  } catch (error) {
    console.error('Save mission failed:', error);
    throw new Error(error.response?.data?.error || 'Save mission failed');
  }
};

export const loadMission = async (missionId) => {
  try {
    const response = await api.get(`/api/load-mission/${missionId}`);
    return response.data;
  } catch (error) {
    console.error('Load mission failed:', error);
    throw new Error(error.response?.data?.error || 'Load mission failed');
  }
};

export const downloadImages = async (params) => {
  try {
    const response = await api.post('/download-images', params);
    return response.data;
  } catch (error) {
    console.error('Image download failed:', error);
    throw new Error(error.response?.data?.error || 'Image download failed');
  }
};

export const downloadFromUrl = async (params) => {
  try {
    const response = await api.post('/download-from-url', params);
    return response.data;
  } catch (error) {
    console.error('URL download failed:', error);
    throw new Error(error.response?.data?.error || 'URL download failed');
  }
};

export const createSampleDataset = async (params) => {
  try {
    const response = await api.post('/sample-dataset', params);
    return response.data;
  } catch (error) {
    console.error('Sample dataset creation failed:', error);
    throw new Error(error.response?.data?.error || 'Sample dataset creation failed');
  }
};

export const getDownloadedImages = async () => {
  try {
    const response = await api.get('/downloaded-images');
    return response.data;
  } catch (error) {
    console.error('Get downloaded images failed:', error);
    throw new Error(error.response?.data?.error || 'Get downloaded images failed');
  }
};

export const downloadLargeDataset = async (params) => {
  try {
    const response = await api.post('/download-large-dataset', params);
    return response.data;
  } catch (error) {
    console.error('Large dataset download failed:', error);
    throw new Error(error.response?.data?.error || 'Large dataset download failed');
  }
};

export const getDatasetInfo = async () => {
  try {
    const response = await api.get('/dataset-info');
    return response.data;
  } catch (error) {
    console.error('Get dataset info failed:', error);
    throw new Error(error.response?.data?.error || 'Get dataset info failed');
  }
};

export const cleanupDatasets = async (daysOld = 30) => {
  try {
    const response = await api.post('/cleanup-datasets', { days_old: daysOld });
    return response.data;
  } catch (error) {
    console.error('Dataset cleanup failed:', error);
    throw new Error(error.response?.data?.error || 'Dataset cleanup failed');
  }
};

// Utility functions
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const formatDistance = (meters) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  } else {
    return `${meters.toFixed(1)} m`;
  }
};

export const formatMass = (kilograms) => {
  if (kilograms >= 1000) {
    return `${(kilograms / 1000).toFixed(2)} tons`;
  } else {
    return `${kilograms.toFixed(1)} kg`;
  }
};

export const formatTemperature = (kelvin) => {
  const celsius = kelvin - 273.15;
  return `${celsius.toFixed(0)}°C`;
};

export const formatEnergy = (joules) => {
  if (joules >= 1e6) {
    return `${(joules / 1e6).toFixed(2)} MJ`;
  } else if (joules >= 1e3) {
    return `${(joules / 1e3).toFixed(2)} kJ`;
  } else {
    return `${joules.toFixed(1)} J`;
  }
};

export const downloadSampleImage = async (imageType) => {
  try {
    const response = await api.post('/download-sample-image', { image_type: imageType });
    return response.data;
  } catch (error) {
    console.error('Download sample image failed:', error);
    throw new Error(error.response?.data?.error || 'Download sample image failed');
  }
};

export const processDownloadedImage = async (imagePath) => {
  try {
    const response = await api.post('/process-downloaded-image', { image_path: imagePath });
    return response.data;
  } catch (error) {
    console.error('Process downloaded image failed:', error);
    throw new Error(error.response?.data?.error || 'Process downloaded image failed');
  }
};

export default api;
