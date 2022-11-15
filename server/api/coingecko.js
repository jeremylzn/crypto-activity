const axios = require('axios');

let PQueue;

(async () => {
    PQueue = (await import('p-queue')).default;
})();

const coingecko = async function coingecko(query, doRetry = true) {
    let response;

    try {
        response = await axios.get(`https://api.coingecko.com/api/v3/${query}`, {
            timeout: 30000,
        });
    } catch (error) {
        if (!doRetry) {
            throw error;
        }

        if (error.code === 'ENOTFOUND') {
            console.error(error);
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return await coingecko(query);
        }

        if (error.code === 'ETIMEDOUT') {
            console.error(error);
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return await coingecko(query);
        }

        if (error.message.startsWith('timeout of ')) {
            console.error(error);
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return await coingecko(query);
        }

        if (error.response && error.response.status === 404) {
            throw error;
        }

        if (error.response && error.response.status >= 400 && error.response.status < 600) {
            console.error(`message ${error.response.statusText}`);
            console.error(`url ${error.response.config.url}`);
            console.log('Sleep 60 sec')
            await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
            return await coingecko(query);
        }

        throw error;
    }

    if (response.data.errors && response.data.errors[0].message.startsWith('Complexity budget exhausted,')) {
        let match = response.data.errors[0].message.match(/([0-9]+) seconds$/);

        if (match) {
            let secondsToWait = parseInt(match[1]);
            console.log(`! Maximum query rate is reached. Need to wait for ${secondsToWait}s...`);
            await new Promise((resolve) => setTimeout(resolve, secondsToWait * 1000 + 1000));
            return await coingecko(query);
        }
    }

    if (response.data.errors) {
        let error = new Error('Invalid request');
        error.errors = response.data.errors;
        throw error;
    }

    if (response.data.error_code) {
        let error = new Error(response.data.error_message);
        error.code = response.data.error_code;
        error.data = response.data.error_data;
        throw error;
    }

    return response.data;
};

coingecko.getIdsList = async function () {
    list = await coingecko('coins/list');
    return list;
};

coingecko.getPriceByTimestamps = async function ({ id, currency, timestamp }) {
    let historical_response;
    let end_timestamp = timestamp + (24*60*60);

    if (`${id}_${timestamp}` in priceByTimestamp) historical_response = priceByTimestamp[`${id}_${timestamp}`];
    else historical_response = await coingecko(`coins/${id}/market_chart/range?vs_currency=${currency}&from=${timestamp}&to=${end_timestamp}`);

    console.log('historical_response :', historical_response)
    if (!historical_response) {
        throw new Error('Error in Coin Gecko');
    }

    return historical_response.prices.length ? historical_response.prices[historical_response.prices.length - 1][1] : 0;
};

coingecko.getPriceByDate = async function ({ id, currency, date }) {

    let response = await coingecko(`coins/${id}/history?date=${date}`);

    if (!response) {
        throw new Error('Error in Coin Gecko');
    }
    return response['market_data']['current_price'][currency];
};

coingecko.getCurrentPrice = async function ({ ids, currency }) {

    let response = await coingecko(`simple/price?ids=${ids}&vs_currencies=${currency}`);
    return response;
};

module.exports = coingecko;