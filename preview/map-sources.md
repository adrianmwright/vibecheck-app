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
