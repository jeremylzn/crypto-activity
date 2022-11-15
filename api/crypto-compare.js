const axios = require('axios');

let PQueue;

(async () => {
    PQueue = (await import('p-queue')).default;
})();

const cryptocompare = async function cryptocompare(query, doRetry = true) {
    let response;

    try {
        response = await axios.get(`https://min-api.cryptocompare.com/${query}&api_key=${process.env.API_KEY_CRYPTOCOMPARE}`, {
            timeout: 30000,
        });
    } catch (error) {
        if (!doRetry) {
            throw error;
        }

        if (error.response && error.response.status === 404) {
            throw error;
        }

        throw error;
    }

    return response.data;
};

cryptocompare.getPriceBySymbol = async function ({ fsymbols, tsymbols }) {

    let response = await cryptocompare(`data/pricemulti?fsyms=${fsymbols.join(',')}&tsyms=${tsymbols.join(',')}`);
    return response;
};

module.exports = cryptocompare;