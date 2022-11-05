import { Composer } from "telegraf";
import { TelegrafContext } from "../types";

const composer = new Composer<TelegrafContext>();

composer.start(async (ctx: TelegrafContext) => {
  try {
    if (ctx.message && ctx.chat) {

      if (ctx.chat.id < 0) return;
      try { await ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message_id) } catch (err) {};

      if (ctx.session.id_mes_panel) {
        return await ctx.panel.MainPanel(ctx);
      } else {
        return await ctx.panel.RegisterPanel(ctx);
      }

    }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = composer;
