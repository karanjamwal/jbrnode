const express = require('express');
const router = express.Router();
const documentDB = require('../data/documentDB');
let config = require('../data/config');
import _ = require("lodash");
const moment = require('moment-timezone');
require("moment-duration-format");

import { User } from '../models/user';
import { Ticket } from '../models/ticket';

// GET ../api/schedule
/* Return object with be:
{
    ScheduledTickets : [
        {
            "Name" : "Technician Name"
            "Tickets" : [
                { Ticket... }
            ]
        }
    ], 
    UnscheduledTickets : [
        { Tickets }
    ]
} */
router.get('/schedule/:year/:month', function (req, res) {
    // Validate the inputs
    const year = parseInt(req.params.year);
    if (_.isNaN(year)) {
        res.status(400).json("{'error':'Your request is a dud'}");
        return;
    }

    const month = parseInt(req.params.month);
    if (_.isNaN(month)) {
        res.status(400).json("{'error':'Your request is a dud'}");
        return;
    }

    let location = req.params.location;

    // Create array to hold tickets
    let scheduledTickets: { technician: User, tickets: Ticket[] }[] = [];

    // Get technicians
    getTechnicians().then(function (technicians) {
        // For each technician we will add an empty scheduled ticket object, this is due to the feature request that 
        // all technicians for the region show up on the schedule even if they aren't scheduled anything
        for (let technician of technicians) {
            const newTechTicket = {
                "technician": technician,
                "tickets": []
            };
            scheduledTickets.push(newTechTicket);
        }

        // Get the tickets
        getScheduledTickets(year, month).then(function (tickets) {
            if (tickets.length > 0) {
                // Foreach ticket
                for (let ticket of tickets) {
                    // Foreach technician on ticket
                    for (let tech of ticket.technicians) {
                        // See if technician exists
                        const techTickets = _.find(scheduledTickets, function (t: { technician: User, tickets: Ticket[] }) {
                            return t.technician.id == tech.technician.id;
                        });
                        if (_.isUndefined(techTickets)) {
                            // Technician does not exist so add them
                            const newTechTicket = {
                                "technician": tech.technician,
                                "tickets": [ticket]
                            };
                            scheduledTickets.push(newTechTicket);
                        } else {
                            // Tech does exist so append ticket
                            techTickets.tickets.push(ticket);
                        }
                    }
                }

                // Sort scheduled tickets by technician name
                scheduledTickets = _.sortBy(scheduledTickets, function (item) {
                    return item.technician.name;
                });

                // Get the unscheduled tickets
                getUnscheduledTickets().then(function (unscheduledTickets) {
                    const result = {
                        "scheduledTickets": scheduledTickets,
                        "unscheduledTickets": unscheduledTickets
                    };
                    res.json(result);   
                }).catch(function (error) {
                    return res.status(400).send("unscheduled query failed, something happened. (error => " + error + ")");
                }); // End ticket query
            } else {
                // There still might be unscheduled tickets, so fetch them
                getUnscheduledTickets().then(function (unscheduledTickets) {
                    if (unscheduledTickets.length > 0) {
                        const result = {
                            "scheduledTickets": [],
                            "unscheduledTickets": unscheduledTickets
                        };
                        res.json(result);
                    } else {
                        res.json({}); // Returns empty dataset
                    }
                }).catch(function (error) {
                    return res.status(400).send("unscheduled query failed, something happened. (error => " + error + ")");
                }); // End ticket query
            }
        }).catch(function (error) {
            return res.status(400).send("schedule query failed, something happened. (error => " + error + ")");
        }); // End ticket query
    }).catch(function (error) {
        return res.status(400).send("technician query failed, something happened. (error => " + error + ")");
    }); // End technican query
});

router.get('/schedule/unscheduled', function (req, res) {
    getUnscheduledTickets().then(function (tickets) {
        res.json(tickets);
    }).catch(function (error) {
        res.status(400).json("{'error':'something happened.'}");
    });
});

// Helpers
function getMonthDates(year, month) {
    let days = "";
    const startDate = moment([year, month - 1]);

    days = "'" + startDate.format('YYYY-MM-DD') + "'";
    startDate.add(1, 'days');

    while (startDate.month() == (month - 1)) {
        days = days + ",'" + startDate.format('YYYY-MM-DD') + "'";
        startDate.add(1, 'days');
    }
    return days;
}

function getTechnicians(): Promise<[User]> {
    const querySpec = {
        query: `SELECT * 
                FROM user u 
                WHERE u.docType = 'user' 
                AND u.role = 'Technician'`,
        parameters: []
    };

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

function getScheduledTickets(year, month): Promise<[Ticket]> {
    // The the current months dates for the query
    const dates = getMonthDates(year, month);

    // Get all tickets then parse
    const querySpec = {
        query: `SELECT * 
                FROM ticket t 
                WHERE t.docType = 'ticket' 
                AND t.jobStart IN (${dates}) 
                AND t.jobStart != '' 
                AND t.jobEnd != '' 
                AND t.technicians != []`,
        parameters: []
    };

    const client = documentDB.getClient();
    const uri = documentDB.getCollectionUri();

    return new Promise<any>((resolve, reject) => {
        client.queryDocuments(uri, querySpec).toArray(function (err, results) {
            if (err || _.isUndefined(results)) {
                reject(err);
            }
            if (results.length > 0) {
                resolve(results);
            } else {
                resolve({});
            }
        });
    });
}

function getUnscheduledTickets() : Promise<any> {
    const querySpec = {
        query: `SELECT * 
                FROM ticket t 
                WHERE t.docType = 'ticket' 
                AND (t.jobStart = ''  
                OR t.jobEnd = '' 
                OR t.jobStart = 'Invalid date'  
                OR t.jobEnd = 'Invalid date' 
                OR t.technicians = [])`,
        parameters: []
    };
    
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
                resolve({});
            }
        });
    });
}

module.exports = router;