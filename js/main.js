//global variables
var map,
neighborhoodBoudaries,
baseMaps,
overlayMaps,
markerLayer,
subwayLines,
dataList; 
var layerGroup = L.layerGroup()
//function to instantiate the Leaflet map
function createMap(){
    
    //tileset from leaflet-extras.github.io/leaflet-providers/preview/
    //base layers
    var Stamen_Watercolor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 1,
        maxZoom: 20,
        ext: 'jpg'
    })
    var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    })
    
    //overlay layer
    var Stamen_TonerLabels = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png'
    })
    //vars to hold bounds
    var southWest = [40.422838, -74.554147],
        northEast = [41.200653, -73.315940],
        bounds = L.latLngBounds(southWest,northEast)
    //create the map
    map = L.map('map', {
        center: [40.7648, -73.9808],
        zoom: 12,
        minZoom: 9, //constrain zoom so users can't zoom out beyond default
        maxZoom: 17, //constrain zoom so users can only zoom in 2 levels beyond default
        maxBounds: bounds,
        layers: [Stamen_Watercolor,Stamen_TonerLabels], //watercolor is default base layer with labels as overlay
    });

    //scale bar
    L.control.scale({ position: 'bottomright' }).addTo(map);
        
    
    baseMaps = {
        //name in legend      associated layer
        "Watercolor": Stamen_Watercolor,
        "Satellite": Esri_WorldImagery
    };
    overlayMaps = {
        "Labels": Stamen_TonerLabels
    };


    getData();
};

function getData(){
    //load the data
    fetch("data/Subway_Lines.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map
            subwayLines=json.features
            L.geoJson(json).addTo(map);
            
        })
        /*
    fetch("data/NewYorkCityBikeRoutes.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map
            bikeRoutes=json.features
            L.geoJson(json).addTo(map);
        })
    /* too big of a dataset
    fetch("data/NYCStreetCenterline(CSCL).geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map
            streets=json.features
            L.geoJson(json).addTo(map);
        })
        */
    //add layer control to toggle layers after all data has been loaded
    L.control.layers(baseMaps, overlayMaps,{ position: 'topright' }).addTo(map);
};

document.addEventListener('DOMContentLoaded',createMap)
