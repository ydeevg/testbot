import axios from "axios";
import FormData from "form-data";
import { Scenes, Composer, Markup } from "telegraf";
import { TelegrafContext } from "../types";
import { ConfigRestaurant } from "../../types/dbImports";
import { createOrder } from "../utils/createOrder";
import { keyboard } from "../utils/keyboard";
import { productsSum } from "../../utils/productsSum";
import { updatePrices } from "../utils/updatePrices";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *         Сцена оформления заказ | CheckoutPanel          *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//* * * * *       Реакция на кнопки       * * * * * *
const confirmRestaurant = new Composer<TelegrafContext>();
confirmRestaurant.action("yes", async (ctx: TelegrafContext) => { // подтверждение ресторана
  try {
    if (ctx.session.phone) {
      ctx.editMessageText(
        ctx.i18n.t("checkout-goto", { hat: ctx.i18n.t("hat") }),
        { parse_mode: "HTML", ...Markup.inlineKeyboard([[keyboard.checkout.here], [keyboard.checkout.take]]) }
      );
      ctx.answerCbQuery();
      return await ctx.wizard.selectStep(2);
    } else {
      try {
        await ctx.telegram.deleteMessage(ctx.from!.id, ctx.session.id_mes_panel!);
      } catch (err) {
        try {
          await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "0", ctx.i18n.t("hat-nHTML"));
        } catch (err) {
          console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
        }
      }
      ctx.session.id_mes_panel = (await ctx.replyWithHTML(
        ctx.i18n.t("checkout-getContact", { hat: ctx.i18n.t("hat") }),
        { ...Markup.keyboard([[Markup.button.contactRequest("Поделится контактом 📲")]]).oneTime().resize() }
      )).message_id;
      ctx.answerCbQuery();
      return await ctx.wizard.next();
    }

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
confirmRestaurant.action("backT", async (ctx: TelegrafContext) => { // назад в меню
  try {
    await ctx.panel.OrderPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
// Проверка контакта
const confirmNumber = new Composer<TelegrafContext>();
confirmNumber.on("contact", async (ctx) => { // получен контакт
  try {
    try {
      if (!ctx.session.id_mes_panel) return;
      try {
        await ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.session.id_mes_panel);
      } catch (err) {
        try {
          await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "0", ctx.i18n.t("hat-nHTML"));
        } catch (err) {
          console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
        }
      }
      try {
        await ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message_id);
      } catch (err) {
        try {
          await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "0", ctx.i18n.t("hat-nHTML"));
        } catch (err) {
          console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
        }
      }

    } catch (err) {
      console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
    }
    if (ctx.message.contact.user_id !== ctx.from?.id) {
      ctx.session.id_mes_panel = (await ctx.replyWithHTML(
        ctx.i18n.t("checkout-getContact-err-isNotThisUser", { hat: ctx.i18n.t("hat") }),
        { ...Markup.keyboard([[Markup.button.contactRequest("Поделится контактом 📲")]]).oneTime().resize() }
      )).message_id;
      return;
    } else {
      let phone = ctx.message.contact.phone_number;
      if (phone[0] === "+") phone = phone.slice(1, 12);
      if (phone[0] === "8") phone = "7" + phone.slice(1, 11);
      ctx.session.phone = phone;
      ctx.session.id_mes_panel = (await ctx.replyWithHTML(ctx.i18n.t("checkout-goto", { hat: ctx.i18n.t("hat") }), { ...Markup.inlineKeyboard([[keyboard.checkout.here], [keyboard.checkout.take]]) })).message_id;
      return await ctx.wizard.next();
    }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});
confirmNumber.on("message", async (ctx) => { // другое сообщение
  try {
    try {
      await ctx.telegram.deleteMessage(ctx.from!.id, ctx.session.id_mes_panel!);
    } catch (err) {
      try {
        await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "0", ctx.i18n.t("hat-nHTML"));
      } catch (err) {
        console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
      }
    }
    ctx.session.id_mes_panel = (await ctx.replyWithHTML(
      ctx.i18n.t("checkout-getContact", { hat: ctx.i18n.t("hat") }),
      { ...Markup.keyboard([[Markup.button.contactRequest("Поделится контактом 📲")]]).oneTime().resize() }
    )).message_id;
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
// здесь/с собой
const take = new Composer<TelegrafContext>();
take.action(/.+/, async (ctx) => {
  try {
    ctx.wizard.state.data = {}
    ctx.wizard.state.data.take = ctx.callbackQuery.data === "here" ? false : true;

    ctx.editMessageText(
      ctx.i18n.t("checkout-time", { hat: ctx.i18n.t("hat") }),
      { parse_mode: "HTML", ...Markup.inlineKeyboard([[keyboard.checkout.soon], [keyboard.checkout.inTime]]) });
    ctx.wizard.next();

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});

// ко времени / скорее
const time = new Composer<TelegrafContext>();
time.action("inTime", async (ctx) => {
  try {
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({ _id: ctx.session.restaurant_id }).toArray())[0];
    const time = new Date(new Date().getTime() + (40 * 60000));
    const props = {
      amountH: time.getHours() === Number(restaurant.workingHours.end) ? time.getHours() - 1 : time.getHours(),
      amountM: time.getHours() === Number(restaurant.workingHours.end) ? 50 : (10 * Math.ceil(time.getMinutes())) > 59 ? 50 : (10 * Math.ceil(time.getMinutes())),
      workTime: restaurant.workingHours,
    }
    ctx.editMessageText(
      ctx.i18n.t("checkout-inTime", { hat: ctx.i18n.t("hat"), props: props }),
      { parse_mode: "HTML", ...Markup.inlineKeyboard(keyboard.checkout.timeCounter(props)) });
    ctx.wizard.next();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});
time.action("soon", async (ctx) => {
  try {
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({ _id: ctx.session.restaurant_id }).toArray())[0];
    ctx.wizard.state.data!.time = "Как можно скорее"
    ctx.editMessageText(
      ctx.i18n.t("checkout-comment", { hat: ctx.i18n.t("hat") }),
      { parse_mode: "HTML", ...Markup.inlineKeyboard([[keyboard.checkout.noComment]]) });
    ctx.wizard.selectStep(5);

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});
time.action("backT", async (ctx: TelegrafContext) => { // назад в меню
  try {
    await ctx.panel.OrderPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

const inTime = new Composer<TelegrafContext>();
inTime.action(/^time\:/, async (ctx) => {
  try {
    const [, amountH, amountM] = ctx.callbackQuery.data!.split(":")
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({ _id: ctx.session.restaurant_id }).toArray())[0];
    const props = {
      amountH: Number(amountM) >= 60 ? Number(amountH) + 1 : Number(amountM) < 0 ? Number(amountH) - 1 : Number(amountH),
      amountM: Number(amountM) >= 60 ? 0 : Number(amountM) < 0 ? 50 : (Number(amountH) === new Date().getHours()
        ? (Number(amountM) + 40 > new Date().getMinutes() ? Number(amountM) : 50)
        : Number(amountM)),
      workTime: restaurant.workingHours,
    }
    await ctx.editMessageText(
      ctx.i18n.t("checkout-inTime", { hat: ctx.i18n.t("hat"), props: props }),
      { parse_mode: "HTML", ...Markup.inlineKeyboard(keyboard.checkout.timeCounter(props)) }
    );
    ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});
inTime.action(/^yes\:/, async (ctx) => {
  try {
    const [, amountH, amountM] = ctx.callbackQuery.data!.split(":");
    ctx.wizard.state.data!.time = (amountH.toString().length === 1 ? "0" + amountH.toString() : amountH) + ":" + (amountM.toString().length === 1 ? "0" + amountM.toString() : amountM)
    await ctx.editMessageText(
      ctx.i18n.t("checkout-comment", { hat: ctx.i18n.t("hat") }),
      { parse_mode: "HTML", ...Markup.inlineKeyboard([[keyboard.checkout.noComment]]) }
    );
    ctx.answerCbQuery();
    ctx.wizard.selectStep(5);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});
inTime.action("backT", async (ctx: TelegrafContext) => { // назад в меню
  try {
    await ctx.panel.OrderPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
const comment = new Composer<TelegrafContext>();
comment.on("text", async (ctx) => {
  try {
    ctx.wizard.state.data!.comment = ctx.message.text;
    try {
      await ctx.telegram.deleteMessage(ctx.from.id, ctx.message.message_id);
    } catch (err) {
      try {
        await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "0", ctx.i18n.t("hat-nHTML"));
      } catch (err) {
        console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
      }
    }
    let bonus = 0;
    const data = new FormData();
    data.append("secret", (await ctx.dbRestaurants.find({ _id: ctx.session.restaurant_id! }).toArray())[0].frontPad);
    data.append("client_phone", "8" + ctx.session.phone!.toString().slice(1, 11));
    await axios({
      method: "post",
      url: "https://app.frontpad.ru/api/index.php?get_client",
      data: data,
    }).then(async (res) => {
      if (res.data.result === "success") {
        bonus = Number(res.data.score);
      }
    })
    const menuKeyboard = [
      [keyboard.checkout.payInRestaurant],
    ]
    if (bonus >= productsSum(ctx.session.order!)) {
      if (ctx.session.last_bonus_write_off) {
        if (ctx.session.last_bonus_write_off + 720 * 60000 < new Date().getTime()) {
          menuKeyboard.push([keyboard.checkout.payBonus(Math.floor(bonus), productsSum(ctx.session.order!))]);
        }
      } else {
        menuKeyboard.push([keyboard.checkout.payBonus(Math.floor(bonus), productsSum(ctx.session.order!))]);
      }
    }
    menuKeyboard.push([keyboard.checkout.return]);
    await ctx.telegram.editMessageText(
      ctx.from!.id, ctx.session.id_mes_panel, "0",
      ctx.i18n.t("checkout-pay", { hat: ctx.i18n.t("hat"), sum: productsSum(ctx.session.order!), time: ctx.wizard.state.data!.time }),
      {
        parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)
      });
    return await ctx.wizard.next();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
comment.action("noComment", async (ctx) => {
  try {
    let bonus = 0;
    const data = new FormData();
    data.append("secret", (await ctx.dbRestaurants.find({ _id: ctx.session.restaurant_id! }).toArray())[0].frontPad);
    data.append("client_phone", "8" + ctx.session.phone!.toString().slice(1, 11));
    await axios({
      method: "post",
      url: "https://app.frontpad.ru/api/index.php?get_client",
      data: data,
    }).then(async (res) => {
      if (res.data.result === "success") {
        bonus = Number(res.data.score);
      }
    })
    const menuKeyboard = [
      [keyboard.checkout.payInRestaurant],
    ]
    if (bonus >= productsSum(ctx.session.order!)) {
      if (ctx.session.last_bonus_write_off) {
        if (ctx.session.last_bonus_write_off + 720 * 60000 < new Date().getTime()) {
          menuKeyboard.push([keyboard.checkout.payBonus(Math.floor(bonus), productsSum(ctx.session.order!))]);
        }
      } else {
        menuKeyboard.push([keyboard.checkout.payBonus(Math.floor(bonus), productsSum(ctx.session.order!))]);
      }
    }
    menuKeyboard.push([keyboard.checkout.return]);

    await ctx.telegram.editMessageText(
      ctx.from!.id, ctx.session.id_mes_panel, "0",
      ctx.i18n.t("checkout-pay", { hat: ctx.i18n.t("hat"), sum: productsSum(ctx.session.order!), time: ctx.wizard.state.data!.time }),
      {
        parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)
      });
    return await ctx.wizard.next();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
comment.action("backT", async (ctx: TelegrafContext) => { // назад в меню
  try {
    await ctx.panel.OrderPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

const payMethod = new Composer<TelegrafContext>();
payMethod.action("payInRestaurant", async (ctx) => {
  try {
    const oldOrder = JSON.parse(JSON.stringify(ctx.session.order));
    ctx.session.order = await updatePrices(ctx.session.order!, ctx.session.restaurant_id!);
    if (productsSum(oldOrder!) !== productsSum(ctx.session.order!)) {
      await ctx.answerCbQuery("Внимание✋\n Цены, продукты или добавки в корзине изменились\n\nНажмите ещё раз и проверьте изменения перед заказом", { show_alert: true });
      if (ctx.session.order.length < 1) {
        delete ctx.session.order;
        return await ctx.panel.MainPanel(ctx);
      } else {
        return await ctx.panel.OrderPanel(ctx);
      }
    }
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({ _id: ctx.session.restaurant_id! }).toArray())[0];
    const time = new Date().getHours();
    if (time < restaurant.workingHours.start || time >= restaurant.workingHours.end) {
      await ctx.answerCbQuery(ctx.i18n.t("restaurant-isClose"), { show_alert: true });
      return await ctx.panel.OrderPanel(ctx);
    }
    if (restaurant.isStop.length > 0) {
      await ctx.answerCbQuery(ctx.i18n.t("restaurant-isStop", { message: restaurant.isStop }), { show_alert: true });
      return await ctx.panel.OrderPanel(ctx);
    }
    return await createOrder(ctx);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
payMethod.action("payOnline", async (ctx) => {
  try {
    const oldOrder = JSON.parse(JSON.stringify(ctx.session.order));
    ctx.session.order = await updatePrices(ctx.session.order!, ctx.session.restaurant_id!);
    if (productsSum(oldOrder!) !== productsSum(ctx.session.order!)) {
      await ctx.answerCbQuery("Внимание✋\n Цены, продукты или добавки в корзине изменились\n\nНажмите ещё раз и проверьте изменения перед заказом", { show_alert: true });
      if (ctx.session.order.length < 1) {
        delete ctx.session.order;
        return await ctx.panel.MainPanel(ctx);
      } else {
        return await ctx.panel.OrderPanel(ctx);
      }
    }
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({ _id: ctx.session.restaurant_id! }).toArray())[0];
    const time = new Date().getHours();
    if (time < restaurant.workingHours.start || time >= restaurant.workingHours.end) {
      await ctx.answerCbQuery(ctx.i18n.t("restaurant-isClose"), { show_alert: true });
      return await ctx.panel.OrderPanel(ctx);
    }
    if (restaurant.isStop.length > 0) {
      await ctx.answerCbQuery(ctx.i18n.t("restaurant-isStop", { message: restaurant.isStop }), { show_alert: true });
      return await ctx.panel.OrderPanel(ctx);
    }
    return await createOrder(ctx, true);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
payMethod.action(/^bonusPay\:/, async (ctx) => {
  try {
    const oldOrder = JSON.parse(JSON.stringify(ctx.session.order));
    ctx.session.order = await updatePrices(ctx.session.order!, ctx.session.restaurant_id!);
    if (productsSum(oldOrder!) !== productsSum(ctx.session.order!)) {
      await ctx.answerCbQuery("Внимание✋\n Цены, продукты или добавки в корзине изменились\n\nНажмите ещё раз и проверьте изменения перед заказом", { show_alert: true });
      if (ctx.session.order.length < 1) {
        delete ctx.session.order;
        return await ctx.panel.MainPanel(ctx);
      } else {
        return await ctx.panel.OrderPanel(ctx);
      }
    }
    const [, bonus] = ctx.callbackQuery.data!.split(":");
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({ _id: ctx.session.restaurant_id! }).toArray())[0];
    const time = new Date().getHours();
    ctx.wizard.state.data!.bonus = Number(bonus);
    if (time < restaurant.workingHours.start || time >= restaurant.workingHours.end) {
      await ctx.answerCbQuery(ctx.i18n.t("restaurant-isClose"), { show_alert: true });
      return await ctx.panel.OrderPanel(ctx);
    }
    if (restaurant.isStop.length > 0) {
      await ctx.answerCbQuery(ctx.i18n.t("restaurant-isStop", { message: restaurant.isStop }), { show_alert: true });
      return await ctx.panel.OrderPanel(ctx);
    }
    return await createOrder(ctx);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
payMethod.action("backT", async (ctx: TelegrafContext) => { // назад в меню
  try {
    await ctx.panel.OrderPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})



module.exports = new Scenes.WizardScene<TelegrafContext>("checkout", confirmRestaurant, confirmNumber, take, time, inTime, comment, payMethod);
