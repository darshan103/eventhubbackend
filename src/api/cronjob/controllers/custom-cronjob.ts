import { factories } from '@strapi/strapi';

module.exports = factories.createCoreController(
    "api::cronjob.cronjob",
    ({ strapi }) => ({
        async cronHealthCheck(ctx){
            ctx.body = {
                cronstatus: 'ok',
                crontime: new Date().toISOString(),
            };
        },
        async fetchHackathons(ctx) {
            // const token = ctx.request.headers['x-cron-secret'];

            // if (token !== process.env.CRON_SECRET) {
            //     return ctx.unauthorized('Invalid cron token');
            // }

            await strapi
                .service('api::event.custom-event')
                .fetchHackathons({ platform: 'devpost', page: 1, limit: 20 });

            ctx.body = { success: true, message: 'Hackathons fetched' };
        },
    })
);