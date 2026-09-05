# Hotel Ranking ML Baseline

## Purpose

Voyagent needs real supplier inventory for booking, but live APIs usually return
a broad set of hotel candidates. This ML layer provides a data-driven prior for
ordering those candidates. It predicts which hotel is more likely to be booked
for a given search context.

The model should not be treated as proof of price, availability, cancellation
rules, or reservation status. Those must come from the live hotel supplier.

## Dataset

The current baseline uses the Kaggle Expedia Hotel / Personalized Sort style
dataset added to a Kaggle Notebook as:

```text
/kaggle/input/datasets/vijeetnigam26/expedia-hotel/train.csv
```

Each row represents one hotel candidate (`prop_id`) shown inside one search
result set (`srch_id`). The target is:

```text
booking_bool
```

`booking_bool = 1` means the user booked that hotel. `booking_bool = 0` means
the hotel was shown but was not booked.

## Algorithm

The baseline is a scikit-learn binary classifier:

```text
SimpleImputer(strategy="median")
-> HistGradientBoostingClassifier
-> predict_proba(...)[booking_bool = 1]
```

This is not a regression model. It predicts a booking probability for each
hotel candidate, then sorts candidates by that probability.

## Features

The notebook selects numeric columns that are known before booking, excluding
labels, post-interaction outcomes, and IDs.

Used features:

```text
site_id
visitor_location_country_id
visitor_hist_starrating
visitor_hist_adr_usd
prop_country_id
prop_starrating
prop_review_score
prop_brand_bool
prop_location_score1
prop_location_score2
prop_log_historical_price
price_usd
promotion_flag
srch_destination_id
srch_length_of_stay
srch_booking_window
srch_adults_count
srch_children_count
srch_room_count
srch_saturday_night_bool
srch_query_affinity_score
orig_destination_distance
random_bool
comp1_rate
comp1_inv
comp1_rate_percent_diff
comp2_rate
comp2_inv
comp2_rate_percent_diff
comp3_rate
comp3_inv
comp3_rate_percent_diff
comp4_rate
comp4_inv
comp4_rate_percent_diff
comp5_rate
comp5_inv
comp5_rate_percent_diff
comp6_rate
comp6_inv
comp6_rate_percent_diff
comp7_rate
comp7_inv
comp7_rate_percent_diff
comp8_rate
comp8_inv
comp8_rate_percent_diff
```

Excluded columns:

```text
srch_id
prop_id
date_time
position
click_bool
booking_bool
gross_bookings_usd
```

`position` is excluded because it reflects Expedia's historical display rank.
`click_bool`, `booking_bool`, and `gross_bookings_usd` are outcomes that would
not be available before ranking live results. `srch_id` and `prop_id` are
identifiers, not generalizable feature values.

## Kaggle Run Metrics

The first baseline run used 300,000 rows and 47 numeric features.

```text
ROC AUC: 0.7632
Average precision: 0.0949
```

Plain accuracy is not very useful here because bookings are sparse. The next
evaluation step should use ranking metrics grouped by `srch_id`, such as NDCG
or MAP, and compare against the provider's default ordering.

## Applying This To Live Hotel APIs

The production ranking flow should look like this:

```text
1. The LLM extracts structured trip intent.
2. A live hotel API returns available hotel candidates.
3. Voyagent maps each hotel candidate into the trained feature schema.
4. The model predicts booking_probability for each candidate.
5. The app combines ML score with user preference fit and supplier constraints.
6. Booking is completed only through the supplier checkout flow.
```

Example feature mapping:

```text
supplier hotel star rating      -> prop_starrating
supplier review score           -> prop_review_score
supplier total price            -> price_usd
supplier promotion/deal flag     -> promotion_flag
destination/city mapping         -> srch_destination_id
stay length                      -> srch_length_of_stay
days until check-in              -> srch_booking_window
adults / children / rooms        -> srch_adults_count / srch_children_count / srch_room_count
```

Some Kaggle features may not exist in a supplier response. The current pipeline
handles missing numeric values with median imputation. In production, we should
also add provider-specific feature enrichment and explicit missing-value flags.

## Artifacts

The Kaggle Notebook writes these files to `/kaggle/working`:

```text
hotel_property_ranker.joblib
personalized_sort_metrics.json
example_property_ranking.csv
```

The raw Kaggle CSV files should not be committed to this repository.
