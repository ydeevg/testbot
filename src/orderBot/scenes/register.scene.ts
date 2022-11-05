import { Scenes, Composer, Context, Markup } from "telegraf";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";
import { TelegrafContext } from "../types";
import { ConfigRestaurant } from "../../types/dbImports";
import { keyboard } from "../utils/keyboard";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *               Сцена регистрации | Register              *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//* * * * * Реакция на кнопки первого layout'a * * * * * *
const startActions = new Composer<TelegrafContext>();

startActions.action("yes", async (ctx: TelegrafContext) => {
  try {
    await ctx.panel.AddBonusAccountPanel(ctx);

    return await ctx.wizard.next();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

//* * * * * Получение и обработка номера телефона * * * * * *
const numberHandler = new Composer<TelegrafContext>();

numberHandler.on("contact", async (ctx: TelegrafContext) => {
  try {
    try {
      if (!ctx.session.id_mes_panel) return;
      await ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.session.id_mes_panel);
    } catch (err) {
      try {
        await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "0", ctx.i18n.t("hat-nHTML"));
      } catch (err) {
        console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
      }
    }
    try {
      await ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message_id);
    } catch (e) { }
    if (ctx.message.contact.user_id !== ctx.from?.id) {
      ctx.session.id_mes_panel = (await ctx.replyWithHTML(
        ctx.i18n.t("enterPhoneNumber-err-isNotThisUser", {hat: ctx.i18n.t("hat")}),
        {...Markup.keyboard([[Markup.button.contactRequest("Поделится контактом 📲")]]).oneTime().resize()}
      )).message_id;
      return;
    } else {
      let phone = ctx.message.contact.phone_number;
      if (phone[0] === "+") phone = phone.slice(1, 12);
      if (phone[0] === "8") phone = "7" + phone.slice(1, 11);
      ctx.session.phone = phone;
      ctx.session.id_mes_panel = ( await ctx.replyWithHTML( ctx.i18n.t("enterPhoneNumber-yes", { hat: ctx.i18n.t("hat") }), {...Markup.inlineKeyboard(keyboard.RegisterPanel)} ) ).message_id;
      return await ctx.wizard.next();
    }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
//* * * * * Обработка нажатия кнопки "Продолжить" * * * * * *
const lastKey = new Composer<TelegrafContext>();
lastKey.action("yes", async (ctx: TelegrafContext) => {
  try {
    const menuKeyboard: InlineKeyboardButton[][] = [];

    (await ctx.dbRestaurants.find().toArray()).map((rest: ConfigRestaurant) => {
      menuKeyboard.push([Markup.button.callback(rest.address, "go:"+rest._id)])
    });

    await ctx.editMessageText(
      ctx.i18n.t("RegisterPanel-choiceRestaurant", {hat: ctx.i18n.t("hat")}),
      {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)}
    );
    await ctx.scene.leave();
    await ctx.scene.enter("panel");
    return await ctx.wizard.selectStep(1);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = new Scenes.WizardScene<TelegrafContext>("register", startActions, numberHandler, lastKey);
