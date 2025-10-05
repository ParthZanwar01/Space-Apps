import React from 'react';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const DashboardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const DashboardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
`;

const StatusCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatusLabel = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 5px;
`;

const StatusValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.color || '#ffffff'};
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const MetricName = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
`;

const MetricValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.percentage}%;
  background: linear-gradient(90deg, #ff0000, #ffaa00, #00ff00);
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const MaterialBreakdown = styled.div`
  margin-top: 20px;
`;

const MaterialTitle = styled.h4`
  font-size: 14px;
  color: #ffffff;
  margin-bottom: 10px;
`;

const MaterialList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MaterialTag = styled.div`
  background: rgba(0, 255, 255, 0.2);
  border: 1px solid rgba(0, 255, 255, 0.3);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  color: #00ffff;
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 14px;
  margin-bottom: 10px;
`;

const EmptySubtext = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
`;

function Dashboard({ analysisResult, pathResult, serverStatus }) {
  const getServerStatusColor = () => {
    switch (serverStatus) {
      case 'connected': return '#00ff00';
      case 'disconnected': return '#ff0000';
      default: return '#ffaa00';
    }
  };

  const getServerStatusText = () => {
    switch (serverStatus) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      default: return 'Checking...';
    }
  };

  if (!analysisResult && !pathResult) {
    return (
      <DashboardContainer>
        <DashboardHeader>
          <DashboardTitle>📊 Mission Dashboard</DashboardTitle>
        </DashboardHeader>
        
        <EmptyState>
          <EmptyIcon>🚀</EmptyIcon>
          <EmptyText>No Analysis Data</EmptyText>
          <EmptySubtext>Upload an image to see mission metrics</EmptySubtext>
        </EmptyState>
      </DashboardContainer>
    );
  }

  const summary = analysisResult?.summary || {};
  const metrics = pathResult?.metrics || {};

  return (
    <DashboardContainer>
      <DashboardHeader>
        <DashboardTitle>📊 Mission Dashboard</DashboardTitle>
      </DashboardHeader>

      <StatusGrid>
        <StatusCard>
          <StatusLabel>Server Status</StatusLabel>
          <StatusValue color={getServerStatusColor()}>
            {getServerStatusText()}
          </StatusValue>
        </StatusCard>
        
        <StatusCard>
          <StatusLabel>Mission Status</StatusLabel>
          <StatusValue color={pathResult ? '#00ff00' : '#ffaa00'}>
            {pathResult ? 'Path Planned' : 'Analysis Complete'}
          </StatusValue>
        </StatusCard>
      </StatusGrid>

      <MetricsGrid>
        {analysisResult && (
          <>
            <MetricCard>
              <MetricHeader>
                <MetricName>Detection Rate</MetricName>
                <MetricValue>
                  {analysisResult.total_objects > 0 ? 
                    `${((analysisResult.feasible_objects / analysisResult.total_objects) * 100).toFixed(1)}%` : 
                    '0%'}
                </MetricValue>
              </MetricHeader>
              <ProgressBar>
                <ProgressFill 
                  percentage={analysisResult.total_objects > 0 ? 
                    (analysisResult.feasible_objects / analysisResult.total_objects) * 100 : 0} 
                />
              </ProgressBar>
            </MetricCard>

            <MetricCard>
              <MetricHeader>
                <MetricName>Average Priority</MetricName>
                <MetricValue>
                  {summary.avg_priority ? `${(summary.avg_priority * 100).toFixed(0)}` : '0'}
                </MetricValue>
              </MetricHeader>
              <ProgressBar>
                <ProgressFill percentage={summary.avg_priority ? summary.avg_priority * 100 : 0} />
              </ProgressBar>
            </MetricCard>

            {summary.size_stats && (
              <MetricCard>
                <MetricHeader>
                  <MetricName>Size Range</MetricName>
                  <MetricValue>
                    {summary.size_stats.min?.toFixed(2)}m - {summary.size_stats.max?.toFixed(2)}m
                  </MetricValue>
                </MetricHeader>
              </MetricCard>
            )}
          </>
        )}

        {pathResult && (
          <>
            <MetricCard>
              <MetricHeader>
                <MetricName>Total Distance</MetricName>
                <MetricValue>
                  {metrics.total_distance ? `${(metrics.total_distance / 1000).toFixed(1)} km` : '0 km'}
                </MetricValue>
              </MetricHeader>
            </MetricCard>

            <MetricCard>
              <MetricHeader>
                <MetricName>Mission Time</MetricName>
                <MetricValue>
                  {metrics.total_time ? `${(metrics.total_time / 3600).toFixed(1)} hours` : '0 hours'}
                </MetricValue>
              </MetricHeader>
            </MetricCard>

            <MetricCard>
              <MetricHeader>
                <MetricName>Fuel Required</MetricName>
                <MetricValue>
                  {metrics.total_fuel ? `${metrics.total_fuel.toFixed(1)} kg` : '0 kg'}
                </MetricValue>
              </MetricHeader>
            </MetricCard>

            <MetricCard>
              <MetricHeader>
                <MetricName>Path Efficiency</MetricName>
                <MetricValue>
                  {metrics.efficiency ? `${(metrics.efficiency * 100).toFixed(0)}%` : '0%'}
                </MetricValue>
              </MetricHeader>
              <ProgressBar>
                <ProgressFill percentage={metrics.efficiency ? metrics.efficiency * 100 : 0} />
              </ProgressBar>
            </MetricCard>

            <MetricCard>
              <MetricHeader>
                <MetricName>Safety Score</MetricName>
                <MetricValue>
                  {metrics.safety_score ? `${(metrics.safety_score * 100).toFixed(0)}%` : '0%'}
                </MetricValue>
              </MetricHeader>
              <ProgressBar>
                <ProgressFill percentage={metrics.safety_score ? metrics.safety_score * 100 : 0} />
              </ProgressBar>
            </MetricCard>
          </>
        )}
      </MetricsGrid>

      {summary.material_distribution && (
        <MaterialBreakdown>
          <MaterialTitle>Material Distribution</MaterialTitle>
          <MaterialList>
            {Object.entries(summary.material_distribution).map(([material, count]) => (
              <MaterialTag key={material}>
                {material}: {count}
              </MaterialTag>
            ))}
          </MaterialList>
        </MaterialBreakdown>
      )}
    </DashboardContainer>
  );
}

export default Dashboard;
