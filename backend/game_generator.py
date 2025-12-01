import pandas as pd
import numpy as np
import random
import time
from math import comb
from typing import List, Optional, Dict, Tuple
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression

class GameGenerator:
    """Classe responsável por toda a lógica de geração de jogos da Mega-Sena."""
    
    def __init__(self, all_numbers_series: pd.Series, full_dataframe: pd.DataFrame):
        self.all_numbers_series = all_numbers_series
        self.full_dataframe = full_dataframe
        self.all_mega_sena_numbers = set(range(1, 61))

    def _get_pool_from_period(self, analysis_range: str, exclude_fixed: List[int]) -> List[int]:
        """
        Retorna pool de números baseado no período de análise,
        excluindo os números fixos.
        """
        target_df = self.full_dataframe
        
        if analysis_range != 'all':
            try:
                num_draws = int(analysis_range.split('_')[-1])
                if num_draws > 0:
                    target_df = self.full_dataframe.tail(num_draws)
            except (ValueError, IndexError):
                target_df = self.full_dataframe
        
        # Pega todos os números do período
        period_numbers = set()
        for i in range(1, 7):
            period_numbers.update(target_df[f'Dezena{i}'].unique())
        
        # Remove números fixos
        available = period_numbers - set(exclude_fixed)
        
        return list(available)

    def _get_target_dataframe(self, analysis_range: str) -> pd.DataFrame:
        """Retorna DataFrame filtrado pelo período."""
        if analysis_range == 'all':
            return self.full_dataframe
        
        try:
            num_draws = int(analysis_range.split('_')[-1])
            if num_draws > 0:
                return self.full_dataframe.tail(num_draws)
        except (ValueError, IndexError):
            pass
        
        return self.full_dataframe

    # ==================== TÉCNICAS AVANÇADAS ====================

    def _quadrant_suppression_strategy(
        self, 
        analysis_range: str, 
        numbers_per_game: int,
        suppressed_quadrants: Optional[List[str]] = None
    ) -> List[int]:
        """
        SUPRESSÃO DE QUADRANTES:
        Divide 60 números em 4 quadrantes e suprime os escolhidos pelo usuário.
        Se nenhum for escolhido, suprime automaticamente os menos frequentes.
        """
        # Define quadrantes
        quadrants = {
            'Q1': list(range(1, 16)),    # 1-15
            'Q2': list(range(16, 31)),   # 16-30
            'Q3': list(range(31, 46)),   # 31-45
            'Q4': list(range(46, 61))    # 46-60
        }
        
        suppressed_quadrants = suppressed_quadrants or []
        
        if len(suppressed_quadrants) == 0:
            # Modo automático: suprime o menos frequente
            target_df = self._get_target_dataframe(analysis_range)
            
            quadrant_freq = {}
            for q_name, q_numbers in quadrants.items():
                freq = 0
                for num in q_numbers:
                    for i in range(1, 7):
                        freq += (target_df[f'Dezena{i}'] == num).sum()
                quadrant_freq[q_name] = freq
            
            print(f"   📊 Frequências dos quadrantes: {quadrant_freq}")
            
            sorted_quadrants = sorted(quadrant_freq.items(), key=lambda x: x[1], reverse=True)
            suppressed_quadrants = [sorted_quadrants[3][0]]  # Suprime o menos frequente
            
            print(f"   🤖 MODO AUTOMÁTICO: Suprimindo quadrante menos frequente")
        
        # Valida quadrantes suprimidos
        valid_quadrants = ['Q1', 'Q2', 'Q3', 'Q4']
        suppressed_quadrants = [q for q in suppressed_quadrants if q in valid_quadrants]
        
        # Garante pelo menos 2 quadrantes ativos
        if len(suppressed_quadrants) >= 3:
            suppressed_quadrants = suppressed_quadrants[:2]
        
        active_quadrants = [q for q in valid_quadrants if q not in suppressed_quadrants]
        
        print(f"   ✅ Quadrantes ativos: {active_quadrants}")
        print(f"   ❌ Quadrantes suprimidos: {suppressed_quadrants}")
        
        # Pool disponível (números dos quadrantes ativos)
        available_pool = []
        for q in active_quadrants:
            available_pool.extend(quadrants[q])
        
        if len(available_pool) < numbers_per_game:
            raise ValueError(f"Pool insuficiente após supressão. Disponível: {len(available_pool)}, necessário: {numbers_per_game}")
        
        return random.sample(available_pool, numbers_per_game)

    def _cycle_analysis_strategy(self, analysis_range: str, numbers_per_game: int) -> List[int]:
        """
        ANÁLISE DE CICLOS:
        Identifica números próximos ao ciclo natural de aparição.
        """
        target_df = self._get_target_dataframe(analysis_range)
        
        cycle_scores = {}
        
        for num in range(1, 61):
            appearances = []
            for idx in range(len(target_df)):
                row = target_df.iloc[idx]
                if num in [row[f'Dezena{i}'] for i in range(1, 7)]:
                    appearances.append(idx)
            
            if len(appearances) < 2:
                cycle_scores[num] = 0
                continue
            
            # Calcula ciclo médio
            intervals = [appearances[i] - appearances[i-1] for i in range(1, len(appearances))]
            avg_cycle = np.mean(intervals) if intervals else len(target_df)
            
            # Atraso atual
            current_delay = len(target_df) - appearances[-1] - 1 if appearances else len(target_df)
            
            # Score: quanto mais próximo do ciclo, maior o score
            if avg_cycle > 0:
                proximity = 1 - abs(current_delay - avg_cycle) / avg_cycle
                cycle_scores[num] = max(0, proximity)
            else:
                cycle_scores[num] = 0
        
        # Seleciona números com melhor score
        sorted_numbers = sorted(cycle_scores.items(), key=lambda x: x[1], reverse=True)
        top_candidates = [n for n, s in sorted_numbers[:numbers_per_game * 2]]
        
        print(f"   🔄 Top 10 por ciclo: {sorted_numbers[:10]}")
        
        return random.sample(top_candidates, numbers_per_game)

    def _linear_regression_strategy(self, analysis_range: str, numbers_per_game: int) -> List[int]:
        """
        REGRESSÃO LINEAR:
        Prevê tendências de aparição baseado em histórico recente.
        """
        target_df = self._get_target_dataframe(analysis_range)
        
        if len(target_df) < 10:
            # Fallback para aleatório se dados insuficientes
            return random.sample(range(1, 61), numbers_per_game)
        
        trends = {}
        
        for num in range(1, 61):
            # Cria série temporal de aparições
            appearances_over_time = []
            for idx in range(len(target_df)):
                row = target_df.iloc[idx]
                appears = 1 if num in [row[f'Dezena{i}'] for i in range(1, 7)] else 0
                appearances_over_time.append(appears)
            
            # Calcula tendência usando regressão linear
            X = np.arange(len(appearances_over_time)).reshape(-1, 1)
            y = np.array(appearances_over_time)
            
            model = LinearRegression()
            model.fit(X, y)
            
            # Coeficiente angular (tendência)
            trend_coef = model.coef_[0]
            trends[num] = trend_coef
        
        # Seleciona números com tendência CRESCENTE
        sorted_trends = sorted(trends.items(), key=lambda x: x[1], reverse=True)
        top_candidates = [n for n, t in sorted_trends[:numbers_per_game * 2] if t >= 0]
        
        print(f"   📈 Top 10 tendências: {sorted_trends[:10]}")
        
        if len(top_candidates) < numbers_per_game:
            top_candidates = [n for n, t in sorted_trends[:numbers_per_game * 2]]
        
        return random.sample(top_candidates, min(numbers_per_game, len(top_candidates)))

    def _clustering_kmeans_strategy(self, analysis_range: str, numbers_per_game: int) -> List[int]:
        """
        CLUSTERING K-MEANS:
        Agrupa números que aparecem juntos e diversifica seleção.
        """
        target_df = self._get_target_dataframe(analysis_range)
        
        if len(target_df) < 20:
            # Fallback para aleatório se dados insuficientes
            return random.sample(range(1, 61), numbers_per_game)
        
        # Cria matriz de co-ocorrência
        cooccurrence = np.zeros((60, 60))
        
        for idx in range(len(target_df)):
            row = target_df.iloc[idx]
            numbers_in_draw = [row[f'Dezena{i}'] for i in range(1, 7)]
            
            for n1 in numbers_in_draw:
                for n2 in numbers_in_draw:
                    if n1 != n2:
                        cooccurrence[n1-1][n2-1] += 1
        
        # Aplica K-means para agrupar números similares
        n_clusters = min(8, numbers_per_game)
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(cooccurrence)
        
        # Agrupa números por cluster
        clustered_numbers = {}
        for num in range(1, 61):
            cluster_id = clusters[num-1]
            if cluster_id not in clustered_numbers:
                clustered_numbers[cluster_id] = []
            clustered_numbers[cluster_id].append(num)
        
        print(f"   🔬 {len(clustered_numbers)} clusters formados")
        
        # Seleciona números distribuídos pelos clusters
        selected = []
        numbers_per_cluster = numbers_per_game // len(clustered_numbers)
        
        for cluster_id, numbers in clustered_numbers.items():
            count = min(numbers_per_cluster + 1, len(numbers))
            selected.extend(random.sample(numbers, count))
        
        # Completa até numbers_per_game
        if len(selected) < numbers_per_game:
            remaining = list(set(range(1, 61)) - set(selected))
            selected.extend(random.sample(remaining, numbers_per_game - len(selected)))
        
        return random.sample(selected, numbers_per_game)

    # ==================== TÉCNICAS CLÁSSICAS ====================

    def _calculate_weights(self, numbers: List[int], analysis_range: str) -> Dict[int, float]:
        """
        Calcula pesos para cada número baseado na frequência histórica.
        """
        target_df = self._get_target_dataframe(analysis_range)
        
        frequencies = {}
        for num in numbers:
            count = 0
            for i in range(1, 7):
                count += (target_df[f'Dezena{i}'] == num).sum()
            frequencies[num] = count
        
        total_freq = sum(frequencies.values())
        if total_freq == 0:
            return {num: 1.0 / len(numbers) for num in numbers}
        
        weights = {num: freq / total_freq for num, freq in frequencies.items()}
        
        return weights

    def _weighted_selection(self, numbers: List[int], weights: Dict[int, float], count: int) -> List[int]:
        """Seleciona números usando pesos."""
        number_list = list(numbers)
        weight_list = [weights.get(num, 0) for num in number_list]
        
        total_weight = sum(weight_list)
        if total_weight == 0:
            return random.sample(number_list, count)
        
        normalized_weights = [w / total_weight for w in weight_list]
        
        selected_indices = np.random.choice(
            len(number_list), 
            size=count, 
            replace=False, 
            p=normalized_weights
        )
        
        return [number_list[i] for i in selected_indices]

    def _is_balanced(self, numbers: List[int]) -> bool:
        """Verifica se os números estão balanceados."""
        if len(numbers) < 6:
            return True
        
        evens = sum(1 for n in numbers if n % 2 == 0)
        odds = len(numbers) - evens
        
        if evens < 2 or odds < 2:
            return False
        
        faixas = [0, 0, 0, 0]
        for n in numbers:
            if n <= 15:
                faixas[0] += 1
            elif n <= 30:
                faixas[1] += 1
            elif n <= 45:
                faixas[2] += 1
            else:
                faixas[3] += 1
        
        if any(f == 0 for f in faixas):
            return False
        
        return True

    def _has_patterns(self, numbers: List[int]) -> bool:
        """Verifica se os números têm padrões indesejados."""
        if len(numbers) < 3:
            return False
        
        sorted_numbers = sorted(numbers)
        
        sequence_count = 1
        for i in range(1, len(sorted_numbers)):
            if sorted_numbers[i] == sorted_numbers[i-1] + 1:
                sequence_count += 1
                if sequence_count >= 3:
                    return True
            else:
                sequence_count = 1
        
        dezenas = {}
        for n in numbers:
            dezena = n // 10
            dezenas[dezena] = dezenas.get(dezena, 0) + 1
            if dezenas[dezena] >= 3:
                return True
        
        for mult in [5, 10]:
            if sum(1 for n in numbers if n % mult == 0) >= 3:
                return True
        
        return False

    def _sum_in_range(self, numbers: List[int], min_sum: int = 120, max_sum: int = 210) -> bool:
        """Verifica se a soma está no intervalo ideal."""
        if len(numbers) < 6:
            return True
        
        total = sum(numbers)
        return min_sum <= total <= max_sum

    def _validate_generated_numbers(self, generated_numbers: List[int], strategy: str) -> bool:
        """Valida números gerados de acordo com a estratégia."""
        if strategy == 'balanced':
            return self._is_balanced(generated_numbers)
        elif strategy == 'avoid_patterns':
            return not self._has_patterns(generated_numbers)
        elif strategy == 'controlled_sum':
            return self._sum_in_range(generated_numbers)
        elif strategy in ['random', 'neural_weighted', 'quadrant_suppression', 'cycle_analysis', 'linear_regression', 'clustering_kmeans']:
            return True
        else:
            raise ValueError(f"Estratégia '{strategy}' desconhecida.")

    def generate_games(
        self, 
        strategy: str, 
        num_games: int, 
        numbers_per_game: int, 
        analysis_range: str = 'all',
        fixed_numbers: Optional[List[int]] = None,
        suppressed_quadrants: Optional[List[str]] = None
    ) -> list:
        """
        Gera jogos com base na estratégia escolhida.
        
        TÉCNICAS AVANÇADAS (não aceitam números fixos):
        - quadrant_suppression
        - cycle_analysis
        - linear_regression
        - clustering_kmeans
        
        TÉCNICAS CLÁSSICAS (aceitam números fixos):
        - random, balanced, avoid_patterns, controlled_sum, neural_weighted
        """
        if numbers_per_game < 6 or numbers_per_game > 20:
            raise ValueError("Dezenas por jogo deve estar entre 6 e 20.")
        
        # Técnicas avançadas NÃO aceitam números fixos
        advanced_strategies = ['quadrant_suppression', 'cycle_analysis', 'linear_regression', 'clustering_kmeans']
        
        if strategy in advanced_strategies:
            if fixed_numbers and len(fixed_numbers) > 0:
                raise ValueError(f"A técnica '{strategy}' não aceita números fixados. Desmarque os números atrasados.")
            
            print(f"🚀 TÉCNICA AVANÇADA: {strategy}")
            print(f"   Período: {analysis_range}")
            print(f"   Números por jogo: {numbers_per_game}")
            print(f"   Jogos solicitados: {num_games}")
            
            generated_games = set()
            
            for _ in range(num_games):
                game = None  # ✅ Inicializa para evitar unbound error
                
                if strategy == 'quadrant_suppression':
                    game = self._quadrant_suppression_strategy(analysis_range, numbers_per_game, suppressed_quadrants)
                elif strategy == 'cycle_analysis':
                    game = self._cycle_analysis_strategy(analysis_range, numbers_per_game)
                elif strategy == 'linear_regression':
                    game = self._linear_regression_strategy(analysis_range, numbers_per_game)
                elif strategy == 'clustering_kmeans':
                    game = self._clustering_kmeans_strategy(analysis_range, numbers_per_game)
                else:
                    raise ValueError(f"Estratégia avançada desconhecida: {strategy}")
                
                if game is not None:  # ✅ Valida antes de usar
                    generated_games.add(tuple(sorted(game)))
                else:
                    raise RuntimeError(f"Falha ao gerar jogo com estratégia {strategy}")
            
            print(f"✅ {len(generated_games)} jogos gerados com técnica avançada!")
            
            for i, game in enumerate(list(generated_games)[:3]):
                print(f"   Jogo exemplo {i+1}: {list(game)}")
            
            return [list(game) for game in generated_games]
        
        # TÉCNICAS CLÁSSICAS (com suporte a números fixos)
        fixed_numbers = fixed_numbers or []
        fixed_numbers = sorted(list(set(fixed_numbers)))
        
        print(f"🔧 DEBUG: Números fixos recebidos: {fixed_numbers}")
        
        if len(fixed_numbers) > numbers_per_game:
            raise ValueError("Números fixos excedem total de dezenas por jogo.")
        
        max_fixed = int(numbers_per_game * 0.3)
        if len(fixed_numbers) > max_fixed:
            raise ValueError(f"Máximo de {max_fixed} números fixos permitidos (30%).")
        
        if any(n < 1 or n > 60 for n in fixed_numbers):
            raise ValueError("Números fixos devem estar entre 1 e 60.")
        
        remaining_slots = numbers_per_game - len(fixed_numbers)
        number_pool = self._get_pool_from_period(analysis_range, fixed_numbers)
        
        if len(number_pool) < remaining_slots:
            raise ValueError(f"Pool insuficiente. Precisa de {remaining_slots}, disponível: {len(number_pool)}.")
        
        random.seed(int(time.time() * 1000))
        np.random.seed(int(time.time() * 1000) % (2**32 - 1))
        
        generated_games = set()
        attempts = 0
        max_attempts = num_games * 3000
        
        weights = None
        if strategy == 'neural_weighted':
            weights = self._calculate_weights(number_pool, analysis_range)
            print(f"   🧠 Pesos neurais calculados: Top 5 = {sorted(weights.items(), key=lambda x: x[1], reverse=True)[:5]}")
        
        print(f"🎲 Gerando {num_games} jogos de {numbers_per_game} dezenas...")
        print(f"   Estratégia: {strategy}")
        print(f"   Período: {analysis_range}")
        print(f"   Números FIXOS: {fixed_numbers} ({len(fixed_numbers)} números)")
        print(f"   Pool disponível: {len(number_pool)} números")
        print(f"   Slots a completar: {remaining_slots}")
        
        if len(fixed_numbers) > 0:
            print(f"   ⚠️ REGRA: Estratégia aplicada APENAS aos {remaining_slots} números restantes")
        
        last_progress = 0
        while len(generated_games) < num_games and attempts < max_attempts:
            if strategy == 'neural_weighted' and weights:
                selected = self._weighted_selection(number_pool, weights, remaining_slots)
            else:
                selected = random.sample(number_pool, remaining_slots)
            
            if len(fixed_numbers) > 0:
                if not self._validate_generated_numbers(selected, strategy):
                    attempts += 1
                    continue
            else:
                if not self._validate_generated_numbers(selected, strategy):
                    attempts += 1
                    continue
            
            game_list = fixed_numbers + selected
            game = tuple(sorted(game_list))
            
            if len(game) != numbers_per_game:
                attempts += 1
                continue
            
            if not all(f in game for f in fixed_numbers):
                attempts += 1
                continue
            
            generated_games.add(game)
            attempts += 1
            
            current_progress = len(generated_games)
            if current_progress % 500 == 0 and current_progress > last_progress:
                print(f"   Progresso: {current_progress}/{num_games}")
                last_progress = current_progress
        
        final_count = len(generated_games)
        
        if final_count == 0:
            print(f"❌ ERRO: Nenhum jogo gerado!")
            return []
        elif final_count < num_games:
            print(f"⚠️ Gerados {final_count} de {num_games} jogos.")
        else:
            print(f"✅ Sucesso: {final_count} jogos gerados!")
        
        for i, game in enumerate(list(generated_games)[:3]):
            has_all_fixed = all(f in game for f in fixed_numbers)
            print(f"   Jogo exemplo {i+1}: {list(game)} - Fixos presentes: {'✅' if has_all_fixed else '❌'}")
        
        return [list(game) for game in generated_games]
