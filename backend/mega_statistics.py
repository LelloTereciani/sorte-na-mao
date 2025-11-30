import pandas as pd
from itertools import combinations
from typing import Dict, List, Optional

class StatisticsAnalyzer:
    """Classe para análise estatística completa da Mega-Sena"""
    
    def __init__(self, dataframe: pd.DataFrame):
        self.df = dataframe
        self.all_numbers = list(range(1, 61))
    
    def _get_period_dataframe(self, last_n: Optional[int]) -> pd.DataFrame:
        """Retorna o dataframe do período solicitado"""
        if last_n is None or last_n <= 0:
            return self.df
        return self.df.tail(last_n)
    
    def analyze_individual_numbers(self, last_n: Optional[int] = None) -> List[Dict]:
        """Análise detalhada de cada número (1-60)"""
        period_df = self._get_period_dataframe(last_n)
        results = []
        
        # Concatena todas as dezenas em uma série
        all_draws = pd.concat([period_df[f'Dezena{i}'] for i in range(1, 7)])
        
        # Frequência de cada número
        frequency = all_draws.value_counts()
        
        # Total de sorteios no período
        total_draws = len(period_df)
        
        for num in self.all_numbers:
            freq = frequency.get(num, 0)
            percentage = (freq / total_draws * 100) if total_draws > 0 else 0
            
            # Encontra última aparição no período
            last_appearance = None
            draws_ago = None
            for idx in range(len(period_df) - 1, -1, -1):
                row = period_df.iloc[idx]
                if num in [row[f'Dezena{i}'] for i in range(1, 7)]:
                    last_appearance = row['Concurso']
                    draws_ago = len(period_df) - idx
                    break
            
            results.append({
                'numero': int(num),
                'frequencia': int(freq),
                'porcentagem': round(percentage, 2),
                'ultima_aparicao': int(last_appearance) if last_appearance else None,
                'sorteios_atras': int(draws_ago) if draws_ago else None,
            })
        
        # Ordena por frequência (decrescente)
        results.sort(key=lambda x: x['frequencia'], reverse=True)
        
        # Retorna apenas top 10
        return results[:10]
    
    def analyze_pairs(self, last_n: Optional[int] = None, top_n: int = 10) -> List[Dict]:
        """Análise das duplas mais frequentes"""
        period_df = self._get_period_dataframe(last_n)
        pair_counter = {}
        
        # Para cada sorteio, gera todas as combinações de 2 números
        for idx, row in period_df.iterrows():
            numbers = [row[f'Dezena{i}'] for i in range(1, 7)]
            
            for pair in combinations(sorted(numbers), 2):
                pair_counter[pair] = pair_counter.get(pair, 0) + 1
        
        # Converte para lista ordenada
        results = []
        for pair, count in pair_counter.items():
            percentage = (count / len(period_df) * 100) if len(period_df) > 0 else 0
            results.append({
                'numero1': int(pair[0]),
                'numero2': int(pair[1]),
                'frequencia': int(count),
                'porcentagem': round(percentage, 2)
            })
        
        # Ordena por frequência e retorna top N
        results.sort(key=lambda x: x['frequencia'], reverse=True)
        return results[:top_n]
    
    def analyze_trios(self, last_n: Optional[int] = None, top_n: int = 10) -> List[Dict]:
        """Análise dos trios mais frequentes"""
        period_df = self._get_period_dataframe(last_n)
        trio_counter = {}
        
        # Para cada sorteio, gera todas as combinações de 3 números
        for idx, row in period_df.iterrows():
            numbers = [row[f'Dezena{i}'] for i in range(1, 7)]
            
            for trio in combinations(sorted(numbers), 3):
                trio_counter[trio] = trio_counter.get(trio, 0) + 1
        
        # Converte para lista ordenada
        results = []
        for trio, count in trio_counter.items():
            percentage = (count / len(period_df) * 100) if len(period_df) > 0 else 0
            results.append({
                'numero1': int(trio[0]),
                'numero2': int(trio[1]),
                'numero3': int(trio[2]),
                'frequencia': int(count),
                'porcentagem': round(percentage, 2)
            })
        
        # Ordena por frequência e retorna top N
        results.sort(key=lambda x: x['frequencia'], reverse=True)
        return results[:top_n]
    
    def get_complete_statistics(self, last_n: Optional[int] = None) -> Dict:
        """Retorna todas as estatísticas de uma vez"""
        period_df = self._get_period_dataframe(last_n)
        
        return {
            'total_sorteios': len(period_df),
            'total_geral': len(self.df),
            'primeiro_concurso': int(period_df.iloc[0]['Concurso']),
            'ultimo_concurso': int(period_df.iloc[-1]['Concurso']),
            'numeros': self.analyze_individual_numbers(last_n),
            'duplas': self.analyze_pairs(last_n, 10),
            'trios': self.analyze_trios(last_n, 10)
        }

