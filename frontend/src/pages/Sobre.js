import React from 'react';
import {
  Container, Typography, Paper, Box, Divider, List, ListItem, 
  ListItemIcon, ListItemText, Chip, Link
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CodeIcon from '@mui/icons-material/Code';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';

function Sobre() {
  const features = [
    'Gerador de jogos inteligente com múltiplas estratégias',
    'Estatísticas detalhadas (números, duplas e trios mais frequentes)',
    'Visualização dos últimos resultados',
    'Análise de períodos personalizados (50, 100, 200, 500, 1000, 2000 sorteios)',
    'Interface responsiva para desktop e mobile'
  ];

  const technologies = [
    'React - Biblioteca JavaScript para interfaces',
    'Material-UI - Framework de componentes visuais',
    'FastAPI - Framework Python para backend',
    'Pandas - Análise e manipulação de dados'
  ];

  const avisos = [
    'Este aplicativo não garante ganhos',
    'Jogo responsável',
    'Apenas para maiores de 18 anos'
  ];

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mt: 4, mb: { xs: 12, md: 6 } }}>
        
        {/* CABEÇALHO */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="#1E8449">
            🍀 Sorte na Mão
          </Typography>
          <Chip 
            label="Versão 1.0" 
            sx={{ 
              backgroundColor: '#1E8449', 
              color: 'white',
              fontWeight: 'bold',
              mb: 2
            }} 
          />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Seu assistente inteligente para análise e geração de jogos da Mega-Sena
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* SOBRE O APLICATIVO */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon sx={{ color: '#1E8449' }} />
            Sobre o Aplicativo
          </Typography>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, mt: 2 }}>
            O <strong>Sorte na Mão</strong> é uma ferramenta completa para análise estatística e geração 
            inteligente de jogos da Mega-Sena. Desenvolvido com tecnologias modernas, o aplicativo oferece 
            recursos avançados de análise de dados históricos, permitindo que você tome decisões mais 
            informadas ao escolher seus números.
          </Typography>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8 }}>
            Com uma interface intuitiva e responsiva, você pode acessar estatísticas detalhadas, 
            visualizar padrões de sorteios anteriores e gerar combinações de números baseadas em 
            diferentes estratégias matemáticas.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* FUNCIONALIDADES */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon sx={{ color: '#1E8449' }} />
            Funcionalidades Principais
          </Typography>
          <List>
            {features.map((feature, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: '#1E8449' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={feature}
                  primaryTypographyProps={{
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* TECNOLOGIAS */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CodeIcon sx={{ color: '#1E8449' }} />
            Tecnologias Utilizadas
          </Typography>
          <List>
            {technologies.map((tech, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CodeIcon sx={{ color: '#1E8449' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={tech}
                  primaryTypographyProps={{
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* DESENVOLVEDOR */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ color: '#1E8449' }} />
            Desenvolvedor
          </Typography>
          <Box sx={{ mt: 2, pl: 2 }}>
            <Typography variant="h6" fontWeight="bold" color="#1E8449">
              Wesley
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* AVISO LEGAL - PADRÃO SIMPLES */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon sx={{ color: '#1E8449' }} />
            Aviso Legal
          </Typography>
          <List>
            {avisos.map((aviso, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <WarningIcon sx={{ color: '#1E8449' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={aviso}
                  primaryTypographyProps={{
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* CRÉDITOS E LINKS */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Dados dos sorteios obtidos de fontes públicas da Mega-Sena
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Site oficial: {' '}
            <Link 
              href="https://loterias.caixa.gov.br/Paginas/Mega-Sena.aspx" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ color: '#1E8449', fontWeight: 'bold' }}
            >
              Loterias Caixa
            </Link>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            © 2025 - Sorte na Mão - Desenvolvido por Wesley
          </Typography>
        </Box>

      </Paper>
    </Container>
  );
}

export default Sobre;
