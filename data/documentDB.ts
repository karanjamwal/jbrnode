let express = require('express');
const documentClient = require('documentdb').DocumentClient;
const config = require('../data/config');
const documentDB = require('../data/documentDB');
const _ = require("lodash");

// Function getClient
export function getClient() {
    const client = new documentClient(config.endpoint, {'masterKey': config.authKey});
    return client;
}

// Function getCollectionUri
export function getCollectionUri() {
    const collectionUri = 'dbs/' + config.dbDefinition + '/colls/' + config.collectionDefinition;
    return collectionUri;
}

// Function getDocument
export function getDocument(documentId, callback) {
    const querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [{name: '@id', value: documentId}]
    };
    
    const client = getClient();
    const uri = getCollectionUri();
    
    client.queryDocuments(uri, querySpec).toArray(function(err, results) {
        if(err) return callback(err);

        if(results.length === 1) {
            callback(null, results);
        } else {
            callback(null, null);
        }
    });
}

// Function createDocument
export function createDocument(document, callback) {
    const querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [{name: '@id', value: document.id}]
    };
    
    const client = getClient();
    const uri = getCollectionUri();

    client.queryDocuments(uri, querySpec).toArray(function(err, results) {
        if(err) return callback(err);
        if(results.length === 0) {
            client.createDocument(uri, document, function(err, created) {
                if(err) return callback(err);
                callback(null, created);
            });
        } else {
            callback(null, results[0]);
        }
    });
}

// Function updateDocument
export function updateDocument(document, callback) {
    const querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [{name: '@id', value: document.id}]
    };

    const client = getClient();
    const uri = getCollectionUri();
    
    client.queryDocuments(uri, querySpec).toArray(function(err, results) {
        if(err) return callback(err);    
        if(results.length === 0) {
            // If document was not returned then return an error
            callback({ code : 400, body : "Existing document not found." });
        } else {
            let documentUrl = `${uri}/docs/${document.id}`;
            client.replaceDocument(documentUrl, document, function (err, updated) {
                if (err) return callback(err);
                callback(null, updated);
            });
        }
    });
}

// Function deleteDocument
export function deleteDocument(documentId, callback) {
    const client = getClient();
    const uri = getCollectionUri();

    // Create the URL
    const docLink = `${uri}/docs/${documentId}`;
    
    client.deleteDocument(docLink, function(err, results) {
        if(err) return callback(err);
        return callback(null, null);
    });
}

// Function queryDatabase
export function queryDatabase(querySpec) : Promise<any> {
    const client = documentDB.getClient();
    const uri = documentDB.getCollectionUri();

    return new Promise<any>((resolve, reject) => {
        client.queryDocuments(uri, querySpec).toArray(function (err, results) {
            if (err || _.isUndefined(results)) {
                return reject(err);
            }
            if (results.length > 0) {
                resolve(results);
            } else {
                resolve([]);
            }
        });
    });
}

// Function queryDatabaseLargeResult
export function queryDatabaseLargeResult(querySpec) : Promise<any> {
    const client = documentDB.getClient();
    const uri = documentDB.getCollectionUri();

    const feedOptions = {
        maxItemCount: 1000,
        continuation: "69692275-21c1-42bc-8c41-6314ccde98fc"
    };

    return new Promise<any>((resolve, reject) => {
        client.queryDocuments(uri, querySpec, feedOptions).toArray(function (err, results) {
            if (err || _.isUndefined(results)) {
                return reject(err);
            }
            if (results.length > 0) {
                resolve(results);
            } else {
                resolve([]);
            }
        });
    });

    // return new Promise<any>((resolve, reject) => {
    //     var bigResults = [];

    //     var queryIterator = client.queryDocuments(uri, querySpec, feedOptions);
    //     while (queryIterator.hasMoreResults()) {
    //         queryIterator.executeNext(function (err, docs, headers) {
    //             if (err) {
    //                 return reject(err);
    //             }
    //             _.concat(bigResults, docs);
    //         });
    //     }
        
    //     resolve(bigResults);
    // });
}