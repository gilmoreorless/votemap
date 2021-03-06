# URL Design

## REST APIs (Map <-> Backend) - all are GET

### `/data/candidates?query=string&divisionId=int`

Get all candidates, optionally filtered by `query` (for free text search) or `divisionId`.

DONE? Yes

### `/data/places/tile/{Z}/{X}/{Y}?votes={true|false|full|min}`

Get GeoJSON data for polling places using OSM tile co-ordinates (zoom/X/Y).
Optional `votes` parameter also returns candidate/voting data for each place:

* `false` (default) - do not return voting data
* `true` or `full` - return full voting data (candidate name, party, vote numbers)
* `min` - return minimal voting data (cadidate ID and vote numbers only)

DONE? Yes

### `/data/places/{id}/votes`

Get all voting data for a polling place with `{id}`

DONE? Yes

### `/data/divisions/info`

Get info/metadata (name, state, party, etc.) for all divisions without geo information

DONE? No

### `/data/divisions/geo/{divisionId}`

Get GeoJSON data for a single division

DONE? No

### `/data/divisions/geo/tile/{Z}/{X}/{Y}`

Get GeoJSON data for any divisions within OSM tile boundaries

DONE? No


## CouchDB views (Backend <-> Couch)

### `{db}/_design/candidates/_view/by_division_id?key={divisionId}` (or `?keys=[{id1},{id2},...]`)

Get all candidates for a division with `divisionId`, or all candidates if key is not given

DONE? Yes

### `{db}/_design/places/_spatial/for_bounds?bbox={bounds}`

Get GeoJSON data for polling places within lat/lon bounds

DONE? Yes

### `{db}/_design/places/_view/votes?key={???}` (or `?keys=[{id1},{id2},...]`)

Get voting data for polling places with particular IDs

DONE? Yes

### `{db}/_design/divisions/_view/all`

Get non-geo data for all divisions

DONE? No

### `{db}/_design/divisions/_spatial/by_id?key={divisionId}`

Get GeoJSON data for a single division with `divisionId`

DONE? No

### `{db}/_design/divisions/_spatial/for_bounds?bbox={bounds}`

Get GeoJSON data for all divisions within lat/lon bounds

DONE? No
