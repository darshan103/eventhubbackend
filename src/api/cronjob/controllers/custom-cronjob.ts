import { factories } from '@strapi/strapi';

module.exports = factories.createCoreController(
    "api::cronjob.cronjob",
    ({ strapi }) => ({
        async cronHealthCheck(ctx){
            ctx.body = {
                cronstatus: 'ok',
                crontime: new Date().toISOString(),
            };
        }
    })
);