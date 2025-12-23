"use strict";

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/cronjob/healthcheck',
            handler: 'custom-cronjob.cronHealthCheck', 
            config: {
                auth: false, // set to true if you want authentication
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/cronjob/fetchhackathons',
            handler: 'custom-cronjob.fetchHackathons',
            config: {
                auth: false, // set to true if you want authentication
                policies: [],
            },
        },
     ],
};