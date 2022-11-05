import axios from "axios";
import FormData from "form-data";
import { Telegraf } from "telegraf";
import { TelegrafContext } from "../../orderBot/types";
import { ConfigOrder, ConfigProduct, ConfigRestaurant } from "../../types/dbImports";
import { changeStatus } from "./changeStatus";

const generateFromFrontPad = (products: ConfigProduct[]) => {
  const productArr: string[] = [];
  const product_kolArr: string[] = [];
  const product_priceArr: string[] = [];
  const product_modArr: any = {};
  products.forEach(prod => {
    productArr.push(prod.product_id);
    product_kolArr.push(prod.amount!.toString());
    product_priceArr.push(prod.price!.toString());
    if (prod.additives) {
      const key = (productArr.length-1).toString();
      prod.additives.forEach((add) => {
        productArr.push(add.product_id);
        product_kolArr.push(prod.amount!.toString());
        product_priceArr.push(add.price!.toString());
        product_modArr[productArr.length-1] = key;
      })
    }
  })
  return [productArr, product_kolArr, product_priceArr, product_modArr]
}

export const sendOrder = async (ctx: (TelegrafContext | Partial<TelegrafContext>), order: ConfigOrder, bot?: Telegraf<TelegrafContext>) => {
  try {
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants!.find({_id: order.restaurant_id}).toArray())[0];
    order.status = "оформлен"

    if (restaurant.fpIntegration) {
      const [products, kol, price, mod] = generateFromFrontPad(order.products)
      const curDate = new Date();
      const data = new FormData();
      data.append("secret", (await ctx.dbRestaurants!.find({_id: order.restaurant_id}).toArray())[0].frontPad);
      for (let key in products) {
        data.append(`product[${key}]`, products[key]);
      }
      for (let key in kol) {
        data.append(`product_kol[${key}]`, kol[key]);
      }
      if (mod) {
        for (let key in mod) {
          data.append(`product_mod[${key}]`, mod[key]);
        }
      }
      for (let key in price) {
        data.append(`product_price[${key}]`, price[key]);
      }
      data.append("phone", "8"+order.client.number!.toString().slice(1,11));
      const descText = `${order.cookingTime.length > 6 ? "" : "Приготовить к " + order.cookingTime + " | "}${order.comment ? order.comment + " | " : ""}#${order._id}`;
      data.append("descr", descText);
      data.append("tags[0]", order.take ? 317 : 318);
      data.append("hook_status[0]", 19);
      data.append("hook_status[1]", 20);
      data.append("hook_status[2]", 10);
      data.append(`hook_url`, `http://${process.env.SERVER_IP}:${process.env.SERVER_PORT}/api/changeStatus`);
      data.append("channel", 363);
      if (order.client.first_name) data.append("name", order.client.first_name);
      if (order.bonusSum && order.bonusSum > 0) data.append("score", order.bonusSum);
      if (order.restaurant_id) data.append("affiliate", order.restaurant_id.toString());
      if (order.cookingTime !== "Как можно скорее") data.append("datetime", `${curDate.toLocaleDateString("se-SE")} ${order.cookingTime}:00`);
      await axios({
        method: "post",
        url: "https://app.frontpad.ru/api/index.php?new_order",
        data: data,
        headers: {'Content-type': 'application/json', "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.143 YaBrowser/22.5.0.1792 Yowser/2.5 Safari/537.36"},
        responseType: "text"
      }).then(async (res) => {
        if (res.data.result === "error") {
          if (bot) {
            bot.telegram.sendMessage(restaurant.chat_id, `Заказ #${order._id} не смог отправится в FRONTPAD. Пробейте самостоятельно.`, {parse_mode: "HTML"})
          } else {
            ctx.telegram!.sendMessage(restaurant.chat_id, `Заказ #${order._id} не смог отправится в FRONTPAD. Пробейте самостоятельно.`, {parse_mode: "HTML"})
          }
        } else {
          order.fp_id = res.data.order_id;
          order.fp_number = res.data.order_number;
        }
      }).catch(async () => {
        if (bot) {
          bot.telegram.sendMessage(restaurant.chat_id,`Заказ #${order._id} не смог отправится в FRONTPAD. Пробейте самостоятельно.`, {parse_mode: "HTML"})
        } else {
          ctx.telegram!.sendMessage(restaurant.chat_id, `Заказ #${order._id} не смог отправится в FRONTPAD. Пробейте самостоятельно.`, {parse_mode: "HTML"})
        }
      })
    }

    if (order.client.message_id) {
      if (bot) {
        await bot.telegram.editMessageText(order.client.chatId, order.client.message_id, "1", "обновление нового заказа...", {parse_mode: "HTML"});
      } else {
        await ctx.telegram!.editMessageText(order.client.chatId, order.client.message_id, "1", "обновление нового заказа...", {parse_mode: "HTML"});
        delete ctx.session!.id_mes_panel;
      }
    } else {
      if (bot) {
        order.client.message_id = (await bot.telegram.sendMessage(order.client.chatId, "загрузка нового заказа...", {parse_mode: "HTML"})).message_id;
      } else {
        order.client.message_id = (await ctx.telegram!.sendMessage(order.client.chatId, "загрузка нового заказа...", {parse_mode: "HTML"})).message_id;
      }
    }

    if (bot) {
      await bot.telegram.sendMessage(restaurant.chat_id, "загрузка нового заказа...", {parse_mode: "HTML"})
      .then((data) => {
        order.client.restaurant_message_id = data.message_id;
        if (restaurant.fpIntegration) {
          if (!order.fp_id) try {(bot.telegram.pinChatMessage(data.chat.id, data.message_id))} catch (e) {};
        } else {
          try {(bot.telegram.pinChatMessage(data.chat.id, data.message_id, {disable_notification: true}))} catch (e) {};
        }
      });
    } else {
      await ctx.telegram!.sendMessage(restaurant.chat_id, "загрузка нового заказа...", {parse_mode: "HTML"})
      .then((data) => {
        order.client.restaurant_message_id = data.message_id
        if (restaurant.fpIntegration) {
          if (!order.fp_id) try {(ctx.telegram!.pinChatMessage(data.chat.id, data.message_id))} catch (e) {};
        } else {
          try {(ctx.telegram!.pinChatMessage(data.chat.id, data.message_id, {disable_notification: true}))} catch (e) {};
        }
      });
    }
    await ctx.dbOrders!.updateOne({_id: order._id}, {$set: order});
    await changeStatus({status: 2, orderNumber: order._id});
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
