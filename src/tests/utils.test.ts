import {Utils, CityLocations} from "../utils";

const testHtml: string = "<div><select name='kaupunki' onchange='javascript:kaupunki_haku.submit()'><option>Valitse kaupunki/Tie</option><option value='1-tie'>1-tie</option><option value='10-tie'>10-tie</option><option value='11-tie'>11-tie</option><option value='110-tie'>110-tie</option><option value='12-tie'>12-tie</option><option value='120-tie'>120-tie</option><option value='13-tie'>13-tie</option><option value='130-tie'>130-tie</option><option value='14-tie'>14-tie</option><option value='140-tie'>140-tie</option><option value='15-tie'>15-tie</option><option value='17-tie'>17-tie</option><option value='18-tie'>18-tie</option><option value='19-tie'>19-tie</option></select></div>";

let exp = expect as jest.Expect;

if (Utils) {
    test('Utils is available as a named export from ../utils.ts', () => {
        exp(Utils).toBeDefined();
    });
    
    test('get city locations returns', () => {
        let cityNames: CityLocations = Utils.getCityNames(testHtml);
        exp(cityNames.locations).toHaveLength(14)
    })
}