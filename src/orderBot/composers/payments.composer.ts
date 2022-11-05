import { Composer } from "telegraf";
import { TelegrafContext } from "../types";
import { ConfigOrder, ConfigRestaurant } from "../../types/dbImports";
import { sendOrder } from "../utils/sendOrder";

const composer = new Composer<TelegrafContext>();

composer.on('pre_checkout_query', async (ctx) => {
  try {
  const _id = (JSON.parse(ctx.preCheckoutQuery.invoice_payload))._id;
  const order: ConfigOrder = (await ctx.dbOrders.find({_id: _id}).toArray())[0];
  const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({_id: order.restaurant_id}).toArray())[0];
  const time = new Date().getHours();
  if (time >= restaurant.workingHours.start && time < restaurant.workingHours.end) {
    const [dTimeH, dTimeM] = order.time.split(":");
    const [dD, dM, dY] = order.date.split(".");
    const orderDate = new Date(Number(dY), Number(dM)-1, Number(dD), Number(dTimeH), Number(dTimeM));
    console.log(new Date().toLocaleTimeString(), new Date(orderDate.getTime() + 20*60000).toLocaleTimeString())
    if(new Date() < new Date(orderDate.getTime() + 20*60000)) {
      await ctx.answerPreCheckoutQuery(true)
    } else {
      await ctx.answerPreCheckoutQuery(false, "❗️ Вы пытаетесь оплатить старый чек ❗️ Оплатить заказ можно в течении 20 минут после создания чека");
    }
  } else {
    await ctx.answerPreCheckoutQuery(false, "❗️ Ресторан сейчас закрыт ❗️ Ждём заказ от вас в рабочее время ресторана!");
  }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});
composer.on('successful_payment', async (ctx, next) => { // ответ в случае положительной оплаты
  try {
    const _id = (JSON.parse(ctx.message.successful_payment.invoice_payload))._id;
    const order: ConfigOrder = (await ctx.dbOrders.find({_id: _id}).toArray())[0];
    await sendOrder(ctx, order);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = composer;
