import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemButton, ListItemText, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import { useThemeContext } from '../contexts/ThemeContext';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { toggleTheme } = useThemeContext();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { text: '🏠 Início', path: '/' },
    { text: '🎲 Gerador', path: '/gerador' },
    { text: '📊 Estatísticas', path: '/estatisticas' },
    { text: '⚙️ Configurações', path: '/configuracoes' }
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <AppBar position="fixed" sx={{ bgcolor: 'primary.main', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🍀 Sorte na Mão
          </Typography>

          <IconButton onClick={toggleTheme} color="inherit" title="Alternar tema" sx={{ fontSize: '1.5rem' }}>
            {theme.palette.mode === 'dark' ? '☀️' : '🌙'}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '70%', sm: '300px' },
            maxWidth: '300px',
            height: '50vh',
            top: 'auto',
            bottom: 0,
            borderTopRightRadius: 16,
            borderTopLeftRadius: 16
          }
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
            📋 Menu
          </Typography>
          
          <List sx={{ flexGrow: 1 }}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 1.5 }}>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    '&.Mui-selected': { 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    },
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '1.1rem',
                      fontWeight: 500
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          bgcolor: 'background.default',
          pt: { xs: 9, sm: 10 },
          pb: { xs: 10, sm: 4 },
          px: { xs: 1, sm: 2 },
          minHeight: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
