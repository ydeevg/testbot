import { Scenes, Composer, Markup } from "telegraf";
import { TelegrafContext } from "../types";
import { ConfigProduct, ConfigPromo, ConfigRestaurant } from "../../types/dbImports";
import { keyboard } from "../utils/keyboard";
import { productsSum } from "../../utils/productsSum";
import { updatePrices } from "../utils/updatePrices";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *             Сцена OrderPanel | OrderPanel               *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//* * * * *       Реакция на кнопки       * * * * * *
const orderActions = new Composer<TelegrafContext>();

orderActions.action("edit", async (ctx: TelegrafContext) => {
  try {
    if (ctx.callbackQuery && ctx.callbackQuery.data) {
      const order = ctx.session.order;
      const menuKeyboard = [[keyboard.orderPanel.clear, keyboard.backT]]
      for (let i = 0; i < order!.length;) {
        const countList = [];

        for (let count = 0; count < 2; ++count){
          if (i < order!.length) {
            countList.push(Markup.button.callback(order![i].name, "editProd:"+order![i].amount+":"+i))
            ++i;
          }
        }
        menuKeyboard.push(countList);
      };

      await ctx.editMessageText(ctx.i18n.t("orderPanel-editOrder", {hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)});
      await ctx.answerCbQuery();
      return ctx.wizard.next();
    }

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

orderActions.action("back", async (ctx: TelegrafContext) => {
  try {
    await ctx.panel.MainPanel(ctx, true);
    await ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

orderActions.action("promo", async (ctx: TelegrafContext) => {
  try {
    await ctx.editMessageText(ctx.i18n.t("orderPanel-sendPromo", {hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.backT])});
    await ctx.wizard.selectStep(3);
    return await ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

orderActions.action("checkout", async (ctx) => {
  try {
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
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({_id: ctx.session.restaurant_id}).toArray())[0];
    const time = new Date().getHours();
    if (time < restaurant.workingHours.start || time >= restaurant.workingHours.end) {
      return await ctx.answerCbQuery(ctx.i18n.t("restaurant-isClose"), {show_alert: true});
    }
    if (restaurant.isStop.length > 0) {
      return await ctx.answerCbQuery(ctx.i18n.t("restaurant-isStop", {message: restaurant.isStop}), {show_alert: true});
    }
    //await ctx.editMessageText(ctx.i18n.t("checkout-start", {hat: ctx.i18n.t("hat"), restaurant}), {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.checkout.yes, keyboard.backT])});
    await ctx.scene.leave();
    await ctx.scene.enter("checkout");
    if (ctx.session.phone) {
      ctx.editMessageText(
        ctx.i18n.t("checkout-goto", {hat: ctx.i18n.t("hat")}),
        {parse_mode: "HTML", ...Markup.inlineKeyboard([[keyboard.checkout.here], [keyboard.checkout.take]])}
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
        ctx.i18n.t("checkout-getContact", {hat: ctx.i18n.t("hat")}),
        {...Markup.keyboard([[Markup.button.contactRequest("Поделится контактом 📲")]]).oneTime().resize()}
      )).message_id;
      ctx.answerCbQuery();
      return await ctx.wizard.next();
    }
  } catch (e) {
    console.error('cant panel scene', e)
  }
})

//* * * * * Обработка выбора ресторана * * * * * *
const editOrderActions = new Composer<TelegrafContext>();
editOrderActions.action("backT", async (ctx: TelegrafContext) => {
  try {
    return await ctx.panel.OrderPanel(ctx);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
editOrderActions.action("clear", async (ctx: TelegrafContext) => {
  try {
    delete ctx.session.order;
    if (ctx.session.promo_order) {
      delete ctx.session.promo_order;
    }
    return await ctx.panel.OrderPanel(ctx);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
editOrderActions.action(/^editProd\:/, async (ctx: TelegrafContext) => {
  try {
    const [, amount, prodIndex] = ctx.callbackQuery!.data!.split(":");
    const indexNumber: number = Number(prodIndex);
    ctx.session.order![indexNumber].amount = Number(amount);
    const product = ctx.session.order![indexNumber];
    if (ctx.session.order![indexNumber].promo) {
      await ctx.answerCbQuery(ctx.i18n.t("orderPanel-promo-notEdited"), {show_alert: true});
      return;
    }

    const menuKeyboard = [
      keyboard.counter(Number(amount), "editProd", prodIndex, "sht"),
      [keyboard.orderPanel.save, keyboard.orderPanel.delete(indexNumber)]
    ];

    await ctx.editMessageText(ctx.i18n.t("orderPanel-editProd", {product: product, hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)});
    await ctx.answerCbQuery();
    return ctx.wizard.next();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

const editProductActions = new Composer<TelegrafContext>();
editProductActions.action(/^editProd\:/, async (ctx: TelegrafContext) => {
  try {
    const [, amount, prodIndex] = ctx.callbackQuery!.data!.split(":");
    const indexNumber: number = Number(prodIndex);
    if (ctx.session.order![indexNumber].promo) {
      await ctx.answerCbQuery(ctx.i18n.t("orderPanel-promo-notEdited"), {show_alert: true});
      return;
    } else {
      ctx.session.order![indexNumber].amount = Number(amount);
      const product = ctx.session.order![indexNumber];

      const menuKeyboard = [
        keyboard.counter(Number(amount), "editProd", prodIndex, "sht"),
        [keyboard.orderPanel.save, keyboard.orderPanel.delete(indexNumber)]
      ];

      await ctx.editMessageText(ctx.i18n.t("orderPanel-editProd", {product: product, hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)});
      await ctx.answerCbQuery();
    }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
editProductActions.action(/^del\:/, async (ctx: TelegrafContext) => {
  try {
    const [, prodIndex] = ctx.callbackQuery!.data!.split(":");
    ctx.session.order!.splice(Number(prodIndex), 1);
    if (!ctx.session.order!.length) {
      delete ctx.session.order;
      await ctx.panel.MainPanel(ctx);
      return await ctx.answerCbQuery();
    } else {
      await ctx.panel.OrderPanel(ctx);
      return await ctx.answerCbQuery();
    }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
editProductActions.action("save", async (ctx: TelegrafContext) => {
  try {
    return await ctx.panel.OrderPanel(ctx);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

const sendPromo = new Composer<TelegrafContext>();
sendPromo.action("backT", async (ctx: TelegrafContext) => {
  try {
    return await ctx.panel.MainPanel(ctx, true);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
sendPromo.on("text", async (ctx: TelegrafContext) => {
  try {
    try {ctx.deleteMessage();} catch (e) {}
    if (ctx.session.promo_order) {
      await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "1",ctx.i18n.t("orderPanel-sendPromo-orderIsUsed", {hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.backT])});
      return;
    }
    const allPromo = (await ctx.config.find({name: "promo"}).toArray())[0];
    const currentPromo: ConfigPromo = allPromo.data.find((promo: ConfigPromo) => promo.name === ctx.message.text.toLowerCase());
    if (ctx.session.used_promo && ctx.session.used_promo.find(promoName => promoName === ctx.message.text.toLowerCase())) {
      if (currentPromo.use !== 4) {
        await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "1",ctx.i18n.t("orderPanel-sendPromo-isUsed", {hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.backT])});
        return;
      }
    }
    if (currentPromo) {
      const orderSum = ctx.session.order ? productsSum(ctx.session.order) : 0;
      if (orderSum < currentPromo.condition) return await ctx.telegram.editMessageText(
        ctx.from!.id, ctx.session.id_mes_panel!, "1",
        ctx.i18n.t("orderPanel-sendPromo-condition", {hat: ctx.i18n.t("hat"), sum: currentPromo.condition}),
        {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.backT])
      });
      if (!currentPromo.active) return await ctx.telegram.editMessageText(
        ctx.from!.id, ctx.session.id_mes_panel!, "1",ctx.i18n.t("orderPanel-sendPromo-notFined", {hat: ctx.i18n.t("hat")}),
        {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.backT])}
      );
      if (currentPromo.use === 1) {
        if (ctx.session.used_promo) return await ctx.telegram.editMessageText(
          ctx.from!.id, ctx.session.id_mes_panel!, "1",
          ctx.i18n.t("orderPanel-sendPromo-isFirst", {hat: ctx.i18n.t("hat")}),
          {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.backT])}
          );
      } else if (currentPromo.use === 2) {
        if (ctx.session.orders) return await ctx.telegram.editMessageText(
          ctx.from!.id, ctx.session.id_mes_panel!, "1",
          ctx.i18n.t("orderPanel-sendPromo-isFirst", {hat: ctx.i18n.t("hat")}),
          {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.backT])
        });
      } else if (currentPromo.use === 3) {
        if (!currentPromo.users!.includes(ctx.from!.id)) return await ctx.telegram.editMessageText(
          ctx.from!.id, ctx.session.id_mes_panel!, "1",
          ctx.i18n.t("orderPanel-sendPromo-notFourYou", {hat: ctx.i18n.t("hat")}),
          {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.backT])
        });
      }
      if (currentPromo.type === "dish") {
        const product: ConfigProduct = ( await ctx.dbRestaurants.find({_id: ctx.session.restaurant_id})
          .toArray())[0].products.find((prod: ConfigProduct) => prod.product_id === currentPromo.value);
        const promoProduct = {
          product_id: product.product_id,
          amount: 1,
          name: product.name,
          price: product.price,
          promo: true,
          stop: false,
          additives: []
        }
        ctx.session.order ? ctx.session.order.push(promoProduct) : ctx.session.order = [promoProduct];
        ctx.session.promo_order = ctx.message.text.toLowerCase();
        await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "1",ctx.i18n.t("orderPanel-sendPromo-success", {hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.backT])});
      } else if (currentPromo.type === "dishes") {
        const products = ( await ctx.dbRestaurants.find({_id: ctx.session.restaurant_id}).toArray())[0].products.filter((product: ConfigProduct) => {
          for (let index of currentPromo.value) {
            if(product.product_id.indexOf(index) !== -1) return true;
          }
        })
        const menuKeyboard = products.map((prod: ConfigProduct) => [Markup.button.callback("🎁 "+prod.name, "add:"+(prod.product_id))]);
        ctx.session.promo_order = ctx.message.text.toLowerCase();
        await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "1",ctx.i18n.t("orderPanel-sendPromo-options", {hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)});
        return ctx.wizard.next();
      }
    } else {
      await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "1",ctx.i18n.t("orderPanel-sendPromo-notFined", {hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.backT])});
    }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

const productsPromo = new Composer<TelegrafContext>();
productsPromo.action(/^add\:/, async (ctx: TelegrafContext) => {
  try {
    const [,product_id] = ctx.callbackQuery!.data!.split(":");
    const product: ConfigProduct = ( await ctx.dbRestaurants.find({_id: ctx.session.restaurant_id})
    .toArray())[0].products.find((prod: ConfigProduct) => prod.product_id === product_id);
    const promoProduct = {
      product_id: product.product_id,
      amount: 1,
      name: product.name,
      price: product.price,
      promo: true,
      stop: false,
      additives: []
    }
    ctx.session.order ? ctx.session.order.push(promoProduct) : ctx.session.order = [promoProduct];
    await ctx.answerCbQuery(ctx.i18n.t("orderPanel-promo-success-add"), {show_alert: true});
    await ctx.panel.MainPanel(ctx, true);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})


module.exports = new Scenes.WizardScene<TelegrafContext>("order", orderActions, editOrderActions, editProductActions, sendPromo, productsPromo);
