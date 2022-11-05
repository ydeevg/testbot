import { Composer } from "telegraf";
import { TelegrafContext } from "../types";

const composer = new Composer<TelegrafContext>();
//Без уведомлений
composer.action("hideThisMessage" , async (ctx: TelegrafContext) => {
  try {
    await ctx.deleteMessage();
  } catch (err) {
    try {
      await ctx.editMessageText(`<span class="tg-spoiler">сообщение скрыто</span>`, {parse_mode: "HTML"});
    } catch (err) {
      console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
    }
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = composer;
