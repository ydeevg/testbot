import { Markup } from "telegraf";
import { TelegrafContext } from "../../../../types"
import { ConfigProduct, ConfigPromo } from "../../../../../types/dbImports";
import { keyboard } from "../../../keyboard";
import { productsSum } from "../../../../../utils/productsSum";
import { productsToString } from "../../../../../utils/productsToString";
import { updatePrices } from "../../../updatePrices";

export const OrderPanel = async (ctx: TelegrafContext, edit = true) => {
  try {
    if (!ctx.session.order) return await ctx.panel.MainPanel(ctx, true);
    const oldOrder = JSON.parse(JSON.stringify(ctx.session.order));
    ctx.session.order = await updatePrices(ctx.session.order!, ctx.session.restaurant_id!);
    if (productsSum(oldOrder!) !== productsSum(ctx.session.order!)) {
      await ctx.answerCbQuery("Внимание✋\n Цены, продукты или добавки в корзине изменились\n\nНажмите ещё раз и проверьте изменения перед заказом", {show_alert: true});
      if (ctx.session.order.length < 1) {
        delete ctx.session.order;
        return await ctx.panel.MainPanel(ctx);
      } else {
        return await ctx.panel.OrderPanel(ctx);
      }
    }
    if (ctx.session.promo_order) {
      const orderSum = await productsSum(ctx.session.order)
      const allPromo = (await ctx.config.find({name: "promo"}).toArray())[0]
      const currentPromo = allPromo.data.find((promo: ConfigPromo) => promo.name === ctx.session.promo_order);
      if (orderSum < currentPromo.condition) {
        await ctx.answerCbQuery(ctx.i18n.t("orderPanel-promo-answer"), {show_alert: true});
        const prodIndex = ctx.session.order.findIndex((prod: ConfigProduct) => prod.promo);
        ctx.session.order!.splice(prodIndex, 1);
        delete ctx.session.promo_order;
        if (!ctx.session.order!.length) {
          delete ctx.session.order;
          return await ctx.panel.MainPanel(ctx);
        }
      }
    }
    const orderDishes = await productsToString(ctx.session.order);
    const order = {
      orderDishes: orderDishes,
      fullPrice: await productsSum(ctx.session.order),
    }
    const menuKeyboard = [
      [keyboard.orderPanel.editOrder],
      // [keyboard.orderPanel.promo],
      [keyboard.orderPanel.checkout, keyboard.back]
    ]

    const restaurant = (await ctx.dbRestaurants.find({_id: ctx.session.restaurant_id}).toArray())[0]
    if (edit) {
      await ctx.editMessageText(ctx.i18n.t("orderPanel", {order, restaurant: restaurant, hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)});
    } else {
      if ( ctx.session.id_mes_panel ) {
        try {
          await ctx.telegram.deleteMessage(ctx.from!.id, ctx.session.id_mes_panel);
        } catch (err) {
          try {
            await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "0", ctx.i18n.t("hat-nHTML"));
          } catch (err) {
            console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
          }
        }
      }

      ctx.session.id_mes_panel = ( await ctx.replyWithHTML(
        ctx.i18n.t("orderPanel", {order, restaurant: restaurant, hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)}) ).message_id;
    }
    await ctx.answerCbQuery();
    await ctx.scene.leave();
    return await ctx.scene.enter("order");
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
