import pandas as pd
from typing import Dict, Any, List, Union

class AnalysisEngine:
    """
    O cérebro da aplicação. Carrega o histórico de jogos e realiza
    todas as análises estatísticas necessárias.
    """
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.df = self._load_data()

    def _load_data(self) -> pd.DataFrame:
        """Carrega os dados do arquivo .xlsx e os prepara para análise."""
        try:
            df = pd.read_excel(self.data_path)
            df = df.sort_values(by=df.columns[0]).reset_index(drop=True)
            print("✅ Dados históricos carregados e ordenados com sucesso.")
            return df
        except FileNotFoundError:
            print(f"❌ ERRO: O arquivo de dados '{self.data_path}' não foi encontrado.")
            return pd.DataFrame()
        except Exception as e:
            print(f"❌ ERRO: Falha ao carregar ou processar o arquivo de dados: {e}")
            return pd.DataFrame()

    def _filter_by_range(self, analysis_range: Union[int, str]) -> pd.DataFrame:
        """Filtra o DataFrame com base no período de análise selecionado."""
        if self.df.empty:
            return pd.DataFrame()
        if isinstance(analysis_range, str) and analysis_range.lower() == 'all':
            return self.df
        else:
            try:
                num_range = int(analysis_range)
                return self.df.tail(num_range)
            except (ValueError, TypeError):
                return self.df

    def get_summary_data(self) -> Dict[str, Any]:
        """Retorna os dados para a página inicial (últimos 5 concursos)."""
        if self.df.empty or len(self.df) < 5:
            return {}
        summary_df = self.df.tail(5)
        last_contest_raw = summary_df.iloc[-1]
        previous_contests_raw = summary_df.iloc[:-1]
        last_contest = {
            "number": int(last_contest_raw.iloc[0]),
            "date": pd.to_datetime(last_contest_raw.iloc[1]).strftime('%d/%m/%Y'),
            "result": [int(d) for d in last_contest_raw.iloc[2:8]]
        }
        previous_contests = []
        for _, row in previous_contests_raw.iterrows():
            previous_contests.append({
                "number": int(row.iloc[0]),
                "result": [int(d) for d in row.iloc[2:8]]
            })
        return {
            "last_contest": last_contest,
            "previous_contests": list(reversed(previous_contests))
        }
        
    def get_statistics(self, analysis_range: Union[int, str]) -> Dict[str, Any]:
        """
        Calcula as estatísticas (frequência, etc.) com base no período de análise.
        """
        filtered_df = self._filter_by_range(analysis_range)
        if filtered_df.empty:
            return {"error": "Nenhum dado para analisar."}

        all_numbers = filtered_df.iloc[:, 2:8].values.flatten()
        
        freq = pd.Series(all_numbers).value_counts().sort_index()
        all_dezenas = pd.Series(index=range(1, 61), data=0)
        freq_full = (all_dezenas + freq).fillna(0).astype(int)
        
        hot_numbers = freq_full.sort_values(ascending=False).head(15)
        cold_numbers = freq_full.sort_values(ascending=True).head(15)

        # --- CORREÇÃO DEFINITIVA ---
        # Iteramos sobre o 'index' da Series. Esta abordagem é 100% segura para tipos.
        freq_list = []
        for dezena in freq_full.index:
            freq_list.append({"dezena": int(dezena), "frequencia": int(freq_full[dezena])})

        hot_list = []
        for dezena in hot_numbers.index:
            hot_list.append({"dezena": int(dezena), "frequencia": int(hot_numbers[dezena])})

        cold_list = []
        for dezena in cold_numbers.index:
            cold_list.append({"dezena": int(dezena), "frequencia": int(cold_numbers[dezena])})

        return {
            "analysis_range": analysis_range,
            "contests_analyzed": len(filtered_df),
            "frequency": {
                "all": freq_list,
                "hot_15": hot_list,
                "cold_15": cold_list,
            }
        }

