"""
RAG-Bench Evaluation Engine
Deterministic, model-free, reproducible evaluation harness for RAG pipelines.
Computes:
1. Context Recall
2. Context Precision
3. Faithfulness (Hallucination Detection)
4. Citation Accuracy
Overall weighted score = 0.25*Recall + 0.20*Precision + 0.35*Faithfulness + 0.20*CitationAccuracy
"""

import re
import string
from typing import List, Dict, Any, Set, Tuple

# Comprehensive standard English stopwords list
STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
    "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
    "during", "each", "few", "for", "from", "further", "had", "hadn't", "has",
    "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
    "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
    "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
    "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't",
    "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
    "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
    "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
    "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what",
    "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
    "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd",
    "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
}

PUNCTUATION_TABLE = str.maketrans(string.punctuation, " " * len(string.punctuation))


def tokenize(text: str) -> List[str]:
    """
    Tokenize & normalize text:
    - Lowercase
    - Strip punctuation and citations
    - Remove stopwords and short tokens (< 3 chars)
    """
    if not text:
        return []
    # Strip citation markers like [1], [Source 2] before tokenizing
    cleaned = re.sub(r"\[(?:Source\s*)?\d+\]", " ", text, flags=re.IGNORECASE)
    cleaned = cleaned.lower().translate(PUNCTUATION_TABLE)
    raw_tokens = cleaned.split()
    tokens = [t for t in raw_tokens if len(t) >= 3 and t not in STOPWORDS]
    return tokens


def tokenize_set(text: str) -> Set[str]:
    """Return a unique set of normalized tokens."""
    return set(tokenize(text))


def split_sentences(text: str) -> List[str]:
    """
    Split text into distinct sentences with robust boundary detection.
    Preserves citation markers and handles abbreviations.
    """
    if not text or not text.strip():
        return []

    # Protect common abbreviations and numbers
    protected = text.strip()
    abbreviations = [
        ("e.g.", "e_g_"),
        ("i.e.", "i_e_"),
        ("vs.", "vs_"),
        ("Dr.", "Dr_"),
        ("Mr.", "Mr_"),
        ("Mrs.", "Mrs_"),
        ("Prof.", "Prof_"),
        ("Inc.", "Inc_"),
        ("Corp.", "Corp_"),
        ("approx.", "approx_"),
        ("Fig.", "Fig_"),
    ]
    for abbr, placeholder in abbreviations:
        protected = re.sub(re.escape(abbr), placeholder, protected, flags=re.IGNORECASE)

    # Protect decimals like 3.14
    protected = re.sub(r'(\d+)\.(\d+)', r'\1_dot_\2', protected)

    # Split on sentence terminals followed by whitespace or end of string
    raw_sentences = re.split(r'(?<=[.!?])\s+', protected)

    restored = []
    for s in raw_sentences:
        s_clean = s
        for abbr, placeholder in abbreviations:
            s_clean = s_clean.replace(placeholder, abbr)
        s_clean = re.sub(r'(\d+)_dot_(\d+)', r'\1.\2', s_clean)
        s_clean = s_clean.strip()
        if s_clean:
            restored.append(s_clean)

    return restored


def compute_context_recall(ground_truth: str, retrieved_chunks: List[str]) -> Tuple[float, Dict[str, Any]]:
    """
    Recall = |GT tokens ∩ All Retrieved tokens| / |GT tokens|
    Edge cases: empty GT -> 1.0, empty retrieved -> 0.0
    """
    gt_tokens = tokenize_set(ground_truth)
    if not gt_tokens:
        return 1.0, {
            "gt_tokens_count": 0,
            "matched_tokens_count": 0,
            "matched_tokens": [],
            "missed_tokens": [],
            "note": "Ground truth is empty; trivially 100% recall."
        }

    all_retrieved_tokens: Set[str] = set()
    for chunk in retrieved_chunks:
        all_retrieved_tokens.update(tokenize_set(chunk))

    if not all_retrieved_tokens:
        return 0.0, {
            "gt_tokens_count": len(gt_tokens),
            "matched_tokens_count": 0,
            "matched_tokens": [],
            "missed_tokens": sorted(list(gt_tokens)),
            "note": "Retrieved chunks are empty; 0% recall."
        }

    matched = gt_tokens.intersection(all_retrieved_tokens)
    missed = gt_tokens.difference(all_retrieved_tokens)
    score = len(matched) / len(gt_tokens)

    return round(score, 4), {
        "gt_tokens_count": len(gt_tokens),
        "matched_tokens_count": len(matched),
        "matched_tokens": sorted(list(matched)),
        "missed_tokens": sorted(list(missed)),
        "note": f"Found {len(matched)} of {len(gt_tokens)} essential ground truth tokens."
    }


