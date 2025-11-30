import pandas as pd
from fastapi import FastAPI, HTTPException, Response, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import io
import os
import shutil

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from game_generator import GameGenerator
from mega_statistics import StatisticsAnalyzer

DATA_FILE_PATH = 'data/Mega-Sena.xlsx'

# Tabela de Preços Oficial
PRICE_TABLE = {
    6: 5.00, 7: 35.00, 8: 140.00, 9: 420.00,
    10: 1050.00, 11: 2310.00, 12: 4620.00, 13: 8580.00,
    14: 15015.00, 15: 25025.00, 16: 40040.00, 17: 61880.00,
    18: 92820.00, 19: 135660.00, 20: 193800.00,
}

def load_data():
    """Carrega e processa o arquivo Excel da Mega-Sena."""
    try:
        df = pd.read_excel(DATA_FILE_PATH)
        df = df.iloc[:, :8]
        df.columns = ['Concurso', 'Data', 'Dezena1', 'Dezena2', 'Dezena3', 'Dezena4', 'Dezena5', 'Dezena6']
        df['Data'] = pd.to_datetime(df['Data'], format='%d/%m/%Y', errors='coerce')
        df.dropna(subset=['Data'], inplace=True)
        df['Data'] = df['Data'].dt.strftime('%Y-%m-%d')
        all_numbers = pd.concat([df[f'Dezena{i}'] for i in range(1, 7)])
        
        print(f"✅ Base de dados carregada com sucesso!")
        print(f"   Total: {len(df)} sorteios")
        print(f"   Primeiro: Concurso {df.iloc[0]['Concurso']} ({df.iloc[0]['Data']})")
        print(f"   Último: Concurso {df.iloc[-1]['Concurso']} ({df.iloc[-1]['Data']})")
        
        return df, all_numbers
        
    except FileNotFoundError:
        print("⚠️ Arquivo não encontrado")
        return None, None
    except Exception as e:
        print(f"❌ Erro ao carregar: {e}")
        raise RuntimeError(f"Falha crítica ao carregar e processar o arquivo Excel: {e}")

# Carregamento inicial
df, all_numbers = load_data()
generator = None
if df is not None and all_numbers is not None:
    generator = GameGenerator(all_numbers, df)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GameGenerationRequest(BaseModel):
    analysis_range: str = 'all'
    numbers_per_game: int = 6
    strategy: str
    budget: Optional[float] = None
    game_count: Optional[int] = 10
    fixed_numbers: List[int] = []
    suppressed_quadrants: List[str] = []

class ExportRequest(BaseModel):
    games: List[List[int]]

@app.get("/api/summary")
def get_summary():
    if df is None:
        raise HTTPException(status_code=404, detail="Base de dados não encontrada. Faça upload de um arquivo Excel nas Configurações.")
    latest_draw = df.iloc[-1].to_dict()
    previous_draws = df.iloc[-6:-1].to_dict('records')
    return {"latest": latest_draw, "previous": previous_draws}

@app.get("/api/database-status")
def get_database_status():
    exists = os.path.exists(DATA_FILE_PATH)
    draw_count = len(df) if df is not None else 0
    return {
        "exists": exists,
        "total_draws": draw_count,
        "file_path": DATA_FILE_PATH if exists else None
    }

