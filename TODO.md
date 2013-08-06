# The plan

## Part 1 - Candidates / Votes

### Data storage

1. √ Clean up 2010 data
*  √ Set up GeoCouch locally
*  √ Import data into GeoCouch - work out the best JSON representations
*    Play with data via Couch queries - see if it will work as desired

### Backend

1.    Decide on a backend system / framework - Node (+Express), Python (+Flask/Bottle), Ruby (+Sinatra)
*    Hook up system to Couch
*    Make a basic REST endpoint to get data for a tile
*    Add a cache in front of Couch for tile data
*    Make basic REST endpoints to get all candidates

### Frontend

1.    Basic page with Leaflet
*    Show dots for polling booths
*    Special styling (size, colour) for dots on map
*    Click on dot to get more details of polling place results
*    Get detailed list of candidates from server REST endpoint
*    Link candidates and polling places
*    Toggle switch to change between first prefs & two-party preferred

### Design

1.    Really basic design to begin: Some about text and the map
*    Customise the background to be colours based on no. of party seats
*    Add a simple about page

### Hosting

1.    Set up Heroku app
*    Set up IrisCouch account / database
*    Populate IrisCouch with data
*    Connect app with IrisCouch and publish

## Part 2 - Electorates

### Data storage

1.    Get shape files, stuff them into GeoCouch
*    See if GeoCouch + Leaflet will actually work for simplification + low data size
*    If not, try to optimise the size of the boundaries
*    Investigate TopoJSON as well
*    Add party/candidate winner to data

### Backend

1. ??? Depends on how data storage goes
2. Also possibly add a cache in front, if needed

### Frontend

1.    Added electorates to Leaflet as a new layer
*    Colour electorates based on which party won the seat
*    Make the layer toggle on/off with a new UI section


## Part 3 - Search

### Backend - idea 1

1.    New REST API to find electorates based on search terms
*    Add polling places to API

### Backend - idea 2

1.    New REST API to get all electorates + centre point lat/long
*    Electorates get sent to frontend to be cached in memory
*    Copy API to do the same for polling places, but that might be too large

### Frontend

1.    New UI element for a search box, with autocomplete
*    First search only electorates
*    Next add polling places