def compute_context_precision(query: str, retrieved_chunks: List[str]) -> Tuple[float, Dict[str, Any]]:
    """
    A chunk is relevant if |Query tokens ∩ Chunk tokens| / |Query tokens| >= 0.25
    Precision = relevant_chunks / total_chunks
    Empty list -> 0.0
    """
    if not retrieved_chunks:
        return 0.0, {
            "total_chunks": 0,
            "relevant_chunks": 0,
            "chunks": [],
            "note": "No retrieved chunks provided."
        }

    query_tokens = tokenize_set(query)
    if not query_tokens:
        # If query has no content words, assume precision 1.0 if chunks exist, or 0.0
        return 0.0, {
            "total_chunks": len(retrieved_chunks),
            "relevant_chunks": 0,
            "chunks": [],
            "note": "Query contains no substantive keywords after normalization."
        }

    chunk_results = []
    relevant_count = 0

    for idx, chunk in enumerate(retrieved_chunks, start=1):
        chunk_tokens = tokenize_set(chunk)
        overlap = query_tokens.intersection(chunk_tokens)
        relevance_score = len(overlap) / len(query_tokens)
        is_relevant = relevance_score >= 0.25

        if is_relevant:
            relevant_count += 1

        chunk_results.append({
            "chunk_id": idx,
            "text": chunk,
            "relevance_score": round(relevance_score, 4),
            "is_relevant": is_relevant,
            "matched_tokens": sorted(list(overlap))
        })

    score = relevant_count / len(retrieved_chunks)
    return round(score, 4), {
        "total_chunks": len(retrieved_chunks),
        "relevant_chunks": relevant_count,
        "chunks": chunk_results,
        "note": f"{relevant_count} of {len(retrieved_chunks)} chunks meet the >= 25% query keyword threshold."
    }


def compute_faithfulness(answer: str, retrieved_chunks: List[str]) -> Tuple[float, Dict[str, Any]]:
    """
    Split answer into sentences.
    A sentence is supported if token overlap with all retrieved context >= 0.55
    Faithfulness = supported_sentences / total_sentences
    Return score and detailed list of sentences with status.
    """
    sentences = split_sentences(answer)
    if not sentences:
        return 1.0, {
            "total_sentences": 0,
            "supported_sentences": 0,
            "unsupported_sentences": 0,
            "sentences": [],
            "note": "Answer is empty; no ungrounded claims."
        }

    all_retrieved_tokens: Set[str] = set()
    for chunk in retrieved_chunks:
        all_retrieved_tokens.update(tokenize_set(chunk))

    sentence_results = []
    supported_count = 0

    citation_pattern = re.compile(r"\[(?:Source\s*)?(\d+)\]", re.IGNORECASE)

    for idx, sent in enumerate(sentences, start=1):
        sent_tokens = tokenize_set(sent)
        citations = [int(m) for m in citation_pattern.findall(sent)]

        if not sent_tokens:
            # Punctuation-only or extremely short sentence
            overlap_score = 1.0
            is_supported = True
            supported_tokens = []
            hallucinated_tokens = []
        else:
            supported = sent_tokens.intersection(all_retrieved_tokens)
            hallucinated = sent_tokens.difference(all_retrieved_tokens)
            overlap_score = len(supported) / len(sent_tokens)
            is_supported = overlap_score >= 0.55
            supported_tokens = sorted(list(supported))
            hallucinated_tokens = sorted(list(hallucinated))

        if is_supported:
            supported_count += 1

        sentence_results.append({
            "sentence_id": idx,
            "text": sent,
            "overlap_score": round(overlap_score, 4),
            "is_supported": is_supported,
            "supported_tokens": supported_tokens,
            "hallucinated_tokens": hallucinated_tokens,
            "citations": citations
        })

    score = supported_count / len(sentences)
    return round(score, 4), {
        "total_sentences": len(sentences),
        "supported_sentences": supported_count,
        "unsupported_sentences": len(sentences) - supported_count,
        "sentences": sentence_results,
        "note": f"{supported_count} of {len(sentences)} claims are grounded in retrieved context (>= 55% overlap)."
    }


