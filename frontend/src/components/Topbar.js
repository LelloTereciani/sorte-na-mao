import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemText, ListItemIcon, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import CasinoIcon from '@mui/icons-material/Casino';
import SettingsIcon from '@mui/icons-material/Settings';

const menuItems = [
  { text: 'Página Inicial', path: '/', icon: <HomeIcon /> },
  { text: 'Gerador', path: '/gerador', icon: <CasinoIcon /> },
  { text: 'Configurações', path: '/configuracoes', icon: <SettingsIcon /> },
];

function Topbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
         <ListItem>
          <ListItemText 
            primary="🍀 Sorte na Mão 🍀" 
            primaryTypographyProps={{ variant: 'h6', color: 'primary', fontWeight: 'bold' }} 
          />
        </ListItem>
        <Divider />
        {menuItems.map((item) => (
          <ListItem button component={RouterLink} to={item.path} key={item.text}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
          🍀 ::. Sorte na Mão .::  🍀
        </Typography>

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          {menuItems.map((item) => (
            <Button color="inherit" component={RouterLink} to={item.path} key={item.text}>
              {item.text}
            </Button>
          ))}
        </Box>

        <IconButton
          size="large"
          edge="end"
          color="inherit"
          aria-label="menu"
          sx={{ display: { xs: 'flex', md: 'none' } }}
          onClick={toggleDrawer(true)}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawerContent}
      </Drawer>
    </AppBar>
  );
}

export default Topbar;
