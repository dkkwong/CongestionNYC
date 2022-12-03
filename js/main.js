//global variables
var map,
traffic,
scenario,
baseMaps,
overlayMaps,
timeIndex=12,
streetLayer,
congestionLayer,
trafficType='Max',
subwayLayer=L.layerGroup(),
metroNorthLayer=L.layerGroup(),
lirrLayer=L.layerGroup(),
busLayer=L.layerGroup(),
bikeLayer=L.layerGroup(),
pathLayer=L.layerGroup(),
dataList; 

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
        center: [40.7348, -73.9838],
        zoom: 13,
        minZoom: 9, //constrain zoom so users can't zoom out beyond default
        maxZoom: 19, //constrain zoom so users can only zoom in 2 levels beyond default
        maxBounds: bounds,
        layers: [CartoDB_DarkMatter],
        zoomControl: false,
        renderer: L.canvas({ tolerance: 10 })//how close to something you need to clock
    });
    L.control.zoom({position:'topright'}).addTo(map)
    //scale bar
    L.control.scale({ position: 'bottomleft' }).addTo(map);
    baseMaps = {
        //name in legend      associated layer
        "Basemap": CartoDB_DarkMatter,
        "Satellite": Esri_WorldImagery
    };
    info = L.control({position: 'topleft'}),
    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    info.update = function (props) {
        this._div.innerHTML = '<h4>Congestion Pricing Scenario</h4>' +  (props ?
            '<b>Scenario: ' + props.Name + '</b>'+'<br>Peak price(6am-8pm): $'+
            props.Peak+'<br>Off-Peak price(8pm-10pm): $'+props.OffPeak+'<br>Overnight price(10pm-6am): $'+props.Overnight+'<br>'+props.description 
            : 'Choose from dropdown menu');
    };

    info.addTo(map);
    map.doubleClickZoom.disable ()
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
            var subwayRoute=L.geoJson(json,{
                onEachFeature: onEachFeature2,
                style: style,
                renderer: L.canvas({ tolerance: 10 })//how close to something you need to clock
            });
        subwayLayer.addLayer(subwayRoute)
        })

    fetch("data/Subway/Stops.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map            
            var subwayStop=L.geoJson(json,{
                onEachFeature: onEachFeature,
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng,{clickable: true,icon: L.icon({
                        iconUrl: 'img/stop.svg',
                        iconSize: [10, 10], // size of the icon
                    })})
                },
                renderer: L.canvas({ tolerance: 10 })//how close to something you need to clock
            });
        subwayLayer.addLayer(subwayStop)
        })

//-----Metro North------------
    fetch("data/MetroNorth/Routes.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            console.log(json)
            //create a Leaflet GeoJSON layer and add it to the map            
            var northRoute=L.geoJson(json,{
                onEachFeature:onEachFeaturePath,
                style:stylePath,
            });
            
        metroNorthLayer.addLayer(northRoute)
        })
    fetch("data/MetroNorth/Stops.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map            
            var northStop=L.geoJson(json,{
                onEachFeature:onEachFeatureStops,
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng,{clickable: true,icon: L.icon({
                        iconUrl: 'img/Path.svg',
                        iconSize: [12, 12], // size of the icon
                    })})
                },
                renderer: L.canvas({ tolerance: 10 })//how close to something you need to clock
            });
        metroNorthLayer.addLayer(northStop)    
        })
//-------PATH--------
    fetch("data/PATH/Routes.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map            
            var pathRoute=L.geoJson(json,{
                onEachFeature:onEachFeaturePath,
                style:stylePath,
                renderer: L.canvas({ tolerance: 10 })//how close to something you need to clock
            });
        pathLayer.addLayer(pathRoute)
        })
    fetch("data/PATH/Stops.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map            
            var pathStop=L.geoJson(json,{
                onEachFeature:onEachFeatureStops,
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng,{clickable: true,icon: L.icon({
                        iconUrl: 'img/Path.svg',
                        iconSize: [9, 9], // size of the icon
                    })})
                },
                renderer: L.canvas({ tolerance: 10 })//how close to something you need to clock
            });
        pathLayer.addLayer(pathStop)    
        })    
