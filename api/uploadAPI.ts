const express = require('express');
const router = express.Router();
const config = require('../data/config');
const azure = require('azure-storage');
const multer = require('multer');
const fs = require('fs');
import _ = require("lodash");
const documentDB = require('../data/documentDB');

const uploads = multer({
    dest: './uploads/'
});

// POST ../api/upload_pdf
router.post('/upload_pdf', uploads.single('file'), function(req, res) {
    // Set the parameters
    const contentType = req.file.mimetype;
    const fileName = req.file.originalname;
    const path = req.file.path;

    // Create the Azure service
    const blobService = azure.createBlobService(config.blobStorageAccount, config.blobAccessKey)
        .withFilter(new azure.ExponentialRetryPolicyFilter());

    // Set the blob options
    const blobOptions = {
        contentSettings: {
            contentType: contentType,
        },
        metadata: {
            "ticketId": 1,
        },
    };

    // Upload the blob
    blobService.createBlockBlobFromLocalFile(config.blobFileContainer, fileName, path, blobOptions, function (error, result) {
        // Delete the local file
        fs.unlink(path);

        if (error) {
            res.status(400).send("file upload failed, something happened. (error => " + error + ")");
            return;
        }

        // Get blob url
        const blobUrl = `${config.blobEndpoint}${result.name}`;
        res.json({
            blobUrl: blobUrl,
        });
    });
});

// POST ../api/app/upload
router.post('/app/upload', uploads.single('file'), function(req, res) {
    // Set the parameters
    const contentType = req.file.mimetype;
    const fileName = req.file.originalname;
    const path = req.file.path;

    // Validate data
    if (!_.has(req.body, 'targetDocument')) {
        res.status(400).send("file upload failed, something happened.");
        return;
    }

    const targetDoc = JSON.parse(req.body.targetDocument);

    // Create the Azure service
    const blobService = azure.createBlobService(config.blobStorageAccount, config.blobAccessKey)
        .withFilter(new azure.ExponentialRetryPolicyFilter());

    // Set the blob options
    const blobOptions = {
        contentSettings: {
            contentType: contentType
        },
        metadata: {
            "targetId": targetDoc.targetId,
            "targetDocType": targetDoc.targetDocType,
            "targetProperty": targetDoc.targetProperty,
            "origin": req.headers.host
        }
    };

    // Upload the blob
    blobService.createBlockBlobFromLocalFile(config.blobFileContainer, fileName, path, blobOptions, function (error, result) {
        // Delete the local file
        fs.unlink(path);

        if (error) {
            res.status(400).send("file upload failed, something happened. (error => " + error + ")");
            return;
        }

        // Get blob url
        const blobUrl = `${config.blobEndpoint}${result.name}`;

        // Update the target doc
        documentDB.getDocument(targetDoc.targetId, function(err, results) {
            if (results != null && err == null && _.isArray(results)) {
                // Update the object
                let target = results[0];

                // Map to custom logic for instances where we are updating an embedded document or an "object" property
                // or if the root object is an array
                if (targetDoc.targetProperty == "imageUrls") {
                    target = updateImageUrlsOnTicket(target, targetDoc, blobUrl);
                } else {
                    // Check for sub-property
                    if (targetDoc.subTargetProperty != "") {
                        target[targetDoc.targetProperty][targetDoc.subTargetProperty] = blobUrl;
                    } else {
                        target[targetDoc.targetProperty] = blobUrl;
                    }
                }

                // Update the document
                documentDB.updateDocument(target, function(err, updated) {
                    if (updated != null && updated.id != null && err == null) {
                        let data;
                        if (targetDoc.targetDocType == "ticket") {
                            data = {
                                "targetId": targetDoc.targetId,
                                "targetDocType": targetDoc.targetDocType,
                                "targetProperty": targetDoc.targetProperty,
                                "localFilePath": targetDoc.localFilePath,
                                "cloudFilePath": blobUrl,
                            };
                        } else {
                            data = {"data": updated};
                        }
                        res.status(200).json(data);
                    } else {
                        // Delete the blob since update failed
                        const blobName = blobUrl.substr(blobUrl.lastIndexOf('/') + 1);
                        blobService.deleteBlobIfExists(config.blobFileContainer, blobName, function (error, result) {
                            console.log("Deleted");
                        });
                        console.log(err);
                        res.status(400).send("document update failed, something happened. (ERROR: " + err.body + ")");
                    }
                });
            } else {
                res.status(400).send("document retrieval failed, something happened. (ERROR: " + err + ")");
            }
        })
    });
});

// DELETE ../api/app/upload
router.delete('/app/upload', function(req, res) {
    if (!_.has(req.body, 'fileName')) {
        res.status(400).send("delete file failed. there was no name specified.");
        return;
    }

    // Set the parameters
    const fileName = req.body.fileName;

    // Create the Azure service
    const blobService = azure.createBlobService(config.blobStorageAccount, config.blobAccessKey)
        .withFilter(new azure.ExponentialRetryPolicyFilter());

    // Delete the blob
    blobService.deleteBlobIfExists(config.blobFileContainer, fileName, function (error, result) {
        if (error) {
            res.status(400).send("delete file failed, something happened. (error => " + error + ")");
            return;
        }
        res.json({});
    });
});

function updateImageUrlsOnTicket(ticket, targetDoc, blobUrl) {
    // Find the index of the existing imageUrls
    let imageUrlIndex = _.findIndex(ticket.imageUrls, function(imageUrl) {
        return imageUrl == targetDoc.localFilePath;
    });
    if (imageUrlIndex == -1) {
        return ticket;
    }

    // Update the url
    ticket.imageUrls[imageUrlIndex] = blobUrl;
    return ticket;
}

module.exports = router;
