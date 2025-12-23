const { factories } = require("@strapi/strapi");

module.exports = factories.createCoreController(
    "api::event.event",
    ({ strapi }) => ({
        async getHackathons(ctx) {
            try {
                const { page = 1, limit = 10 } = ctx.query;

                const start = (page - 1) * limit;

                // Read only from DB
                const data = await strapi.entityService.findMany("api::event.event", {
                    filters: { type: "hackathon" },
                    start,
                    limit,
                    sort: { start_date: "DESC" },
                });

                ctx.body = {
                    success: true,
                    count: data.length,
                    data,
                };
            } catch (err) {
                console.error("Error returning hackathons:", err);
                ctx.badRequest("Failed to return hackathons", { error: err.message });
            }
        },

        async getContests(ctx) {
            try {
                const { limit = 10 } = ctx.query;

                const data = await strapi.entityService.findMany("api::event.event", {
                    filters: { type: "contest" },
                    limit,
                    sort: { start_date: "DESC" },
                });

                ctx.body = {
                    success: true,
                    count: data.length,
                    data,
                };
            } catch (err) {
                ctx.badRequest("Failed to return contests");
            }
        },

        async getInternships(ctx) {
            try {
                const { limit = 10 } = ctx.query;

                const data = await strapi.entityService.findMany("api::event.event", {
                    filters: { type: "internship" },
                    limit,
                });

                ctx.body = {
                    success: true,
                    count: data.length,
                    data,
                };
            } catch (err) {
                ctx.badRequest("Failed to return internships");
            }
        },
    })
);
