let express = require('express');
let router = express.Router();
let documentDB = require('../data/documentDB');
let config = require('../data/config');
import _ = require('lodash');
import crypto = require("crypto");

// GET ../api/auth
router.post('/auth', function(req, res) {
    if (!_.has(req.body, 'cipher') || _.isNull(req.body.cipher)) {
        res.status(400).json({ error: "authentication failed, something happened." });
        return;
    }

    let key = config.cryptoKey;
    let iv = config.cryptoIv;

    // Decipher the body
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decrypted = decipher.update(req.body.cipher, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    // Split the parts
    let splitString = decrypted.split('~');
    let email = splitString[0];
    let sentPassword = splitString[1];

    // Get the user from the DB
    let querySpec = {
        query: "SELECT * FROM c WHERE c.docType = 'user' AND c.email = '" + email + "'",
        parameters: []
    };

    let client = documentDB.getClient();
    let uri = documentDB.getCollectionUri();

    client.queryDocuments(uri, querySpec).toArray(function(err, results) {
        if (err) {
            res.status(400).json({ error: "authentication failed, something happened." });
            return;
        }
        if (results.length > 0) {
            let email = results[0].email;
            let password = results[0].password;
            if (sentPassword == password) {
                res.status(200).send({ "userId": results[0].id })
            } else {
                res.status(401).send("Denied!")
            }
        } else {  
            res.status(401).send("Denied!"); 
        }
    });
});

module.exports = router;