def compute_citation_accuracy(
    answer: str,
    retrieved_chunks: List[str],
    faithfulness_score: float
) -> Tuple[float, Dict[str, Any]]:
    """
    Extract citations with regex: [Source N] or [N].
    For each citation, check if the sentence has >= 0.40 overlap with the specific cited chunk.
    Invalid index or low overlap = mismatch.
    Accuracy = valid_citations / total_citations.
    No citations -> return 1.0 if faithfulness is high (>= 0.70), else 0.0.
    """
    sentences = split_sentences(answer)
    citation_pattern = re.compile(r"\[(?:Source\s*)?(\d+)\]", re.IGNORECASE)

    total_chunks = len(retrieved_chunks)
    all_citations = []
    valid_count = 0

    for sent_idx, sent in enumerate(sentences, start=1):
        sent_tokens = tokenize_set(sent)
        # Find all citation matches with their matched raw strings
        matches = list(citation_pattern.finditer(sent))

        for m in matches:
            citation_raw = m.group(0)
            chunk_num = int(m.group(1))

            # Validate chunk index (1-based index)
            if chunk_num < 1 or chunk_num > total_chunks:
                is_valid = False
                overlap_score = 0.0
                reason = f"Invalid source index [{chunk_num}]: retrieved context only has {total_chunks} chunks."
            else:
                chunk_text = retrieved_chunks[chunk_num - 1]
                chunk_tokens = tokenize_set(chunk_text)

                if not sent_tokens:
                    overlap_score = 1.0
                    is_valid = True
                    reason = "Valid citation (no substantive tokens to contest)."
                else:
                    overlap = sent_tokens.intersection(chunk_tokens)
                    overlap_score = len(overlap) / len(sent_tokens)
                    is_valid = overlap_score >= 0.40
                    if is_valid:
                        reason = f"Grounded citation (overlap: {round(overlap_score * 100, 1)}% >= 40%)."
                    else:
                        reason = f"Ungrounded citation: sentence overlap with Chunk [{chunk_num}] is only {round(overlap_score * 100, 1)}% (< 40%)."

            if is_valid:
                valid_count += 1

            all_citations.append({
                "citation_tag": citation_raw,
                "chunk_id": chunk_num,
                "sentence_id": sent_idx,
                "sentence_text": sent,
                "overlap_score": round(overlap_score, 4),
                "is_valid": is_valid,
                "reason": reason
            })

    total_citations = len(all_citations)

    if total_citations == 0:
        # Fallback heuristic: high faithfulness implies correct un-cited synthesis
        is_high = faithfulness_score >= 0.70
        score = 1.0 if is_high else 0.0
        return score, {
            "total_citations": 0,
            "valid_citations": 0,
            "mismatched_citations": 0,
            "has_citations": False,
            "citations": [],
            "note": f"No inline citations found. Assigned {score:.2f} based on Faithfulness threshold (>= 70%)."
        }

    accuracy = valid_count / total_citations
    return round(accuracy, 4), {
        "total_citations": total_citations,
        "valid_citations": valid_count,
        "mismatched_citations": total_citations - valid_count,
        "has_citations": True,
        "citations": all_citations,
        "note": f"{valid_count} of {total_citations} inline citations accurately point to supporting chunks."
    }


def evaluate_rag(
    query: str,
    ground_truth: str,
    retrieved_chunks: List[str],
    answer: str
) -> Dict[str, Any]:
    """
    Run full deterministic RAG evaluation across the 4 key dimensions.
    Calculates overall weighted score and assigns a qualitative grade.
    """
    # Clean inputs
    query = (query or "").strip()
    ground_truth = (ground_truth or "").strip()
    clean_chunks = [c.strip() for c in (retrieved_chunks or []) if c and c.strip()]
    answer = (answer or "").strip()

    # 1. Recall
    recall, recall_details = compute_context_recall(ground_truth, clean_chunks)

    # 2. Precision
    precision, precision_details = compute_context_precision(query, clean_chunks)

    # 3. Faithfulness
    faithfulness, faithfulness_details = compute_faithfulness(answer, clean_chunks)

    # 4. Citation Accuracy
    citation_accuracy, citation_details = compute_citation_accuracy(
        answer, clean_chunks, faithfulness
    )

    # Overall Score formula:
    # 0.25 * Recall + 0.20 * Precision + 0.35 * Faithfulness + 0.20 * CitationAccuracy
    overall_score = (
        0.25 * recall +
        0.20 * precision +
        0.35 * faithfulness +
        0.20 * citation_accuracy
    )
    overall_score = round(overall_score, 4)

    # Assign Grade
    if overall_score >= 0.90:
        grade = "A+"
        verdict = "Production Ready: Outstanding context grounding and citation fidelity."
    elif overall_score >= 0.80:
        grade = "A"
        verdict = "High Quality: Reliable context recall with minor citation or precision noise."
    elif overall_score >= 0.70:
        grade = "B"
        verdict = "Acceptable: Generally faithful with moderate retrieval or grounding gaps."
    elif overall_score >= 0.50:
        grade = "C"
        verdict = "Needs Tuning: Significant context drift or unsupported claims detected."
    else:
        grade = "F"
        verdict = "Critical Failure: Severe hallucinations or retrieval mismatch detected."

    return {
        "metrics": {
            "context_recall": recall,
            "context_precision": precision,
            "faithfulness": faithfulness,
            "citation_accuracy": citation_accuracy,
            "overall_score": overall_score,
            "grade": grade,
            "verdict": verdict
        },
        "details": {
            "context_recall": recall_details,
            "context_precision": precision_details,
            "faithfulness": faithfulness_details,
            "citation_accuracy": citation_details
        },
        "summary": {
            "query": query,
            "ground_truth_token_count": recall_details.get("gt_tokens_count", 0),
            "total_chunks": len(clean_chunks),
            "relevant_chunks": precision_details.get("relevant_chunks", 0),
            "total_claims": faithfulness_details.get("total_sentences", 0),
            "supported_claims": faithfulness_details.get("supported_sentences", 0),
            "hallucinated_claims": faithfulness_details.get("unsupported_sentences", 0),
            "total_citations": citation_details.get("total_citations", 0),
            "valid_citations": citation_details.get("valid_citations", 0)
        }
    }
