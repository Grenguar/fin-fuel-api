import * as cheerio from 'cheerio';
import * as request from 'request-promise';

export class Parser {

    url: string;

    constructor(url: string) {
        this.url = url;
    }

    getCityNames(body: string): CityLocations {
        let citiesList = [];
        const regExpString: RegExp = /[\w-]*Valitse[\w-]*/g;
        const $: CheerioStatic = cheerio.load(body);
        $('select').find('option').map(function() {
            let cityName: string = <string>$(this).val();
            if (!cityName.match(regExpString)) {
                citiesList.push(cityName);
            }
        });
        let cityLocations: CityLocations = {locations: citiesList}
        return cityLocations;
    }

    getStationId(tableRow: Cheerio): string {
        let coordSite = tableRow.find('> td > a').attr('href');
        return typeof coordSite == "undefined" ? "-" : coordSite.split("id=")[1];
    }

    // function getGasStationsForLocation(body) {
    //     $ = cheerio.load(body);
    //     let prices = [];
    //     const priceTable = $('#Hinnat').find('.e10');
    //     const rows = priceTable.find('> tbody > tr');
    //     const regExpString = /[\w-]*E10[\w-]*/g;
    //     const yearNow = new Date().getFullYear();
    //     rows.each(function() {
    //         if ($(this).attr('class').match(regExpString)) {
    //             let values = [];
    //             $(this).find('td').each (function() {
    //                 values.push($(this).text())
    //             });
    //             let jsonObj = {
    //                 "id" : getStationId($(this)),
    //                 "station" : values[0].replace(/\(.*\)/g, '').replace(/\u00B7/g, '').trim(),
    //                 "lastModified" : values[1] + yearNow,
    //                 "ninetyFive" : values[2].replace("*", ""),
    //                 "ninetyEight" : values[3].replace("*", ""),
    //                 "diesel" : values[4],
    //                 "lat" : "-",
    //                 "lon" : "-"
    //             };
    //             prices.push(jsonObj);
    //         }
    //     });
    //     return { stations : prices };
    // }
    
    getGasStationsForLocation(body: string): Stations {
        const $: CheerioStatic = cheerio.load(body);
        console.log($.html())
        let prices = [];
        const priceTable: Cheerio = $('#Hinnat').find('.e10');
        const rows: Cheerio = priceTable.find('> tbody > tr');
        const regExpString: RegExp = /[\w-]*E10[\w-]*/g;
        const yearNow: number = new Date().getFullYear();
        rows.each((() => {
            if ($(this).attr('class').match(regExpString)) {
                let values: string[] = [];
                $(this).find('td').each (function() {
                    values.push($(this).text())
                });
                let stationId: string = this.getStationId($(this))
                let gasPrice: GasPrice = {
                    id: stationId,
                    station: values[0].replace(/\(.*\)/g, '').replace(/\u00B7/g, '').trim(),
                    lastModified: values[1] + yearNow,
                    ninetyFive: values[2].replace("*", ""),
                    ninetyEight: values[3].replace("*", ""),
                    diesel: values[4],
                    lat: "-",
                    lon: "-"
                }
                prices.push(gasPrice);
            }
        }));
        let stations: Stations = { stations: prices}
        return stations;
    }
}

export interface CityLocations {
    locations: string[]
}

export interface Stations {
    stations: GasPrice[]
}

export interface GasPrice {
    id: string
    station: string,
    lastModified: string,
    ninetyFive: string,
    ninetyEight: string,
    diesel: string,
    lat: string,
    lon: string
}