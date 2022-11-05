import { Markup } from "telegraf";
import { bot } from "../../init/orderBot";
import { ConfigOrder } from "../../types/dbImports"
import { keyboard } from "./keyboard";
import { messages } from "./messages";

export const rateOrder = async (order: ConfigOrder) => {
  try {
    const sendTime = order.take ? 45 : 25;
    setTimeout(async () => {
      await bot.telegram.sendMessage(
        order.client.chatId, messages.rateOrder,
        {parse_mode: "HTML", ...Markup.inlineKeyboard(keyboard.rate.grades(order._id))}
      );
    }, 60000 * sendTime)
 //    }, 60000 * 0.1)
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
