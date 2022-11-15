const express = require('express');
const router = new express.Router();
const binance = require('../api/binance');
const coingecko = require('../api/coingecko');
const BigNumber = require('bignumber.js'); // https://github.com/MikeMcl/bignumber.js
const cryptocompare = require('../api/crypto-compare');


router.post('/overview', async(req, res) => {
    try {
        console.log('/overview')

        const form = req.body
        const apiData = { apiKey : form['api'], secretKey: form['secret'] }
        let overview = []

        // Get SPOT
        const allBalanceSpot = (await binance.getAccountInfos(apiData))['balances']
        const balancesSpot = allBalanceSpot.filter(balance => parseFloat(balance['free']) > 0 || parseFloat(balance['locked']) > 0)
        for (let token of balancesSpot) {
            overview.push({
                asset: token['asset'],
                SPOT : {
                    free : new BigNumber(token['free']).toString(),
                    locked: new BigNumber(token['locked']).toString()
                },
                STACK : new BigNumber(0).toString(),
                SAVE : new BigNumber(0).toString()
            })
        }

        // Get EARN
        const allBalanceStacked = await binance.getStackingProductPosition(apiData)

        for (let stack of allBalanceStacked) {
            const foundIndex = overview.findIndex(item => item['asset'] === stack['asset']);
            if (foundIndex !== -1) {
                overview[foundIndex]['STACK'] = new BigNumber(overview[foundIndex]['STACK']).plus(new BigNumber(stack['amount'])).toString()
            } else {
                overview.push({
                    asset: token['asset'],
                    SPOT : {
                        free : new BigNumber(0).toString(),
                        locked: new BigNumber(0).toString()
                    },
                    STACK : new BigNumber(stack['amount']).toString(),
                    SAVE : new BigNumber(0).toString()
                })
            }
        }

        const allBalanceSaved = await binance.getSavingProductPosition(apiData)
        for (let save of allBalanceSaved) {
            const foundIndex = overview.findIndex(item => item['asset'] === save['asset']);
            if (foundIndex !== -1) {
                overview[foundIndex]['SAVE'] = new BigNumber(overview[foundIndex]['SAVE']).plus(new BigNumber(save['amount'])).toString()
            } else {
                overview.push({
                    asset: token['asset'],
                    SPOT : {
                        free : new BigNumber(0).toString(),
                        locked: new BigNumber(0).toString()
                    },
                    STACK : new BigNumber(0).toString(),
                    SAVE : new BigNumber(save['amount']).toString()
                })
            }
        }

        // Get prices USDT
        const symbolsUSDT = overview.map(item => item['asset'] + "USDT")
        const prices = await binance.getPrices({symbols : JSON.stringify(symbolsUSDT)}, apiData);
        for (let price of prices) {
            const foundIndex = overview.findIndex(item => item['asset'] === price['symbol'].replace('USDT', ''));
            overview[foundIndex]['priceUSDT'] = new BigNumber(price['price']);
        }

        // Get prices USD
        const symbols = overview.map(item => item['asset']);
        // const coingeckoIds = await coingecko.getIdsList();
        // const ids = coingeckoIds.reduce((prev, current, index) => {
        //     const indexFound = symbols.findIndex(s => s.toLowerCase() === current['symbol'].toLowerCase())
        //     if (indexFound !== -1) {
        //         prev.push(current);
        //         symbols.splice(indexFound, 1);
        //     }

        //     return prev
        // }, []);

        // const pricesUsd = await coingecko.getCurrentPrice({ids : (ids.map(elem => elem['id'])).join(','), currency: 'usd'});

        // console.log('pricesUsd :', pricesUsd)

        // for (let element of ids) {
        //     const foundIndexOverview = overview.findIndex(item => item['asset'].toLowerCase() === element['symbol'].toLowerCase());
        //     overview[foundIndexOverview]['priceUSD'] = new BigNumber(pricesUsd[element['id']]['usd']);
        // }

        let pricesUsd = await cryptocompare.getPriceBySymbol({fsymbols : symbols, tsymbols: ['USD']})

        for (let key of Object.keys(pricesUsd)) {
            const foundIndexOverview = overview.findIndex(item => item['asset'].toLowerCase() === key.toLowerCase());
            overview[foundIndexOverview]['priceUSD'] = new BigNumber(pricesUsd[key]['USD']);
        }



        overview = overview.map(item => {
            item['total'] = new BigNumber(item['SPOT']['free']).plus(new BigNumber(item['SPOT']['locked'])).plus(new BigNumber(item['STACK'])).plus(new BigNumber(item['SAVE']))
            item['totalUSD'] = new BigNumber(item['total']).times(item['priceUSD'])
            return item
        })

        let totalWallet = overview.reduce((partialSum, item) => partialSum.plus(item['totalUSD']), new BigNumber(0));

        overview = overview.map(item => {
            item['percent'] = new BigNumber(item['totalUSD']).times(new BigNumber(100)).dividedBy(new BigNumber(totalWallet)).toFormat(2)
            return item
        })


        res.send({ error: 0, data: overview });
    } catch (err) {
        console.log(err);
        res.send({ error: 1, data: err.message });
    }
})

module.exports = router
