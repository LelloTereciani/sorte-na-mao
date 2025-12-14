import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import apiClient from '../api/apiClient';
// Voltamos a usar o parseISO, que é o especialista para o formato AAAA-MM-DD
import { format, parseISO } from 'date-fns';

function PaginaInicial() {
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/summary');
        setSummaryData(response.data);
        setError('');
      } catch (err) {
        const errorMessage = err.response?.data?.detail || err.message || 'Não foi possível conectar ao servidor.';
        setError(`Falha ao carregar dados: ${errorMessage}`);
        setSummaryData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const getDrawNumbers = (draw) => {
    if (!draw) return [];
    return [draw.Dezena1, draw.Dezena2, draw.Dezena3, draw.Dezena4, draw.Dezena5, draw.Dezena6];
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  }
  if (error) {
    return (
      <Container
        maxWidth="md"
        sx={{
          mt: 4,
          pb: { xs: 4, md: 2 },
          overflowY: 'auto',
          minHeight: 'auto'
        }}
      >
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  if (!summaryData || !summaryData.latest) {
    return (
      <Container
        maxWidth="md"
        sx={{
          mt: 4,
          pb: { xs: 4, md: 2 },
          overflowY: 'auto',
          minHeight: 'auto'
        }}
      >
        <Alert severity="warning">Nenhum dado para exibir.</Alert>
      </Container>
    );
  }

  const latestDrawNumbers = getDrawNumbers(summaryData.latest);

  return (
    <Container
      maxWidth="lg"
      sx={{
        pb: { xs: 6, md: 4 },
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 'auto',
        width: '100%'
      }}
    >
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Último Resultado da Mega-Sena
        </Typography>
        <Typography variant="h6" align="center" color="textSecondary" gutterBottom>
          {/* Agora o parseISO funciona, pois o back-end envia 'AAAA-MM-DD' */}
          Concurso {summaryData.latest.Concurso} - {format(parseISO(summaryData.latest.Data), 'dd/MM/yyyy')}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, my: 4 }}>
          {latestDrawNumbers.map((number) => (
            <Chip key={number} label={number} color="primary" sx={{ fontSize: '1.5rem', padding: '20px', fontWeight: 'bold' }} />
          ))}
        </Box>

        <Divider sx={{ my: 4 }}><Chip label="Sorteios Anteriores" /></Divider>

        <List>
          {summaryData.previous.map((draw) => (
            <ListItem key={draw.Concurso} secondaryAction={
              <Typography variant="caption">{format(parseISO(draw.Data), 'dd/MM/yy')}</Typography>
            }>
              <ListItemIcon sx={{ minWidth: 'auto', mr: 2 }}><StarIcon fontSize="small" color="disabled" /></ListItemIcon>
              <ListItemText primary={`Concurso ${draw.Concurso}`} secondary={getDrawNumbers(draw).join(' - ')} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}

export default PaginaInicial;
