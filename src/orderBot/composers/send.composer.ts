import { Composer } from "telegraf";
import { TelegrafContext } from "../types";

const composer = new Composer<TelegrafContext>();
//Без уведомлений
// composer.command("send" , async (ctx: TelegrafContext) => {
//   try {

//   } catch (err) {
//     console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
//   }
// })

module.exports = composer;
