import { Markup } from "telegraf";
import { TelegrafContext } from "../../orderBot/types";
import { ConfigOrder, ConfigPromo, ConfigRestaurant } from "../../types/dbImports";
import { getInvoice } from "./getInvoice";
import { keyboard } from "./keyboard";
import { productsSum } from "../../utils/productsSum";
import { sendOrder } from "./sendOrder";
import { generateOrderId } from "./generateOrderId";
import FormData from "form-data";
import axios from "axios";

export const createOrder = async (ctx: TelegrafContext, payOnline?: boolean) => {
  try {
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({_id: ctx.session.restaurant_id}).toArray())[0];
    const time = new Date().getHours();
    if (time < restaurant.workingHours.start || time >= restaurant.workingHours.end) {
      await ctx.answerCbQuery(ctx.i18n.t("restaurant-isClose"), {show_alert: true});
      return await ctx.panel.OrderPanel(ctx);
    }
    if (restaurant.isStop.length > 0) {
      await ctx.answerCbQuery(ctx.i18n.t("restaurant-isStop", {message: restaurant.isStop}), {show_alert: true});
      return await ctx.panel.OrderPanel(ctx);
    }

    const banList: {phone: string, comment: string}[] = (await ctx.config.find({name: "ban-list"}).toArray())[0].data;
    if (banList.findIndex(el => el.phone.toString() === ctx.session.phone!.toString()) !== -1) {
      await ctx.answerCbQuery(ctx.i18n.t("isBanned"), {show_alert: true});
      return await ctx.panel.OrderPanel(ctx);
    }

    let first_name = "";

    try {
      const data = new FormData();
      data.append("secret", (await ctx.dbRestaurants.find({_id: ctx.session.restaurant_id!}).toArray())[0].frontPad);
      data.append("client_phone", "8"+ctx.session.phone!.toString().slice(1,11));
      await axios({
        method: "post",
        url: "https://app.frontpad.ru/api/index.php?get_client",
        data: data,
      }).then(async (res) => {
        if (res.data.result === "success") {
          first_name = "";
        } else if (res.data.error === "invalid_client_phone") {
          first_name = ctx.from!.first_name;
        } else {
          first_name = ctx.from!.first_name;
        }
      })
    } catch (err) {
      console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
    }

    const order: ConfigOrder = {
      _id: await generateOrderId(ctx),
      sum: productsSum(ctx.session.order!),
      bonusSum: ctx.wizard.state.data!.bonus ? ctx.wizard.state.data!.bonus : 0,
      status: "ожидает оплаты",
      payType: payOnline ? "онлайн оплата" : "оплата при получении",
      restaurant_id: ctx.session.restaurant_id!,
      date: new Date().toLocaleDateString("ru"),
      time: new Date().toLocaleTimeString("ru"),
      take: ctx.wizard.state.data!.take,
      cookingTime: ctx.wizard.state.data!.time,
      comment: ctx.wizard.state.data!.comment ? ctx.wizard.state.data!.comment : "",
      client: {
        username: ctx.from!.username!,
        number: ctx.session.phone ?? "0",
        first_name: first_name,
        chatId: ctx.from!.id,
      },
      products: ctx.session.order!.map(product => product)
    }
    if (order.bonusSum) ctx.session.last_bonus_write_off = new Date().getTime();
    await ctx.dbOrders.insertOne(order);
    ctx.session.orders
    ? ctx.session.orders.push(order._id)
    : ctx.session.orders = [order._id];
    if (ctx.session.promo_order) {
      const allPromo = (await ctx.config.find({name: "promo"}).toArray())[0];
      const currentPromo = allPromo.data.find((promo: ConfigPromo) => promo.name === ctx.session.promo_order);
      const currentPromoIndex = allPromo.data.findIndex((promo: ConfigPromo) => promo.name === ctx.session.promo_order);
      await ctx.config.updateOne({name: "promo"}, {$set: {['data.'+currentPromoIndex+'.counter']: currentPromo.counter +1}});

      ctx.session.used_promo ? ctx.session.used_promo.push(ctx.session.promo_order) : ctx.session.used_promo = [ctx.session.promo_order];
      delete ctx.session.promo_order;
    }

    delete ctx.session.id_mes_panel;
    delete ctx.session.order;
    try {
      await ctx.deleteMessage();
    } catch (err) {
      try {
        await ctx.telegram.editMessageText(ctx.callbackQuery!.message!.chat.id, ctx.callbackQuery!.message!.message_id, "0", ctx.i18n.t("hat-nHTML"));
      } catch (err) {
        console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
      }
      console.error(`Cant del err >> ${__filename} error:`, err)
    }
    await ctx.scene.leave();
    if (payOnline) {
      const datePlus = new Date(new Date().getTime() + 20*60000)
      return await ctx.replyWithInvoice(getInvoice(order), Markup.inlineKeyboard([[keyboard.checkout.payButton(`${datePlus.toLocaleTimeString("ru")}`)]])).then(async (data) => {
        setTimeout(async () => {
          // const _id = new ObjectId(order._id);
          const _id = order._id;
          const awaitOrder: ConfigOrder = (await ctx.dbOrders.find({_id: _id}).toArray())[0];
          if (awaitOrder.status === "ожидает оплаты") {
            await ctx.deleteMessage(data.message_id);
            awaitOrder.status = "отменён (до оплаты)";
            await ctx.dbOrders.updateOne({_id: awaitOrder._id}, {$set: awaitOrder});
            await ctx.replyWithHTML(ctx.i18n.t("order-canceled-time"));
          }
        }, 20*60000)
      }
      );
    } else {
      if (order.cookingTime === "Как можно скорее") {
        return await sendOrder(ctx, order);
      } else {
        return await sendOrder(ctx, order);
      }
    }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
