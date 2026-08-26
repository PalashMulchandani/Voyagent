# Voyagent

An agentic AI travel assistant that manages real trip planning — not just LLM-generated "plausible" itineraries, but plans grounded in live, verifiable data: real flight availability, real hotel prices, real routes.

## The Problem

Ask most LLMs to plan a trip and you get a confident-sounding itinerary with no connection to reality — flights that may not exist at that price, hotels with no actual availability, routes that ignore real travel time. The user ends up doing the actual research themselves anyway.

## What Voyagent Does (v1 scope)

Given a short trip request (e.g. "3 days in [city], mid-range budget, likes food and walking"), Voyagent:
1. Searches real flight and hotel options via live APIs
2. Builds a day-by-day itinerary
3. Personalizes recommendations using a lightweight ML layer based on trip style, budget, and preferences

v1 is intentionally scoped small — one trip, one city, a working end-to-end slice — not a full production travel app.

## Architecture

- **Agent orchestration layer** (LangGraph) — coordinates search, itinerary generation, and personalization
- **Search agents** — query live flight/hotel APIs
- **Itinerary agent** — assembles a day-by-day plan from search results
- **ML personalization layer** — [approach TBD after next call: profile-based filtering vs. route/clustering optimization]
- **App layer** (FastAPI + React) — where a user actually interacts with Voyagent

## Tech Stack (proposed)

- Backend: Python, FastAPI, LangGraph
- ML: scikit-learn
- Frontend: React
- Data sources: Skyscanner or Amadeus API (flights), Booking.com Rapid API (hotels) — final choice TBD based on free-tier feasibility

## Team

- **Palash Mulchandani** — agent orchestration, app layer, data integration
- **김희서** — ML personalization design, methodology, evaluation

Both: pairing on the ML implementation itself.

## Status

🚧 Early stage — repo just created, scoping v1 together.

---


## Setup

_(To be filled in once the stack is finalized)_
