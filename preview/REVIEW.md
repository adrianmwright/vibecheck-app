# VibeCheck: review and next working prototype

Reviewed the Codespace copies of `test_dashboard.py`, `app_agent.py`, and `app_build_blueprint.md`. These files were not retrievable on the repository's default branch at review time. Original files have not been overwritten.

## What the existing files do

- `test_dashboard.py` generates 15 random reports, calculates mean social and energy scores and chooses a modal crowd category, then prints a terminal table. It is a calculation demo, not a clickable mobile interface or a real-time service.
- Unrated venues are assigned 5.0 and Quiet, falsely suggesting observations. Reports have no timestamp or expiry. Tied crowd modes use a set, so results can vary. Votes are not validated and disappear when the process exits.
- `app_agent.py` calls an external AI using an environment credential and saves generated text to `app_build_blueprint.md`. It does not create the requested executable backend files or run them. It is not required for the prototype.
- The generated blueprint is JSON containing SQL and Python source, not an assembled backend. Its vibe/density/noise metrics differ from the dashboard's social/energy/crowd metrics. It averages all historical reports despite describing them as recent. Anonymous submission and venue creation lack abuse controls. It should not be deployed unchanged.

## New prototype

`preview/index.html` is a self-contained responsive prototype, requiring no packages, API keys, account registration, or paid services.

1. Discover: venue/suburb search, category filters, sorting by name/social/energy, clear simulation labels.
2. Venue: three aggregate metrics, sample report freshness, explanation of the scores, and insufficient-data state.
3. Rating overlay: crowd selector, 1–10 social and energy sliders, demo confirmation, submit feedback, keyboard close and focus containment.

Reports are stored in this browser only. The exact metric names are Crowd level, Social vibe and Energy. Valid scores are whole numbers 1–10. Reports count only while their age is less than 60 minutes. At least three valid recent reports are needed before any metric is displayed. Crowd level uses the most common category; a tie chooses the most recent response among tied categories. Social and energy scores use their own sums divided by recent submission count, rounded to one decimal.

The RSL fixture intentionally starts with two reports to demonstrate insufficient data. Other fixtures demonstrate usable snapshots. Reset sample data restarts the demo and clears its local submission cooldown. Scores are illustrative, not evidence about real venues; the venue names came from the existing project and their details have not been independently verified.

No public user profiles, photos, person scores, account identifiers, GPS requests, third-party assets or network requests are used. A 15-minute per-venue browser cooldown helps test the interaction; it is bypassable and is NOT a security control. This is not shared real-time data or a verified on-site submission system.

## Run in the Codespace

After the changes are available locally, run `python -m http.server 8000 --directory preview`. In the Ports panel, open port 8000 in the browser and keep its visibility private. Stop the server when finished to avoid unnecessary Codespace runtime. GitHub repository files alone do not enable website hosting.

To check the calculation rules, run `node preview/check-calculations.cjs`. No dependencies are needed.

## Next milestone after testing the flow

Choose the visual native-app builder before rebuilding these screens for iOS/Android. This HTML prototype is a reference and testing tool, not a native store binary or an automatically importable visual-builder project.

Move submissions to a secured shared backend with server-side validation, server timestamps, trusted aggregation and access restrictions. Add private pseudonymous abuse controls, submission rate limits and a deliberate on-site verification design. Define what is retained and for how long. Add a working reporting/support channel and required privacy/store disclosures before any public pilot. Confirm venue facts and seed a small test area. Then test concurrent submissions and real devices before store preparation.

## Validation performed

The dependency-free Node check parses the entire inline script and tests averages, the minimum-report rule, deterministic crowd ties, the exact expiry boundary, future-report exclusion, invalid and fractional scores, unknown venues and expiry of seeded fixtures. Browser testing verified search, category filtering, sorting, venue navigation, rating submission, the minimum-report transition, repeat-submission cooldown and persistence after reload. The desktop layout was visually inspected. A private Codespace preview server is running on port 8000. Native iPhone/Android and small-screen device testing remain outstanding.
