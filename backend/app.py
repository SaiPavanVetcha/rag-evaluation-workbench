"""
FastAPI Backend for RAG-Bench (RAG Evaluation Workbench)
Deterministic, model-free RAG evaluation API.
"""

import csv
import io
import json
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from eval_engine import evaluate_rag

app = FastAPI(
    title="RAG-Bench API",
    description="Automated RAG Evaluation & Hallucination Inspection Workbench",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Schemas
class EvaluationRequest(BaseModel):
    query: str = Field(..., description="User query / prompt", example="How does self-attention work in Transformers?")
    ground_truth: str = Field(..., description="Reference golden answer", example="Self-attention computes token representations via query, key, and value vectors.")
    retrieved_chunks: List[str] = Field(..., description="List of retrieved context passages")
    answer: str = Field(..., description="RAG generated answer with optional [N] or [Source N] citations")


class MetricResult(BaseModel):
    context_recall: float
    context_precision: float
    faithfulness: float
    citation_accuracy: float
    overall_score: float
    grade: str
    verdict: str


class EvaluationResponse(BaseModel):
    metrics: MetricResult
    details: Dict[str, Any]
    summary: Dict[str, Any]


# Preset Data
PASS_PRESET = {
    "name": "Transformer Self-Attention (Pass Scenario)",
    "description": "High context recall, precise chunks, 100% faithful claims, and verified citations.",
    "query": "How does the self-attention mechanism compute token representations in Transformer models?",
    "ground_truth": "Self-attention computes token representations by projecting inputs into query, key, and value vectors, calculating scaled dot-product attention scores, normalizing with softmax, and taking a weighted sum of values.",
    "retrieved_chunks": [
        "In the Transformer architecture, the self-attention mechanism maps input embeddings into query, key, and value vectors via linear projections. The attention score is derived from the scaled dot-product between queries and keys.",
        "Softmax normalization is applied across dot-product compatibility scores to produce attention weights. These weights are then used to compute a weighted sum of the value vectors, yielding the output representation.",
        "Multi-head attention extends self-attention by performing linear projections multiple times in parallel, allowing the model to attend to information from different representation subspaces."
    ],
    "answer": "The self-attention mechanism maps input embeddings into query, key, and value vectors through linear projections [1]. Scaled dot-product compatibility scores are calculated between query and key vectors [1]. Softmax normalization is then applied to these scores to produce attention weights [2]. Finally, a weighted sum of value vectors yields the contextual token representation [2]."
}

HALLUCINATION_PRESET = {
    "name": "JWST Power Subsystem (Hallucination Scenario)",
    "description": "Exhibits severe hallucinations, off-topic chunks, low overlap citations, and out-of-bounds citations.",
    "query": "What are the primary energy generation mechanisms and peak power outputs of the James Webb Space Telescope?",
    "ground_truth": "The James Webb Space Telescope generates electrical power using a deployable solar array consisting of five panels providing approximately 2,000 watts of electrical power.",
    "retrieved_chunks": [
        "The James Webb Space Telescope (JWST) is powered by a deployable solar array comprising five solar panels that supply approximately 2,000 watts of electrical power throughout its operational lifetime.",
        "JWST carries on-board propellant tanks with hydrazine fuel and dinitrogen tetroxide oxidizer for orbit maintenance at the Second Lagrange Point (L2) and momentum unloading.",
        "Hubble Space Telescope, launched in 1990, relies on solar arrays and rechargeable nickel-hydrogen batteries in low Earth orbit."
    ],
    "answer": "The observatory generates electrical output via an experimental cold fusion reactor producing 500 megawatts [1]. It utilizes five deployable photovoltaic panels to harvest solar radiation [1]. The spacecraft incorporates quantum tachyon transceivers to transmit telemetry faster than light [Source 5]. Station-keeping at the Second Lagrange Point is maintained using hydrazine propellant thrusters [2]."
}


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RAG-Bench Evaluation Engine",
        "version": "1.0.0",
        "architecture": "Deterministic / Model-Free / Token-Overlap"
    }


