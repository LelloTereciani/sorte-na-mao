import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Button,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { useDatabase } from '../contexts/DatabaseContext';
// Voltamos a usar o parseISO, que é o especialista para o formato AAAA-MM-DD
import { format, parseISO } from 'date-fns';

function PaginaInicial() {
  const { getLatestDraw, getPreviousDraws, isLoaded, error: dbError } = useDatabase();
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = () => {
      try {
        setIsLoading(true);

        if (!isLoaded) {
          setError('Nenhuma base de dados carregada. Vá em Configurações para carregar uma planilha Excel.');
          setSummaryData(null);
          return;
        }

        const latest = getLatestDraw();
        const previous = getPreviousDraws(5);

        if (!latest) {
          setError('Nenhum sorteio encontrado na base de dados.');
          setSummaryData(null);
          return;
        }

        // Convert to expected format
        const formattedLatest = {
          Concurso: latest.concurso,
          Data: latest.data,
          Dezena1: latest.dezenas[0],
          Dezena2: latest.dezenas[1],
          Dezena3: latest.dezenas[2],
          Dezena4: latest.dezenas[3],
          Dezena5: latest.dezenas[4],
          Dezena6: latest.dezenas[5]
        };

        const formattedPrevious = previous.map(draw => ({
          Concurso: draw.concurso,
          Data: draw.data,
          Dezena1: draw.dezenas[0],
          Dezena2: draw.dezenas[1],
          Dezena3: draw.dezenas[2],
          Dezena4: draw.dezenas[3],
          Dezena5: draw.dezenas[4],
          Dezena6: draw.dezenas[5]
        }));

        setSummaryData({ latest: formattedLatest, previous: formattedPrevious });
        setError('');
      } catch (err) {
        setError(`Falha ao carregar dados: ${err.message}`);
        setSummaryData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, [isLoaded, getLatestDraw, getPreviousDraws]);

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
        <Alert severity="warning">{error}</Alert>
        {!isLoaded && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              component={Link}
              to="/configuracoes"
              sx={{ backgroundColor: '#1E8449', '&:hover': { backgroundColor: '#145a32' } }}
            >
              Ir para Configurações
            </Button>
          </Box>
        )}
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
