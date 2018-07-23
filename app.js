let ApiBuilder = require('claudia-api-builder'),
    api = new ApiBuilder(),
    cheerio = require('cheerio'),
    request = require('request-promise');
const url = 'https://www.polttoaine.net/';

module.exports = api;

api.get('/cities', function () {
    'use strict';
    const options = {
        uri: url,
        json: true
    };
    return new Promise(function(resolve, reject){
        request(options, function (err, response, body) {
            if (err) return reject(err);
            resolve(pushCitiesFromUrl(body));
        });
    });
},{
    success: { contentType: 'application/json' },
    error: {code: 500}
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

api.get('/city/{name}', function (req) {
    'use strict';
    const cityName = req.pathParams.name;
    const cityUrl = url + cityName;
    const options = {
        uri: cityUrl,
        json: true
    };
    return new Promise(function(resolve, reject){
        request(options, function (err, response, body) {
            if (err) return reject(err);
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
                "station" : values[0].replace(/[^\x20-\x7E]+/g, ''),
                "lastModified" : values[1] + yearNow,
                "ninetyFive" : values[2],
                "ninetyEight" : values[3],
                "diesel" : values[4]
            }
            prices.push(jsonObj);
        }
    });
    return {stations : prices};
}