import { ObjectId } from "mongodb";
import { Composer } from "telegraf";
import { TelegrafContext } from "../types";
import { ConfigOrder } from "../../types/dbImports";

const composer = new Composer<TelegrafContext>();
//Без уведомлений
composer.action(/^cancelOrd\:/ , async (ctx: TelegrafContext) => {
  try {
    const [, orderId] = ctx.callbackQuery!.data!.split(":");
    const _id = orderId;
    const order: ConfigOrder = (await ctx.dbOrders.find({_id: _id}).toArray())[0];

    order.status = "отменён (до оплаты)";

    await ctx.deleteMessage();
    await ctx.answerCbQuery(ctx.i18n.t("success"), {show_alert: true});
    await ctx.dbOrders.updateOne({_id: order._id}, {$set: order});
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = composer;
