import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container, Typography, Paper, Tabs, Tab, Box, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Chip, Grid, Card, CardContent, Button, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import apiClient from '../api/apiClient';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: '24px' }}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function ResultadosEstatisticas() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [tabValue, setTabValue] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const periodo = searchParams.get('periodo') || 'all';

  const getPeriodLabel = (value) => {
    const labels = {
      'all': 'Todos os Concursos',
      '50': 'Últimos 50',
      '100': 'Últimos 100',
      '200': 'Últimos 200',
      '500': 'Últimos 500',
      '1000': 'Últimos 1000',
      '2000': 'Últimos 2000'
    };
    return labels[value] || value;
  };

  useEffect(() => {
    loadStatistics();
  }, [periodo]);

  const loadStatistics = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = periodo === 'all' ? {} : { last_n: parseInt(periodo) };
      const response = await apiClient.get('/statistics', { params });
      console.log('📊 Dados recebidos:', response.data);
      setStatistics(response.data);
    } catch (err) {
      setError(`Falha ao carregar estatísticas: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}º`;
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#1E8449' }} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Analisando dados...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/estatisticas')}
          variant="contained"
          sx={{ mt: 2, backgroundColor: '#1E8449', '&:hover': { backgroundColor: '#145a32' } }}
        >
          Voltar
        </Button>
      </Container>
    );
  }

  if (!statistics || !statistics.numeros) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Nenhuma estatística disponível para este período</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/estatisticas')}
          variant="contained"
          sx={{ mt: 2, backgroundColor: '#1E8449', '&:hover': { backgroundColor: '#145a32' } }}
        >
          Voltar
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mt: 4, mb: { xs: 12, md: 6 } }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/estatisticas')}
            variant="outlined"
            sx={{
              mb: 2,
              borderColor: '#1E8449',
              color: '#1E8449',
              '&:hover': {
                borderColor: '#145a32',
                backgroundColor: 'rgba(30, 132, 73, 0.1)'
              }
            }}
          >
            Voltar
          </Button>

          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            📊 Estatísticas - {getPeriodLabel(periodo)}
          </Typography>

          <Chip
            label={`Analisados: ${statistics.total_sorteios} sorteio(s) | Concursos ${statistics.primeiro_concurso} a ${statistics.ultimo_concurso}`}
            sx={{
              mt: 1,
              backgroundColor: '#1E8449',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant={isMobile ? 'fullWidth' : 'standard'}
            centered={!isMobile}
            sx={{
              '& .MuiTab-root': {
                color: '#1E8449',
                '&.Mui-selected': {
                  color: '#145a32'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#1E8449'
              }
            }}
          >
            <Tab icon={<TrendingUpIcon />} label="Números" />
            <Tab icon={<PeopleIcon />} label="Duplas" />
            <Tab icon={<GroupWorkIcon />} label="Trios" />
          </Tabs>
        </Box>

        {/* TAB: NÚMEROS */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {(statistics.numeros || []).map((item, index) => (
              <Grid item xs={6} sm={4} md={2.4} key={item.numero}>
                <Card
                  elevation={3}
                  sx={{
                    border: '2px solid #1E8449',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h6" fontWeight="bold" color="#1E8449">
                      {getMedalEmoji(index)}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                      {item.numero}
                    </Typography>
                    <Chip
                      label={`${item.frequencia}x`}
                      size="small"
                      sx={{
                        backgroundColor: '#1E8449',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {item.porcentagem}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* TAB: DUPLAS */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#1E8449' }}>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Posição</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Dupla</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Frequência</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(statistics.duplas || []).map((item, index) => (
                  <TableRow key={`${item.numero1}-${item.numero2}`} hover>
                    <TableCell align="center">
                      <Typography fontWeight="bold" color="#1E8449">
                        {getMedalEmoji(index)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Chip label={item.numero1} sx={{ backgroundColor: '#1E8449', color: 'white', fontWeight: 'bold' }} />
                        <Chip label={item.numero2} sx={{ backgroundColor: '#1E8449', color: 'white', fontWeight: 'bold' }} />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight="bold">{item.frequencia}x</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{item.porcentagem}%</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* TAB: TRIOS */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#1E8449' }}>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Posição</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Trio</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Frequência</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(statistics.trios || []).map((item, index) => (
                  <TableRow key={`${item.numero1}-${item.numero2}-${item.numero3}`} hover>
                    <TableCell align="center">
                      <Typography fontWeight="bold" color="#1E8449">
                        {getMedalEmoji(index)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={item.numero1} sx={{ backgroundColor: '#1E8449', color: 'white', fontWeight: 'bold' }} />
                        <Chip label={item.numero2} sx={{ backgroundColor: '#1E8449', color: 'white', fontWeight: 'bold' }} />
                        <Chip label={item.numero3} sx={{ backgroundColor: '#1E8449', color: 'white', fontWeight: 'bold' }} />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight="bold">{item.frequencia}x</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{item.porcentagem}%</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default ResultadosEstatisticas;
