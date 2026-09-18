"""
Voyagent — FastAPI entry point.

This is where a trip request comes in and the orchestrator agent takes over.
"""

from fastapi import FastAPI
from pydantic import BaseModel
from backend.agents.orchestrator import build_graph

app = FastAPI(title="Voyagent")
graph = build_graph()


class TripRequest(BaseModel):
    origin: str
    destination: str
    depart_date: str
    days: int
    budget: str  # e.g. "low", "mid", "high"
    style: str   # e.g. "food, walking, museums"


@app.get("/")
def health_check():
    return {"status": "Voyagent backend is running"}


@app.post("/plan-trip")
def plan_trip(request: TripRequest):
    result = graph.invoke({
        "origin": request.origin,
        "destination": request.destination,
        "dates": {"depart": request.depart_date},
        "budget": request.budget,
        "days": request.days,
        "style": request.style,
    })
    return result