import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: #00d4ff;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button`
  background: ${props => props.active ? 'rgba(0, 212, 255, 0.2)' : 'transparent'};
  border: none;
  padding: 12px 20px;
  border-radius: 8px 8px 0 0;
  color: ${props => props.active ? '#00d4ff' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: ${props => props.active ? '2px solid #00d4ff' : '2px solid transparent'};
  
  &:hover {
    background: rgba(0, 212, 255, 0.1);
    color: #00d4ff;
  }
`;

const ContentArea = styled.div`
  min-height: 400px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const DataCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }
`;

const CardTitle = styled.h3`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
`;

const CardContent = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.5;
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const MetricCard = styled.div`
  background: rgba(0, 212, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid rgba(0, 212, 255, 0.2);
  text-align: center;
`;

const MetricValue = styled.div`
  color: #00d4ff;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 5px;
`;

const MetricLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Button = styled.button`
  background: rgba(0, 212, 255, 0.2);
  border: 1px solid #00d4ff;
  padding: 10px 20px;
  border-radius: 20px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 10px;
  margin-bottom: 10px;
  
  &:hover {
    background: rgba(0, 212, 255, 0.3);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #00d4ff;
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
  color: #ff6b6b;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
  color: #51cf66;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 10px 15px;
  color: #ffffff;
  font-size: 14px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #00d4ff;
    background: rgba(255, 255, 255, 0.15);
  }
`;

const NASADataExplorer = () => {
  const [activeTab, setActiveTab] = useState('odpo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'odpo', label: '🚀 NASA ODPO', description: 'Orbital Debris Program Office' },
    { id: 'open-data', label: '📊 NASA Open Data', description: 'Open Data Portal' },
    { id: 'worldview', label: '🌍 NASA Worldview', description: 'Satellite Imagery' },
    { id: 'usgs', label: '🛰️ USGS Landsat', description: 'EarthExplorer Data' },
    { id: 'commercial', label: '💼 Space Commercial', description: 'Commercialization Data' },
    { id: 'integrated', label: '🔗 Integrated Analysis', description: 'Multi-Source Analysis' }
  ];

  const fetchData = async (type, params = {}) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let url = `/api/nasa/${type}`;
      const queryParams = new URLSearchParams(params);
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setSuccess(`Successfully loaded ${type} data`);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setData(null);
    setError('');
    setSuccess('');
    
    // Auto-fetch data for certain tabs
    if (tabId === 'odpo') {
      fetchData('odpo-data', { type: 'current' });
    } else if (tabId === 'open-data') {
      fetchData('open-data', { search_term: 'orbital debris' });
    } else if (tabId === 'worldview') {
      fetchData('worldview');
    } else if (tabId === 'usgs') {
      fetchData('usgs-landsat');
    } else if (tabId === 'commercial') {
      fetchData('commercialization');
    } else if (tabId === 'integrated') {
      fetchData('integrated-analysis');
    }
  };

  const renderODPOData = () => {
    if (!data) return null;
    
    return (
      <div>
        <MetricGrid>
          <MetricCard>
            <MetricValue>{data.total_objects?.toLocaleString() || 0}</MetricValue>
            <MetricLabel>Total Objects</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{(data.total_mass_kg / 1000)?.toFixed(1) || 0}K</MetricValue>
            <MetricLabel>Total Mass (kg)</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.categories?.large_debris?.count?.toLocaleString() || 0}</MetricValue>
            <MetricLabel>Large Debris</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.categories?.medium_debris?.count?.toLocaleString() || 0}</MetricValue>
            <MetricLabel>Medium Debris</MetricLabel>
          </MetricCard>
        </MetricGrid>
        
        <DataGrid>
          {data.objects?.slice(0, 6).map((obj, index) => (
            <DataCard key={index}>
              <CardTitle>Object {obj.id}</CardTitle>
              <CardContent>
                <div><strong>Size:</strong> {obj.size_cm?.toFixed(2)} cm</div>
                <div><strong>Mass:</strong> {obj.mass_kg?.toFixed(2)} kg</div>
                <div><strong>Altitude:</strong> {obj.altitude_km?.toFixed(1)} km</div>
                <div><strong>Velocity:</strong> {obj.velocity_km_s?.toFixed(2)} km/s</div>
                <div><strong>Category:</strong> {obj.category}</div>
              </CardContent>
            </DataCard>
          ))}
        </DataGrid>
      </div>
    );
  };

  const renderOpenData = () => {
    if (!data) return null;
    
    return (
      <div>
        <SearchInput
          type="text"
          placeholder="Search NASA datasets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={() => fetchData('open-data', { search_term: searchTerm })}>
          Search Datasets
        </Button>
        
        <DataGrid>
          {data.datasets?.map((dataset, index) => (
            <DataCard key={index}>
              <CardTitle>{dataset.title}</CardTitle>
              <CardContent>
                <div>{dataset.description}</div>
                <div><strong>Format:</strong> {dataset.format}</div>
                <div><strong>Size:</strong> {dataset.size}</div>
                <div><strong>Updated:</strong> {dataset.updated}</div>
                <div><strong>Tags:</strong> {dataset.tags?.join(', ')}</div>
              </CardContent>
            </DataCard>
          ))}
        </DataGrid>
      </div>
    );
  };

  const renderWorldviewData = () => {
    if (!data) return null;
    
    return (
      <div>
        <MetricGrid>
          <MetricCard>
            <MetricValue>{data.imagery_info?.resolution || 'N/A'}</MetricValue>
            <MetricLabel>Resolution</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.imagery_info?.format || 'N/A'}</MetricValue>
            <MetricLabel>Format</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.metadata?.update_frequency || 'N/A'}</MetricValue>
            <MetricLabel>Update Frequency</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.metadata?.temporal_coverage || 'N/A'}</MetricValue>
            <MetricLabel>Temporal Coverage</MetricLabel>
          </MetricCard>
        </MetricGrid>
        
        <div>
          <CardTitle>Available Layers</CardTitle>
          <DataGrid>
            {data.available_layers?.map((layer, index) => (
              <DataCard key={index}>
                <CardTitle>{layer}</CardTitle>
                <CardContent>
                  <div>Layer ID: {layer}</div>
                  <Button onClick={() => fetchData('worldview', { layer })}>
                    Load Layer
                  </Button>
                </CardContent>
              </DataCard>
            ))}
          </DataGrid>
        </div>
      </div>
    );
  };

  const renderUSGSData = () => {
    if (!data) return null;
    
    return (
      <div>
        <MetricGrid>
          <MetricCard>
            <MetricValue>{data.landsat_info?.resolution || 'N/A'}</MetricValue>
            <MetricLabel>Resolution</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.landsat_info?.mission || 'N/A'}</MetricValue>
            <MetricLabel>Mission</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.landsat_info?.revisit_cycle || 'N/A'}</MetricValue>
            <MetricLabel>Revisit Cycle</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.metadata?.temporal_coverage || 'N/A'}</MetricValue>
            <MetricLabel>Temporal Coverage</MetricLabel>
          </MetricCard>
        </MetricGrid>
        
        <div>
          <CardTitle>Available Scenes</CardTitle>
          <DataGrid>
            {data.available_scenes?.map((scene, index) => (
              <DataCard key={index}>
                <CardTitle>{scene.scene_id}</CardTitle>
                <CardContent>
                  <div><strong>Date:</strong> {scene.acquisition_date}</div>
                  <div><strong>Cloud Cover:</strong> {scene.cloud_cover}%</div>
                  <div><strong>Sun Elevation:</strong> {scene.sun_elevation}°</div>
                  <div><strong>Sun Azimuth:</strong> {scene.sun_azimuth}°</div>
                </CardContent>
              </DataCard>
            ))}
          </DataGrid>
        </div>
      </div>
    );
  };

  const renderCommercialData = () => {
    if (!data) return null;
    
    return (
      <div>
        <MetricGrid>
          <MetricCard>
            <MetricValue>{data.market_analysis?.total_market_size || 'N/A'}</MetricValue>
            <MetricLabel>Total Market Size</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.market_analysis?.growth_rate || 'N/A'}</MetricValue>
            <MetricLabel>Growth Rate</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.commercialization_info?.policies?.length || 0}</MetricValue>
            <MetricLabel>Policies</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.commercialization_info?.partnerships?.length || 0}</MetricValue>
            <MetricLabel>Partnerships</MetricLabel>
          </MetricCard>
        </MetricGrid>
        
        <div>
          <CardTitle>Key Market Sectors</CardTitle>
          <DataGrid>
            {data.market_analysis?.key_sectors?.map((sector, index) => (
              <DataCard key={index}>
                <CardTitle>{sector.sector}</CardTitle>
                <CardContent>
                  <div><strong>Size:</strong> {sector.size}</div>
                  <div><strong>Growth:</strong> {sector.growth}</div>
                </CardContent>
              </DataCard>
            ))}
          </DataGrid>
        </div>
      </div>
    );
  };

  const renderIntegratedData = () => {
    if (!data) return null;
    
    return (
      <div>
        <MetricGrid>
          <MetricCard>
            <MetricValue>{data.analysis_summary?.total_debris_objects?.toLocaleString() || 0}</MetricValue>
            <MetricLabel>Total Debris Objects</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.analysis_summary?.total_mass_kg?.toLocaleString() || 0}</MetricValue>
            <MetricLabel>Total Mass (kg)</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.analysis_summary?.growth_trend || 'N/A'}</MetricValue>
            <MetricLabel>Growth Trend</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{data.analysis_summary?.risk_level || 'N/A'}</MetricValue>
            <MetricLabel>Risk Level</MetricLabel>
          </MetricCard>
        </MetricGrid>
        
        <div>
          <CardTitle>Recommendations</CardTitle>
          <DataGrid>
            {data.recommendations?.map((rec, index) => (
              <DataCard key={index}>
                <CardTitle>Recommendation {index + 1}</CardTitle>
                <CardContent>{rec}</CardContent>
              </DataCard>
            ))}
          </DataGrid>
        </div>
        
        <div>
          <CardTitle>Next Steps</CardTitle>
          <DataGrid>
            {data.next_steps?.map((step, index) => (
              <DataCard key={index}>
                <CardTitle>Step {index + 1}</CardTitle>
                <CardContent>{step}</CardContent>
              </DataCard>
            ))}
          </DataGrid>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner>Loading NASA data...</LoadingSpinner>;
    }
    
    switch (activeTab) {
      case 'odpo':
        return renderODPOData();
      case 'open-data':
        return renderOpenData();
      case 'worldview':
        return renderWorldviewData();
      case 'usgs':
        return renderUSGSData();
      case 'commercial':
        return renderCommercialData();
      case 'integrated':
        return renderIntegratedData();
      default:
        return <div>Select a data source to explore</div>;
    }
  };

  return (
    <Container>
      <Title>🚀 NASA Data Explorer</Title>
      
      <TabContainer>
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
            title={tab.description}
          >
            {tab.label}
          </Tab>
        ))}
      </TabContainer>
      
      {error && <ErrorMessage>Error: {error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <ContentArea>
        {renderContent()}
      </ContentArea>
    </Container>
  );
};

export default NASADataExplorer;
