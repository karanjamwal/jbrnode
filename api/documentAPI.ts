let express = require('express');
let router = express.Router();
let documentDB = require('../data/documentDB');
let config = require('../data/config');
import _ = require("lodash");

// GET ../api/document/:documentId
router.get('/document/:documentId', function(req, res) {
    let documentId = req.params.documentId;
    
    documentDB.getDocument(documentId, function(err, results) { 
        if (results != null && err == null) {
            if (results.length > 0) {
                res.status(200).json(results[0]);
            } else {
                res.status(200).json({});
            }
        } else if(_.isNull(results)) {
            res.status(200).json({});   
        } else {
            res.status(400).send("document retrieval failed, something happened. (ERROR: " + err + ")");
        }
    })
});

// GET ../api/document/type/:documentType
router.get('/document/type/:documentType', function(req, res) {
    let documentType = req.params.documentType;

    // Get all tickets then parse
    let querySpec = {
        query: `SELECT * FROM documents d WHERE d.docType = '${documentType}'`,
        parameters: []
    };

    let client = documentDB.getClient();
    let uri = documentDB.getCollectionUri();

    client.queryDocuments(uri, querySpec).toArray(function(err, results) {
        if (results != null && err == null) {
            let modifiedResults = [];
            _.forEach(results, function(doc) {
                delete doc._rid;
                delete doc._self;
                delete doc._etag;
                delete doc._attachments;
                delete doc._ts;
                delete doc.password;
                modifiedResults.push(doc);
            });
            res.status(200).json(modifiedResults);
        } else if(_.isNull(results)) {
            res.status(200).json({});   
        } else {
            res.status(400).send("document retrieval failed, something happened. (ERROR: " + err + ")");
        }
    });
});

// POST ../api/document/query
router.post('/document/query', function(req, res) {
    // The parameters field is required
    if (!_.has(req.body, 'parameters') || _.isNull(req.body.parameters) || !_.isArray(req.body.parameters)) {
        return res.status(400).json({ error : "documents cannot be queried. you must provide parameters."});
    }
    /*
        parameters : [{
            'property' : 'docType',
            'value' : 'user',
        }]
    */
    let params = req.body.parameters;
    let paramString = '';
    for (let i = 0; i < params.length; i++) {
        const param = params[i];
        paramString += ` d.${param.property} = '${param.value}'`;
        if (i < (params.length - 1)) {
            paramString += ' AND'
        }
    }

    let querySpec = {
        query : `SELECT * FROM docs d WHERE ${paramString}`,
        options : []
    };

    documentDB.queryDatabase(querySpec).then(results => {
        return res.status(200).json(results);
    }).catch(error => {
        console.log("Error processing query. " + error);
        return res.status(400).json({ error : "There was a problem with your request."});
    });
});

// POST ../api/document
router.post('/document', function(req, res) {
    // Validate the model
    let validModel = true;
    
    // The docType field is required
    if (!_.has(req.body, 'docType') || _.isNull(req.body.docType))
        validModel = false;
    
    if (!validModel) {
        res.status(400).send("document can not be created. property docType is required.");
        return;
    }

    documentDB.createDocument(req.body, function(err, created) { 
        if (created != null && created.id != null && err == null) {
            const data = {"data": created};
            res.status(200).json(data);
        } else {
            res.status(400).send("document creation failed, something happened. (ERROR: " + err.body + ")");   
        }
    })
});

// PUT ../api/document
router.put('/document', function(req, res) {
   // Validate the model
    let validModel = true;

    // The docType field is required
    if (!_.has(req.body, 'docType') || _.isNull(req.body.docType))
        validModel = false;
        
    // The id field is required
    if (!_.has(req.body, 'id') || _.isNull(req.body.id)) 
        validModel = false;
        
    if (!validModel) {
        res.status(400).send("document cannot be updated. your model is a dud.");
        return;
    }
    
    documentDB.updateDocument(req.body, function(err, updated) {
        if (updated != null && updated.id != null && err == null) {
            const data = {"data": updated};
            res.status(200).json(data);  
        } else {
            // If the error says that the document wasn't found, default to POST-like behavior by creating a new document
            if (_.has(err, 'body')) {
                if (err.body === 'Existing document not found.') {
                    documentDB.createDocument(req.body, function(err, created) { 
                        if (created != null && created.id != null && err == null) {
                            const data = {"data": created};
                            res.status(200).json(data);
                            return;
                        } else {
                            res.status(400).send("document creation failed, something happened. (ERROR: " + err.body + ")");
                            return;   
                        }
                    })
                }
            } else {
                console.log(err);
                res.status(400).send("document update failed, something happened. (ERROR: " + err.body + ")");
            }
        }
    }) 
});

// DELETE ../api/document
router.delete('/document', function(req, res) {
    // Validate the model
    let validModel = true;
    
    // The docType field is required
    if (!_.has(req.body, 'docType') || _.isNull(req.body.docType))
        validModel = false;

    // The id field is required
    if (!_.has(req.body, 'id') || _.isNull(req.body.id))
        validModel = false;
    
    if (!validModel) {
        return res.status(400).send("document cannot be deleted.");
    }

    // Create the URL
    // var docLink = `${config.endpoint}/${config.collectionDefinition}/docs/${req.body.id}`;

    // Perform the delete
    documentDB.deleteDocument(req.body.id, function(err, result) {
        if (err) {
            return res.status(400).send("document deletion failed, something happened. (ERROR: " + err.body + ")");
        } else {
            return res.status(200).send({});
        }
    });
});

module.exports = router;