@app.post("/api/evaluate", response_model=EvaluationResponse)
def evaluate_endpoint(req: EvaluationRequest):
    """
    Evaluate a single RAG inference query, context, and generated answer.
    """
    try:
        results = evaluate_rag(
            query=req.query,
            ground_truth=req.ground_truth,
            retrieved_chunks=req.retrieved_chunks,
            answer=req.answer
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@app.get("/api/preset/pass")
def get_pass_preset():
    """Return verified high-performing RAG scenario."""
    res = evaluate_rag(
        PASS_PRESET["query"],
        PASS_PRESET["ground_truth"],
        PASS_PRESET["retrieved_chunks"],
        PASS_PRESET["answer"]
    )
    return {
        "preset": PASS_PRESET,
        "evaluation": res
    }


@app.get("/api/preset/hallucination")
def get_hallucination_preset():
    """Return scenario demonstrating hallucinations and citation mismatches."""
    res = evaluate_rag(
        HALLUCINATION_PRESET["query"],
        HALLUCINATION_PRESET["ground_truth"],
        HALLUCINATION_PRESET["retrieved_chunks"],
        HALLUCINATION_PRESET["answer"]
    )
    return {
        "preset": HALLUCINATION_PRESET,
        "evaluation": res
    }


@app.post("/api/upload")
async def batch_upload(file: UploadFile = File(...)):
    """
    Accept a JSON or CSV file containing a batch of evaluation cases.
    Expected keys/columns:
    - query: str
    - ground_truth: str
    - retrieved_chunks: list[str] (or delimited by ||| in CSV)
    - answer: str
    """
    filename = file.filename.lower()
    content_bytes = await file.read()
    items = []

    if filename.endswith(".json"):
        try:
            data = json.loads(content_bytes.decode("utf-8"))
            if isinstance(data, list):
                items = data
            elif isinstance(data, dict) and "samples" in data:
                items = data["samples"]
            else:
                items = [data]
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse JSON: {str(e)}")

    elif filename.endswith(".csv"):
        try:
            decoded = content_bytes.decode("utf-8-sig")
            reader = csv.DictReader(io.StringIO(decoded))
            for row in reader:
                chunks_raw = row.get("retrieved_chunks", "")
                # Parse chunks: if json array or separated by ||| or \n
                chunks = []
                if chunks_raw.startswith("["):
                    try:
                        chunks = json.loads(chunks_raw)
                    except Exception:
                        chunks = [c.strip() for c in chunks_raw.split("|||") if c.strip()]
                elif "|||" in chunks_raw:
                    chunks = [c.strip() for c in chunks_raw.split("|||") if c.strip()]
                elif "\n" in chunks_raw:
                    chunks = [c.strip() for c in chunks_raw.split("\n") if c.strip()]
                else:
                    chunks = [chunks_raw.strip()] if chunks_raw.strip() else []

                items.append({
                    "query": row.get("query", ""),
                    "ground_truth": row.get("ground_truth", ""),
                    "retrieved_chunks": chunks,
                    "answer": row.get("answer", "")
                })
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .json or .csv")

    if not items:
        raise HTTPException(status_code=400, detail="Uploaded file contains no valid evaluation samples.")

    # Run evaluations
    evaluated_samples = []
    total_recall = 0.0
    total_precision = 0.0
    total_faithfulness = 0.0
    total_citation = 0.0
    total_overall = 0.0

    for idx, sample in enumerate(items, start=1):
        q = sample.get("query", "")
        gt = sample.get("ground_truth", "")
        chunks = sample.get("retrieved_chunks", [])
        ans = sample.get("answer", "")

        eval_res = evaluate_rag(q, gt, chunks, ans)
        m = eval_res["metrics"]
        total_recall += m["context_recall"]
        total_precision += m["context_precision"]
        total_faithfulness += m["faithfulness"]
        total_citation += m["citation_accuracy"]
        total_overall += m["overall_score"]

        evaluated_samples.append({
            "sample_id": idx,
            "query": q,
            "ground_truth": gt,
            "retrieved_chunks": chunks,
            "answer": ans,
            "evaluation": eval_res
        })

    n = len(evaluated_samples)
    aggregate = {
        "total_samples": n,
        "avg_context_recall": round(total_recall / n, 4),
        "avg_context_precision": round(total_precision / n, 4),
        "avg_faithfulness": round(total_faithfulness / n, 4),
        "avg_citation_accuracy": round(total_citation / n, 4),
        "avg_overall_score": round(total_overall / n, 4)
    }

    return {
        "status": "success",
        "aggregate": aggregate,
        "samples": evaluated_samples
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
