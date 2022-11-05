import { Telegraf } from "telegraf";
import { supportTelegrafContext } from "../types";


export const composers = (supBot: Telegraf<supportTelegrafContext>) => {
  supBot.use(require("../composers/start.composer")); // command /start

  /*ДАННЫЙ КОМПОЗЕР ВСЕГДА В КОНЦЕ */
  // bot.use(require("../composers/bot.composer")); // ДАННЫЙ КОМПОЗЕР ДОЛЖЕН БЫТЬ ВСЕГДА В КОНЦЕ!
}