@app.post("/api/generate-games", response_model=List[List[int]])
def generate_games_endpoint(request: GameGenerationRequest):
    global generator
    if generator is None:
        raise HTTPException(status_code=404, detail="Base de dados não carregada. Faça upload de um arquivo Excel nas Configurações.")
    
    final_game_count = 0
    if request.budget is not None:
        if request.numbers_per_game not in PRICE_TABLE:
            raise HTTPException(status_code=400, detail=f"Não há preço definido para jogos de {request.numbers_per_game} dezenas.")
        cost_per_game = PRICE_TABLE[request.numbers_per_game]
        if request.budget < cost_per_game:
            raise HTTPException(status_code=400, detail=f"Orçamento de R$ {request.budget:.2f} é insuficiente. O custo mínimo para um jogo de {request.numbers_per_game} dezenas é R$ {cost_per_game:.2f}.")
        final_game_count = int(request.budget / cost_per_game)
    elif request.game_count is not None:
        final_game_count = request.game_count
    else:
        raise HTTPException(status_code=400, detail="Requisição inválida. Forneça um 'budget' ou 'game_count'.")
    
    if final_game_count == 0:
        return []
    
    try:
        games = generator.generate_games(
            strategy=request.strategy,
            num_games=final_game_count,
            numbers_per_game=request.numbers_per_game,
            analysis_range=request.analysis_range,
            fixed_numbers=request.fixed_numbers,
            suppressed_quadrants=request.suppressed_quadrants
        )
        return games
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/export-games")
def export_games_endpoint(request: ExportRequest, format: str):
    if format.lower() == 'xlsx':
        df_export = pd.DataFrame(request.games)
        stream = io.BytesIO()
        df_export.to_excel(stream, index=False, header=False)
        stream.seek(0)
        headers = {'Content-Disposition': 'attachment; filename=jogos_gerados.xlsx'}
        return StreamingResponse(stream, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    
    elif format.lower() == 'pdf':
        stream = io.BytesIO()
        doc = SimpleDocTemplate(
        stream, 
        pagesize=letter, 
        topMargin=40, 
        bottomMargin=40,
        title="🍀 Sorte na Mão 🍀",
        author="Wesley",
        subject="Jogos da Mega-Sena"
        )
        elements = []
        styles = getSampleStyleSheet()
        
        # CABEÇALHO ESTILIZADO
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1E8449'),
            spaceAfter=10,
            alignment=1,
            fontName='Helvetica-Bold'
        )
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.grey,
            spaceAfter=20,
            alignment=1,
            fontName='Helvetica'
        )
        
        elements.append(Paragraph("Jogos Gerados - Sorte na Mao", title_style))
        elements.append(Paragraph(f"Total de jogos: {len(request.games)}", subtitle_style))
        
        # PREPARA DADOS DA TABELA
        header = ['Jogo', 'Dezena 1', 'Dezena 2', 'Dezena 3', 'Dezena 4', 'Dezena 5', 'Dezena 6']
        data = [header]
        
        for i, game in enumerate(request.games):
            row = [f'#{i+1}'] + [str(num) for num in game]
            data.append(row)
        
        # CRIA TABELA COM LARGURAS PERSONALIZADAS
        col_widths = [60, 70, 70, 70, 70, 70, 70]
        table = Table(data, colWidths=col_widths, hAlign='CENTER')
        
        # ESTILO DA TABELA - TEMA MEGA-SENA
        table_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E8449')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#E8F5E9')),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 1), (0, -1), colors.HexColor('#1E8449')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#1E8449')),
            ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#1E8449')),
        ]
        
        # LINHAS ZEBRADAS
        for i in range(1, len(data)):
            if i % 2 == 0:
                table_style.append(('BACKGROUND', (1, i), (-1, i), colors.white))
            else:
                table_style.append(('BACKGROUND', (1, i), (-1, i), colors.HexColor('#F1F8F4')))
        
        table.setStyle(TableStyle(table_style))
        elements.append(table)
        
        # RODAPÉ
        from datetime import datetime
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.grey,
            spaceAfter=0,
            alignment=1,
            fontName='Helvetica-Oblique'
        )
        elements.append(Paragraph(f"<br/><br/>Gerado em: {datetime.now().strftime('%d/%m/%Y as %H:%M')}", footer_style))
        elements.append(Paragraph("(c) 2025 - Sorte na Mao - Desenvolvido por Wesley", footer_style))
        
        doc.build(elements)
        stream.seek(0)
        headers = {'Content-Disposition': 'attachment; filename=jogos_gerados.pdf'}
        return StreamingResponse(stream, headers=headers, media_type='application/pdf')
    
    else:
        raise HTTPException(status_code=400, detail="Formato de exportação inválido. Use 'xlsx' ou 'pdf'.")

