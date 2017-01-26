// var express = require('express');
// var router = express.Router();
// var documentDB = require('../data/documentDB');
// var config = require('../data/config');
// var moment = require('moment-timezone');
// require("moment-duration-format");
// import _ = require("lodash");

// // GET ../api/ticket/active
// router.get('/ticket/active', function(req, res) {
//     // try to get all tickets
//     var querySpec = {
//         query: "SELECT * FROM c WHERE c.docType = 'ticket' AND c.status = 'Open' OR c.status = 'In Progress'",
//         parameters: []
//     };
    
//     var client = documentDB.getClient();
//     var uri = documentDB.getCollectionUri();
    
//     client.queryDocuments(uri, querySpec).toArray(function(err, results) {
//         if(err) {
//             // console.log(err.body);
//             res.status(400).send("ticket query failed, something happened. (ERROR: " + err.body + ")");
//             return;
//         }
//         if(results.length > 0) {
//             res.json(results);
//         } else {
//             res.json({}); // Returns empty dataset
//         }
//     });
// });

// // GET ../api/ticket/complete
// router.get('/ticket/complete', function(req, res) {
//     // try to get all tickets
//     var querySpec = {
//         query: "SELECT * FROM c WHERE c.docType = 'ticket' AND c.status = 'Closed'",
//         parameters: []
//     };

//     var client = documentDB.getClient();
//     var uri = documentDB.getCollectionUri();

//     client.queryDocuments(uri, querySpec).toArray(function(err, results) {
//         if (err) {
//             // console.log(err.body);
//             res.status(400).send("ticket query failed, something happened. (ERROR: " + err.body + ")");
//             return;
//         }
//         if (results.length > 0) {
//             res.json(results);
//         } else {
//             res.json({}); // Returns empty dataset
//         }
//     });
// });

// // GET ../api/ticket/history
// router.get('/ticket/history', function(req, res) {
//     // try to get all tickets
//     var querySpec = {
//         query: "SELECT * FROM c WHERE c.docType = 'ticket' AND c.status = 'Invoiced'",
//         parameters: []
//     };

//     var client = documentDB.getClient();
//     var uri = documentDB.getCollectionUri();

//     client.queryDocuments(uri, querySpec).toArray(function(err, results) {
//         if (err) {
//             // console.log(err.body);
//             res.status(400).send("ticket query failed, something happened. (ERROR: " + err.body + ")");
//             return;
//         }
//         if (results.length > 0) {
//             res.json(results);
//         } else {
//             res.json({}); // Returns empty dataset
//         }
//     });
// });

// // GET ../api/ticket/dashboardKPIS
// router.get('/ticket/dashboardKPIS/:location', function(req, res) {
//     // The docType field is required
//     if (!_.has(req.params, 'location') || _.isNull(req.params.location)) {
//         return res.status(400).json("{'error':'Your request is a dud'}");
//     }
    
//     var location = req.params.location;

//     var result = {
//         ticketsOpenedThisWeek : 0,
//         ticketsClosedThisWeek : 0,
//         ticketsClosedThisMonth : 0
//     };
//     // Get Closed Tickets this week
//     getClosedTicketsThisWeek(location).then(function (closedTickets) {
//         // Update the count
//         if (closedTickets.length > 0)
//             result.ticketsClosedThisWeek = closedTickets.length;

//         // Get closed tickets this month
//         getClosedTicketsThisMonth(location).then(function (closedMonthTickets) {
//             // Update the count
//             if (closedMonthTickets.length > 0)
//                 result.ticketsClosedThisMonth = closedMonthTickets.length;

//             getOpenedTicketsThisWeek(location).then(function (openedTickets) {
//                 // Update the count
//                 if (openedTickets.length > 0)
//                     result.ticketsOpenedThisWeek = openedTickets.length;

//                 // Return results
//                 return res.status(200).json(result);
//             }).catch(function (error) {
//                 return res.status(400).json("{'error':'opened tickets query failed, something happened. (error => " + error + ")'");    
//             }); // End getOpenedTicketsThisMonth
//         }).catch(function (error) {
//             return res.status(400).json("{'error':'closed tickets query failed, something happened. (error => " + error + ")'");
//         }); // End getClosedTicketsThisMonth
//     }).catch(function (error) {
//         return res.status(400).json("{'error':'closed tickets query failed, something happened. (error => " + error + ")'");
//     }); // End getClosedTicketsThisWeek
// });

