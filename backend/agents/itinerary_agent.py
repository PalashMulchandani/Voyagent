from backend.tools.personalize import is_model_ready, score_trip_option


def build_itinerary(search_results: dict, days: int, style: str) -> dict:
    """
    Takes search results (flights, hotels) and assembles a simple
    day-by-day itinerary.

    Right now this picks the first flight/hotel option and repeats a
    placeholder activity per day. Once 김희서's trained model exists
    (checked via is_model_ready()), this is where we'd use
    score_trip_option() to actually rank options and pick activities
    based on the user's real style/budget instead of just taking the
    first result.
    """
    flight = search_results["flights"][0]
    hotel = search_results["hotels"][0]

    if is_model_ready():
        # TODO: actually use score_trip_option() to pick the best option
        # once the model exists, instead of just taking the first result
        pass

    itinerary = {"flight": flight, "hotel": hotel, "days": []}

    for day_num in range(1, days + 1):
        itinerary["days"].append({
            "day": day_num,
            # TODO: replace with real activity suggestions matched to `style`
            "activities": [f"Placeholder activity {day_num} for style: {style}"]
        })

    return itinerary