import { TelegrafContext } from "../../orderBot/types";
import { ConfigOrder, ConfigRestaurant } from "../../types/dbImports";
import { productsToString } from "../../utils/productsToString";

export const waitOrder = async (ctx: TelegrafContext, order: ConfigOrder) => {
  try {
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({_id: order.restaurant_id}).toArray())[0];
    const stringProducts = productsToString(order.products);
    order.status = "оформлен (ожидание)";

    order.client.message_id = (
      await ctx.telegram.sendMessage(
        order.client.chatId,
        ctx.i18n.t("checkout-addedComment", {hat: ctx.i18n.t("hat"), order: order, restaurant: restaurant, strProd: stringProducts}),
        {parse_mode: "HTML"}
      )
    ).message_id;

    await ctx.dbOrders.updateOne({_id: order._id}, {$set: order});

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
