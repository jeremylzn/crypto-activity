const axios = require('axios');

let PQueue;

(async () => {
    PQueue = (await import('p-queue')).default;
})();

const etherscan = async function etherscan(blockchain_url, query, doRetry = true) {
    let response;
    let url = `https://api.${blockchain_url}/api?${query}`
    console.log(`@ URL API : ${url}`)
    try {
        response = await axios.get(url, {
            timeout: 30000,
        });
    } catch (error) {
        if (!doRetry) {
            throw error;
        }

        if (error.code === 'ENOTFOUND') {
            console.error('error.code :', error.code);
            console.log('Sleep 5 sec')
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return await etherscan(blockchain_url, query);
        }

        if (error.code === 'ETIMEDOUT') {
            console.error('error.code :', error.code);
            console.log('Sleep 5 sec')
            await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
            return await etherscan(blockchain_url, query);
        }

        if (error.code === 'ECONNABORTED') {
            console.error('error.code :', error.code);
            console.log('Sleep 5 sec')
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return await etherscan(blockchain_url, query);
        }

        if (error.message.startsWith('timeout of ')) {
            console.error(error);
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return await etherscan(blockchain_url, query);
        }

        if (error.response && error.response.status === 404) {
            throw error;
        }

        if (error.response && error.response.status >= 400 && error.response.status < 600) {
            console.error(`Error : ${error}`);
            console.log('Sleep 30 sec')
            await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
            return await etherscan(blockchain_url, query);
        }


        if (error.isAxiosError) {
            console.error(`isAxiosError Error : ${error}`);
            console.log('Sleep 10 sec')
            await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
            return await etherscan(blockchain_url, query);
        }

        console.log(error)
        throw new Error(error.message);
    }


    if (response.data.status == '0' && response.data.message == 'NOTOK' && response.data.result == 'Max rate limit reached') {
        console.error(`Error : `, response.data);
        console.log('Sleep 5 sec')
        await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
        return await etherscan(blockchain_url, query);
    }

    if (response.data.status === '0' && response.data.message != 'No transactions found') {
        console.error(`Error : `, response.data);
        console.log('Sleep 30 sec')
        await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
        return await etherscan(blockchain_url, query);
    }

    if (response.data.errors && response.data.errors[0].message.startsWith('Complexity budget exhausted,')) {
        let match = response.data.errors[0].message.match(/([0-9]+) seconds$/);

        if (match) {
            let secondsToWait = parseInt(match[1]);
            console.log(`! Maximum query rate is reached. Need to wait for ${secondsToWait}s...`);
            await new Promise((resolve) => setTimeout(resolve, secondsToWait * 1000 + 1000));
            return await etherscan(blockchain_url, query);
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

etherscan.getInternalTransactions = async function ({ address, start_block, page, url, api_key, result, end_block = false }) {

    let offset = 10000

    let query = `module=account&action=txlistinternal&address=${address}&startblock=${start_block}&page=${page}&offset=${offset}&sort=asc&apikey=${api_key}`
    if (end_block) query+= `&endblock=${end_block}`

    let response = await etherscan(url, query);
    
    result.push(...response["result"]);


    if (response["result"].length == offset) {
        start_block = parseInt(result[result.length - 1]['blockNumber'])
        await this.getInternalTransactions({ address : address, start_block : start_block, page : 1, url:url, api_key:api_key, result:result, end_block:end_block });
    }

    return result;
};

etherscan.getInternalTransactionsByTxHash = async function ({ hash, url, api_key }) {
    let query = `module=account&action=txlistinternal&txhash=${hash}&apikey=${api_key}`
    let response = await etherscan(url, query);
    return response["result"];
};

etherscan.getTransactionsByTxHash = async function ({ hash, url, api_key }) {
    let query = `module=account&action=txlist&txhash=${hash}&apikey=${api_key}`
    let response = await etherscan(url, query);
    return response["result"];
};

etherscan.getTransactions = async function ({ address, start_block, page, url, api_key, result, end_block }) {

    let offset = 10000
    let query = `module=account&action=txlist&address=${address}&startblock=${start_block}&page=${page}&offset=${offset}&sort=asc&apikey=${api_key}`
    if (end_block) query+= `&endblock=${end_block}`

    let response = await etherscan(url, query);

    result.push(...response["result"]);

    if (response["result"].length == offset) {
        start_block = parseInt(result[result.length - 1]['blockNumber'])
        await this.getTransactions({ address : address, start_block : start_block, page : 1, url:url, api_key:api_key, result:result, end_block:end_block });
    }

    return result;
};

etherscan.getTransactionReceiptStatus = async function ({ url, txhash, api_key }) {

    let query = `module=transaction&action=gettxreceiptstatus&txhash=${txhash}&apikey=${api_key}`
    let response = await etherscan(url, query);
    
    return response["result"];
};

etherscan.getLastBlock = async function ({ url, api_key }) {

    let current_timestamp = parseInt(Date.now() / 1000)
    let query = `module=block&action=getblocknobytime&timestamp=${current_timestamp}&closest=before&apikey=${api_key}`
    let response = await etherscan(url, query);
    
    return parseInt(response["result"]);
};


module.exports = etherscan;
