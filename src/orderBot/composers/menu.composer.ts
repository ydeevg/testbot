import { Composer } from "telegraf";
import { TelegrafContext } from "../types";

const composer = new Composer<TelegrafContext>();

composer.command("menu",async (ctx: TelegrafContext) => {
  try {
    if (ctx.chat!.id > 0) {
      try {
        await ctx.telegram.deleteMessage(ctx.from!.id, ctx.message.message_id);
      } catch (e) {
      }
      await ctx.panel.MainPanel(ctx);
    }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = composer;
