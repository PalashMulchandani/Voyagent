from langgraph.graph import StateGraph, END
from typing import TypedDict
from backend.agents.search_agent import run_search
from backend.agents.itinerary_agent import build_itinerary

class TripState(TypedDict):
    origin: str
    destination: str
    dates: dict
    budget: str
    days: int
    style: str
    search_results: dict
    itinerary: dict

def search_step(state: TripState) -> TripState:
    state["search_results"] = run_search(state["origin"], state["destination"], state["dates"], state["budget"])
    return state

def itinerary_step(state: TripState) -> TripState:
    state["itinerary"] = build_itinerary(state["search_results"], state["days"], state["style"])
    return state

def build_graph():
    graph = StateGraph(TripState)
    graph.add_node("search", search_step)
    graph.add_node("itinerary", itinerary_step)
    graph.set_entry_point("search")
    graph.add_edge("search", "itinerary")
    graph.add_edge("itinerary", END)
    return graph.compile()

if __name__ == "__main__":
    app = build_graph()
    result = app.invoke({
        "origin": "DEL", "destination": "Bangkok",
        "dates": {"depart": "2026-12-01"}, "budget": "mid",
        "days": 3, "style": "food, walking"
    })
    print(result)