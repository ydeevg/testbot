import axios from "axios";
import FormData from "form-data";
import { Scenes, Composer, Markup } from "telegraf";
import { TelegrafContext } from "../types";
import { ConfigRestaurant } from "../../types/dbImports";
import { keyboard } from "../utils/keyboard";
import { updatePrices } from "../utils/updatePrices";
import { productsSum } from "../../utils/productsSum";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *               Сцена MainPanel | MainPanel               *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//* * * * *       Реакция на кнопки       * * * * * *
const mainActions = new Composer<TelegrafContext>();

mainActions.action("changeRestaurant", async (ctx: TelegrafContext) => {
  try {
    const menuKeyboard = [[keyboard.back]];

    (await ctx.dbRestaurants.find().toArray()).map((rest: ConfigRestaurant) => {
      menuKeyboard.push([Markup.button.callback(rest.address, "go:"+rest._id)])
    });

    await ctx.editMessageText(
      ctx.i18n.t("mainPanel-changeRestaurant", {hat: ctx.i18n.t("hat")}),
      {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)}
    );
    ctx.answerCbQuery();
    return await ctx.wizard.selectStep(1);

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

mainActions.action("addBonus", async (ctx) => {
  try {
    await ctx.panel.AddBonusAccountPanel(ctx);
    ctx.answerCbQuery();

    await ctx.scene.leave();
    await ctx.scene.enter("register");
    return await ctx.wizard.selectStep(1);

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

mainActions.action("bonus", async (ctx) => {
  try {
    const data = new FormData();
    data.append("secret", (await ctx.dbRestaurants.find({_id: ctx.session.restaurant_id!}).toArray())[0].frontPad);
    data.append("client_phone", "8"+ctx.session.phone!.toString().slice(1,11));
    axios({
      method: "post",
      url: "https://app.frontpad.ru/api/index.php?get_client",
      data: data,
    }).then(async (res) => {
      if (res.data.result === "success") {
        return await ctx.answerCbQuery(`У Вас ${res.data.score} бонусов на счету!`, {show_alert: true});
      } else if (res.data.error === "invalid_client_phone") {
        return await ctx.answerCbQuery(`❌ Номер не найден в бонусной системе\n\nЕсли Вы были зарегистрированы в нашей бонусной системе, то уточните информацию у персонала ресторана.`, {show_alert: true});
      } else {
        return await ctx.answerCbQuery(`❌ Произошла ошибка. Попробуйте позже`, {show_alert: true});
      }
    })
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

mainActions.action("menu", async (ctx) => {
  try {
    await ctx.panel.MenuPanel(ctx);
    ctx.answerCbQuery();
  } catch (e) {
    console.error('cant panel scene', e)
  }
})

mainActions.action("order", async (ctx) => {
  try {
    await ctx.panel.OrderPanel(ctx)
    ctx.answerCbQuery();
  } catch (e) {
    console.error('cant panel scene', e)
  }
})

mainActions.action("adminPanelA", async (ctx) => {
  try {
    // await ctx.answerCbQuery(ctx.i18n.t("nf404-answer"), {show_alert: true});
    return await ctx.panel.AdminPanel(ctx);
  } catch (e) {
    console.error('cant panel scene', e)
  }
})

mainActions.action("promoMain", async (ctx) => {
  try {
    await ctx.scene.leave();
    await ctx.scene.enter("order");
    await ctx.wizard.selectStep(3);
    await ctx.editMessageText(ctx.i18n.t("orderPanel-sendPromo", {hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.backT])});
    return await ctx.answerCbQuery();
  } catch (e) {
    console.error('cant panel scene', e)
  }
})

//* * * * * Обработка выбора ресторана * * * * * *
const changeRestaurantActions = new Composer<TelegrafContext>();

changeRestaurantActions.action(/^go\:/, async (ctx: TelegrafContext) => {
  try {
    if (!(ctx.callbackQuery && ctx.callbackQuery.data)) return;

    ctx.session.restaurant_id = Number(ctx.callbackQuery.data.split(":")[1]);
    if (ctx.session.order) delete ctx.session.order;
    await ctx.panel.MainPanel(ctx ,true);
    ctx.answerCbQuery(ctx.i18n.t("success"));
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
changeRestaurantActions.action("back", async (ctx: TelegrafContext) => {
  try {
    await ctx.panel.MainPanel(ctx, true);
    ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = new Scenes.WizardScene<TelegrafContext>("panel", mainActions, changeRestaurantActions);
