import { Markup, Telegraf } from "telegraf";
import { TelegrafContext } from "../types";
import cron from "node-cron";
import { ConfigOrder, ConfigRestaurant } from "../../types/dbImports";
import { productsSum } from "../../utils/productsSum";
import { sendOrder } from "../utils/sendOrder";
import { keyboard } from "../utils/keyboard";
import { reports } from "./reports";

export const configCron = (bot: Telegraf<TelegrafContext>) => {
  cron.schedule("*/30 * * * *", async () => {
    const restaurants: ConfigRestaurant[] = await bot.context.dbRestaurants!.find({}).toArray();
    for (let rest of restaurants) {
      const orders: ConfigOrder[] = await bot.context.dbOrders!.find({$and:[{date: new Date().toLocaleDateString("ru")},{restaurant_id: rest._id}]}).toArray();
      if (orders.length) {
        const allOrders = orders.filter(order => {
          const [hour, min,] = order.time.split(":");
          if (Number(hour) === new Date().getHours()) return false;
          if (Number(hour)+1 === new Date().getHours() && new Date().getMinutes() < 30 ? Number(min) >= 30 : false) return false;
          return order.status !== "получен" && order.status !== "отменён" && order.status !== "отменён (до оплаты)" && order.status !== "ожидает оплаты" && order.status !== "оформлен (ожидание)";
        })
        if (allOrders.length) {
          let ordersText = "<b>Есть незакрытые заказы:</b>\n\n";
          ordersText += allOrders.map(order => `#${order._id} ${order.status} | приготовить ${order.cookingTime}`).join("\n");
          ordersText += "\n\nпроверьте данные заказы и закреплённые сообщения";
          await bot.telegram.sendMessage(rest.chat_id, ordersText, {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.hideThisMessage])});
        }
      }
    }
  });

  cron.schedule("20 */5 * * * *", async () => {
    const restaurants: ConfigRestaurant[] = await bot.context.dbRestaurants!.find({}).toArray();
    for (let rest of restaurants) {
      const orders: ConfigOrder[] = await bot.context.dbOrders!.find({$and:[{date: new Date().toLocaleDateString("ru")},{restaurant_id: rest._id}, {status: "оформлен (ожидание)"}]}).toArray();
      if (orders.length) {
        orders.forEach(order => {
          const sum = productsSum(order.products);
          const sendTime = sum < 1000 ? 30 : sum < 2000 ? 40 : 60;
          const [oD, oM, oY] = order.date.split(".");
          const [pH, pM] = order.cookingTime.split(":");
          const cookingDate = new Date(Number(oY), Number(oM)-1, Number(oD), Number(pH), Number(pM)).getTime();
          const currentDate = new Date().getTime() + sendTime * 60000;
          return cookingDate <= currentDate ?  sendOrder(bot.context, order, bot) : false;
        })
      }
    }
  });

  reports();

  cron.schedule("5 12 * * *", async () => {
  // cron.schedule("*/1 * * * *", async () => {
    const restaurants: ConfigRestaurant[] = await bot.context.dbRestaurants!.find({}).toArray();
    const regexPromo = /^990/;
    for (const rest of restaurants) {
      const products = rest.products;
      const stopProducts = products.filter(prod => prod.stop && !regexPromo.test(prod.product_id));
      console.log(stopProducts)
      if (stopProducts.length > 0) {
        let message = "<b>Напоминание о стоп-листе</b>\n\nВ данный момент в стоп-листе следующие продукты:\n\n";
        stopProducts.forEach(product => message += "<i>" + product.name + "</i>\n");
        message += "\nЕсли продукты уже доступны, то необходимо вынести их из <b>стоп-листа</b>";
        bot.telegram.sendMessage(rest.rate_chat_id, message, {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.hideThisMessage])});
      }
    }
  });
}
