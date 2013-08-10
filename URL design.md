# URL Design

## REST APIs (Map <-> Backend) - all are GET

### `/data/candidates?query=string&divisionId=int`

Get all candidates, optionally filtered by `query` (for free text search) or `divisionId`.

### `/data/places/tile/{Z}/{X}/{Y}?votes=bool`

Get GeoJSON data for polling places using OSM tile co-ordinates (zoom/X/Y).
Optional `votes` parameter returns candidate/voting data as well (default `false`).

### `/data/divisions/info`

Get info/metadata (name, state, party, etc.) for all divisions without geo information

### `/data/divisions/geo/{divisionId}`

Get GeoJSON data for a single division

### `/data/divisions/geo/tile/{Z}/{X}/{Y}`

Get GeoJSON data for any divisions within OSM tile boundaries


## CouchDB views (Backend <-> Couch)

### `{db}/_design/candidates/_view/by_division_id?key={divisionId}` (or `?keys=[{id1},{id2},...]`)

Get all candidates for a division with `divisionId`, or all candidates if key is not given

### `{db}/_design/places/_spatial/for_bounds?bbox={bounds}`

Get GeoJSON data for polling places within lat/lon bounds

### `{db}/_design/places/_view/votes?key={???}` (or `?keys=[{id1},{id2},...]`)

Get voting data for polling places with particular IDs

### `{db}/_design/divisions/_view/all`

Get non-geo data for all divisions

### `{db}/_design/divisions/_spatial/by_id?key={divisionId}`

Get GeoJSON data for a single division with `divisionId`

### `{db}/_design/divisions/_spatial/for_bounds?bbox={bounds}`

Get GeoJSON data for all divisions within lat/lon bounds
