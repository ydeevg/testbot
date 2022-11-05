import { Markup } from "telegraf";
import { bot } from "../../init/orderBot";
import { ConfigOrder, ConfigRestaurant } from "../../types/dbImports";
import { keyboard } from "./keyboard";
import { messages } from "./messages";
import { productsToString } from "../../utils/productsToString";
import { rateOrder } from "./rateOrder";
interface IChangeStatusProps {
  status: number;
  orderNumber: string;
}
export const changeStatus = async (props: IChangeStatusProps) => {
  try {
    const {orderNumber, status} = props;
    const _id = orderNumber;
    const order: ConfigOrder = (await bot.context.dbOrders!.find({_id: _id}).toArray())[0];
    const restaurant: ConfigRestaurant = (await bot.context.dbRestaurants!.find({_id: order.restaurant_id}).toArray())[0];
    const stringProducts = productsToString(order.products);
    let newStatus = "";
    switch (status) {
      case 0:
        newStatus = "ожидает оплаты"
        break;
      case 1:
        newStatus = "оформлен (ожидание)"
        break;
      case 2:
        newStatus = "оформлен"
        break;
      case 3:
        newStatus = "готовится"
        break;
      case 4:
        newStatus = "готов к выдаче"
        break;
      case 5:
        newStatus = "получен"
        break;
      case 6:
        newStatus = "отменён"
        break;
      case 7:
        newStatus = "отменён (до оплаты)"
        break;
    }
    if ((order.status === newStatus) && (newStatus !== "оформлен")) return;
    order.status = newStatus;
    const menuKeyboard = [];

    if (status === 3) {
      order.changeStatusTime = {toCooking: new Date().toLocaleTimeString("ru")};
      if (order.fp_id) {
        menuKeyboard.push([keyboard.changeStatus.cancel(order._id)]);
      } else {
        menuKeyboard.push([keyboard.changeStatus.ready(order._id), keyboard.changeStatus.cancel(order._id)]);
      }
    } else if (status === 4) {
      if (!order.changeStatusTime?.toCooking)  order.changeStatusTime = {...order.changeStatusTime, toCooking: new Date().toLocaleTimeString("ru")};
      order.changeStatusTime = {...order.changeStatusTime, toReady: new Date().toLocaleTimeString("ru")};
      if (order.fp_id) {
        menuKeyboard.push([keyboard.changeStatus.cancel(order._id)]);
      } else {
        menuKeyboard.push([keyboard.changeStatus.placed(order._id), keyboard.changeStatus.cancel(order._id)]);
      }
    } else if (status === 2) {
      if (order.fp_id) {
        order.changeStatusTime = {}
        menuKeyboard.push([keyboard.changeStatus.cancel(order._id)]);
      } else {
        menuKeyboard.push([keyboard.changeStatus.accept(order._id), keyboard.changeStatus.cancel(order._id)]);
      }
    } else if (status === 5) {
      if (!order.changeStatusTime?.toCooking)  order.changeStatusTime = {...order.changeStatusTime, toCooking: new Date().toLocaleTimeString("ru")};
      if (!order.changeStatusTime?.toReady)  order.changeStatusTime = {...order.changeStatusTime, toReady: new Date().toLocaleTimeString("ru")};
      order.changeStatusTime = {...order.changeStatusTime, received: new Date().toLocaleTimeString("ru")};
      if (!order.fp_id) try {bot.telegram.unpinChatMessage(restaurant.chat_id, order.client.restaurant_message_id)} catch (e) {console.log(e)};
    } else if (status === 6) {
      if (!order.fp_id) try {bot.telegram.unpinChatMessage(restaurant.chat_id, order.client.restaurant_message_id)} catch (e) {console.log(e)};
    }
    try {
      await bot.telegram.deleteMessage(order.client.chatId, order.client.message_id!);
    } catch (err) {
      try {
        await bot.telegram.editMessageText(order.client.chatId, order.client.message_id!, "0", ".");
      } catch (err) {
        console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
      }
    }
    await bot.telegram.editMessageText(
      restaurant.chat_id, order.client.restaurant_message_id, "0",
      messages.changeStatusNew(order, restaurant, stringProducts),
      {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)}
    );
    await bot.telegram.sendMessage(
      order.client.chatId,
      messages.changeStatusClient(order, restaurant, stringProducts),
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard(order.status === "получен" ? [[keyboard.changeStatus.newOrder], [keyboard.changeStatus.repeat(order._id)]] : [])
      }
    ).then(async (data) => {
        order.client.message_id = data.message_id;
        if (order.status === "получен") await rateOrder(order);
      }
    )

    await bot.context.dbOrders!.updateOne({_id: order._id}, {$set: order});
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
