"use strict";

const cron = require("node-cron");

module.exports = ({ strapi }) => {
    // Runs every 6 hours
    cron.schedule("0 */6 * * *", async () => {
        try {
            strapi.log.info("⏰ Cron: saveAllEvents started");

            await strapi
                .service("api::event.custom-event")
                .saveAllEvents();

            strapi.log.info("✅ Cron: saveAllEvents completed");
        } catch (err) {
            strapi.log.error("❌ Cron failed", err);
        }
    });
};
