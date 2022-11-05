import { Markup } from "telegraf";
import { keyboard } from "../../keyboard";
import { TelegrafContext } from "../../../types";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
*               Создание панели регистрации                */
//* * * * * * * * * * * * * * * *  * * * * * * * * * * * * *

export const RegisterPanel = async (ctx: TelegrafContext) => {
  try {

  ctx.session.id_mes_panel = (await ctx.replyWithHTML(
    ctx.i18n.t("registerPanel", {hat: ctx.i18n.t("hat")}),
    {...Markup.inlineKeyboard(keyboard.RegisterPanel)}
    )).message_id;

  return await ctx.scene.enter("register");

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
