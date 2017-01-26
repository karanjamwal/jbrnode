require('dotenv').config();
const express = require('express'); // call express
const app = express();              // define our app using express
const cors = require('cors');              
const bodyParser = require('body-parser');
const authAPI = require('./api/authenticationAPI');
const uploadAPI = require('./api/uploadAPI');
const documentAPI = require('./api/documentAPI');
const customerAPI = require('./api/customerAPI');
const scheduleAPI = require('./api/scheduleAPI');
const technicianAPI = require('./api/technicianAPI');
const notificationAPI = require('./api/notificationAPI');
import _ = require("lodash");

// Server is the backbone, the AppDelegate if you will. All setup here defines our endpoint 

// Endpoint Configuration
// ============================================================================= 

// Set our port
const port = process.env.PORT || 8585;

// Configure bodyParser for getting data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

// Route Configuration
// =============================================================================
const router = express.Router();

// Configure the /api prefix to all routes
app.use('/api', router); 

app.use(cors({
    origin: true,
    credentials: true
}));

// Configure a test route to make sure everything is working (accessed at GET http://localhost:8181/api)
router.get('/', function(req, res) {
    res.status(200).send('Hello Scott Services');      
});

// Add CORS Support
router.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'x-requested-with,content-type,authorization,origin');
    
    // // Set to true if you need the website to include cookies in the requests sent
    // // to the API (e.g. in case you use sessions)
    // res.setHeader('Access-Control-Allow-Credentials', true);

    // If method is an OPTIONS requested
    if (req.method === "OPTIONS") {
        return res.status(200).send();
    }

    next(); // make sure we go to the next routes and don't stop here
});

const authFreeRoutes = [];

// Optional to add a piece of middleware to use for all requests
router.use(function(req, res, next) {
    // Skip authentication middle-ware for certain routes
    const exceptionIndex = _.findIndex(authFreeRoutes, function (route) {
        return _.startsWith(req.originalUrl, route);
    });
    if (exceptionIndex > -1) {
        next();
        return;
    }
    
    // Crude authentication, the token must match
    if (_.has(req.headers, 'authorization')) {
        const tokenString = req.headers['authorization'];
        const tokenPrefix = "Token token=";
        
        let isAuthorized: boolean = true;
        
        // Does the prefix exist
        if (!tokenString.includes(tokenPrefix)) {
            isAuthorized = false;
        }
        
        // Get Token
        let prefixLength = tokenPrefix.length;
        const token: string = tokenString.substring(tokenPrefix.length);

        if (!_.isEqual(token, "ae716140-772a-4a60-a005-4f2d28fc21a3")) {
            isAuthorized = false;
        }
        
        if (!isAuthorized) {
            console.log("Auth failed");
            return res.status(401).send('Not Authorized');
        }
    } else {
        console.log("No header");
        return res.status(401).send('Not Authorized');
    }
    console.log("Auth success");
    next(); // make sure we go to the next routes and don't stop here
});

// Additional Routes
app.use('/api', uploadAPI);
app.use('/api', authAPI);
app.use('/api', documentAPI);
app.use('/api', customerAPI);
app.use('/api', scheduleAPI);
app.use('/api', technicianAPI);
app.use('/api', notificationAPI);

// Start the Server
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
