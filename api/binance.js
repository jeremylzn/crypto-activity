const axios = require('axios');
var crypto = require('crypto');
const qs = require('qs');

let PQueue;

(async () => {
    PQueue = (await import('p-queue')).default;
})();

const binance = async function binance(apiKey, secretKey, query, data = {}, signed=false, doRetry = true) {
    let response;
    
    const APIKEY = apiKey;
    const APISECRET = secretKey;

    const dataQueryString = qs.stringify(data);
    const signature = crypto.createHmac('sha256', APISECRET).update(dataQueryString).digest("hex");
    let config = {
        headers: {
            'X-MBX-APIKEY': APIKEY,
        },
        timeout: 30000
    }
    let url = `https://api.binance.com/${query}?`
    if (Object.keys(data).length !== 0) url += `${dataQueryString}&`
    if (signed) url += `signature=${signature}`

    console.log(`@ API url : ${url}`)
    try {
        response = await axios.get(url, config);
    } catch (error) {
        if (!doRetry) {
            throw error;
        }

        console.log(error)
        throw new Error(error);
    }

    return response.data;
};

binance.getStackingProductList = async function ({ apiKey, secretKey }) {
    const data = { recvWindow: 20000, timestamp: Date.now(), product: "STAKING" }
    let query = 'sapi/v1/staking/productList'
    return await binance(apiKey, secretKey, query, data, true);
};

// Get Stacking Earn Wallet
binance.getStackingProductPosition = async function ({ apiKey, secretKey }) {
    const data = { recvWindow: 20000, timestamp: Date.now(), product: "STAKING" }
    let query = 'sapi/v1/staking/position'
    return await binance(apiKey, secretKey, query, data, true);
};

// Get Saving Earn Wallet
binance.getSavingProductPosition = async function ({ apiKey, secretKey }) {
    const data = { recvWindow: 20000, timestamp: Date.now() }
    let query = 'sapi/v1/lending/daily/token/position'
    return await binance(apiKey, secretKey, query, data, true);
};

binance.getLendingAccount = async function ({ apiKey, secretKey }) {
    const data = { recvWindow: 20000, timestamp: Date.now() }
    let query = 'sapi/v1/lending/union/account'
    return await binance(apiKey, secretKey, query, data, true);
};

// Get Prices By Symbols
binance.getPrices = async function (params = false, { apiKey, secretKey }) {
    let query = 'api/v3/ticker/price'
    return (params) ? await binance(apiKey, secretKey, query, params) : await binance(apiKey, secretKey, query);
};

// Get Balance SPOT
binance.getAccountInfos = async function ({ apiKey, secretKey }) {
    const data = { recvWindow: 20000, timestamp: Date.now() }
    let query = 'api/v3/account'
    return await binance(apiKey, secretKey, query, data, true);
};

binance.currentOpenOrders = async function ({ apiKey, secretKey }) {
    const data = { recvWindow: 20000, timestamp: Date.now() }
    let query = 'api/v3/openOrders'
    return await binance(apiKey, secretKey, query, data, true);
};


module.exports = binance;
