"use strict";

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/eventhub/hackathons',
            handler: 'custom-event.getHackathons',
            config: {
                auth: false, // set to true if you want authentication
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/eventhub/contests',
            handler: 'custom-event.getContests',
            config: {
                auth: false, // set to true if you want authentication
                policies: [],
            },
        }
    ],
};
