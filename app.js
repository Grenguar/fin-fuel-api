require('dotenv').load();
let ApiBuilder = require('claudia-api-builder'),
    api = new ApiBuilder(),
    cheerio = require('cheerio'),
    request = require('request-promise'),
    iconv = require('iconv-lite');

const url = 'https://www.polttoaine.net/';
const token = process.env.MAP_TOKEN;

module.exports = api;

/**
 *
 * REST GET Get all available cities
 *
 **/
api.get('/cities', function () {
    'use strict';
    const options = {
        uri: url,
        json: true,
        encoding: 'latin1'
    };
    return new Promise(function(resolve, reject){
        request(options, function (err, response, body) {
            if (err) return reject(err);
            resolve(pushCitiesFromUrl(body));
        });
    });
},{
    success: { contentType: 'application/json' },
    error: { code: 500 }
});

function pushCitiesFromUrl(body) {
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

/**
 *
 * REST GET Stations of the chosen city by name
 *
**/
api.get('/city/{name}', function (req) {
    'use strict';
    const cityName = req.pathParams.name;
    const cityUrl = url + cityName;
    const options = {
        uri: cityUrl,
        json: true,
        encoding: 'latin1'
    };
    return new Promise(function(resolve, reject){
        request(options, function (err, response, body) {
            if (err) return reject(err);
            body = iconv.decode(body, 'ISO-8859-1');
            resolve(pushGasStationsForLocation(body));
        });
    });
},{
    success: { contentType: 'application/json' },
    error: {code: 500}
});

function pushGasStationsForLocation(body) {
    $ = cheerio.load(body);
    let prices = [];
    let coords = getCoordinates(body);
    const priceTable = $('#Hinnat').find('.e10');
    const rows = priceTable.find('> tbody > tr');
    const regExpString = /[\w-]*E10[\w-]*/g;
    const yearNow = new Date().getFullYear();
    //link for the map site
    // let additionalUrl = rows.find('> td > a').attr('href');
    rows.each(function() {
        if ($(this).attr('class').match(regExpString)) {
            let values = [];
            $(this).find('td').each (function() {
                values.push($(this).text())
            });
            let address = values[0].split(", ")[1];
            let coordSite = $(this).find('> td > a').attr('href');
            let jsonObj = {
                "station" : values[0].replace(/\(.*\)/g, '').replace(/\u00B7/g, '').trim(),
                "lastModified" : values[1] + yearNow,
                "ninetyFive" : values[2],
                "ninetyEight" : values[3],
                "diesel" : values[4]
            };
            prices.push(jsonObj);
        }
    });
    return {stations : prices};
}

function getAddresses(prices) {
    let addresses = [];
    for (var key in prices.stations) {
        if (prices.stations.hasOwnProperty(key)) {
            addresses.push(filterStationAddress(prices.stations[key].station));
        }
    }
    return addresses;
}

function filterStationAddress(string) {
    return string.split(', ')[1]
        .replace(/\(.*\)/g, '')
        .replace(/\[.*\]/g, '');
}

function getBodyWithCoordinates(urlEnding) {
    if (urlEnding === "-") {
      return [];
    }
    return new Promise(function(resolve, reject){
      request({
        method: "GET",
        uri: url + urlEnding,
        json: true    
      }, function (err, response, body) {
          if (err) return reject(err);
          resolve(getCoordinatesFromScript(body));
      });
    });
  }
  
  function getCoordinatesFromScript(body) {
    $ = cheerio.load(body);
    let coordsArray = [];
    $('.centerCol').each(function() {
      let obj = $(this).find("script").attr("type","text/javascript");
      let scriptText = obj[3].children[0].data;
      coordsArray = scriptText.split(/google.maps.LatLng/)[1]
                              .match(/\(([^)]+)\)/)[1]
                              .split(", ");
    });
    console.log(coordsArray);
    return coordsArray;
  }

  function setCoordsForPrices(prices, coordsArray) {
    for (var key in prices.stations) {
        if (prices.stations.hasOwnProperty(key)) {
            prices.stations[key].lat = coordsArray[0];
            prices.stations[key].lon = coordsArray[1];
        }
    }
  }

api.get('/city/{name}/cheapestgas', function(req) {
    'use strict';
    const cityName = req.pathParams.name;
    const fuelType = req.queryString.type;
    const sortedUrl = url + "index.php?kaupunki=" + cityName + "&sort=" + fuelType;
    const options = {
        uri: sortedUrl,
        json: true,
        encoding: 'latin1'
    };
    return new Promise(function(resolve, reject){
        request(options, function (err, response, body) {
            if (err) return reject(err);
            body = iconv.decode(body, 'ISO-8859-1');
            resolve(pushCheapestStationForLocation(body, fuelType));
        });
    });
},{
    success: { contentType: 'application/json' },
    error: {code: 500}
});

function pushCheapestStationForLocation(body, fuelType) {
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
            let priceValue = getPriceFromParsedData(fuelType, values);
            station = {
                "station" : values[0].replace(/\(.*\)/g, '').replace(/\u00B7/g, '').trim(),
                "lastModified" : values[1] + yearNow,
                "fuelType" : fuelType,
                "price" : priceValue
            };
            return false;
        }
        return 0;
    });
    return {station : station};
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
    return "not present";
}