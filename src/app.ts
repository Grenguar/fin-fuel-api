import ApiBuilder from 'claudia-api-builder';
import request from 'request-promise';
import iconv_lite from 'iconv-lite';
import {Parser} from './parser'

const api : any = new ApiBuilder();
const url: string = 'https://www.polttoaine.net/';
const parser = new Parser(url);


api.get('/', () => 'Hello world');

api.get('/cities', () => {
    const options = {
        uri: url,
        json: true,
        encoding: 'latin1'
    }
    return new Promise((resolve, reject) => {
        request(options, (err, response, body) => {
            if (err) return reject(err);
            resolve(parser.getCityNames(body));
        })
    })
}, {
    success: { contentType: 'application/json' },
    error: { code: 500 }
})

export = api;