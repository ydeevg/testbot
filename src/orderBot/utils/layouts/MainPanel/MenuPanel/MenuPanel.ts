import { Markup } from "telegraf";
import { TelegrafContext } from "../../../../types"
import { ConfigCategory } from "../../../../../types/dbImports";
import { CreateMultilineKeyboard } from "../../../CreateMultilineKeyboard";
import { keyboard } from "../../../keyboard";

export const MenuPanel = async (ctx: TelegrafContext) => {
  try {
    const categories: [] = ( await ctx.config.find({name: "categories"}).toArray())[0].data.filter((cat: ConfigCategory) => cat.config.show);
    const catKeyboard = CreateMultilineKeyboard(categories, "category", "id", 1, "name");
    const menuKeyboard = [];

    catKeyboard.map((str) => {menuKeyboard.push(str)});

    if (ctx.session.order) {
      menuKeyboard.push([keyboard.order(ctx), keyboard.back]);
    } else {
      menuKeyboard.push([keyboard.back]);
    }

    await ctx.editMessageText(ctx.i18n.t("menuPanel", {hat: ctx.i18n.t("hat")}),
    {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)})

    await ctx.scene.leave();
    return await ctx.scene.enter("menu");
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
