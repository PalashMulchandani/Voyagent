def run_search(origin, destination, dates, budget):
    # TODO: swap these placeholder returns for real calls to
    # tools.flights.search_flights() and tools.hotels.search_hotels()
    # once the API keys are working.

    flights = [
        {"airline": "Placeholder Air", "price": 350, "currency": "USD"}
    ]
    hotels = [
        {"name": "Placeholder Hotel", "price_per_night": 80, "currency": "USD", "rating": 4.2}
    ]
    return {"flights": flights, "hotels": hotels}