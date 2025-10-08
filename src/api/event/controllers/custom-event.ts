const { factories } = require("@strapi/strapi");

module.exports = factories.createCoreController(
    "api::event.event",
    ({ strapi }) => ({
        async getChallenges(ctx:any) {
            try {
                const { platform = 'devpost', page = 1, limit = 10 } = ctx.query;
                console.log(`Fetching challenges from platform: ${platform}, page: ${page}, limit: ${limit}`);

                // Call service
                const data = await strapi
                    .service('api::event.custom-event')
                    .fetchChallenges({ platform, page, limit });

                ctx.body = {
                    success: true,
                    platform,
                    count: data.length,
                    data,
                };
            } catch (err) {
                console.error('Error in getChallenges:', err);
                ctx.badRequest('Failed to fetch challenges', { error: err.message });
            }
        },

    }));