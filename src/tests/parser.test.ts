import {Parser, CityLocations, Stations} from "../parser";
import {testHtml, testHtmlLocationTable} from "./htmls"

let exp = expect as jest.Expect;
const url: string = 'https://www.polttoaine.net/';

if (Parser) {
    describe("Testing Utils class", () => {
        test('Utils is available as a named export from ../utils.ts', () => {
            exp(Parser).toBeDefined();
        })
        
        test('get city locations returns correct number of elements', () => {
            let parser: Parser = new Parser(url); 
            let cityNames: CityLocations = parser.getCityNames(testHtml);
            exp(cityNames.locations).toHaveLength(14)
        })

        test('get Gas Stations For Location', () => {
            let parser: Parser = new Parser(url);
            let stations: Stations = parser.getGasStationsForLocation(testHtmlLocationTable)
        })
    })
}