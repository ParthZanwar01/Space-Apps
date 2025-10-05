// Mock API for demo purposes when backend is not available
export const analyzeImage = async (imageFile) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    debris_objects: [
      {
        id: 1,
        position: [100, 150, 0],
        size: 2.5,
        material: 'aluminum',
        feasible: true,
        confidence: 0.85,
        priority: 0.9,
        estimated_mass: 15.2,
        melting_point: 660,
        estimated_value: 2500
      },
      {
        id: 2,
        position: [300, 200, 0],
        size: 1.8,
        material: 'steel',
        feasible: true,
        confidence: 0.78,
        priority: 0.7,
        estimated_mass: 22.1,
        melting_point: 1370,
        estimated_value: 1800
      },
      {
        id: 3,
        position: [450, 120, 0],
        size: 3.2,
        material: 'titanium',
        feasible: true,
        confidence: 0.92,
        priority: 0.95,
        estimated_mass: 28.5,
        melting_point: 1668,
        estimated_value: 8500
      }
    ],
    metadata: {
      total_objects: 3,
      feasible_objects: 3,
      analysis_time: 1.2,
      image_size: [800, 600]
    }
  };
};

export const planPath = async (debrisList, startPosition = [0, 0, 0]) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const path = [
    { position: startPosition, type: 'start' },
    ...debrisList.map(debris => ({
      position: debris.position,
      type: 'debris',
      debris_data: debris
    })),
    { position: startPosition, type: 'end' }
  ];
  
  return {
    path,
    total_distance: 450.5,
    estimated_time: 12.3,
    fuel_consumption: 85.2,
    visualization: {
      points: [startPosition, ...debrisList.map(d => d.position), startPosition],
      connections: Array.from({ length: debrisList.length + 1 }, (_, i) => [i, i + 1]),
      metadata: debrisList.map(debris => ({
        position: debris.position,
        size: debris.size,
        material: debris.material,
        priority: debris.priority,
        feasible: debris.feasible,
        debris_id: debris.id
      }))
    }
  };
};

export const getHealthStatus = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    status: 'healthy',
    message: 'Space Debris Analyzer API is running (Mock Mode)',
    version: '1.0.0',
    mode: 'demo'
  };
};

export const downloadImages = async (params) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    success: true,
    downloaded_count: 5,
    images: [
      { url: '/sample_images/nasa_1.jpg', filename: 'nasa_1.jpg' },
      { url: '/sample_images/nasa_2.jpg', filename: 'nasa_2.jpg' },
      { url: '/sample_images/nasa_3.jpg', filename: 'nasa_3.jpg' },
      { url: '/sample_images/nasa_4.jpg', filename: 'nasa_4.jpg' },
      { url: '/sample_images/nasa_5.jpg', filename: 'nasa_5.jpg' }
    ]
  };
};

export const downloadLargeDataset = async (params) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    success: true,
    dataset_size: '25.3 MB',
    images_downloaded: 50,
    estimated_time: '2m 15s'
  };
};

export const getDatasetInfo = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    total_images: 50,
    total_size: '25.3 MB',
    last_updated: new Date().toISOString(),
    datasets: [
      { name: 'NASA APOD', count: 20, size: '12.1 MB' },
      { name: 'NASA Images', count: 20, size: '10.8 MB' },
      { name: 'NASA Earth', count: 10, size: '2.4 MB' }
    ]
  };
};

export const getMissionHistory = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return {
    missions: [
      {
        id: 1,
        name: 'ORCA-001',
        date: '2024-10-01',
        debris_collected: 15,
        materials_recovered: 125.5,
        parts_manufactured: 8,
        cost_savings: 45000,
        status: 'completed'
      },
      {
        id: 2,
        name: 'ORCA-002',
        date: '2024-10-03',
        debris_collected: 12,
        materials_recovered: 98.2,
        parts_manufactured: 6,
        cost_savings: 32000,
        status: 'in_progress'
      }
    ]
  };
};

// Export all functions as default
export default {
  analyzeImage,
  planPath,
  getHealthStatus,
  downloadImages,
  downloadLargeDataset,
  getDatasetInfo,
  getMissionHistory
};