//-------LIRR--------
    fetch("data/LIRR/LIRR_GTFS.json")
        .then(function(response){
           return response.json();
        })
        .then(function(data){
            var lirrRoute=L.geoJson(data,{
                onEachFeature:onEachFeatureRoutes,
                style:style,
                renderer: L.canvas({ tolerance: 10 })//how close to something you need to clock
            });
        lirrLayer.addLayer(lirrRoute)
        });
    fetch("data/LIRR/Stops.json")
        .then(function(response){
           return response.json();
        })
        .then(function(data){
            
            var lirrStop=L.geoJson(data,{
                onEachFeature:onEachFeatureStops,
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng,{clickable: true,icon: L.icon({
                        iconUrl: 'img/Path.svg',
                        iconSize: [12, 12], // size of the icon
                    })})
                },
                renderer: L.canvas({ tolerance: 10 })//how close to something you need to clock
            });
        lirrLayer.addLayer(lirrStop) 
        });
        
        
//------Bus-------
    fetch("data/Bus/Routes.json")
        .then(function(response){
           return response.json();
        })
        .then(function(data){
            var busRoute=L.geoJson(data,{
                onEachFeature:onEachFeature2,
                style:style,
                renderer: L.canvas({ tolerance: 5 })//how close to something you need to clock
            });
        busLayer.addLayer(busRoute)
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
    
 */   
    fetch("data/NewYorkCityBikeRoutes.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create a Leaflet GeoJSON layer and add it to the map
            var bikeRoute=L.geoJson(json,{
                onEachFeature:onEachFeature4,
                style:{color:'#1aa342'},
                renderer: L.canvas({ tolerance: 5 })//how close to something you need to clock
            });
        bikeLayer.addLayer(bikeRoute)
        })
    fetch("data/Streets.json")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //make data globally available
            traffic=json.features
            //create a Leaflet GeoJSON layer and add it to the map          
            streetLayer =L.geoJson(json,{
                onEachFeature:onEachFeature3
            }).addTo(map);
            //add default color for 12pm
            streetLayer.eachLayer(function (layer) {
                //input traffic counts to get color function
                color=getColor(layer.feature.properties['F11_00_12_00PM'])
        
                layer.setStyle({color:color,weight:5})
              });
            //use years from traffic data to make dropdown menu
            //createDropdownTraffic(traffic);
        })

    fetch("data/CongestionZone.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var congestion=json
            //create a Leaflet GeoJSON layer and add it to the map         
            congestionLayer=L.geoJson(json,{
                style:{color:'#FED976'}//default color
            }).addTo(map);
            //add pop-up content
            congestionLayer.bindPopup('Congestion Zone',{maxHeight:300}).openPopup;
            //add congestion pricing scenarios
            congestion.A={Name:'A',Peak:9,OffPeak:7,Overnight:5,description:'Base plan with no exemptions'}
            congestion.B={Name:'B',Peak:10,OffPeak:8,Overnight:5,description:'Taxis and for hire vehicles charged max once per day'}
            congestion.C={Name:'C',Peak:14,OffPeak:11,Overnight:7,description:'Drivers receive $6.55 credit for using tunnels. Taxis exempt from toll but for hire vehicles are not'}
            congestion.D={Name:'D',Peak:19,OffPeak:14,Overnight:10,description:'Drivers receive $13.10 credit for using tunnels. No vehicle exemptions'}
            congestion.E={Name:'E',Peak:23,OffPeak:17,Overnight:12,description:'Drivers receive $13.10 credit for using tunnels.Taxis exempt from tolls. For hire vehicles charged max 3 times per day'}
            congestion.F={Name:'F',Peak:12,OffPeak:9,Overnight:7,description:'More expensive base plan. No exemptions of any kind'}
        createDropdownZone(congestion)
        })

    createControls();
    createSequenceControls();
    createForm();
    createLegend();
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
    if(!feature.properties.OBJECTID){//PATH stops have no links
    popupContent += "<a href=" + "'" + feature.properties.stop_url + "' target='_blank'>More Information" + "</a>"
    }
    //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
    layer.bindPopup(popupContent,{maxHeight:300}).openPopup;
};
function onEachFeaturePath(feature, layer) {
    // create html string with all properties
    var popupContent = "";

    popupContent += "<p><b>Line:</b> " + feature.properties.route_long_name + "</p>";

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
        formatTime(index);
        updateTime(index)
        info.update(scenario)
        timeIndex=index
    return timeIndex
        })
    })
    // input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        
        // get the new index value
        var index = this.value;
        formatTime(index);
        updateTime(index);
        info.update(scenario);
        timeIndex=index
    return timeIndex
    });
};
function formatTime(index){
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
    document.querySelector('#time').innerHTML='<h5><b>Time:</b>' + am +'</h5>'
    return am
}
function createDropdownZone(congestion){
    //create list of unique year values
    congestionList=['A','B','C','D','E','F']    
    //add dropdown menu
    document.querySelector('#dropdown').insertAdjacentHTML('beforeend','<select name="congestion" id="congestion"><option value="" selected="selected">Choose Scenario</option></select>')
    for (i in congestionList){
        document.querySelector('#congestion').insertAdjacentHTML('beforeend','<option class="congestion-option">' + congestionList[i] + '</option>')
        }
    //add event listener to all dropdown menu options
    document.querySelector('#congestion').addEventListener("change",function(event){
        var key=document.querySelector('#congestion').value
        scenario=congestion[key]
        info.update(congestion[key])
        return scenario//make globally available
    })
}/*
function createDropdownTraffic(traffic){
    
    //create list of unique year values
    var yearList=[]
    for(var i = 0; i < traffic.length; i++) {
        var date=traffic[i].properties.Date
    //year is always last 4 characters
    if (!yearList.includes(date.substring(date.length-4,date.length)))
    yearList.push(date.substring(date.length-4,date.length))
    yearList.sort()
    }
    //add dropdown menu
    document.querySelector('#dropdown').insertAdjacentHTML('beforeend','<select name="year" id="year"><option value="" selected="selected">Choose Year</option></select>')
    for (i in yearList){
        document.querySelector('#year').insertAdjacentHTML('beforeend','<option class="year-option">' + yearList[i] + '</option>')
        }
        document.querySelector('#year').insertAdjacentHTML('beforeend','<option class="year-option">All Years</option>')
        
        document.querySelector('#dropdown').insertAdjacentHTML('beforeend','<select name="year" id="year"><option value="" selected="selected">Choose Traffic Type</option></select>')
        document.querySelector('#year').insertAdjacentHTML('beforeend','<option class="year-option">Max</option>')
        document.querySelector('#year').insertAdjacentHTML('beforeend','<option class="year-option">Average</option>')
        document.querySelector('#year').insertAdjacentHTML('beforeend','<option class="year-option">Minimum</option>')
    //add event listener to all dropdown menu options
    document.querySelector('#year').addEventListener("change",function(){
        trafficType= this.value
        console.log(trafficType)
        updateTime(timeIndex)
        return trafficType//globally set the year
        
    })
}*/
function updateTime(index){
    var id=''
    if(index==12){
        id='F11_00_12_00PM'
    }else if(index==13){
        id='F12_00_1_00PM'
    }else if(index==1){
        id='F12_00_1_00_AM'
    }else if(index==0){
        id='F11_00_12_00AM'
    }else if(index>13){
        id='F'+parseInt(index-13)+'_00_'+parseInt(index-12)+'_00PM'
    }else if(1<index<12){
        id='F'+parseInt(index-1)+'_00_'+index+'_00AM'
    }
    //update traffic color by time of day
    var time=formatTime(index)
    dateList=[]
    trafficList=[]
    for(var i = 0; i < traffic.length; i++) {
    trafficList.push(traffic[i].properties)
    }
    var streetGroup=groupBy(trafficList,'SegmentID')
    streetLayer.eachLayer(function (layer) {//loop through each item in the street layer
        color=getColor(layer.feature.properties[id])
        layer.setStyle({color:color})
        var popupContent = "";//add pop-ups to displayed streets

            popupContent += "<p><b>Road:</b> " + layer.feature.properties.Roadway_Name+ "</p>";
            popupContent += "<p><b>Traffic Count:</b> " + layer.feature.properties[id]+ "</p>";
            popupContent += "<p><b>Time:</b> " + time+ "</p>";
        //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
        layer.bindPopup(popupContent,{maxHeight:300}).openPopup;
        //trafficList.push(layer.feature.properties)
        /*
        var date=layer.feature.properties.Date
        layer.removeFrom(map)
        if ((year==date.substring(date.length-4,date.length))){//add only years matching chosen date to map
            color=getColor(layer.feature.properties[id])
            layer.setStyle({color:color})
            var popupContent = "";//add pop-ups to displayed streets
    
            popupContent += "<p><b>Road:</b> " + layer.feature.properties.Roadway_Name+ "</p>";
            popupContent += "<p><b>Traffic Count:</b> " + layer.feature.properties[id]+ "</p>";
            popupContent += "<p><b>Time:</b> " + time+ "</p>";
            //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
            layer.bindPopup(popupContent,{maxHeight:300}).openPopup;
            layer.addTo(map) 
        }*/
    });
    /*
    var trafficMax=[]
    var trafficMin=[]
    var trafficAverage=[]
    var streetGroup=groupBy(trafficList,'SegmentID')
    for(key in streetGroup){
        //calculate max,min, and average values for each street
        average=0
        for(var i = 0; i < streetGroup[key].length; i++) {
            max = streetGroup[key][0][id]
            if(streetGroup[key][i][id]>max){
            max=(streetGroup[key][i][id])
            }
            min=streetGroup[key][0][id]
            if(streetGroup[key][i][id]<min){
            min=(streetGroup[key][i][id])
            }
            average+=parseInt(streetGroup[key][i][id])
        }
        var popupContent = "";//add pop-ups to displayed streets
        if(trafficType='Max'){
            color=getColor(max);
            popupContent += "<p><b>Traffic Count:</b> " + max+ "</p>";
        }else if(trafficType='Min'){
            color=getColor(min);
            popupContent += "<p><b>Traffic Count:</b> " + min+ "</p>";
        }else if(trafficType='Average'){
            color=getColor(average);
            popupContent += "<p><b>Traffic Count:</b> " + average+ "</p>";
        }
        if(layer.feature.properties.SegmentID==key){
            layer.setStyle({color:color})

            popupContent += "<p><b>Road:</b> " + layer.feature.properties.Roadway_Name+ "</p>";
            popupContent += "<p><b>Time:</b> " + time+ "</p>";
            //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
            layer.bindPopup(popupContent,{maxHeight:300}).openPopup;
        }

    }
    
    streetLayer.eachLayer(function (layer) {//loop through each item in the street layer
        layer.removeFrom(map)
        var popupContent = "";//add pop-ups to displayed streets
        if(trafficType='Max'){
            color=getColor(max);
            popupContent += "<p><b>Traffic Count:</b> " + max+ "</p>";
        }else if(trafficType='Min'){
            color=getColor(min);
            popupContent += "<p><b>Traffic Count:</b> " + min+ "</p>";
        }else if(trafficType='Average'){
            color=getColor(average);
            popupContent += "<p><b>Traffic Count:</b> " + average+ "</p>";
        }
        console.log(color)
        layer.setStyle({color:color})

        popupContent += "<p><b>Road:</b> " + layer.feature.properties.Roadway_Name+ "</p>";
        popupContent += "<p><b>Time:</b> " + time+ "</p>";
        //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
        layer.bindPopup(popupContent,{maxHeight:300}).openPopup;
        layer.addTo(map)
    })*/
}
//from leaflet choropleth tutorial
function getColor(d) {
    return  d > 2500  ? '#bd0026' : //from color brewer YlOR 5 classes
            d > 500  ? '#f03b20' :
            d > 100   ? '#fd8d3c' :
            d > 10   ? '#fecc5c' :
            d > 0   ? '#ffffb2' :
                        '#ffffb2';
}
//add control panel
function createControls(){
    var controls = L.control({position: 'bottomleft'});

    controls.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'controls')
        div.innerHTML+='<div id="time"><h5><b>Time:</b>12:00PM</h5></div>'
        div.innerHTML+='<div id="sequence"></div><br>'
        div.innerHTML+='<div id="dropdown"></div><br>'
        div.innerHTML+='<div id="formTitle"><h5>Add Data</h5></div>'
        div.innerHTML+='<div id="form"></div>'
        return div;
    };

    controls.addTo(map);
    // Disable dragging when user's cursor enters the element
    controls.getContainer().addEventListener('mouseover', function () {
        map.dragging.disable();
    });

    // Re-enable dragging when user's cursor leaves the element
    controls.getContainer().addEventListener('mouseout', function () {
        map.dragging.enable();
    });

}
function createLegend(){
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 10, 100, 500, 2500],
            labels = ['<b>Traffic Counts</b>'];
        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                labels.push(
                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+'));
        }
        div.innerHTML = labels.join('<br>');
        return div;
    };
    legend.addTo(map);
}
function createForm(){
    var checkBox = document.querySelector('#form')
    var unchecked=['Subway','LIRR','Bus Route','Metro North','Bike Route','PATH']
    var checked=['Traffic']
    for (i in checked){
        checkBox.insertAdjacentHTML('beforeend', '<input type="checkbox" id="' + checked[i] +'" name="' + checked[i] +'" value="'+checked[i]+'"checked>')
        checkBox.insertAdjacentHTML('beforeend','<label for="' + checked[i] +'"><h6>' + checked[i] + '</h6></label><br>')
        
        document.getElementById(checked[i]).addEventListener("change",updateMap )
    }
    for (i in unchecked){
        checkBox.insertAdjacentHTML('beforeend', '<input type="checkbox" id="' + unchecked[i] +'" name="' + unchecked[i] +'" value="'+unchecked[i]+'">');
        checkBox.insertAdjacentHTML('beforeend','<label for="' + unchecked[i] +'"><h6>' + unchecked[i] + '</h6></label><br>');
        
        document.getElementById(unchecked[i]).addEventListener("change",updateMap )
    }
}
function updateMap(){
    //layer control
    if(this.value=='Bike Route'){
        if(this.checked){
            map.addLayer(bikeLayer)
        }else if(!this.checked){
            map.removeLayer(bikeLayer)
        }
    }
    if(this.value=='Subway'){
        if(this.checked){
            map.addLayer(subwayLayer)
        }else if(!this.checked){
            map.removeLayer(subwayLayer)
        }
    }
    if(this.value=='LIRR'){
        if(this.checked){
            map.addLayer(lirrLayer)
        }else if(!this.checked){
            map.removeLayer(lirrLayer)
        }
    }
    if(this.value=='Metro North'){
        if(this.checked){
            map.addLayer(metroNorthLayer)
        }else if(!this.checked){
            map.removeLayer(metroNorthLayer)
        }
    }
    if(this.value=='Traffic'){
        if(this.checked){
            map.addLayer(streetLayer)
        }else if(!this.checked){
            map.removeLayer(streetLayer)
        }
    }
    if(this.value=='Congestion Zone'){
        if(this.checked){
            map.addLayer(congestionLayer)
        }else if(!this.checked){
            map.removeLayer(congestionLayer)
        }
    }
    if(this.value=='Bus Route'){
        if(this.checked){
            map.addLayer(busLayer)
        }else if(!this.checked){
            map.removeLayer(busLayer)
        }
    }
    if(this.value=='PATH'){
        if(this.checked){
            map.addLayer(pathLayer)
        }else if(!this.checked){
            map.removeLayer(pathLayer)
        }
    }
    streetLayer.bringToFront();
}

//default style for layers
function style(feature) {
    return {
        weight: 2,
        opacity: 1,
        color: '#'+feature.properties.route_colo,
        fillOpacity: 0.7,
        fillColor: '#'+feature.properties.route_colo
    };
}
function stylePath(feature) {

    return {
        weight: 2,
        opacity: 1,
        color: '#'+feature.properties.route_color,
        fillOpacity: 0.7,
        fillColor: '#'+feature.properties.route_color
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
https://leafletjs.com/examples/custom-icons/
https://gis.stackexchange.com/questions/75590/setstyle-function-for-geojson-features-leaflet
*/