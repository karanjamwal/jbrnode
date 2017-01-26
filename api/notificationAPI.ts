let express = require('express');
let router = express.Router();
let config = require('../data/config');
import _ = require("lodash");
let pushpad = require('pushpad');

let pushpadProject = new pushpad.Pushpad({
    authToken: config.pushpad_auth_token,
    projectId: config.pushpad_project_id,
});

var server = require('http').createServer(express)
  , io = require('socket.io').listen(server);

//server.listen(8585);
  
// POST ../api/notification/send
router.post('/notification/send', function(req, res) {
    /*
     request: {
     'title': 'notification title',
     'message': 'notification body',
     'targetUrl': 'website url',
     'role': 'userRole', // Optional, omit to send to all
     'ids': ['userIds'], // Optional, omit to send to all role group
     }
     */

    let notification = new pushpad.Notification({
        project: pushpadProject,
        body: req.body.message, // max 120 characters
        title: req.body.title, // optional, defaults to your project name, max 30 characters
        targetUrl: req.body.targetUrl, // optional, defaults to your project website
        // iconUrl: 'http://example.com/assets/icon.png', // optional, defaults to the project icon
        // ttl: 604800 // optional, drop the notification after this number of seconds if a device is offline
    });

    io.on('connection', function (socket) { 
        socket.emit('ticket-suspended' , "some-id" );
    });
  
    if (_.has(req.body, 'ids') && !_.isNull(req.body.ids)) {
        if (_.has(req.body, 'role') && !_.isNull(req.body.role)) {
            notification.deliverTo(req.body.ids, { tags: [req.body.role] }, function (err, result) {
                processNotificationReturnValues(res, err, result);
            });
        } else {
            notification.deliverTo(req.body.ids, function(err, result) {
                processNotificationReturnValues(res, err, result);
            });
        }
    } else {
        if (_.has(req.body, 'role') && !_.isNull(req.body.role)) {
            notification.broadcast({ tags: [req.body.role] }, function (err, result) {
                processNotificationReturnValues(res, err, result);
            });
        } else {
            notification.broadcast(function(err, result) {
                processNotificationReturnValues(res, err, result);
            });
        }
    }
});

function processNotificationReturnValues(res, err, result) {
    if (err) {
        return res.status(400).json({
            error : err,
        });
    } else {
        return res.status(200).json(result);
    }
}

module.exports = router;
