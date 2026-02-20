"""Cycle detection using Tarjan's SCC + DFS enumeration.

1. Find all Strongly Connected Components (SCC) of size >= 2.
2. Within each SCC, DFS-enumerate simple cycles of length 3–5.
3. Deduplicate cycles (canonical form).
4. Compute a risk score per cycle.
"""

from typing import List, Dict, Set, Tuple
from collections import defaultdict
from models.graph_data import GraphData


def _tarjan_scc(adj: Dict[str, list]) -> List[Set[str]]:
    """Tarjan's algorithm to find SCCs."""
    index_counter = [0]
    stack = []
    on_stack = set()
    index = {}
    lowlink = {}
    result = []

    def strongconnect(v):
        index[v] = index_counter[0]
        lowlink[v] = index_counter[0]
        index_counter[0] += 1
        stack.append(v)
        on_stack.add(v)

        for edge in adj.get(v, []):
            w = edge.receiver_id
            if w not in index:
                strongconnect(w)
                lowlink[v] = min(lowlink[v], lowlink[w])
            elif w in on_stack:
                lowlink[v] = min(lowlink[v], index[w])

        if lowlink[v] == index[v]:
            component = set()
            while True:
                w = stack.pop()
                on_stack.discard(w)
                component.add(w)
                if w == v:
                    break
            result.append(component)

    for v in list(adj.keys()):
        if v not in index:
            strongconnect(v)

    return result


def _find_cycles_in_scc(
    scc: Set[str],
    adj: Dict[str, list],
    min_len: int = 3,
    max_len: int = 5,
    max_cycles: int = 100,
) -> List[List[str]]:
    """DFS-enumerate simple cycles within an SCC, length 3–5."""
    cycles = []
    scc_list = sorted(scc)  # deterministic ordering
    
    # Limit search if SCC is too large
    if len(scc) > 50:
        scc_list = scc_list[:50]  # Only search from first 50 nodes

    for start in scc_list:
        if len(cycles) >= max_cycles:
            break
            
        visited: Set[str] = set()
        path: List[str] = []

        def dfs(node: str, depth: int):
            if len(cycles) >= max_cycles:
                return
            if depth > max_len:
                return
            path.append(node)
            visited.add(node)

            for edge in adj.get(node, []):
                nb = edge.receiver_id
                if nb not in scc:
                    continue
                if nb == start and depth >= min_len:
                    cycles.append(list(path))
                    if len(cycles) >= max_cycles:
                        return
                elif nb not in visited:
                    dfs(nb, depth + 1)

            path.pop()
            visited.discard(node)

        dfs(start, 1)

    return cycles


def _canonicalize(cycle: List[str]) -> Tuple[str, ...]:
    """Canonical form: rotate so smallest element is first."""
    min_idx = cycle.index(min(cycle))
    rotated = cycle[min_idx:] + cycle[:min_idx]
    return tuple(rotated)


def _cycle_risk_score(
    cycle: List[str],
    graph: GraphData,
) -> float:
    """Compute a risk score for a single cycle based on flow characteristics."""
    total_flow = 0.0
    tx_count = 0
    amounts = []

    for i in range(len(cycle)):
        src = cycle[i]
        dst = cycle[(i + 1) % len(cycle)]
        edges = graph.edge_index.get((src, dst), [])
        for e in edges:
            total_flow += e.amount
            tx_count += 1
            amounts.append(e.amount)

    score = 50.0  # base score for being a cycle

    # Tighter amount clustering → more suspicious (structuring)
    if amounts:
        avg = sum(amounts) / len(amounts)
        if avg > 0:
            variance_ratio = sum((a - avg) ** 2 for a in amounts) / (len(amounts) * avg ** 2)
            if variance_ratio < 0.1:
                score += 20.0  # very uniform amounts

    # Higher transaction volume → more suspicious
    if tx_count > len(cycle) * 2:
        score += 15.0

    # Longer cycles are rarer / more deliberate
    if len(cycle) >= 4:
        score += 10.0

    return min(score, 100.0)


def detect_cycles(graph: GraphData, max_results: int = 50) -> List[dict]:
    """
    Main entry point. Returns list of detected fraud rings (cycles).

    Each ring dict:
        {
            "members": [account_ids...],
            "total_flow": float,
            "transaction_count": int,
            "risk_score": float,
            "cycle_length": int,
        }
    """
    sccs = _tarjan_scc(graph.adjacency_list)

    # Keep only SCCs of size >= 2 (potential cycles)
    sccs = [s for s in sccs if len(s) >= 2]
    
    # Sort SCCs by size (smaller first, more likely to be fraud rings)
    sccs.sort(key=len)
    
    # Limit number of SCCs to process
    if len(sccs) > 20:
        sccs = sccs[:20]

    seen_canonical: Set[Tuple[str, ...]] = set()
    results = []

    for scc in sccs:
        if len(results) >= max_results:
            break
            
        raw_cycles = _find_cycles_in_scc(scc, graph.adjacency_list, max_cycles=100)
        for cycle in raw_cycles:
            if len(results) >= max_results:
                break
                
            canon = _canonicalize(cycle)
            if canon in seen_canonical:
                continue
            seen_canonical.add(canon)

            # Compute flow stats
            total_flow = 0.0
            tx_count = 0
            for i in range(len(cycle)):
                src = cycle[i]
                dst = cycle[(i + 1) % len(cycle)]
                for e in graph.edge_index.get((src, dst), []):
                    total_flow += e.amount
                    tx_count += 1

            risk = _cycle_risk_score(cycle, graph)

            results.append({
                "members": list(cycle),
                "total_flow": round(total_flow, 2),
                "transaction_count": tx_count,
                "risk_score": round(risk, 2),
                "cycle_length": len(cycle),
            })

    # Sort by risk score descending
    results.sort(key=lambda r: r["risk_score"], reverse=True)
    return results[:max_results]