@app.post("/api/upload-database")
async def upload_database(file: UploadFile = File(...)):
    global df, all_numbers, generator
    if not file.filename or not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Arquivo inválido. Envie apenas arquivos Excel (.xlsx ou .xls).")
    try:
        os.makedirs('data', exist_ok=True)
        with open(DATA_FILE_PATH, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        df, all_numbers = load_data()
        if df is None or all_numbers is None:
            raise HTTPException(status_code=400, detail="Arquivo enviado não possui o formato esperado.")
        generator = GameGenerator(all_numbers, df)
        return {
            "message": f"Base de dados atualizada com sucesso! {len(df)} sorteios carregados.",
            "total_draws": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar o arquivo: {str(e)}")

@app.delete("/api/delete-database")
def delete_database():
    global df, all_numbers, generator
    try:
        if not os.path.exists(DATA_FILE_PATH):
            raise HTTPException(status_code=404, detail="Nenhuma base de dados encontrada para deletar.")
        os.remove(DATA_FILE_PATH)
        df = None
        all_numbers = None
        generator = None
        return {"message": "Base de dados deletada com sucesso."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar base de dados: {str(e)}")

@app.get("/api/statistics")
def get_statistics(last_n: Optional[int] = None):
    if df is None:
        raise HTTPException(status_code=404, detail="Base de dados não encontrada. Faça upload de um arquivo Excel nas Configurações.")
    
    try:
        analyzer = StatisticsAnalyzer(df)
        stats = analyzer.get_complete_statistics(last_n)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular estatísticas: {str(e)}")

@app.get("/api/delayed-numbers")
def get_delayed_numbers(count: int = 20, analysis_range: str = 'all'):
    if df is None:
        raise HTTPException(status_code=404, detail="Base de dados não encontrada.")
    
    try:
        target_df = df
        if analysis_range != 'all':
            try:
                num_draws = int(analysis_range.split('_')[-1])
                if num_draws > 0:
                    target_df = df.tail(num_draws)
            except (ValueError, IndexError):
                target_df = df
        
        delayed_info = []
        ultimo_concurso_periodo = int(target_df.iloc[-1]['Concurso'])
        primeiro_concurso_periodo = int(target_df.iloc[0]['Concurso'])
        
        for num in range(1, 61):
            appearances = []
            for idx in range(len(target_df)):
                row = target_df.iloc[idx]
                if num in [row[f'Dezena{i}'] for i in range(1, 7)]:
                    appearances.append(idx)
            
            ciclo_natural = 0
            if len(appearances) > 1:
                intervalos = [appearances[i] - appearances[i-1] for i in range(1, len(appearances))]
                ciclo_natural = int(sum(intervalos) / len(intervalos))
            elif len(appearances) == 1:
                ciclo_natural = len(target_df)
            else:
                ciclo_natural = len(target_df) + 1
            
            last_draw = None
            draws_ago = 0
            
            if len(appearances) > 0:
                last_idx = appearances[-1]
                last_draw = int(target_df.iloc[last_idx]['Concurso'])
                draws_ago = ultimo_concurso_periodo - last_draw
            else:
                for idx in range(len(df)):
                    row = df.iloc[idx]
                    if num in [row[f'Dezena{i}'] for i in range(1, 7)]:
                        last_draw = int(df.iloc[idx]['Concurso'])
                
                if last_draw and last_draw < primeiro_concurso_periodo:
                    draws_ago = len(target_df)
                elif last_draw:
                    draws_ago = ultimo_concurso_periodo - last_draw
                else:
                    draws_ago = len(target_df)
            
            proporcao = draws_ago / ciclo_natural if ciclo_natural > 0 else draws_ago
            
            delayed_info.append({
                'numero': num,
                'ultimo_concurso': last_draw,
                'sorteios_atras': draws_ago,
                'ciclo_natural': ciclo_natural,
                'proporcao_atraso': round(proporcao, 2),
                'total_aparicoes': len(appearances),
                'formato_display': f"{num}  {draws_ago}/{ciclo_natural}"
            })
        
        delayed_info.sort(key=lambda x: x['proporcao_atraso'], reverse=True)
        
        return {
            'total': len(delayed_info),
            'ultimo_concurso': ultimo_concurso_periodo,
            'periodo_analisado': len(target_df),
            'criterio_ordenacao': 'proporcao_atraso',
            'descricao_ordenacao': 'Ordenado por ATRASO/CICLO NATURAL',
            'atrasados': delayed_info[:count]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular atrasados: {str(e)}")
