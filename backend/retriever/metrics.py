"""Lightweight offline metrics for evaluating retrieval ranking."""


def recall_at_k(ranked_ids: list[str], relevant_ids: set[str], k: int) -> float:
    """Fraction of known relevant chunks found in the first K results."""
    if not relevant_ids or k <= 0:
        return 0.0
    retrieved = set(ranked_ids[:k])
    return len(retrieved.intersection(relevant_ids)) / len(relevant_ids)


def mean_reciprocal_rank(
    ranked_lists: list[list[str]],
    relevant_sets: list[set[str]],
) -> float:
    """Mean reciprocal rank across query/result pairs."""
    if not ranked_lists or len(ranked_lists) != len(relevant_sets):
        return 0.0

    reciprocal_ranks = []
    for ranked_ids, relevant_ids in zip(ranked_lists, relevant_sets):
        reciprocal_rank = 0.0
        for rank, item_id in enumerate(ranked_ids, start=1):
            if item_id in relevant_ids:
                reciprocal_rank = 1.0 / rank
                break
        reciprocal_ranks.append(reciprocal_rank)

    return sum(reciprocal_ranks) / len(reciprocal_ranks)
