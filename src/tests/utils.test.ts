import {Utils, CityLocations} from "../utils";
import {testHtml, testHtmlLocationTable} from "./htmls"


let exp = expect as jest.Expect;

if (Utils) {
    describe("Testing Utils class", () => {
        test('Utils is available as a named export from ../utils.ts', () => {
            exp(Utils).toBeDefined();
        });
        
        test('get city locations returns correct number of elements', () => {
            let cityNames: CityLocations = Utils.getCityNames(testHtml);
            exp(cityNames.locations).toHaveLength(14)
        })
    })
}