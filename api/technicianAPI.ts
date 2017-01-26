const express = require('express');
const router = express.Router();
const documentDB = require('../data/documentDB');
let config = require('../data/config');
import _ = require("lodash");
const moment = require('moment-timezone');
require("moment-duration-format");

// GET ../api/app/technician/:technicianId:
// Returns payload for that technicians app (including tickets, and KPIs)
router.get('/app/technician/:technicianId', function(req, res) {
    const technicianId = req.params.technicianId;
    const returnObj = new Object();

    // Because JS lacks the ability to await asynchronous calles we have to nest multiple calls like so

    // Get the technican object
    getTechnician(technicianId).then(function(tech) {
        // Set tech on the return object
        delete tech.password;
        returnObj["technician"] = tech;

        // Get current tickets for technician
        getCurrentTickets(technicianId).then(function(tickets) {
            // Set the tickets on the return object
            returnObj["tickets"] = tickets;

            // Get the tickets worked this week by technician
            getTicketsCompleted(technicianId).then(function(count) {
                // Set the completed ticket count on the return object
                returnObj["completedTickets"] = count;

                // Finally, return the resulting json
                res.json(returnObj);
            }).catch(function(error) {
                res.status(400).send("completed ticket query failed, something happened. (error => " + error + ")");
                return;
            });
        }).catch(function(error) {
            res.status(400).send("ticket query failed, something happened. (error => " + error + ")");
            return;
        });
    }).catch(function(error) {
        res.status(400).send("technician query failed, something happened. (error => " + error + ")");
        return;
    });
});

// MARK: Helper Methods
function getTechnician(technicianId : string) : Promise<any> {
    const querySpec = {
        query: `SELECT * FROM Collection c  
                WHERE c.docType = 'user' 
                AND c.id = '${technicianId}'`,
        parameters: []
    };

    const client = documentDB.getClient();
    const uri = documentDB.getCollectionUri();

    return new Promise<any>((resolve, reject) => {
        client.queryDocuments(uri, querySpec).toArray(function(err, results) {
            if(err || _.isUndefined(results)) {
                reject(err);
                return;
            }
            if (results.length > 0) {
                const user = results[0];
                resolve(user);
            } else {
                reject("There were zero results of tech query.");
            }
        });
    });
}

function getCurrentTickets(technicianId : string) : Promise<any> {
    const dateToday = moment().tz("America/Chicago").format('YYYY-MM-DD');
    const querySpec = {
        query: `SELECT VALUE c 
                FROM Collection c 
                JOIN t in c.technicians 
                WHERE c.docType = 'ticket' 
                AND t.role = 'Primary' 
                AND t.technician.id = '${technicianId}' 
                AND c.jobEnd >= '${dateToday}' 
                ORDER BY c.jobStart`,
        parameters: []
    };

    const client = documentDB.getClient();
    const uri = documentDB.getCollectionUri();

    return new Promise<any>((resolve, reject) => {
        client.queryDocuments(uri, querySpec).toArray(function(err, results) {
            if(err || _.isUndefined(results)) {
                reject(err);
                return;
            }
            if(results.length > 0) {
                const tickets = results;
                resolve(tickets);
            } else {
                resolve({});
            }
        });
    });
}

function getTicketsCompleted(technicianId : string) : Promise<number> {
    const monday = moment().tz("America/Chicago").startOf('isoweek').day(1).format('YYYY-MM-DD');
    const sunday = moment().tz("America/Chicago").startOf('isoweek').day(0 + 7).format('YYYY-MM-DD');

    const querySpec = {
        query: `SELECT VALUE c 
                FROM Collection c 
                JOIN t in c.technicians 
                WHERE c.docType = 'ticket' 
                AND t.role = 'Primary' 
                AND t.technician.id = '${technicianId}' 
                AND c.status = 'Complete' 
                AND c.jobEnd >= '${monday}' 
                AND c.jobEnd <= '${sunday}'`,
        parameters: []
    };

    const client = documentDB.getClient();
    const uri = documentDB.getCollectionUri();

    return new Promise<any>((resolve, reject) => {
        client.queryDocuments(uri, querySpec).toArray(function(err, results) {
            if(err || _.isUndefined(results)) {
                reject(err);
                return;
            }
            if(results.length > 0) {
                const tickets = results;
                resolve(tickets.length);
            } else {
                resolve({});
            }
        });
    });
}

module.exports = router;
