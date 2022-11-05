import { Markup } from "telegraf";
import { supportTelegrafContext } from "../types";
import { supKeyboard } from "./keyboard";

export const startSupBot = async (ctx: supportTelegrafContext) => {
  try {
    try {ctx.deleteMessage()} catch {};
    if (ctx.message && ctx.chat) {
      if (ctx.chat.id < 0) return;
      const originalSession = (await ctx.originalSession.find({key: ctx.from!.id + ":" + ctx.from!.id}).toArray())[0];
      await ctx.replyWithHTML("Добро пожаловать в бот-поддержку <b>Бостон шаурмаркет!</b>\n\nВыберите заказ по которому у вас возник вопрос:", {...Markup.inlineKeyboard(supKeyboard.mainPanel(originalSession))});
      if (ctx.session.__scenes) {await ctx.scene.leave()};
      await ctx.scene.enter("supportMenu");
    }
  } catch (error) {
    console.log("Error support bot >", error)
  }
}
