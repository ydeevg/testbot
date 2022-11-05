import axios from "axios";
import FormData from "form-data";
import { Scenes, Composer, Markup } from "telegraf";
import { TelegrafContext } from "../types";
import { ConfigCategory, ConfigProduct, ConfigRestaurant, MenuConfig } from "../../types/dbImports";
import { CreateMultilineKeyboard } from "../utils/CreateMultilineKeyboard";
import { keyboard } from "../utils/keyboard";
import { bot } from "../../init/orderBot";

interface IProductsAPIData {
  product_id: string[];
  name: string[];
  price: string[];
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *               Сцена регистрации | Register              *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//* * * * * Реакция на кнопки первого layout'a * * * * * *
const startActions = new Composer<TelegrafContext>();
startActions.action("adminParseMenuA", async (ctx: TelegrafContext) => {
  try {
    const menuKeyboard = [[keyboard.back]];
    const admins: {chatId: number, lvl: number, only?: number}[] = (await bot.context.config!.find({name: "admins"}).toArray())[0].data;
    const currentAdmin = admins.find((el) => el.chatId === ctx.from!.id);
    (await ctx.dbRestaurants.find(currentAdmin!.only !== undefined ? {"_id": currentAdmin!.only} : {}).toArray()).map((rest: ConfigRestaurant) => {
      menuKeyboard.push([Markup.button.callback(rest.address, "parse:"+rest._id)])
    });

    await ctx.editMessageText(
      ctx.i18n.t("adminPanel-parse-choiceRestaurant", {hat: ctx.i18n.t("hat")}),
      {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)}
    );
    ctx.answerCbQuery();
    return await ctx.wizard.next();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
startActions.action("changeWorkTimeA", async (ctx: TelegrafContext) => {
  try {
    const menuKeyboard = [[keyboard.back]];
    const admins: {chatId: number, lvl: number, only?: number}[] = (await bot.context.config!.find({name: "admins"}).toArray())[0].data;
    const currentAdmin = admins.find((el) => el.chatId === ctx.from!.id);
    (await ctx.dbRestaurants.find(currentAdmin!.only !== undefined ? {"_id": currentAdmin!.only} : {}).toArray()).map((rest: ConfigRestaurant) => {
      menuKeyboard.push([Markup.button.callback(rest.address, `changeTime:${rest.workingHours.start}:${rest.workingHours.end}:+${rest._id}`)])
    });

    await ctx.editMessageText(
      ctx.i18n.t("adminPanel-changeWorkTime-choiceRestaurant", {hat: ctx.i18n.t("hat")}),
      {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)}
    );
    ctx.answerCbQuery();
    return await ctx.wizard.selectStep(2);
  } catch (err) {
    console.error(`${(new Date().toString())} cant >> ${__filename} error:`, err)
  }
})
startActions.action("stopRestA", async (ctx: TelegrafContext) => {
  try {
    const menuKeyboard = [[keyboard.backT]];
    const admins: {chatId: number, lvl: number, only?: number}[] = (await bot.context.config!.find({name: "admins"}).toArray())[0].data;
    const currentAdmin = admins.find((el) => el.chatId === ctx.from!.id);
    (await ctx.dbRestaurants.find(currentAdmin!.only !== undefined ? {"_id": currentAdmin!.only} : {}).toArray()).map((rest: ConfigRestaurant) => {
      if (rest.isStop.length > 0) {
        menuKeyboard.push([Markup.button.callback("🔴 " + rest.address, `unStopRest:${rest._id}`)])
      } else {
        menuKeyboard.push([Markup.button.callback("🟢 " + rest.address, `stopRest:${rest._id}`)])
      }
    });

    await ctx.editMessageText(
      ctx.i18n.t("adminPanel-stopRest-choiceRestaurant", {hat: ctx.i18n.t("hat")}),
      {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)}
    );
    ctx.answerCbQuery();
    return await ctx.wizard.selectStep(4);
  } catch (err) {
    console.error(`${(new Date().toString())} cant >> ${__filename} error:`, err)
  }
})
startActions.action("stopListA", async (ctx: TelegrafContext) => {
  try {
    const menuKeyboard = [[keyboard.backT]];
    const admins: {chatId: number, lvl: number, only?: number}[] = (await bot.context.config!.find({name: "admins"}).toArray())[0].data;
    const currentAdmin = admins.find((el) => el.chatId === ctx.from!.id);
    (await ctx.dbRestaurants.find(currentAdmin!.only !== undefined ? {"_id": currentAdmin!.only} : {}).toArray()).map((rest: ConfigRestaurant) => {
      menuKeyboard.push([Markup.button.callback(rest.address, `stopListMenu:${rest._id}`)])
    });

    await ctx.editMessageText(
      ctx.i18n.t("adminPanel-stopList-choiceRestaurant", {hat: ctx.i18n.t("hat")}),
      {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)}
    );
    ctx.answerCbQuery();
    return await ctx.wizard.selectStep(3);
  } catch (err) {
    console.error(`${(new Date().toString())} cant >> ${__filename} error:`, err)
  }
})
startActions.action("back", async (ctx: TelegrafContext) => {
  try {
    await ctx.panel.MainPanel(ctx, true);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())} cant >> ${__filename} error:`, err)
  }
})

const choiceParseRest = new Composer<TelegrafContext>();
choiceParseRest.action(/^parse\:/, async (ctx) => {
  try {
    const [, _id] = ctx.callbackQuery.data!.split(":");

    const data = new FormData();
    data.append("secret", (await ctx.dbRestaurants.find({_id: Number(_id)}).toArray())[0].frontPad)
    axios({
      method: "post",
      url: "https://app.frontpad.ru/api/index.php?get_products",
      data: data,
    }).then(async (res) => {
      const products: IProductsAPIData = res.data;
      const productsArr: ConfigProduct[] = [];

      const menuConfig: MenuConfig[] = await ctx.dbMenuConfig.find({}).toArray();

      const regex = /^909/;
      const regexPromo = /^990/;

      for (let product in products.product_id) {
        if (regex.test(products.product_id[product])) {
          const productConfig = menuConfig.find((prod) => prod.product_id === products.product_id[product]);
          if (productConfig) {
            productsArr.push({
              product_id: products.product_id[product],
              name: products.name[product],
              price: Number(products.price[product]),
              stop: false,
              description: productConfig.description,
              additivesProducts: productConfig.additivesProducts,
              exceptionsProducts: productConfig.exceptionsProducts
            });
          } else {
            productsArr.push({
              product_id: products.product_id[product],
              name: products.name[product],
              price: Number(products.price[product]),
              stop: false,
            });
          }
        } else if (regexPromo.test(products.product_id[product])) {
          productsArr.push({
            product_id: products.product_id[product],
            name: products.name[product],
            price: Number(products.price[product]),
            stop: true,
          });
        }
      }

      await ctx.dbRestaurants.updateOne({ _id: Number(_id) }, { $set: { products: productsArr, lastUpdate: `${new Date().toLocaleDateString("ru")} ${new Date().toLocaleTimeString("ru")}` } });
      try {
        ctx.answerCbQuery(ctx.i18n.t("success"), {show_alert: true});
      } catch (err) {
        console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
      }
    });

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
choiceParseRest.action("back", async (ctx: TelegrafContext) => {
  try {
    await ctx.panel.MainPanel(ctx, true);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

const changeTime = new Composer<TelegrafContext>();
changeTime.action(/^changeTime\:/, async (ctx) => {
  try {
    const [, start, end, restId] = ctx.callbackQuery.data!.split(":");
    const props = {
      start: Number(start),
      end: Number(end),
      restId: Number(restId)
    }
    await ctx.editMessageText(
      ctx.i18n.t("adminPanel-changeWorkTime-choiceTime", {hat: ctx.i18n.t("hat"), props: props}),
      {parse_mode: "HTML", ...Markup.inlineKeyboard(keyboard.adminPanel.workingTime(props))}
    );
    ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});
changeTime.action(/^save\:/, async (ctx) => {
  try {
    const [, start, end, restId] = ctx.callbackQuery.data!.split(":");
    const workingHours = {
      start: Number(start),
      end: Number(end),
    }
    await ctx.dbRestaurants.updateOne({ _id: Number(restId) }, { $set: { workingHours: workingHours } });
    await ctx.answerCbQuery(ctx.i18n.t("success"), {show_alert: true});
    return await ctx.panel.MainPanel(ctx, true);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});

const choiceStopListRest = new Composer<TelegrafContext>();
choiceStopListRest.action(/^stopListMenu\:/, async (ctx: TelegrafContext) => {
  try {
    ctx.wizard.state.data = { restId: ctx.callbackQuery!.data!.split(":")[1] };
    const categories: [] = ( await ctx.config.find({name: "categories"}).toArray())[0].data;
    const catKeyboard = CreateMultilineKeyboard(categories, "stopCat", "id", 2, "name");
    const menuKeyboard = [];

    catKeyboard.map((str) => {menuKeyboard.push(str)});

    if (ctx.session.order) {
      menuKeyboard.push([keyboard.order(ctx), keyboard.back]);
    } else {
      menuKeyboard.push([keyboard.backT]);
    }

    await ctx.editMessageText(ctx.i18n.t("adminPanel-stopList-category", {hat: ctx.i18n.t("hat")}),
    {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)})
  } catch (err) {
    console.error(`${(new Date().toString())} cant >> ${__filename} error:`, err)
  }
})
choiceStopListRest.action(/^stopCat\:/, async (ctx: TelegrafContext) => {
  try {
    if (ctx.callbackQuery && ctx.callbackQuery.data) {
      const [, catId, prodId] = ctx.callbackQuery!.data!.split(":");
      const menuKeyboard = [];
      const currentCategory: ConfigCategory = ( await ctx.config.find({name: "categories"}).toArray())[0]
        .data.find((cat: ConfigCategory) => cat.id === Number(catId));
      const oldProducts: ConfigProduct[] = ( await ctx.dbRestaurants.find({_id: Number(ctx.wizard.state.data!.restId)}).toArray())[0].products;
      if (prodId) {
        if (oldProducts[Number(prodId)].stop) {
          await ctx.dbRestaurants.updateOne({_id: Number(ctx.wizard.state.data!.restId)}, {$set: {['products.'+prodId+'.stop']: false}});
          await ctx.googleStopList.addRow({
            date: new Date().toLocaleString("ru"),
            restaurant: ctx.wizard.state.data!.restId,
            action: `Продукт "${oldProducts[Number(prodId)].name}" УБРАН из стоп-лист`,
            user: ctx.from!.username ?? ctx.from!.first_name
          })
        } else {
          await ctx.dbRestaurants.updateOne({_id: Number(ctx.wizard.state.data!.restId)}, {$set: {['products.'+prodId+'.stop']: true}});
          await ctx.googleStopList.addRow({
            date: new Date().toLocaleString("ru"),
            restaurant: ctx.wizard.state.data!.restId,
            action: `Продукт "${oldProducts[Number(prodId)].name}" ДОБАВЛЕН в стоп-листа`,
            user: ctx.from!.username ?? ctx.from!.first_name
          })
        }
      }
      const products: ConfigProduct[] = ( await ctx.dbRestaurants.find({_id: Number(ctx.wizard.state.data!.restId)}).toArray())[0].products;
      const currentProducts = Object.assign({}, products);
      for (let index in currentProducts) {
        let count = 0;
        for (let index2 of currentCategory.indexes) {
          if (count > 0) continue;
          if(currentProducts[index].name.toLowerCase().indexOf(index2.toLowerCase()) !== -1) {
            ++count;
            continue;
          };
        }
        if (count === 0) continue
        if (currentProducts[index].stop) {
          menuKeyboard.push([Markup.button.callback(currentProducts[index].name+" 🔴", "stopCat:"+(catId)+":"+(index))]);
        } else {
          menuKeyboard.push([Markup.button.callback(currentProducts[index].name+" 🟢", "stopCat:"+(catId)+":"+(index))]);
        }
      }

      if (ctx.session.order) {
        menuKeyboard.push([keyboard.order(ctx), keyboard.backT]);
      } else {
        menuKeyboard.push([keyboard.backT]);
      }

      await ctx.editMessageText(
        ctx.i18n.t("menuPanel-dishes", {categoryName: currentCategory.name, hat: ctx.i18n.t("hat")}),
        {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)}
      );
      ctx.answerCbQuery();
    }

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
choiceStopListRest.action("backT", async (ctx: TelegrafContext) => {
  try {
    await ctx.panel.AdminPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})


const choiceStopRest = new Composer<TelegrafContext>();
choiceStopRest.action(/^unStopRest\:/, async (ctx: TelegrafContext) => {
  try {
    const [, restId] = ctx.callbackQuery!.data!.split(":");
    await ctx.dbRestaurants.updateOne({_id: Number(restId)}, {$set: {isStop: ""}});
    await ctx.answerCbQuery(ctx.i18n.t("success"), {show_alert: true});
    ctx.googleStopList.addRow({
      date: new Date().toLocaleString("ru"),
      restaurant: restId,
      action: `Ресторан ДОСТУПЕН для приёма заказов`,
      user: ctx.from!.username ?? ctx.from!.first_name
    })
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({"_id": Number(restId)}).toArray())[0];
    await ctx.telegram.sendMessage(restaurant.chat_id, `Ресторан <b>включен</b>\n\Включил <a href="tg://user?id=${ctx.from!.id}">${ctx.from!.first_name}</a>`, {parse_mode: "HTML"});
    return await ctx.panel.AdminPanel(ctx);
  } catch (err) {
    console.error(`${(new Date().toString())} cant >> ${__filename} error:`, err)
  }
})
choiceStopRest.action(/^stopRest\:/, async (ctx: TelegrafContext) => {
  try {
    const [, restId] = ctx.callbackQuery!.data!.split(":");
    ctx.wizard.state.data = {rest: Number(restId)};
    await ctx.answerCbQuery(ctx.i18n.t("adminPanel-stopRest-enterComment"), {show_alert: true});
    await ctx.editMessageText(
      ctx.i18n.t("adminPanel-stopRest-enterComment"), {parse_mode: "HTML"}
    );
    return await ctx.wizard.selectStep(5);
  } catch (err) {
    console.error(`${(new Date().toString())} cant >> ${__filename} error:`, err)
  }
})
choiceStopRest.action("backT", async (ctx: TelegrafContext) => {
  try {
    await ctx.panel.AdminPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

const addCommentStopRest = new Composer<TelegrafContext>();
addCommentStopRest.action("backT", async (ctx: TelegrafContext) => {
  try {
    await ctx.panel.AdminPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
addCommentStopRest.on("text",  async (ctx: TelegrafContext) => {
  try {
    await ctx.dbRestaurants.updateOne({_id: Number(ctx.wizard.state.data!.rest)}, {$set: {isStop: ctx.message.text.trim()}});
    ctx.googleStopList.addRow({
      date: new Date().toLocaleString("ru"),
      restaurant: ctx.wizard.state.data!.rest,
      action: `Ресторан ОТКЛЮЧЕН для приёма заказов с комментарием: "${ctx.message.text.trim()}"`,
      user: ctx.from!.username ?? ctx.from!.first_name
    })
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({"_id": ctx.wizard.state.data!.rest}).toArray())[0];
    await ctx.telegram.sendMessage(restaurant.chat_id, `Ресторан <b>отключен</b>\n\nОтключил <a href="tg://user?id=${ctx.from!.id}">${ctx.from!.first_name}</a>\n\nКомментарий: <i>${ctx.message.text.trim()}</i>`, {parse_mode: "HTML"});
    ctx.wizard.state.data = {};
    await ctx.deleteMessage();
    await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "0",
      ctx.i18n.t("adminPanel-stopList-success", {message: ctx.message.text.trim()}),
      {parse_mode: "HTML", ...Markup.inlineKeyboard([keyboard.backT])}
    );
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})



module.exports = new Scenes.WizardScene<TelegrafContext>("admin", startActions, choiceParseRest, changeTime, choiceStopListRest, choiceStopRest, addCommentStopRest);
