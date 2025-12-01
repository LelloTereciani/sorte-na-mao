import React, { useState } from 'react';
import {
  Container, Typography, Paper, Grid, Button, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Alert,
  Box, TextField, Divider, Chip, Card, CardContent,
  Checkbox, FormControlLabel, FormGroup
, Dialog, DialogTitle, DialogContent, DialogActions} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CasinoIcon from '@mui/icons-material/Casino';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import apiClient from '../api/apiClient';
import { useConfig } from '../contexts/ConfigContext';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
function Gerador() {


    // ═══════════════════════════════════════════════════════════
  // FUNÇÕES DE CONVERSÃO (TRABALHA COM INTEIROS - CENTAVOS)
  // ═══════════════════════════════════════════════════════════
  const toCents = (value) => {
    if (!value || value === '') return 0;
    // Remove TUDO exceto números (sem vírgula, sem ponto)
    const cleaned = String(value).replace(/[^0-9]/g, '');
    const num = parseInt(cleaned, 10);
    // Multiplica por 100: Reais → Centavos (500 → 50000)
    return isNaN(num) ? 0 : num * 100;
  };
  
  const toReais = (cents) => {
    return (cents / 100).toFixed(2).replace('.', ',');
  };

  const { calculatePrice } = useConfig();
  const theme = useTheme();
  
  // Estados principais
  const [budget, setBudget] = useState('');
  const [numbersPerGame, setNumbersPerGame] = useState(6);
  const [analysisRange, setAnalysisRange] = useState('all');
  const [strategy, setStrategy] = useState('random');
  const [suppressedQuadrants, setSuppressedQuadrants] = useState([]);
  
  // Estados de números atrasados
    const [delayedNumbers, setDelayedNumbers] = useState([]);
  const [renderKey, setRenderKey] = useState(0);
  const [selectedFixed, setSelectedFixed] = useState([]);
  const [isLoadingDelayed, setIsLoadingDelayed] = useState(false);
  
  // Estados de geração
  const [generatedGames, setGeneratedGames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [error, setError] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);

  // Configurações de estratégias
  const advancedStrategies = [
    { value: 'quadrant_suppression', label: '🎯 Supressão de Quadrantes', description: 'Escolha quais quadrantes suprimir (1-15, 16-30, 31-45, 46-60)' },
    { value: 'cycle_analysis', label: '🔄 Análise de Ciclos', description: 'Identifica números próximos ao ciclo natural de aparição' },
    { value: 'linear_regression', label: '📈 Regressão Linear', description: 'Prevê tendências baseado em histórico recente' },
    { value: 'clustering_kmeans', label: '🔬 Clustering K-means', description: 'Agrupa números por padrões de co-ocorrência' }
  ];

  const classicStrategies = [
    { value: 'random', label: 'Aleatória', description: 'Geração totalmente aleatória sem filtros' },
    { value: 'balanced', label: 'Números Balanceados', description: 'Equilíbrio entre pares/ímpares e faixas' },
    { value: 'avoid_patterns', label: 'Evitar Padrões', description: 'Evita sequências, mesma dezena e múltiplos' },
    { value: 'controlled_sum', label: 'Soma Controlada', description: 'Soma entre 120 e 210' },
    { value: 'neural_weighted', label: '🧠 Rede Neural Ponderada', description: 'Seleção baseada em frequência histórica' }
  ];

  const strategies = [...advancedStrategies, ...classicStrategies];

  const analysisRanges = [
    { value: 'last_50', label: 'Últimos 50 sorteios' },
    { value: 'last_100', label: 'Últimos 100 sorteios' },
    { value: 'last_200', label: 'Últimos 200 sorteios' },
    { value: 'last_500', label: 'Últimos 500 sorteios' },
    { value: 'last_1000', label: 'Últimos 1000 sorteios' },
    { value: 'last_2000', label: 'Últimos 2000 sorteios' },
    { value: 'all', label: 'Todos os sorteios' }
  ];

  const quadrants = [
    { id: 'Q1', label: 'Q1 (1-15)', range: '1-15' },
    { id: 'Q2', label: 'Q2 (16-30)', range: '16-30' },
    { id: 'Q3', label: 'Q3 (31-45)', range: '31-45' },
    { id: 'Q4', label: 'Q4 (46-60)', range: '46-60' }
  ];

  // Variáveis calculadas
  const maxFixed = Math.floor(numbersPerGame * 0.3);
  const selectedStrategy = strategies.find(s => s.value === strategy);
  const isAdvancedStrategy = advancedStrategies.some(s => s.value === strategy);
  const isClassicStrategy = classicStrategies.some(s => s.value === strategy);
  const isQuadrantSuppression = strategy === 'quadrant_suppression';

  // Formatação monetária
  

  // Cálculo de orçamento (usando centavos - inteiros)
  const costPerGameReais = calculatePrice(numbersPerGame);
  const costPerGameCents = toCents(costPerGameReais);
  const budgetCents = toCents(budget);
  
  let finalGameCount = 0;
  let infoMessage = '';
  let messageType = 'info';
  
  if (budget === '' || budgetCents === 0) {
    infoMessage = 'Digite um valor no campo "Orçamento Disponível".';
    messageType = 'info';
  } else if (budgetCents < costPerGameCents) {
    const faltaCents = costPerGameCents - budgetCents;
    infoMessage = `Orçamento insuficiente. Faltam R$ ${toReais(faltaCents)}.`;
    messageType = 'warning';
  } else {
    finalGameCount = Math.floor(budgetCents / costPerGameCents);
    const totalCostCents = finalGameCount * costPerGameCents;
    const sobraCents = budgetCents - totalCostCents;
    infoMessage = `${finalGameCount} jogo(s) - Total: R$ ${toReais(totalCostCents)} | Sobra: R$ ${toReais(sobraCents)}`;
    messageType = 'success';
  }

  // Handler: Carregar números atrasados
  const handleAnalysisRangeChange = (newRange) => {
    setAnalysisRange(newRange);
    
    // Só carrega se for técnica clássica
    if (!isClassicStrategy) return;
    
    console.log('📅 Período mudou para:', newRange);
    setDelayedNumbers([]);
    setIsLoadingDelayed(true);
    
    apiClient.get('/delayed-numbers', {
      params: { 
        count: numbersPerGame, 
        analysis_range: newRange 
      }
    })
    .then(response => {
      setDelayedNumbers(response.data.atrasados || []);
      setRenderKey(prev => prev + 1);
      console.log('✅ Carregados:', response.data.periodo_analisado, 'sorteios');
    })
    .catch(err => {
      console.error('❌ Erro ao carregar atrasados:', err);
      setDelayedNumbers([]);
    })
    .finally(() => {
      setIsLoadingDelayed(false);
    });
  };

  // Handler: Fixar/desfixar número
  const toggleFixed = (numero) => {
    if (selectedFixed.includes(numero)) {
      setSelectedFixed(selectedFixed.filter(n => n !== numero));
    } else {
      if (selectedFixed.length < maxFixed) {
        setSelectedFixed([...selectedFixed, numero]);
      } else {
        alert(`Máximo de ${maxFixed} números fixos permitidos (30%).`);
      }
    }
  };

  // Handler: Alternar quadrante suprimido
  const toggleQuadrant = (quadrantId) => {
    if (suppressedQuadrants.includes(quadrantId)) {
      setSuppressedQuadrants(suppressedQuadrants.filter(q => q !== quadrantId));
    } else {
      if (suppressedQuadrants.length < 2) {
        setSuppressedQuadrants([...suppressedQuadrants, quadrantId]);
      } else {
        alert('Máximo de 2 quadrantes podem ser suprimidos (deve manter pelo menos 2 ativos).');
      }
    }
  };

  // Handler: Gerar jogos
  const handleGenerateGames = async () => {
    setError('');
    setGeneratedGames([]);
    
    if (budget === '' || budgetCents === 0) {
      setError("Por favor, insira um valor de orçamento válido.");
      return;
    }
    
    if (budgetCents < costPerGameCents) {
      setError(`Orçamento insuficiente. Necessário: R$ ${toReais(costPerGameCents)}`);
      return;
    }
    
    if (finalGameCount === 0) {
      setError(`Não é possível gerar jogos. Orçamento insuficiente.`);
      return;
    }

    if (isQuadrantSuppression && suppressedQuadrants.length === 0) {
      setError("Selecione pelo menos 1 quadrante para suprimir.");
      return;
    }
    
    setIsLoading(true);
    try {
      const payload = {
        game_count: finalGameCount,
        numbers_per_game: parseInt(numbersPerGame, 10),
        strategy: strategy,
        analysis_range: analysisRange,
        fixed_numbers: selectedFixed,
        suppressed_quadrants: suppressedQuadrants
      };
      
      const response = await apiClient.post('/export-games', payload);
      setGeneratedGames(response.data.games || response.data);
      setShowActionModal(true); // Abre modal de próxima ação
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message;
      setError(`Falha ao gerar jogos: ${errorDetail}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Resetar tudo
  const handleReset = () => {
    setShowActionModal(false); // Fecha modal
    setBudget('');
    setNumbersPerGame(6);
    setAnalysisRange('all');
    setStrategy('random');
    setSuppressedQuadrants([]);
    setDelayedNumbers([]);
    setSelectedFixed([]);
    setGeneratedGames([]);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Fechar aplicativo
  const handleClose = () => {
    if (window.confirm('Deseja realmente fechar o aplicativo?')) {
      window.close();
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  // Handler: Exportar jogos
  const handleExport = async (format) => {
    const setExporting = format === 'xlsx' ? setIsExportingXlsx : setIsExportingPdf;
    
    setExporting(true);
    setError('');
    try {
      const response = await apiClient.post(
        '/export-games', 
        { games: generatedGames }, 
        { params: { format }, responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `jogos_gerados.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Falha ao exportar: ${err.response?.data?.detail || err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: { xs: 12, md: 6 } }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          🎲 Gerador de Jogos Estratégicos
        </Typography>
        <Divider sx={{ mb: 4 }} />
        
        {/* ORÇAMENTO E DEZENAS */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Orçamento Disponível (R$)" 
              type="text" 
              value={budget} 
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setBudget(value);
              }} 
              placeholder="Ex: 500 (apenas inteiros)" 
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Dezenas por Jogo</InputLabel>
              <Select 
                value={numbersPerGame} 
                label="Dezenas por Jogo" 
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      overflowY: 'auto'
                    }
                  }
                }}
                onChange={(e) => {
                  setNumbersPerGame(e.target.value);
                  setSelectedFixed([]);
                }}
              >
                {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(num => (
                  <MenuItem key={num} value={num}>
                    {num} dezenas - R$ {calculatePrice(num).toLocaleString('pt-BR')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Alert severity={messageType} icon={<InfoIcon />} sx={{ mt: 3 }}>
          {infoMessage}
        </Alert>

        {/* PERIODO */}
        <Paper elevation={0} variant="outlined" sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Período de Análise
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Define o período histórico para aplicar as técnicas de geração.
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Período</InputLabel>
            <Select 
              value={analysisRange} 
              label="Período" 
              MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      overflowY: 'auto'
                    }
                  }
                }}
                onChange={(e) => handleAnalysisRangeChange(e.target.value)}
            >
              {analysisRanges.map((range) => (
                <MenuItem key={range.value} value={range.value}>
                  {range.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {/* TECNICA */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Técnica de Geração
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Técnica</InputLabel>
            <Select 
              value={strategy} 
              label="Técnica" 
              MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      overflowY: 'auto'
                    }
                  }
                }}
                onChange={(e) => {
                setStrategy(e.target.value);
                const isAdv = advancedStrategies.some(s => s.value === e.target.value);
                if (isAdv) {
                  setSelectedFixed([]);
                }
                if (e.target.value !== 'quadrant_suppression') {
                  setSuppressedQuadrants([]);
                }
              }}
            >
              <MenuItem disabled>
                <Typography variant="overline" fontWeight="bold" color="primary">
                  🚀 TÉCNICAS AVANÇADAS (sem números fixados)
                </Typography>
              </MenuItem>
              {advancedStrategies.map((strat) => (
                <MenuItem key={strat.value} value={strat.value}>
                  <Box>
                    <Typography variant="body1">{strat.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {strat.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
              <MenuItem disabled sx={{ my: 1 }}>
                <Typography variant="overline" fontWeight="bold" color="secondary">
                  ⚙️ TÉCNICAS CLÁSSICAS (aceitam números fixados)
                </Typography>
              </MenuItem>
              {classicStrategies.map((strat) => (
                <MenuItem key={strat.value} value={strat.value}>
                  <Box>
                    <Typography variant="body1">{strat.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {strat.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {selectedStrategy && (
          <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>{selectedStrategy.label}:</strong> {selectedStrategy.description}
            </Typography>
          </Alert>
        )}

        {/* SELEÇÃO DE QUADRANTES */}
        {isQuadrantSuppression && (
          <Paper elevation={0} variant="outlined" sx={{ p: 3, mt: 3, bgcolor: theme.palette.warning.light }}>
            <Typography variant="h6" gutterBottom>
              🎯 Selecione Quadrantes para Suprimir
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Escolha até <strong>2 quadrantes</strong> para suprimir. Os números dos quadrantes suprimidos <strong>NÃO serão usados</strong> na geração.
            </Typography>
            <FormGroup row sx={{ mt: 2 }}>
              {quadrants.map((q) => (
                <FormControlLabel
                  key={q.id}
                  control={
                    <Checkbox 
                      checked={suppressedQuadrants.includes(q.id)}
                      onChange={() => toggleQuadrant(q.id)}
                      color="error"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="bold">{q.label}</Typography>
                      <Typography variant="caption" color="text.secondary">Números: {q.range}</Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
            {suppressedQuadrants.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Quadrantes suprimidos:</strong> {suppressedQuadrants.join(', ')}
                  <br />
                  <strong>Números excluídos da geração</strong>
                </Typography>
              </Alert>
            )}
          </Paper>
        )}

        {/* AVISO TÉCNICAS AVANÇADAS */}
        {isAdvancedStrategy && !isQuadrantSuppression && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>⚠️ TÉCNICA AVANÇADA:</strong> Esta técnica analisa padrões complexos do período selecionado e <strong>não aceita números fixados</strong>. A geração será 100% automática baseada nos algoritmos avançados.
            </Typography>
          </Alert>
        )}

        {/* NUMEROS ATRASADOS */}
        {isClassicStrategy && (
          <Paper elevation={0} variant="outlined" sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Números Mais Atrasados (Opcional)
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Mostrando os <strong>{numbersPerGame} números</strong> ordenados por <strong>PROPORÇÃO (atraso/ciclo natural)</strong>.
              Quanto maior a proporção, mais significativo é o atraso.
              <br />
              <strong>Formato:</strong> NÚMERO → ATRASO/CICLO (ex: 2 → 37/101 = 0.37x do ciclo)
              <br />
              Clique para fixar (máximo {maxFixed} - 30%).
            </Typography>
            
            {isLoadingDelayed ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>Carregando números atrasados...</Typography>
              </Box>
            ) : delayedNumbers.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                Selecione um período de análise acima para carregar os números atrasados.
              </Alert>
            ) : (
              <>
                <Grid container spacing={1.5} sx={{ mt: 2 }}>
                  {delayedNumbers.map((item) => {
                    const isFixed = selectedFixed.includes(item.numero);
                    return (
                      <Grid item xs={6} sm={4} md={2} key={item.numero}>
                        <Card variant="outlined" key={`card-${item.numero}-${renderKey}`} 
                          onClick={() => toggleFixed(item.numero)}
                          sx={{ 
                            backgroundColor: isFixed 
                              ? theme.palette.success.main 
                              : theme.palette.background.paper,
                            border: isFixed 
                              ? `2px solid ${theme.palette.success.dark}` 
                              : `1px solid ${theme.palette.divider}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'scale(1.03)',
                              boxShadow: theme.shadows[4],
                              borderColor: theme.palette.success.main
                            }
                          }}
                        >
                          <CardContent sx={{ textAlign: 'center', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography 
                              variant="h5" 
                              fontWeight="bold" 
                              color={isFixed ? 'success.contrastText' : 'text.primary'}
                            >
                              {item.numero}
                            </Typography>
                            <Divider sx={{ my: 0.5 }} />
                            <Typography 
                              variant="body2" 
                              color={isFixed ? 'success.contrastText' : 'text.secondary'}
                              fontWeight="bold"
                              sx={{ fontSize: '0.85rem' }}
                            >
                              {item.sorteios_atras}/{item.ciclo_natural}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color={isFixed ? 'success.contrastText' : 'primary.main'}
                              sx={{ fontSize: '0.7rem', mt: 0.3 }}
                            >
                              {item.proporcao_atraso}x
                            </Typography>
                            {isFixed && (
                              <Chip 
                                label="FIXADO" 
                                color="success" 
                                size="small" 
                                sx={{ 
                                  mt: 0.5, 
                                  height: 20, 
                                  fontSize: '0.65rem',
                                  backgroundColor: theme.palette.success.dark,
                                  color: theme.palette.success.contrastText
                                }}
                                icon={<CheckCircleIcon sx={{ fontSize: 12 }} />}
                              />
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
                
                {selectedFixed.length > 0 && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>{selectedFixed.length} número(s) fixado(s):</strong> {selectedFixed.sort((a,b) => a-b).join(', ')}
                      <br />
                      <strong>Restantes:</strong> {numbersPerGame - selectedFixed.length} número(s) completados pela técnica
                    </Typography>
                  </Alert>
                )}
              </>
            )}
          </Paper>
        )}

        {/* AVISOS DE APLICAÇÃO */}
        {selectedFixed.length > 0 && isClassicStrategy && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>⚠️ IMPORTANTE:</strong> A técnica selecionada será aplicada <strong>APENAS aos {numbersPerGame - selectedFixed.length} número(s) restante(s)</strong> que serão sorteados do período selecionado.
              <br />
              <strong>Números fixados ({selectedFixed.length}):</strong> {selectedFixed.sort((a,b) => a-b).join(', ')} - <em>não sofrem validação da técnica</em>
            </Typography>
          </Alert>
        )}
        
        {selectedFixed.length === 0 && isClassicStrategy && strategy !== 'random' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>ℹ️ Aplicação:</strong> A técnica será aplicada a <strong>todos os {numbersPerGame} números</strong> sorteados do período selecionado.
            </Typography>
          </Alert>
        )}
        
        <Box textAlign="center" sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <CasinoIcon />} 
            onClick={handleGenerateGames} 
            disabled={isLoading || finalGameCount === 0}
          >
            {isLoading ? 'Gerando...' : finalGameCount > 0 ? `Gerar ${finalGameCount} Jogo(s)` : 'Digite um Orçamento'}
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>}
      
      {generatedGames.length > 0 && (
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mt: 4 }}>
          <Typography variant="h5" gutterBottom align="center">
            {generatedGames.length} Jogo(s) Gerado(s)!
          </Typography>
          {selectedFixed.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Números fixos em todos os jogos:</strong> {selectedFixed.sort((a,b) => a-b).join(', ')}
              </Typography>
            </Alert>
          )}
          {suppressedQuadrants.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Quadrantes suprimidos:</strong> {suppressedQuadrants.join(', ')} - números excluídos da geração
              </Typography>
            </Alert>
          )}
          <Divider sx={{ my: 2 }} />                            
        </Paper>
      )}
          

      {/* ═══════════════════════════════════════════════════════════
          MODAL DE AÇÕES - Aparece após gerar jogos
          ═══════════════════════════════════════════════════════════ */}
      <Dialog 
        open={showActionModal} 
        onClose={() => {}}
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.shadows[24],
            p: 2,
            mt: 2 // Mais próximo ao topo
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)'
          }
        }}
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'flex-start', // Alinha ao topo
            paddingTop: '5vh' // Espaçamento do topo
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="h5" fontWeight="bold" color="primary">
            🎉 Jogos Gerados com Sucesso!
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, pb: 3 }}>
          <Typography variant="h6" align="center" gutterBottom>
            O que deseja fazer agora?
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ flexDirection: 'column', gap: 2, p: 3, pt: 0 }}>
          {/* BOTÃO 1: EXPORTAR PDF */}
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<PictureAsPdfIcon />} 
            onClick={() => {
              handleExport('pdf');
            }}
            fullWidth
            size="large"
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            📄 Exportar PDF
          </Button>
          
          {/* BOTÃO 2: EXPORTAR EXCEL */}
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<TableViewIcon />} 
            onClick={() => {
              handleExport('xlsx');
            }}
            fullWidth
            size="large"
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            📊 Exportar Excel
          </Button>
          
          {/* BOTÃO 3: VOLTAR PARA O JOGO */}
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => {
              setShowActionModal(false);
            }}
            fullWidth
            size="large"
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            ⬅️ Voltar para o Jogo
          </Button>
          
          {/* BOTÃO 4: RESETAR APLICAÇÃO */}
          <Button 
            variant="outlined" 
            color="warning" 
            startIcon={<RestartAltIcon />} 
            onClick={handleReset}
            fullWidth
            size="large"
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            🔄 Resetar Aplicação
          </Button>
          
          {/* BOTÃO 5: FECHAR APLICAÇÃO */}
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<CloseIcon />} 
            onClick={handleClose}
            fullWidth
            size="large"
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            ✖️ Fechar Aplicação
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Gerador;
