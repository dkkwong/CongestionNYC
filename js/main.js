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
    var CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
    });
    var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
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
        layers: [CartoDB_DarkMatter]
    });
    //scale bar
    L.control.scale({ position: 'bottomright' }).addTo(map);
    baseMaps = {
        //name in legend      associated layer
        "Basemap": CartoDB_DarkMatter,
        "Satellite": Esri_WorldImagery
    };
    //overlayMaps = {
    //    "Labels": Stamen_TonerLabels
    //};


    getData();
};

function getData(){
//--------Subway----------
    fetch("data/Subway/Routes.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map            
            L.geoJson(json).addTo(map);
            
        })
    fetch("data/Subway/Stops.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map            
            L.geoJson(json).addTo(map);
            
        })
//-----Metro North------------
    fetch("data/MetroNorth/Routes.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map            
            L.geoJson(json).addTo(map);
            
        })
    fetch("data/MetroNorth/Stops.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map            
            L.geoJson(json).addTo(map);
            
        })
//-------LIRR--------
    fetch("data/LIRR/LIRR_GTFS.json")
        .then(function(response){
           return response.json();
        })
        .then(function(data){
            L.geoJson(data).addTo(map);
        });
    fetch("data/LIRR/Stops.json")
        .then(function(response){
           return response.json();
        })
        .then(function(data){
            L.geoJson(data).addTo(map);
        });
//------Bus-------
    fetch("data/Bus/Routes.json")
        .then(function(response){
           return response.json();
        })
        .then(function(data){
            L.geoJson(data).addTo(map);
        });
    //look into adding fetch option 
    /*
    var promises = [];    
        promises.push(d3.csv("data/LandUse_Percentage.csv")); //load attributes from csv     
        promises.push(d3.json("data/cb_2018_us_state_5m.topojson")); //load choropleth spatial data    
        Promise.all(promises).then(getData);
    */      
    var folders=['Bus','LIRR','MetroNorth','Subway']
    for (var i in folders){
        var trips= d3.csvParse(FileHelper("data/"+folders[i]+"/trips.txt"));
        var stop_times = d3.csvParse(FileHelper("data/"+folders[i]+"/stop_times.txt"));
        //processData(trips,stop_times)
    }
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
    // too big of a dataset
    fetch("data/NYCStreetCenterline(CSCL).geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map
            streets=json.features
            L.geoJson(json).addTo(map);
        })
    fetch("data/lirr_gtfs.json")
        .then(function(response){
           return response.json();
        })
        .then(function(data){
            //L.geoJson(data.gtfs.shapes).addTo(map);
            console.log(data);
            processData(data.gtfs);
        });
        
    */
    //add layer control to toggle layers after all data has been loaded
    createSequenceControls();
    createForm();
    createDropdown();
    L.control.layers(baseMaps, overlayMaps,{ position: 'topright' }).addTo(map);
};
function processData(trips,stop_times){
    var schedule=[]
    var item={}
    for (var i in trips){
        var trip= trips[i].trip_id 
        var route= trips[i].route_id;
        item["trip"]=trip
        item["route"]=route//match each trip id to its associated routeid
        schedule.push(item)
        item={}//clear what is stored
    }
    var groupedRoute = groupBy(schedule, 'trip');

    
    var schedule2=[]
    for (var i in stop_times){
        var time=[]
        var item={}
        time.push(stop_times[i].arrival_time)
        time.push(stop_times[i].departure_time)
        var tripid=stop_times[i].trip_id
        item["time"]=time
        item["trip"]=tripid//match time to associated route id
        schedule2.push(item) 
    }
    var groupedTrip = groupBy(schedule2,'trip');
    //groupedRoute and groupedTrip have same length and order
    //add 
    for (var i in groupedRoute){
        var t=Object.values(groupedTrip[i])
        groupedRoute[i].start_time = t[0].time //first time listed
        groupedRoute[i].end_time = t[t.length-1].time //last time listed
    }
    console.log(groupedRoute)
}
/*
function processData(data){
    var schedule=[]
    var item={}
    for (var i in data.trips){
        var trips= data.trips[i].trip_id 
        var route= data.trips[i].route_id;
        item["trip"]=trips
        item["route"]=route//match each trip id to its associated routeid
        schedule.push(item)
        item={}//clear what is stored
    }
    var groupedRoute = groupBy(schedule, 'trip');

    
    var schedule2=[]
    for (var i in data.stop_times){
        var time=[]
        var item={}
        time.push(data.stop_times[i].arrival_time)
        time.push(data.stop_times[i].departure_time)
        var tripid=data.stop_times[i].trip_id
        item["time"]=time
        item["trip"]=tripid//match time to associated route id
        schedule2.push(item) 
    }
    var groupedTrip = groupBy(schedule2,'trip');
    
    //groupedRoute and groupedTrip have same length and order
    //add 
    for (var i in groupedRoute){
        var trip=Object.values(groupedTrip[i])
        groupedRoute[i].start_time = trip[0].time //first time listed
        groupedRoute[i].end_time = trip[trip.length-1].time //last time listed
    }
    //console.log(groupedRoute)
}
*/
function createSequenceControls(){
    var sequence = document.querySelector('#sequence')
    //create slider
    sequence.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')

    //add skip buttons
    sequence.insertAdjacentHTML('afterbegin', '<button class="step" id="reverse" title="Reverse">-</button>'); 
    sequence.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward">+</button>');
    
    //ADD TIME
    document.querySelector(".range-slider").max = 2022;
    document.querySelector(".range-slider").min = 1892;
    document.querySelector(".range-slider").value = 2022;
    document.querySelector(".range-slider").step = 10;

    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = parseInt(document.querySelector('.range-slider').value);

            //increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index+=10; //increase year by 10
                //wrap around from first year to last year
                index = index > 2022 ? 1892 : index;
            } else if (step.id == 'reverse'){
                index-= 10; //decrease year by 10
                //wrap around from last year to first year
                index = index < 1892 ? 2022 : index;
            };
            //update slider
        document.querySelector('.range-slider').value = index
        //show year
        updateMarker(index)
        })
    })
    // input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        // get the new index value
        var index = this.value;
        //show year
        document.querySelector('#year').innerHTML='<p>Year:' + index + '</p>'
        updateMarker(index)
    });
};
function createForm(){
    var checkBox = document.querySelector('#form')
    var dataList=['Subway','LIRR','Bus Route']
    for (i in dataList){
        checkBox.insertAdjacentHTML('beforeend', '<input type="checkbox" id="' + i +'" name="' + dataList[i] +'" value="Subway">');
        checkBox.insertAdjacentHTML('beforeend','<label for="' + i +'">' + dataList[i] + '</label><br>');
    }

}
function createDropdown(){
    //add dropdown menu
    material=document.querySelector('#dropdown')
    material.insertAdjacentHTML('beforeend','<select name="material" id="material"><option value="" selected="selected">Choose Year</option></select>')
    

}
//groupby function for processData
function groupBy(objectArray, property) {
    return objectArray.reduce((acc, obj) => {
       const key = obj[property];
       if (!acc[key]) {
          acc[key] = [];
       }
       // Add object to list for given key's value
       acc[key].push(obj);
       return acc;
    }, {});
}

function FileHelper(path){
    var request = new XMLHttpRequest();
    request.open("GET", path, false);
    request.send(null);
    var returnValue = request.responseText;

    return returnValue;
    
}
document.addEventListener('DOMContentLoaded',createMap)
