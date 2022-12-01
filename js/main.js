//global variables
var map,
traffic,
baseMaps,
overlayMaps,
streetLayer,
congestionLayer,
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
    fetch("data/Streets.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //make data globally available
            traffic=json.features
            //create a Leaflet GeoJSON layer and add it to the map          
            streetLayer =L.geoJson(json,{
                onEachFeature:onEachFeature3,
                style:{color:'#FED976'}//default color
            }).addTo(map);
            
            //use years from traffic data to make dropdown menu
            createDropdown(traffic);
        })
/*
//--------Subway----------
    fetch("data/Subway/Routes.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map           
            L.geoJson(json,{
                onEachFeature: onEachFeature2,
                style: style
            }).addTo(map);
            
        })

    fetch("data/Subway/Stops.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map            
            L.geoJson(json,{
                onEachFeature: onEachFeature
            }).addTo(map);
            
        })

//-----Metro North------------
    fetch("data/MetroNorth/Routes.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map            
            L.geoJson(json,{
                onEachFeature:onEachFeatureRoutes,
                style:style
            }).addTo(map);
            
        })
    fetch("data/MetroNorth/Stops.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map            
            L.geoJson(json,{
                onEachFeature:onEachFeatureStops
            }).addTo(map);
            
        })
    
//-------LIRR--------
    fetch("data/LIRR/LIRR_GTFS.json")
        .then(function(response){
           return response.json();
        })
        .then(function(data){
            console.log(data)
            L.geoJson(data,{
                onEachFeature:onEachFeatureRoutes,
                style:style
            }).addTo(map);
        });
    fetch("data/LIRR/Stops.json")
        .then(function(response){
           return response.json();
        })
        .then(function(data){
            
            L.geoJson(data,{
                onEachFeature:onEachFeatureStops
            }).addTo(map);
        });
/*        
//------Bus-------
    fetch("data/Bus/Routes.json")
        .then(function(response){
           return response.json();
        })
        .then(function(data){
            L.geoJson(data,{
                onEachFeature:onEachFeature2,
                style:style
            }).addTo(map);
        });
    //look into adding fetch option 
    /*
    var promises = [];    
        promises.push(d3.csv("data/LandUse_Percentage.csv")); //load attributes from csv     
        promises.push(d3.json("data/cb_2018_us_state_5m.topojson")); //load choropleth spatial data    
        Promise.all(promises).then(getData);
    
    
    var folders=['Bus','LIRR','MetroNorth','Subway']
    for (var i in folders){
        var trips= d3.csvParse(FileHelper("data/"+folders[i]+"/trips.txt"));
        var stop_times = d3.csvParse(FileHelper("data/"+folders[i]+"/stop_times.txt"));
        processData(trips,stop_times)
    }
    /*
    
    
    fetch("data/NewYorkCityBikeRoutes.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map
            bikeRoutes=json.features
            L.geoJson(json,{
                onEachFeature:onEachFeature4
            }).addTo(map);
        })
*/
    fetch("data/CongestionZone.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map         
            congestionLayer=L.geoJson(json,{
                style:{color:'#FED976'}//default color
            }).addTo(map);
        })
        
    //add layer control to toggle layers after all data has been loaded
    createSequenceControls();
    createForm();
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
function onEachFeature(feature, layer) {
    // create html string with all properties
    var popupContent = "";

    popupContent += "<p><b>Stop:</b> " + feature.properties.stop_name + "</p>";
    if(feature.properties.stop_id[0]=='9'){//exception for 42nd shuttle
        popupContent += "<p><b>Route:</b>S</p>";
    }else if(feature.properties.stop_id[0]=='H'){//exception for Far Rockaway
        popupContent += "<p><b>Route:</b>A</p>";
    }else{
        popupContent += "<p><b>Route:</b> " + feature.properties.stop_id[0] + "</p>";
    }
    //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
    layer.bindPopup(popupContent,{maxHeight:300}).openPopup;
};
function onEachFeature2(feature, layer) {
    // create html string with all properties
    var popupContent = "";
    
    popupContent += "<p><b>Route:</b> " + feature.properties.route_shor + "</p>";
    popupContent += "<p><b>Line:</b> " + feature.properties.route_long + "</p>";
    popupContent += "<p><b>Description:</b> " + feature.properties.route_desc + "</p>";
    //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
    layer.bindPopup(popupContent,{maxHeight:300}).openPopup;
};
function onEachFeature3(feature, layer) {
    // create html string with all properties
    var popupContent = "";
    
    popupContent += "<p><b>Road:</b> " + feature.properties.Roadway_Name+ "</p>";
    //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
    layer.bindPopup(popupContent,{maxHeight:300}).openPopup;
    
};
function onEachFeature4(feature, layer) {
    // create html string with all properties
    var popupContent = "";
    
    popupContent += "<p><b>Street:</b> " + feature.properties.street + "</p>";
    //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
    layer.bindPopup(popupContent,{maxHeight:300}).openPopup;
    
};
function onEachFeatureRoutes(feature, layer) {
    // create html string with all properties
    var popupContent = "";

    popupContent += "<p><b>Line:</b> " + feature.properties.route_long + "</p>";

    //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
    layer.bindPopup(popupContent,{maxHeight:300}).openPopup;
};
function onEachFeatureStops(feature, layer) {
    // create html string with all properties
    var popupContent = "";

    popupContent += "<p><b>Stop:</b> " + feature.properties.stop_name + "</p>";
    popupContent += "<a href=" + "'" + feature.properties.stop_url + "' target='_blank'>More Information" + "</a>"
    //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
    layer.bindPopup(popupContent,{maxHeight:300}).openPopup;
};

