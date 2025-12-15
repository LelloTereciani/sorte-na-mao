import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Divider, TextField, Button,
  Box, Alert, CircularProgress, Stack, Chip, LinearProgress,
  Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DownloadIcon from '@mui/icons-material/Download';
import { useConfig } from '../contexts/ConfigContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { parseExcelFile } from '../utils/excelParser';
import { formatStorageSize, getStorageSize } from '../utils/localDatabase';

function Configuracoes() {
  const { ticketPrice, setTicketPrice, calculatePrice } = useConfig();
  const {
    isLoaded,
    metadata,
    updateDatabase,
    deleteDatabase
  } = useDatabase();

  const [localPrice, setLocalPrice] = useState(Math.floor(ticketPrice).toString());
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleSavePrice = () => {
    const price = parseInt(localPrice, 10);
    if (isNaN(price) || price <= 0) {
      setMessage({ type: 'error', text: 'Por favor, insira um valor válido maior que zero.' });
      return;
    }
    setTicketPrice(price);
    setMessage({ type: 'success', text: `Preço do bilhete atualizado para R$ ${price}` });
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setMessage({ type: 'error', text: 'Por favor, selecione um arquivo Excel (.xlsx ou .xls)' });
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });
    setLogs([]); // Clear previous logs
    addLog(`Iniciando processamento do arquivo: ${selectedFile.name}`);

    try {
      // Simulate progress for better UX
      setUploadProgress(20);

      // Parse Excel file with logging
      addLog('Enviando arquivo para o parser...');
      const parsedData = await parseExcelFile(selectedFile, addLog);

      addLog(`Parse concluído. Total sorteios: ${parsedData.draws.length}`);
      setUploadProgress(60);

      // Save to localStorage
      addLog('Salvando no banco de dados local...');
      updateDatabase(parsedData);

      addLog('Banco de dados atualizado com sucesso.');
      setUploadProgress(100);

      setMessage({
        type: 'success',
        text: `Base de dados carregada com sucesso! ${parsedData.metadata.totalDraws} sorteios processados.`
      });

      event.target.value = '';
    } catch (err) {
      addLog(`❌ ERRO: ${err.message}`);
      setMessage({
        type: 'error',
        text: `Falha ao carregar base: ${err.message}`
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDeleteDatabase = async () => {
    if (!window.confirm('Tem certeza que deseja deletar toda a base de dados local? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsDeleting(true);
    setMessage({ type: '', text: '' });

    try {
      deleteDatabase();
      setMessage({ type: 'success', text: 'Base de dados local deletada com sucesso!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `Falha ao deletar: ${err.message}`
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const storageSize = getStorageSize();
  const formattedSize = formatStorageSize(storageSize);

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Configurações do Sistema
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            💰 Valor do Bilhete Mínimo (6 números)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Este valor será usado como base para calcular o custo de apostas com mais números.
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Preço (R$)"
              type="number"
              value={localPrice}
              onChange={(e) => {
                const value = e.target.value;
                // Aceita apenas números inteiros
                if (value === '' || /^\d+$/.test(value)) {
                  setLocalPrice(value);
                }
              }}
              InputProps={{
                inputProps: { min: 0, step: 1 },
                placeholder: "6"
              }}
              helperText="Apenas valores inteiros"
              sx={{ width: '200px' }}
            />
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSavePrice}
            >
              Salvar Preço
            </Button>
          </Stack>

          <Box sx={{ mt: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Tabela de Preços (6 a 20 números):</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(num => (
                <Chip
                  key={num}
                  label={`${num}: R$ ${calculatePrice(num).toLocaleString('pt-BR')}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            📊 Base de Dados da Mega-Sena (Local)
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>💡 Armazenamento Local:</strong> Os dados ficam salvos no seu dispositivo (navegador).
              Você pode atualizar a base sempre que quiser baixando a planilha mais recente da Caixa.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
            {isLoaded ? (
              <>
                <CheckCircleIcon color="success" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    Base de dados carregada
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {metadata?.totalDraws || 0} sorteios disponíveis
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Concursos: {metadata?.firstDraw} a {metadata?.lastDraw}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Tamanho: {formattedSize}
                  </Typography>
                  {metadata?.lastUpdated && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Atualizado: {new Date(metadata.lastUpdated).toLocaleString('pt-BR')}
                    </Typography>
                  )}
                </Box>
              </>
            ) : (
              <>
                <ErrorIcon color="warning" />
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="warning.main">
                    Nenhuma base de dados encontrada
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Carregue uma planilha Excel para começar
                  </Typography>
                </Box>
              </>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Como atualizar:</strong>
          </Typography>
          <Box component="ol" sx={{ pl: 3, mb: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Baixe a planilha atualizada em:{' '}
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                href="https://www.loteriascaixa.gov.br/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textTransform: 'none' }}
              >
                Loterias Caixa
              </Button>
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Clique em "Carregar Base de Dados" abaixo
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Selecione o arquivo Excel baixado
            </Typography>
          </Box>

          <Stack spacing={2}>
            <Box>
              <Button
                variant="contained"
                component="label"
                startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                fullWidth
                disabled={isUploading}
              >
                {isUploading ? 'Processando...' : isLoaded ? 'Atualizar Base de Dados' : 'Carregar Base de Dados'}
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </Button>
              {uploadProgress > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{ mt: 1, borderRadius: 1 }}
                />
              )}
            </Box>

            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteDatabase}
              disabled={!isLoaded || isDeleting}
              startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
              fullWidth
            >
              {isDeleting ? 'Deletando...' : 'Deletar Base de Dados Local'}
            </Button>
          </Stack>
        </Box>

        {message.text && (
          <Alert severity={message.type} sx={{ mt: 3 }}>
            {message.text}
          </Alert>
        )}

        {/* Debug Logs Section - Visible if there are logs */}
        {logs.length > 0 && (
          <Accordion sx={{ mt: 3, bgcolor: 'background.default' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="caption" color="text.secondary">
                Logs de Processamento ({logs.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: '300px', overflow: 'auto', bgcolor: 'grey.100' }}>
                <List dense disablePadding>
                  {logs.map((log, index) => (
                    <ListItem key={index} disablePadding divider>
                      <ListItemText
                        primary={log}
                        primaryTypographyProps={{
                          variant: 'caption',
                          fontFamily: 'monospace',
                          color: log.includes('❌') ? 'error' : 'text.primary'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </AccordionDetails>
          </Accordion>
        )}
      </Paper>
    </Container>
  );
}

export default Configuracoes;
