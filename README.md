# 🍀 Sorte na Mão

**Aplicativo inteligente para análise estatística e geração de jogos da Mega-Sena**

Versão 1.0 | Desenvolvido por Wesley

______________________________________________________________________

## 📋 Sobre o Projeto

O **Sorte na Mão** é uma ferramenta completa para análise de dados históricos da Mega-Sena e geração inteligente de jogos. Com interface responsiva e recursos avançados de estatística, o aplicativo permite que você tome decisões mais informadas ao escolher seus números.

### ⚠️ Aviso Legal

- Este aplicativo não garante ganhos
- Jogo responsável
- Apenas para maiores de 18 anos

______________________________________________________________________

## ✨ Funcionalidades

### 🎲 Gerador de Jogos

- Múltiplas estratégias de geração:
  - Números mais frequentes
  - Números atrasados
  - Distribuição equilibrada
  - Aleatório puro
- Configuração por orçamento
- Números fixos (dezenas favoritas)
- Supressão de quadrantes
- Escolha de 6 a 20 dezenas por jogo

### 📊 Estatísticas Avançadas

- Análise de períodos personalizados (50, 100, 200, 500, 1000, 2000 sorteios ou todos)
- Top 10 números mais frequentes
- Top 10 duplas mais sorteadas
- Top 10 trios mais sorteados
- Porcentagens e frequências detalhadas

### 📈 Últimos Resultados

- Visualização dos últimos 6 sorteios
- Detalhes de cada concurso

### ⚙️ Configurações

- Upload de base de dados atualizada (arquivo Excel)
- Exclusão da base de dados
- Status do banco de dados

### 📄 Exportação

- Exportar jogos para Excel (XLSX)
- Exportar jogos para PDF com tema Mega-Sena

______________________________________________________________________

## 🛠️ Tecnologias Utilizadas

### Backend

- **Python 3.12**
- **FastAPI** - Framework web moderno e rápido
- **Pandas** - Análise e manipulação de dados
- **ReportLab** - Geração de PDFs
- **Uvicorn** - Servidor ASGI

### Frontend

- **React 18** - Biblioteca JavaScript para interfaces
- **Material-UI (MUI)** - Framework de componentes visuais
- **React Router** - Navegação entre páginas
- **Axios** - Requisições HTTP

______________________________________________________________________

## 📦 Estrutura do Projeto

```text
sorte_na_mao_app/
│
├── backend/
│   ├── main.py                 # Aplicação FastAPI
│   ├── game_generator.py       # Lógica de geração de jogos
│   ├── mega_statistics.py      # Análise estatística
│   ├── data/
│   │   └── Mega-Sena.xlsx      # Base de dados
│   └── venv/                   # Ambiente virtual Python
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PaginaInicial.js
│   │   │   ├── Gerador.js
│   │   │   ├── SeletorEstatisticas.js
│   │   │   ├── ResultadosEstatisticas.js
│   │   │   ├── Configuracoes.js
│   │   │   └── Sobre.js
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── node_modules/
│
└── README.md
```

---

## 🚀 Instalação e Execução

### Pré-requisitos

- Python 3.12+
- Node.js 18+
- npm ou yarn

### 1. Clone o repositório

```bash
git clone https://github.com/LelloTereciani/sorte-na-mao.git
cd sorte-na-mao
```

2.Configure o Backend
   bash

cd backend

# Crie o ambiente virtual

python3 -m venv venv

# Ative o ambiente virtual

source venv/bin/activate # Linux/Mac

# ou

venv\\Scripts\\activate # Windows

# Instale as dependências

pip install fastapi uvicorn pandas openpyxl reportlab python-multipart

# Execute o backend

uvicorn main:app --reload --host 127.0.0.1 --port 8000
O backend estará rodando em: <http://127.0.0.1:8000>

3. Configure o Frontend
   Abra um novo terminal:

bash

cd frontend

# Instale as dependências

npm install

# Execute o frontend

npm start
O frontend estará rodando em: <http://localhost:3000>

📖 Como Usar

1. Página Inicial
   Acesse a aplicação e veja o resumo dos últimos sorteios.

1. Gerar Jogos
   Escolha o período de análise
   Selecione a quantidade de dezenas (6 a 20)
   Escolha a estratégia de geração
   Defina orçamento OU quantidade de jogos
   (Opcional) Adicione números fixos
   (Opcional) Suprima quadrantes
   Clique em "Gerar Jogos"
   Exporte para Excel ou PDF

1. Estatísticas
   Escolha o período de análise
   Veja os números, duplas e trios mais frequentes
   Analise porcentagens e frequências

1. Configurações
   Faça upload de uma base de dados atualizada
   Veja o status da base de dados
   Exclua a base de dados se necessário
   📊 Formato da Base de Dados
   O arquivo Excel deve conter as seguintes colunas (nas 8 primeiras colunas):

Concurso Data Dezena1 Dezena2 Dezena3 Dezena4 Dezena5 Dezena6

1 11/03/1996 4 5 30 33 41 52

2 13/03/1996 10 34 46 47 49 52

Data no formato DD/MM/YYYY

Dezenas de 1 a 60

Fonte oficial: Loterias Caixa

🎨 Tema Visual

Cor principal: Verde Mega-Sena (#1E8449)

Layout responsivo: Desktop e Mobile

Design moderno: Material-UI components

🤝 Contribuição

Este é um projeto educacional. Sugestões e melhorias são bem-vindas!

📜 Licença
Este projeto é de código aberto para fins educacionais.

👨‍💻 Desenvolvedor

Wesley Rodrigues Tereciani - Desenvolvedor

Formado em Tecnologia em Sistemas de Informação.

Interesses: Web3, Python, Ciência de Dados, Machine Learning, IA.

📞 Suporte
Para questões sobre o projeto, abra uma issue no repositório.

🎯 Roadmap Futuro

Integração com API oficial da Caixa

Análise de quadrantes e padrões

Histórico de jogos salvos

Notificações de resultados

Modo escuro

Aplicativo mobile (React Native)

© 2025 Sorte na Mão - Desenvolvido por Wesley

🍀 Boa sorte!
