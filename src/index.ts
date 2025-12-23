import cron from "node-cron";
export default {
  register({ strapi }) {
    // Force the socket to be treated as encrypted for proxy setups
    strapi.server.use(async (ctx, next) => {
      if (ctx.req?.socket) {
        (ctx.req.socket as any).encrypted = true;
      }
      await next();
    });
  },

  async bootstrap({ strapi }) {
    console.log("🚀 Bootstrap loaded!");
    // cron.schedule("* * * * *", async () => {
    //   strapi.log.info("⏰ External cron triggered");
    //   console.log("cron is loaded!");
    //   await strapi
    //     .service("api::event.custom-event")
    //     .fetchHackathons({ platform: "devpost", limit: 10});

    //   await strapi
    //     .service("api::event.custom-event")
    //     .fetchContests({ limit: 10 });

    //   await strapi
    //     .service("api::event.custom-event")
    //     .fetchInternships({limit: 10});
    // });
  },
};