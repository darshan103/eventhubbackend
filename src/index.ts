const cronEvents =  require("./cron/event-cron");
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
    cronEvents({ strapi });
  },
};