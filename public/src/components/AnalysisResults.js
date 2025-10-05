import React, { useState } from 'react';
import styled from 'styled-components';

const ResultsContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ResultsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const ResultsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusBadge = styled.div`
  padding: 6px 12px;
  background: ${props => props.status === 'success' ? 'rgba(0, 255, 0, 0.2)' : 
              props.status === 'warning' ? 'rgba(255, 170, 0, 0.2)' : 
              'rgba(255, 0, 0, 0.2)'};
  border: 1px solid ${props => props.status === 'success' ? '#00ff00' : 
              props.status === 'warning' ? '#ffaa00' : 
              '#ff0000'};
  border-radius: 15px;
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.status === 'success' ? '#00ff00' : 
              props.status === 'warning' ? '#ffaa00' : 
              '#ff0000'};
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
`;

const SummaryCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SummaryValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.color || '#00ffff'};
  margin-bottom: 5px;
`;

const SummaryLabel = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DebrisList = styled.div`
  margin-bottom: 20px;
`;

const DebrisItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 10px;
  border-left: 4px solid ${props => props.feasible ? '#00ff00' : '#ff0000'};
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
  }
`;

const DebrisHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const DebrisInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DebrisId = styled.div`
  background: rgba(0, 255, 255, 0.2);
  color: #00ffff;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
`;

const DebrisMaterial = styled.div`
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 500;
`;

const DebrisSize = styled.div`
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
`;

const DebrisMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 10px;
  margin-top: 10px;
`;

const MetricItem = styled.div`
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
`;

const MetricLabel = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
`;

const PriorityBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
`;

const PriorityFill = styled.div`
  height: 100%;
  width: ${props => props.priority * 100}%;
  background: linear-gradient(90deg, #ff0000, #ffaa00, #00ff00);
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const ActionButton = styled.button`
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

function AnalysisResults({ result, selectedImage, onPlanPath, isPlanningPath }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!result) return null;

  const getStatusBadge = () => {
    if (result.feasible_objects === 0) return { status: 'error', text: 'No Feasible Debris' };
    if (result.feasible_objects < result.total_objects / 2) return { status: 'warning', text: 'Limited Options' };
    return { status: 'success', text: 'Good Targets Found' };
  };

  const status = getStatusBadge();

  return (
    <ResultsContainer className="fade-in">
      <ResultsHeader>
        <ResultsTitle>
          🔍 Analysis Results
        </ResultsTitle>
        <StatusBadge status={status.status}>
          {status.text}
        </StatusBadge>
      </ResultsHeader>

      <SummaryGrid>
        <SummaryCard>
          <SummaryValue color="#00ffff">{result.total_objects}</SummaryValue>
          <SummaryLabel>Total Objects</SummaryLabel>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryValue color="#00ff00">{result.feasible_objects}</SummaryValue>
          <SummaryLabel>Feasible</SummaryLabel>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryValue color="#ffaa00">
            {result.summary?.feasibility_rate ? 
              `${(result.summary.feasibility_rate * 100).toFixed(1)}%` : '0%'}
          </SummaryValue>
          <SummaryLabel>Success Rate</SummaryLabel>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryValue color="#ffffff">
            {result.summary?.avg_priority ? 
              `${(result.summary.avg_priority * 100).toFixed(0)}` : '0'}
          </SummaryValue>
          <SummaryLabel>Avg Priority</SummaryLabel>
        </SummaryCard>
      </SummaryGrid>

      {result.feasible_debris && result.feasible_debris.length > 0 && (
        <DebrisList>
          <h4 style={{ color: '#ffffff', marginBottom: '15px', fontSize: '14px' }}>
            Feasible Debris Objects:
          </h4>
          
          {result.feasible_debris.map((debris, index) => (
            <DebrisItem key={debris.id || index} feasible={debris.feasible}>
              <DebrisHeader>
                <DebrisInfo>
                  <DebrisId>ID: {debris.id}</DebrisId>
                  <DebrisMaterial>{debris.material}</DebrisMaterial>
                  <DebrisSize>{debris.estimated_size?.toFixed(2)}m</DebrisSize>
                </DebrisInfo>
              </DebrisHeader>
              
              <DebrisMetrics>
                <MetricItem>
                  <MetricValue>{debris.priority?.toFixed(2)}</MetricValue>
                  <MetricLabel>Priority</MetricLabel>
                </MetricItem>
                
                <MetricItem>
                  <MetricValue>
                    {debris.melting_feasibility?.feasibility_score?.toFixed(2)}
                  </MetricValue>
                  <MetricLabel>Melt Score</MetricLabel>
                </MetricItem>
                
                <MetricItem>
                  <MetricValue>
                    {debris.melting_feasibility?.estimated_mass?.toFixed(1)}kg
                  </MetricValue>
                  <MetricLabel>Mass</MetricLabel>
                </MetricItem>
                
                <MetricItem>
                  <MetricValue>
                    {debris.circularity?.toFixed(2)}
                  </MetricValue>
                  <MetricLabel>Shape</MetricLabel>
                </MetricItem>
              </DebrisMetrics>
              
              <PriorityBar>
                <PriorityFill priority={debris.priority || 0} />
              </PriorityBar>
            </DebrisItem>
          ))}
        </DebrisList>
      )}

      <ActionButtons>
        {result.feasible_objects > 0 && (
          <ActionButton 
            primary 
            onClick={onPlanPath}
            disabled={isPlanningPath}
          >
            {isPlanningPath ? 'Planning...' : 'Plan Capture Path'}
          </ActionButton>
        )}
        
        <ActionButton onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </ActionButton>
      </ActionButtons>

      {showDetails && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: 'rgba(0, 0, 0, 0.3)', 
          borderRadius: '10px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.8)'
        }}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </ResultsContainer>
  );
}

export default AnalysisResults;
