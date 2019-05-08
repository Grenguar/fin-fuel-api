import * as cheerio from 'cheerio';
import * as request from 'request-promise';

export class Utils {
    static getCityNames(body: string): CityLocations {
        let citiesList = [];
        const regExpString: RegExp = /[\w-]*Valitse[\w-]*/g;
        const $: CheerioStatic = cheerio.load(body)
        $('select').find('option').map(function() {
            let cityName: string = <string>$(this).val();
            if (!cityName.match(regExpString)) {
                citiesList.push(cityName);
            }
        });
        let cityLocations: CityLocations = {locations: citiesList}
        return cityLocations;
    }
    
}

export interface CityLocations {
    locations: string[]
}