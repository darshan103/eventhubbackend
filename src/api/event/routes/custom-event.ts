"use strict";

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/eventhub/challenges',
            handler: 'custom-event.getChallenges',
            config: {
                auth: false, // set to true if you want authentication
                policies: [],
            },
        },
    ],
};
