with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontra e substitui o bloco de cálculo (linhas 270-320 aproximadamente)
new_code = '''@app.get("/api/delayed-numbers")
def get_delayed_numbers(count: int = 20, analysis_range: str = 'all'):
    """
    Retorna os números mais atrasados com ciclo natural calculado DENTRO DA RANGE.
    Calcula atraso/ciclo_natural para ordenar por relevância dentro do período.
    """
    if df is None:
        raise HTTPException(status_code=404, detail="Base de dados não encontrada.")
    
    try:
        # Define o período de análise
        target_df = df
        if analysis_range != 'all':
            try:
                num_draws = int(analysis_range.split('_')[-1])
                if num_draws > 0:
                    target_df = df.tail(num_draws)
            except (ValueError, IndexError):
                target_df = df
        
        delayed_info = []
        
        # Último concurso DO PERÍODO (não global)
        ultimo_concurso_periodo = int(target_df.iloc[-1]['Concurso'])
        primeiro_concurso_periodo = int(target_df.iloc[0]['Concurso'])
        
        for num in range(1, 61):
            # Busca aparições DENTRO do período filtrado
            appearances = []
            for idx in range(len(target_df)):
                row = target_df.iloc[idx]
                if num in [row[f'Dezena{i}'] for i in range(1, 7)]:
                    appearances.append(idx)
            
            # Calcula ciclo natural DENTRO do período
            ciclo_natural = 0
            if len(appearances) > 1:
                intervalos = []
                for i in range(1, len(appearances)):
                    intervalos.append(appearances[i] - appearances[i-1])
                ciclo_natural = int(sum(intervalos) / len(intervalos))
            elif len(appearances) == 1:
                ciclo_natural = len(target_df)
            else:
                ciclo_natural = len(target_df) + 1
            
            # Calcula atraso DENTRO do período
            last_draw = None
            draws_ago = None
            
            if len(appearances) > 0:
                # Última aparição DENTRO do período
                last_idx = appearances[-1]
                last_draw = int(target_df.iloc[last_idx]['Concurso'])
                # Atraso = último concurso do período - última aparição
                draws_ago = ultimo_concurso_periodo - last_draw
            else:
                # Não apareceu no período - busca na base completa
                all_appearances = []
                for idx in range(len(df)):
                    row = df.iloc[idx]
                    if num in [row[f'Dezena{i}'] for i in range(1, 7)]:
                        all_appearances.append(idx)
                
                if len(all_appearances) > 0:
                    last_global_idx = all_appearances[-1]
                    last_draw = int(df.iloc[last_global_idx]['Concurso'])
                    # Se última aparição foi ANTES do período, atraso = tamanho do período
                    if last_draw < primeiro_concurso_periodo:
                        draws_ago = len(target_df)
                    else:
                        draws_ago = ultimo_concurso_periodo - last_draw
                else:
                    # Nunca apareceu
                    draws_ago = len(target_df)
                    last_draw = None
            
            # Calcula proporção atraso/ciclo_natural
            proporcao_atraso = draws_ago / ciclo_natural if ciclo_natural > 0 else draws_ago
            
            delayed_info.append({
                'numero': num,
                'ultimo_concurso': last_draw,
                'sorteios_atras': draws_ago,
                'ciclo_natural': ciclo_natural,
                'total_aparicoes': len(appearances),
                'proporcao_atraso': round(proporcao_atraso, 2)  # Novo campo!
            })
        
        # Ordena por PROPORÇÃO (atraso/ciclo_natural), não por atraso absoluto
        delayed_info.sort(key=lambda x: x['proporcao_atraso'], reverse=True)
        
        return {
            'total': len(delayed_info),
            'ultimo_concurso': ultimo_concurso_periodo,
            'periodo_analisado': len(target_df),
            'atrasados': delayed_info[:count]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular atrasados: {str(e)}")
'''

# Encontra a linha onde começa @app.get("/api/delayed-numbers")
start_idx = -1
for i, line in enumerate(lines):
    if '@app.get("/api/delayed-numbers")' in line:
        start_idx = i
        break

if start_idx == -1:
    print("❌ Endpoint não encontrado!")
    exit(1)

# Encontra onde termina (próximo @app ou fim do arquivo)
end_idx = len(lines)
for i in range(start_idx + 1, len(lines)):
    if lines[i].strip().startswith('@app.'):
        end_idx = i
        break

# Substitui o bloco
new_lines = lines[:start_idx] + [new_code + '\n\n'] + lines[end_idx:]

with open('main.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Código atualizado com cálculo correto de atraso/ciclo natural!")
print("✅ Novo campo 'proporcao_atraso' adicionado ao response!")
