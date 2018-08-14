let cheerio = require('cheerio'),
    request = require('request-promise'),
    iconv = require('iconv-lite');
const url = 'https://www.polttoaine.net/';

function getCityNames(body) {
    $ = cheerio.load(body);
    let citiesList = [];
    const regExpString = /[\w-]*Valitse[\w-]*/g;
    $('select').find('option').map(function() {
        let cityName = $(this).val();
        if (!cityName.match(regExpString)) {
            citiesList.push(cityName);
        }
    });
    return {locations : citiesList};
}

function getGasStationsForLocation(body) {
    $ = cheerio.load(body);
    let prices = [];
    const priceTable = $('#Hinnat').find('.e10');
    const rows = priceTable.find('> tbody > tr');
    const regExpString = /[\w-]*E10[\w-]*/g;
    const yearNow = new Date().getFullYear();
    rows.each(function() {
        if ($(this).attr('class').match(regExpString)) {
            let values = [];
            $(this).find('td').each (function() {
                values.push($(this).text())
            });
            let jsonObj = {
                "id" : getStationId($(this)),
                "station" : values[0].replace(/\(.*\)/g, '').replace(/\u00B7/g, '').trim(),
                "lastModified" : values[1] + yearNow,
                "ninetyFive" : values[2].replace("*", ""),
                "ninetyEight" : values[3].replace("*", ""),
                "diesel" : values[4],
                "lat" : "-",
                "lon" : "-"
            };
            prices.push(jsonObj);
        }
    });
    return { stations : prices };
}

function getStationId(tableRow) {
    let coordSite = tableRow.find('> td > a').attr('href');
    return typeof coordSite == "undefined" ? "-" : coordSite.split("id=")[1];
}

function createNewPricesArray(prices) {
    let ids = getIdsFromPrices(prices);
    let newPricesArray = [];
    for(var i = 0; i < ids.length; i++) {
      newPricesArray.push(getCoordinatesWithStationId(ids[i], prices));
    }
    return Promise.all(newPricesArray);
}

function getIdsFromPrices(prices) {
    let ids = [];
    for (let key in prices.stations) {
      if (prices.stations.hasOwnProperty(key)) {
        let url = prices.stations[key].id;
          ids.push(url);
      }
    }
  return ids;
}
  
function getCoordinatesWithStationId(id, prices) {
    if (id === "-") {
        return [];
    }
    return new Promise(function(resolve, reject) {
        request({
        method: "GET",
        uri: url + "/index.php?cmd=map&id=" + id,
        json: true    
        }, function (err, response, body) {
            if (err) return reject(err);
            resolve(putCoordsToPricesArray(body, id, prices));
        });
    });
}
  
function putCoordsToPricesArray(body, id, prices) {
    $ = cheerio.load(body);
    let coordsArray = [];
    $('.centerCol').each(function() {
    let obj = $(this).find("script").attr("type","text/javascript");
    let scriptText = obj[3].children[0].data;
    coordsArray = scriptText.split(/google.maps.LatLng/)[1]
                            .match(/\(([^)]+)\)/)[1]
                            .split(", ");
    });
    setCoordsForPrices(prices, coordsArray);
    return prices;
}
  
function setCoordsForPrices(prices, coordsArray) {
    for (var key in prices.stations) {
      if (prices.stations.hasOwnProperty(key)) {
        if (prices.stations[key].id !== "-") {
          prices.stations[key].lat = coordsArray[0];
          prices.stations[key].lon = coordsArray[1];
        }
      }
    }
}

function getCheapestStationForLocation(body, fuelType) {
    $ = cheerio.load(body);
    let station = [];
    const priceTable = $('#Hinnat').find('.e10');
    const rows = priceTable.find('> tbody > tr');
    const regExpString = /[\w-]*E10[\w-]*/g;
    const yearNow = new Date().getFullYear();
    rows.each(function() {
        if ($(this).attr('class').match(regExpString)) {
            let values = [];
            $(this).find('td').each(function() {
                values.push($(this).text())
            });
            station = {
                "id" : getStationId($(this)),
                "station" : values[0].replace(/\(.*\)/g, '').replace(/\u00B7/g, '').trim(),
                "lastModified" : values[1] + yearNow,
                "fuelType" : fuelType,
                "price" : getPriceFromParsedData(fuelType, values),
                "lat" : "-",
                "lon" : "-"
            };
            return false;
        }
        return 0;
    });
    return {station : station};
}

function getCoordinatesForCheapestStation(id, price) {
    if (id === "-") {
        return [];
    }
    return new Promise(function(resolve, reject){
        request({
        method: "GET",
        uri: url + "/index.php?cmd=map&id=" + id,
        json: true    
        }, function (err, response, body) {
            if (err) return reject(err);
            resolve(putCoordsToCheapestPrice(body, price));
        });
    });
}

function putCoordsToCheapestPrice(body, price) {
    $ = cheerio.load(body);
    let coordsArray = [];
    $('.centerCol').each(function() {
    let obj = $(this).find("script").attr("type","text/javascript");
    let scriptText = obj[3].children[0].data;
    coordsArray = scriptText.split(/google.maps.LatLng/)[1]
                            .match(/\(([^)]+)\)/)[1]
                            .split(", ");
    });
    setCoordsForPrice(price, coordsArray);
    return price;
}

function setCoordsForPrice(price, coordsArray) {
    price.station.lat = coordsArray[0];
    price.station.lon = coordsArray[1];
}

function getPriceFromParsedData(type, parsedValues) {
    if (type === "95") {
        return parsedValues[2];
    } else if (type === "98") {
        return parsedValues[3];
    } else if (type === "Di") {
        return parsedValues[4];
    } else {
        return "not present"
    }
}

module.exports.getCityNames = getCityNames;
module.exports.getGasStationsForLocation = getGasStationsForLocation;
module.exports.getStationId = getStationId;
module.exports.createNewPricesArray = createNewPricesArray;
module.exports.getCheapestStationForLocation = getCheapestStationForLocation;
module.exports.getCoordinatesForCheapestStation = getCoordinatesForCheapestStation;
