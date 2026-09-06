import os
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "model.pkl")

_model = None

def _load_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"No trained model found at {MODEL_PATH}. "
                "This is expected until 김희서's model is trained and saved there."
            )
        _model = joblib.load(MODEL_PATH)
    return _model

def score_trip_option(features: dict) -> float:
    """
    Takes trip-option features and returns a score the itinerary
    agent can use to rank options.

    TODO once her model exists: define exact feature keys expected
    (e.g. price, style_match, rating) and convert `features` dict
    into whatever input shape her model needs.
    """
    model = _load_model()
    raise NotImplementedError("Wire this up once the real model and feature schema exist.")

def is_model_ready() -> bool:
    """Lets the orchestrator check if personalization is available yet,
    so the pipeline can run WITHOUT it until it's ready."""
    return os.path.exists(MODEL_PATH)