// // POST ../api/ticket
// router.post('/ticket', function(req, res) {
//     // Validate the model
//     // var validModel = schemas.validateCoffeShop(req.body);
//     var validModel = true;
    
//     if (!validModel) {
//         res.status(400).send("ticket cannot be created. your model is a dud.")
//         return;
//     }

//     documentDB.createDocument(req.body, function(err, created) { 
//         if (created != null && created.id != null && err == null) {
//             var data = { "data" : created };
//             res.status(200).json(data);
//         } else {
//             res.status(400).send("ticket creation failed, something happened. (ERROR: " + err.body + ")");   
//         }
//     })
// });

// // PUT ../api/ticket
// router.put('/ticket', function(req, res) {
//    // Validate the model
//     var validModel = true;
    
//     if (!validModel) {
//         res.status(400).send("ticket cannot be updated. your model is a dud.");
//         return;
//     }

//     documentDB.updateDocument(req.body, function(err, updated) {
//         if (updated != null && updated.id != null && err == null) {
//             var data = { "data" : updated };
//             res.status(200).json(data);  
//         } else {
//             console.log(err);
//             res.status(400).send("ticket update failed, something happened. (ERROR: " + err.body + ")");   
//         }
//     }) 
// });

// // Queries
// function getClosedTicketsThisWeek(location) : Promise<[any]> {
//     var weekDays = getCurrentWeekDates();
//     return getClosedTicketsForDates(location, weekDays);
// }

// function getClosedTicketsThisMonth(location) : Promise<[any]> {
//     var monthDays = ticketAPIGetMonthDates();
//     return getClosedTicketsForDates(location, monthDays);
// }

// function getClosedTicketsForDates(location, dates) : Promise<[any]> {
//     var querySpec = {
//         query : `SELECT * 
//                 FROM tickets t
//                 WHERE t.docType = 'ticket' 
//                 AND t.status = 'Closed' 
//                 AND t.jobEnd IN (${dates})`,
//         parameters : []
//     }

//     // If the region query is not all regions then add to query
//     if (location != 'allLocations') {
//         querySpec.query += ` AND t.serviceLocation = '${location}'`;
//     }

//     var client = documentDB.getClient();
//     var uri = documentDB.getCollectionUri();

//     return new Promise<any>((resolve, reject) => {
//         client.queryDocuments(uri, querySpec).toArray(function (err, results) {
//             if (err || _.isUndefined(results)) {
//                 reject(err);
//             }
//             if (results.length > 0) {
//                 resolve(results);
//             } else {
//                 resolve([]);
//             }
//         });
//     });
// }

// function getOpenedTicketsThisWeek(location) : Promise<[any]> {
//     var weekDays = getCurrentWeekDates();
//     var querySpec = {
//         query : `SELECT * 
//                 FROM tickets t 
//                 WHERE t.docType = 'ticket'  
//                 AND t.jobStart IN (${weekDays})`,
//         parameters : []
//     };

//     // If the region query is not all regions then add to query
//     if (location != 'allLocations') {
//         querySpec.query += ` AND t.serviceLocation = '${location}'`;
//     }

//     var client = documentDB.getClient();
//     var uri = documentDB.getCollectionUri();

//     return new Promise<any>((resolve, reject) => {
//         client.queryDocuments(uri, querySpec).toArray(function (err, results) {
//             if (err || _.isUndefined(results)) {
//                 reject(err);
//             }
//             if (results.length > 0) {
//                 resolve(results);
//             } else {
//                 resolve([]);
//             }
//         });
//     });
// }

// // Helpers
// function ticketAPIGetMonthDates() {
//     var days = "";
//     var monday = moment().startOf('isoweek');
//     var startDate = moment([monday.year(), monday.month()]);

//     days = "'" + startDate.format('YYYY-MM-DD') + "'";
//     startDate.add(1, 'days');

//     while (startDate.month() == (monday.month())) {
//         days = days + ",'" + startDate.format('YYYY-MM-DD') + "'";
//         startDate.add(1, 'days');
//     }
//     return days;
// }

// function getCurrentWeekDates() {
//     var monday = moment().startOf('isoweek');
//     var days = "";

//     days = "'" + monday.format('YYYY-MM-DD') + "'";
//     monday.add(1, 'days');

//     while (monday.isoWeekday() > 1) {
//         days = days + ",'" + monday.format('YYYY-MM-DD') + "'";
//         monday.add(1, 'days');
//     }
//     return days;
// }

// module.exports = router;