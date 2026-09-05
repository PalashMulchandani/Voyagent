def build_itinerary(search_results: dict, days: int, style: str) -> dict:
    """
    Takes search results (flights, hotels) and assembles a simple
    day-by-day itinerary.

    Right now this picks the first flight/hotel option and just repeats
    a placeholder activity per day. Once tools/personalize.py has a real
    trained model, this is where we'd rank options and pick activities
    based on the user's actual style/budget instead of just taking the
    first result.
    """
    flight = search_results["flights"][0]
    hotel = search_results["hotels"][0]

    itinerary = {"flight": flight, "hotel": hotel, "days": []}

    for day_num in range(1, days + 1):
        itinerary["days"].append({
            "day": day_num,
            # TODO: replace with real activity suggestions matched to `style`
            "activities": [f"Placeholder activity {day_num} for style: {style}"]
        })

    return itinerary