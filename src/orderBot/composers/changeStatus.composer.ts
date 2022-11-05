import { Composer } from "telegraf";
import { TelegrafContext } from "../types";
import { ConfigOrder } from "../../types/dbImports";
import { changeStatus } from "../utils/changeStatus";

const composer = new Composer<TelegrafContext>();
//Без уведомлений
composer.action(/^ordCS\:/ , async (ctx: TelegrafContext) => {
  try {
    await ctx.answerCbQuery(ctx.i18n.t("loading")) ;
    const [, status, orderId] = ctx.callbackQuery!.data!.split(":");
    const _id = orderId;
    const order: ConfigOrder = (await ctx.dbOrders.find({_id: _id}).toArray())[0];

    if (status === "Accept") {
      await changeStatus({orderNumber: order._id, status: 3});
    } else if (status === "Ready") {
      await changeStatus({orderNumber: order._id, status: 4});
    } else if (status === "Placed") {
      await changeStatus({orderNumber: order._id, status: 5});
    } else if (status === "Cancel") {
      await changeStatus({orderNumber: order._id, status: 6});
    }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = composer;
