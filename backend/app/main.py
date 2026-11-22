"""
NeuroBloom — FastAPI Backend Reference Implementation (Python 3.11+ / SQLite)
Mirror of the Node/Express TypeScript server for standalone Python/FastAPI Windows setups.
"""
from datetime import datetime, timezone
import os
import sqlite3
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB_PATH = os.getenv("DB_PATH", "neurobloom.db")

app = FastAPI(
    title="NeuroBloom Cognitive Play API",
    description="Inclusive cognitive therapy through play — educational support backend.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GameSessionCreate(BaseModel):
    child_id: str
    game_id: str
    score: int = Field(ge=0)
    accuracy: float = Field(ge=0, le=100)
    attempts: int = Field(ge=1)
    duration: int = Field(ge=1)
    difficulty: int = Field(ge=1, le=5)
    hints_used: int = Field(default=0, ge=0)
    repeated_errors: int = Field(default=0, ge=0)


def evaluate_adaptive_difficulty(recent_accuracies: List[float], current_difficulty: int) -> dict:
    next_diff = current_difficulty
    action = "maintained"
    reason = f"Maintaining Level {current_difficulty} for steady mastery."
    if len(recent_accuracies) >= 3 and all(a >= 85 for a in recent_accuracies[:3]) and current_difficulty < 5:
        next_diff = current_difficulty + 1
        action = "increased"
        reason = f"Accuracy >= 85% across 3 sessions; stepped up to Level {next_diff}."
    elif len(recent_accuracies) >= 2 and all(a < 60 for a in recent_accuracies[:2]) and current_difficulty > 1:
        next_diff = current_difficulty - 1
        action = "reduced"
        reason = f"Accuracy < 60% across 2 sessions; eased to Level {next_diff}."
    return {"previousDifficulty": current_difficulty, "nextDifficulty": next_diff, "action": action, "reason": reason}


@app.get("/api/health")
def health():
    return {"status": "ok", "engine": "fastapi", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/api/games/sessions")
def record_session(payload: GameSessionCreate):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(
            "SELECT accuracy FROM game_sessions WHERE child_id = ? AND game_id = ? ORDER BY completed_at DESC LIMIT 5",
            (payload.child_id, payload.game_id),
        ).fetchall()
        accuracies = [payload.accuracy] + [float(r["accuracy"]) for r in rows]
        return {
            "received": payload.model_dump(),
            "adaptive_adjustment": evaluate_adaptive_difficulty(accuracies, payload.difficulty),
        }
    except sqlite3.Error as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        conn.close()
