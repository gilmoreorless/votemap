var map = L.map('map', {
	center: [-33.7609, 150.932],
	zoom: 13,
	minZoom: 4,
	maxZoom: 18
	// maxBounds: [[1, 2], [3, 4]]
});

L.tileLayer('http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png', {
	key: '9d5d057459c24f2e8359c28738e1ab3b',
	styleId: 998,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
    maxZoom: 18
}).addTo(map);

new L.TileLayer.GeoJSON('/data/places/tile/{z}/{x}/{y}').addTo(map);
