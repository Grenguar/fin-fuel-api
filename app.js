let ApiBuilder = require('claudia-api-builder'),
    api = new ApiBuilder(),
    cheerio = require('cheerio'),
    request = require('request-promise'),
    iconv = require('iconv-lite'),
    utils = require("./src/utils");

const url = 'https://www.polttoaine.net/';

/**
 * Functions for local-api-builder. 
 * This is for developing locally with 
 * command: 'npm run server'
 */
function handleGetRequest(app, req) {
    const body = {
        status: 'OK',
        body: req.body,
        pathParams: req.pathParams,
        query: req.queryString
    };
    return new app.ApiResponse(body, {
        called: 'handleGetRequest'
    }, 200);
}

function bootstrap() {
    const app = new ApiBuilder();
    app.get('/cities', handleGetRequest.bind(null, app));
    app.get('/city/{name}', handleGetRequest.bind(null, app));
    app.get('/city/{name}/cheapestgas', handleGetRequest.bind(null, app));
    return app;
}

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
            resolve(utils.getCityNames(body));
        });
    });
},{
    success: { contentType: 'application/json' },
    error: { code: 500 }
});

/**
 *
 * REST GET Stations for the chosen city/location by its name
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
    let prices = new Promise(function(resolve, reject){
        request(options, function (err, response, body) {
            if (err) return reject(err);
            body = iconv.decode(body, 'ISO-8859-1');
            resolve(utils.getGasStationsForLocation(body));
        });
    });
    return prices.then(function(prices) {
        return utils.createNewPricesArray(prices).then(function() {
          return prices;
        });
    });
},{
    success: { contentType: 'application/json' },
    error: {code: 500}
});

/**
 * REST GET Station with cheapest gas station according to param {fuelType}
 */
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
    let cheapestPrice = new Promise(function(resolve, reject){
        request(options, function (err, response, body) {
            if (err) return reject(err);
            body = iconv.decode(body, 'ISO-8859-1');
            resolve(utils.getCheapestStationForLocation(body, fuelType));
        });
    });
    return cheapestPrice.then(function(price) {
        let id = price.station.id;
        if (id === "-") {
            return price;
        }
        return utils.getCoordinatesForCheapestStation(id, price).then(function() {
            return price;
        });
    });
},{
    success: { contentType: 'application/json' },
    error: {code: 500}
});