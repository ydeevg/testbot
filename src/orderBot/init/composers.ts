import { Telegraf } from "telegraf";
import { TelegrafContext } from "../types";


export const composers = (bot: Telegraf<TelegrafContext>) => {
  bot.use(require("../composers/start.composer")); // command /start
  bot.use(require("../composers/parse.composer")); // command /start
  bot.use(require("../composers/menu.composer")); // command /menu
  bot.use(require("../composers/help.composer")); // рассылки
  bot.use(require("../composers/changeStatus.composer")); // кнопки в чате ресторана
  bot.use(require("../composers/payments.composer")); // платёжные
  bot.use(require("../composers/rateOrder.composer")); // оценка
  bot.use(require("../composers/cancelOrder.composer")); // отмена оплаты
  bot.use(require("../composers/hideThis.composer")); // закрыть окно
  bot.use(require("../composers/ban.composer")); // бан
  bot.use(require("../composers/adminChangeStatus.composer")); // смена статуса\
  bot.use(require("../composers/test.composer")); // test
  bot.use(require("../composers/send.composer")); // рассылки

  /*ДАННЫЙ КОМПОЗЕР ВСЕГДА В КОНЦЕ */
  bot.use(require("../composers/bot.composer")); // ДАННЫЙ КОМПОЗЕР ДОЛЖЕН БЫТЬ ВСЕГДА В КОНЦЕ!
}
