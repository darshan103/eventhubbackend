"use strict";

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/event/hackathons',
            handler: 'custom-event.getHackathons',
            config: {
                auth: false, // set to true if you want authentication
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/event/contests',
            handler: 'custom-event.getContests',
            config: {
                auth: false, // set to true if you want authentication
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/event/internships',
            handler: 'custom-event.getInternships',
            config: {
                auth: false, // set to true if you want authentication
                policies: [],
            },
        }
    ],
};
