import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Grid, Card, CardContent,
  CardActionArea, Box, Divider
} from '@mui/material';

function SeletorEstatisticas() {
  const navigate = useNavigate();

  const periods = [
    { value: 'all', label: 'Todos os Concursos' },
    { value: '50', label: 'Últimos 50' },
    { value: '100', label: 'Últimos 100' },
    { value: '200', label: 'Últimos 200' },
    { value: '500', label: 'Últimos 500' },
    { value: '1000', label: 'Últimos 1000' },
    { value: '2000', label: 'Últimos 2000' }
  ];

  const handleSelectPeriod = (periodValue) => {
    navigate(`/estatisticas/resultados?periodo=${periodValue}`);
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: { xs: 12, md: 6 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            📊 Estatísticas da Mega-Sena
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Top 10 Números, Duplas e Trios
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body1" color="text.secondary">
            Selecione o período de análise:
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {periods.map((period) => (
            <Grid item xs={12} sm={6} md={4} key={period.value}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  transition: 'all 0.3s',
                  border: '2px solid #1E8449',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    borderColor: '#145a32'
                  }
                }}
              >
                <CardActionArea
                  onClick={() => handleSelectPeriod(period.value)}
                  sx={{ height: '100%' }}
                >
                  <CardContent
                    sx={{
                      minHeight: 80,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                      backgroundColor: '#1E8449',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#145a32'
                      }
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold" align="center">
                      {period.label}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Clique em qualquer opção para ver as estatísticas
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default SeletorEstatisticas;
