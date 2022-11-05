import axios from "axios";
import FormData from "form-data";
import { Composer } from "telegraf";
import { ConfigRestaurant } from "../../types/dbImports";
import { TelegrafContext } from "../types";

interface IProductsAPIData {
  product_id: string[];
  name: string[];
  price: string[];
}

const composer = new Composer<TelegrafContext>();

composer.command("help",async (ctx: TelegrafContext) => {
  try {
    const restaurants: ConfigRestaurant[] = await ctx.dbRestaurants!.find({}).toArray();
    const restChatIds = restaurants.map(rest => rest.chat_id);
    if (ctx.chat!.id === Number(process.env.MAILING_CHAT)) {
      return ctx.replyWithHTML(ctx.i18n.t("help-mailing"));
    } else if (restChatIds.includes(ctx.chat!.id)) {
      return ctx.replyWithHTML(ctx.i18n.t("help-restChat"));
    } else {
      return ctx.replyWithHTML(ctx.i18n.t("help"));
    }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})




module.exports = composer;
