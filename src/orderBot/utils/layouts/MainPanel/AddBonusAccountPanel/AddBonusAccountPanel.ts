import { Markup } from "telegraf";
import { TelegrafContext } from "../../../../types";

//* * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

export const AddBonusAccountPanel = async (ctx: TelegrafContext) => {
  try {
    try   {
      await ctx.telegram.deleteMessage(ctx.from!.id, ctx.session.id_mes_panel!);
    } catch (err) {
      try {
        await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "0", ctx.i18n.t("hat-nHTML"));
      } catch (err) {
        console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
      }
    }

    ctx.session.id_mes_panel = (await ctx.replyWithHTML(
      ctx.i18n.t("enterPhoneNumber", {hat: ctx.i18n.t("hat")}),
      {...Markup.keyboard([[Markup.button.contactRequest("Поделится контактом 📲")]]).oneTime().resize()}
    )).message_id;

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
