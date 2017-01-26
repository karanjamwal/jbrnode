let express = require('express');
let router = express.Router();
let _cache = require('../data/node_cache');
let documentDB = require('../data/documentDB');
let config = require('../data/config');
import _ = require("lodash");

// GET ../api/customers
router.get('/customers', function(req, res) {
    let cacheKey = "customers_cached";
    let ttl = 2629746000; // 1 month

    // Get Customers from cache
    _cache.get(cacheKey, function (err, cachedResult) {
        if (err) {
            return res.status(400).json({ error : "There was a problem retrieving customers from cache."});
        }
        // If value is undefined than the cache does not yet exist
        if (cachedResult == undefined) {
            let querySpec = {
                query : "SELECT c.id, c.docType, c.customerListId, c.customerName FROM Customers c WHERE c.docType = 'customer'",
                parameters: []
            };
            documentDB.queryDatabaseLargeResult(querySpec).then(customers => {
                // Cache Customers
                _cache.set(cacheKey, JSON.stringify(customers), ttl, function (err, success) {
                    if (!err && success) {
                        console.log("Successfully stored customers in cache");
                    }
                });
                // Return Results
                res.status(200).json(customers);
            }).catch(error => {
                res.status(400).send("document retrieval failed, something happened. (ERROR: " + error + ")");
            });
        } else {
            // Return cached Results
            let customers = JSON.parse(cachedResult);
            res.status(200).json(customers);
        }
    });
});

module.exports = router;
