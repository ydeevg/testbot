import { Markup } from "telegraf";
import { TelegrafContext } from "../../../../types"
import { getAdminLvl } from "../../../getAdminLvl";
import { keyboard } from "../../../keyboard";

export const AdminPanel = async (ctx: TelegrafContext) => {
  try {
    const adminLvl = await getAdminLvl(ctx.from!.id);
    if (!(adminLvl > 0)) return;
    await ctx.editMessageText(ctx.i18n.t("admin-panel", {hat: ctx.i18n.t("hat")}),
    {parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      adminLvl >= 2 ? [keyboard.adminPanel.main.parsingKey] : [],
      adminLvl >= 2 ? [keyboard.adminPanel.main.workTimeKey] : [],
      [keyboard.adminPanel.main.stopRest],
      [keyboard.adminPanel.main.stopList],
      [keyboard.back]])});
    await ctx.scene.leave();
    await ctx.scene.enter("admin");
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
