import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #00ffff, #0080ff);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: #000;
`;

const LogoText = styled.div`
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
  }
  
  p {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }
`;

const NavItems = styled.nav`
  display: flex;
  align-items: center;
  gap: 30px;
`;

const NavItem = styled.a`
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  
  &:hover {
    color: #00ffff;
  }
`;

const StatusBadge = styled.div`
  padding: 8px 16px;
  background: rgba(0, 255, 0, 0.2);
  border: 1px solid #00ff00;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #00ff00;
`;

function Header({ currentView, onNavigate }) {
  const handleNavClick = (view) => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo>
          <LogoIcon>🚀</LogoIcon>
          <LogoText>
            <h1>Space Debris Analyzer</h1>
            <p>AI-Powered Capture & Melting Analysis</p>
          </LogoText>
        </Logo>
        
        <NavItems>
          <NavItem 
            onClick={() => handleNavClick('main')}
            style={{ 
              color: currentView === 'main' ? '#00ffff' : 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer'
            }}
          >
            Analysis
          </NavItem>
          <NavItem 
            onClick={() => handleNavClick('download')}
            style={{ 
              color: currentView === 'download' ? '#00ffff' : 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer'
            }}
          >
            Download
          </NavItem>
          <NavItem 
            onClick={() => handleNavClick('large-dataset')}
            style={{ 
              color: currentView === 'large-dataset' ? '#00ffff' : 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer'
            }}
          >
            Large Dataset
          </NavItem>
          <NavItem 
            onClick={() => handleNavClick('orca')}
            style={{ 
              color: currentView === 'orca' ? '#00ffff' : 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer'
            }}
          >
            ORCA Demo
          </NavItem>
          <NavItem 
            onClick={() => handleNavClick('processor')}
            style={{ 
              color: currentView === 'processor' ? '#00ffff' : 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer'
            }}
          >
            Process Images
          </NavItem>
          <NavItem 
            onClick={() => handleNavClick('nasa-data')}
            style={{ 
              color: currentView === 'nasa-data' ? '#00ffff' : 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer'
            }}
          >
            NASA Data
          </NavItem>
        </NavItems>
        
        <StatusBadge>LIVE</StatusBadge>
      </HeaderContent>
    </HeaderContainer>
  );
}

export default Header;
