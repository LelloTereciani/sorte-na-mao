import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ConfigProvider } from './contexts/ConfigContext';
import {
  AppBar, Toolbar, Typography, Button, Container, Box,
  IconButton, Drawer, List, ListItem, ListItemText, ListItemIcon, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import CasinoIcon from '@mui/icons-material/Casino';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import PaginaInicial from './pages/PaginaInicial';
import Gerador from './pages/Gerador';
import SeletorEstatisticas from './pages/SeletorEstatisticas';
import ResultadosEstatisticas from './pages/ResultadosEstatisticas';
import Configuracoes from './pages/Configuracoes';
import Sobre from './pages/Sobre';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { text: 'Início', path: '/', icon: <HomeIcon /> },
    { text: 'Gerador', path: '/gerador', icon: <CasinoIcon /> },
    { text: 'Estatísticas', path: '/estatisticas', icon: <BarChartIcon /> },
    { text: 'Configurações', path: '/configuracoes', icon: <SettingsIcon /> },
    { text: 'Sobre', path: '/sobre', icon: <InfoIcon /> }
  ];

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <ConfigProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppBar 
          position="fixed" 
          sx={{ 
            backgroundColor: '#1E8449', 
            zIndex: (theme) => theme.zIndex.drawer + 1 
          }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              🍀 ::. Sorte na Mão .:: 🍀
            </Typography>
            
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    color="inherit"
                    component={Link}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    {item.text}
                  </Button>
                ))}
              </Box>
            )}

            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer(true)}
                edge="end"
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </AppBar>

        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          PaperProps={{
            sx: {
              width: '70%',
              maxWidth: '300px',
              height: '50vh',
              top: 0,
              bottom: 'auto',
              borderBottomRightRadius: 16,
              boxShadow: theme.shadows[24]
            }
          }}
        >
          <Box
            sx={{ 
              width: '100%',
              height: '100%',
              p: 3,
              display: 'flex',
              flexDirection: 'column'
            }}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center', color: '#1E8449' }}>
              📋 Menu
            </Typography>
            
            <List sx={{ flexGrow: 1 }}>
              {menuItems.map((item) => (
                <ListItem
                  button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  sx={{
                    borderRadius: 2,
                    mb: 1.5,
                    py: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(30, 132, 73, 0.1)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: '#1E8449' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '1.2rem',
                      fontWeight: 500
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        <Toolbar />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            pt: 2,
            pb: { xs: 25, md: 12 },
            px: { xs: 1, md: 2 }
          }}
        >
          <Routes>
            <Route path="/" element={<PaginaInicial />} />
            <Route path="/gerador" element={<Gerador />} />
            <Route path="/estatisticas" element={<SeletorEstatisticas />} />
            <Route path="/estatisticas/resultados" element={<ResultadosEstatisticas />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/sobre" element={<Sobre />} />
          </Routes>
        </Box>
      </Box>
    </ConfigProvider>
  );
}

export default App;
