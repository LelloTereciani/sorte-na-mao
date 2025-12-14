import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Divider, TextField, Button,
  Box, Alert, CircularProgress, Stack, Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import apiClient from '../api/apiClient';
import { useConfig } from '../contexts/ConfigContext';

function Configuracoes() {
  const { ticketPrice, setTicketPrice, calculatePrice } = useConfig();

  const [localPrice, setLocalPrice] = useState(Math.floor(ticketPrice).toString());
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [databaseExists, setDatabaseExists] = useState(false);
  const [totalDraws, setTotalDraws] = useState(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await apiClient.get('/database-status');
      setDatabaseExists(response.data.exists);
      setTotalDraws(response.data.total_draws);
    } catch (err) {
      console.error('Erro ao verificar status da base de dados:', err);
      setDatabaseExists(false);
      setTotalDraws(0);
    } finally {
      setIsCheckingStatus(false);
    }
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

    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await apiClient.post('/upload-database', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: response.data.message || 'Base de dados carregada com sucesso!' });
      event.target.value = '';
      await checkDatabaseStatus();
    } catch (err) {
      setMessage({
        type: 'error',
        text: `Falha ao carregar base: ${err.response?.data?.detail || err.message}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDatabase = async () => {
    if (!window.confirm('Tem certeza que deseja deletar toda a base de dados? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsDeleting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await apiClient.delete('/delete-database');
      setMessage({ type: 'success', text: response.data.message || 'Base de dados deletada com sucesso!' });
      await checkDatabaseStatus();
    } catch (err) {
      setMessage({
        type: 'error',
        text: `Falha ao deletar: ${err.response?.data?.detail || err.message}`
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
            📊 Base de Dados da Mega-Sena
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Baixe a planilha atualizada do site da Caixa e carregue aqui.
          </Typography>

          {isCheckingStatus ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Verificando status...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
              {databaseExists ? (
                <>
                  <CheckCircleIcon color="success" />
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      Base de dados carregada
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {totalDraws} sorteios disponíveis
                    </Typography>
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
                      Baixe a planilha do site da Caixa e carregue aqui
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}

          <Stack spacing={2}>
            <Button
              variant="contained"
              component="label"
              startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              fullWidth
              disabled={databaseExists || isUploading}
            >
              {isUploading ? 'Carregando...' : 'Carregar Base de Dados'}
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={databaseExists || isUploading}
              />
            </Button>

            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteDatabase}
              disabled={!databaseExists || isDeleting}
              startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
              fullWidth
            >
              {isDeleting ? 'Deletando...' : 'Deletar Base de Dados'}
            </Button>
          </Stack>
        </Box>

        {message.text && (
          <Alert severity={message.type} sx={{ mt: 3 }}>
            {message.text}
          </Alert>
        )}
      </Paper>
    </Container>
  );
}

export default Configuracoes;