function createSequenceControls(){
    var sequence = document.querySelector('#sequence')
    //create slider
    sequence.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')

    //add skip buttons
    sequence.insertAdjacentHTML('afterbegin', '<button class="step" id="reverse" title="Reverse">-</button>'); 
    sequence.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward">+</button>');
    
    //ADD TIME
    document.querySelector(".range-slider").max = 23;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 12;
    document.querySelector(".range-slider").step = 1;

    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = parseInt(document.querySelector('.range-slider').value);

            //increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index+=1; //increase hour by 1
                //wrap around from first hour to last hour
                index = index > 23 ? 0 : index;
            } else if (step.id == 'reverse'){
                index-= 1; //decrease hour by 1
                //wrap around from last hour to first hour
                index = index < 0 ? 23 : index;
            };
            //update slider
        document.querySelector('.range-slider').value = index
        //show current selected time of day
        //format display time
        if(index==12){
            am='12:00PM'
        }else if(index>12){
            am=index-12+':00PM'
        }else if(index==0){
            am='12:00AM'
        }else{
            am=index+':00AM'
        }
        //show year
        document.querySelector('#time').innerHTML='<p>Time:' + am +'</p>'
        updateTime(index)
        })
    })
    // input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        
        // get the new index value
        var index = this.value;
        //format display time
        if(index==12){
            am='12:00PM'
        }else if(index>12){
            am=index-12+':00PM'
        }else if(index==0){
            am='12:00AM'
        }else{
            am=index+':00AM'
        }
        //show year
        document.querySelector('#time').innerHTML='<p>Time:' + am +'</p>'
        updateTime(index)
    });
};
function createDropdown(traffic){
    //create list of unique year values
    var yearList=[]
    for(var i = 0; i < traffic.length; i++) {
        var year=traffic[i].properties.Date
    //year is always last 4 characters
    if (!yearList.includes(year.substring(year.length-4,year.length)))
    yearList.push(year.substring(year.length-4,year.length))
    yearList.sort()
    }
    //add dropdown menu
    document.querySelector('#dropdown').insertAdjacentHTML('beforeend','<select name="year" id="year"><option value="" selected="selected">Choose Year</option></select>')
    for (i in yearList){
        document.querySelector('#year').insertAdjacentHTML('beforeend','<option class="year-option">' + yearList[i] + '</option>')
        }

    //add event listener to all dropdown menu options
    document.querySelector('#year').addEventListener("change",updateTime)
}
function updateTime(index){
    var key=''
    if(index==12){
        key='F11_00_12_00PM'
    }else if(index==13){
        key='F12_00_1_00PM'
    }else if(index==1){
        key='F12_00_1_00AM'
    }else if(index==0){
        key='F11_00_12_00AM'
    }else if(index>13){
        key='F'+parseInt(index-13)+'_00_'+parseInt(index-12)+'_00PM'
    }else if(1<index<12){
        key='F'+parseInt(index-1)+'_00_'+index+'_00AM'
    }
    /*
    //first need to assign time and price fields
    congestionLayer.setStyle({color:'#FED976'})
    

    var popupContent =  "<p><b>Price:</b> " + feature.properties.street + "</p>";
    //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
    congestionLayer.bindPopup(popupContent,{maxHeight:300}).openPopup;
    */
    streetLayer.eachLayer(function (layer) {
        //input traffic counts to get colo function
        color=getColor(layer.feature.properties[key])

        layer.setStyle({color:color})
      });
   
}
//from leaflet choropleth tutorial
function getColor(d) {
    return d > 1000 ? '#800026' :
            d > 500  ? '#BD0026' :
            d > 200  ? '#E31A1C' :
            d > 100  ? '#FC4E2A' :
            d > 50   ? '#FD8D3C' :
            d > 20   ? '#FEB24C' :
            d > 10   ? '#FED976' :
                        '#FFEDA0';
}
function createForm(){
    var checkBox = document.querySelector('#form')
    var dataList=['Subway','LIRR','Bus Route','Metro North','Bike Route','Traffic']
    for (i in dataList){
        checkBox.insertAdjacentHTML('beforeend', '<input type="checkbox" id="' + dataList[i] +'" name="' + dataList[i] +'" value="'+dataList[i]+'">');
        checkBox.insertAdjacentHTML('beforeend','<label for="' + dataList[i] +'">' + dataList[i] + '</label><br>');
        document.getElementById(dataList[i]).addEventListener("change",updateMap )
    }
}
function updateMap(){
    console.log(this.checked)
    if(this.checked){
    map.addLayer(streetLayer)
    }else if(!this.checked){
    map.removeLayer(streetLayer)
    }
}


function style(feature) {
    return {
        weight: 2,
        opacity: 1,
        color: '#'+feature.properties.route_colo,
        dashArray: '3',
        fillOpacity: 0.7,
        fillColor: '#'+feature.properties.route_colo
    };
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

/*
geojson = L.geoJson(statesData, {
    style: style,
}).addTo(map);
geojsonLayer.eachLayer()
geojson.resetStyle
geojson.setStyle
//https://leafletjs.com/examples/choropleth/
*/