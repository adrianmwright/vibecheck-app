# Pilot map

Leaflet 1.9.4 is vendored locally (BSD-2-Clause): https://leafletjs.com/reference.html. Runtime basemap tiles use https://tile.openstreetmap.org with visible OpenStreetMap contributor attribution. No bulk downloads, prefetching, geocoding at runtime or offline tile caching. This is a small private MVP; reassess tile hosting before wider usage. Map zoom/pan transmits tile requests to OpenStreetMap. Browser location is requested only on Near me, used to centre the map, and never written into ratings.

Coordinates were retrieved from Nominatim/OpenStreetMap on 15 October 2026 (Australia/Brisbane). Data © OpenStreetMap contributors, ODbL 1.0: https://www.openstreetmap.org/copyright. Venue pins represent mapped locations, not verified attendance or exact entry points.

| ID | Venue | Coordinates | OSM object / address |
| --- | --- | --- | --- |
| V001 | Currumbin Beach Surf Club | -28.132368, 153.4901412 | way 45176478, 741 Pacific Parade |
| V002 | Dust Temple | -28.1445026, 153.4731954 | way 617928354, 54 Currumbin Creek Road (building centroid) |
| V003 | Balter | -28.1427012, 153.4703376 | node 5706861021, Balter, Traders Way |
| V004 | Currumbin RSL | -28.1374071, 153.4739195 | way 553386756, 165 Duringan Street |

Addresses cross-checked against https://currumbinslsc.com.au/supporters/contact-us/, https://dusttemple.com.au/event/, https://www.balter.com.au/tap-room/about and https://www.currumbinrsl.com.au/.

Colour represents the Energy score from reports less than 60 minutes old: below 4 Chilled, below 7 Buzzing, otherwise Going off. Grey means no recent reports; it does not mean Quiet. Halos are centred on known venue points; they do not estimate area population or interpolate crowd density. A first rating is now displayed as an Early snapshot until three reports are available.

## Expanded live catalogue

Six additional listings were added on 15 October 2026. They have no seeded ratings. Live map positions are now read from the venue catalogue database, so a new database listing with coordinates can appear without changing map code. Demo mode retains its four simulated fixtures; use live mode to test the expanded catalogue.

| ID | Venue | Suburb | Coordinates | Position source |
| --- | --- | --- | --- | --- |
| V005 | Surfers Paradise Beer Garden | Surfers Paradise | -28.002146, 153.429393 | https://clubsandpubsnearme.com.au/pubs/surfers-paradise-tavern-surfers-beer-garden-surfers-paradise-qld |
| V006 | House of Brews | Surfers Paradise | -28.0006731, 153.4296926 | OSM node 4356817156 |
| V007 | Surfers Paradise Surf Life Saving Club | Surfers Paradise | -28.0030501, 153.4308761 | OSM way 349348328 |
| V008 | Kurrawa Surf Club | Broadbeach | -28.0297736, 153.4349043 | OSM way 262819470 |
| V009 | The Loose Moose | Broadbeach | -28.0295290, 153.4314131 | OSM node 8303993618 |
| V010 | The Envy Hotel | Broadbeach | -28.0289745, 153.4321645 | OSM node 10180357408 |

Names and addresses cross-checked against the venues' official sites: https://www.surfersbeergarden.com.au/, https://www.houseofbrews.com.au/contact-us/, https://surfersparadiseslsc.com.au/contact/, https://www.kurrawasurf.com.au/surf-contact, https://gennarigroup.com.au/loose-moose-broadbeach and https://envyhotel.com.au/. Map points are approximate and do not verify that a venue is currently open.

Future broader discovery is a separate directory/provider integration. Search currently covers the curated catalogue, not all businesses. New venue discovery must remain independent of whether a venue has received a rating.
