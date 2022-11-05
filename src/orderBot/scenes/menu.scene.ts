import { Scenes, Composer, Markup } from "telegraf";
import { TelegrafContext } from "../types";
import { ConfigCategory, ConfigProduct } from "../../types/dbImports";
import { CreateMultilineKeyboard } from "../utils/CreateMultilineKeyboard";
import { keyboard } from "../utils/keyboard";
import { AdditivesCard } from "../utils/layouts/MainPanel/MenuPanel/AdditivesCard";
import { ProductCard } from "../utils/layouts/MainPanel/MenuPanel/ProductCard";
import { productsToString } from "../../utils/productsToString";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *               Сцена MenuPanel | MainPanel               *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//* * * * *       Реакция на кнопки       * * * * * *
const menuActions = new Composer<TelegrafContext>();

menuActions.action(/^category\:/, async (ctx: TelegrafContext) => {
  try {
    if (ctx.callbackQuery && ctx.callbackQuery.data) {
      const currentCategory: ConfigCategory = ( await ctx.config.find({name: "categories"}).toArray())[0]
        .data.find((cat: ConfigCategory) => cat.id === Number(ctx.callbackQuery!.data!.split(":")[1]));
      if (currentCategory.children) {
        const categories: [] = ( await ctx.config.find({name: "categories"}).toArray())[0].data.filter((cat: ConfigCategory) => currentCategory.children!.includes(cat.id));
        const catKeyboard = CreateMultilineKeyboard(categories, "category", "id", 1, "name");
        const menuKeyboard = [];

        catKeyboard.map((str) => {menuKeyboard.push(str)});

        if (ctx.session.order) {
          menuKeyboard.push([keyboard.order(ctx), keyboard.backB]);
        } else {
          menuKeyboard.push([keyboard.backB]);
        }
        await ctx.editMessageText(ctx.i18n.t("menuPanel", {hat: ctx.i18n.t("hat")}),
          {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)}
        );
        return ctx.answerCbQuery();
      } else {
        const products = ( await ctx.dbRestaurants.find({_id: ctx.session.restaurant_id}).toArray())[0].products.filter((product: ConfigProduct) => {
          for (let index of currentCategory.indexes) {
            if(product.name.toLowerCase().indexOf(index.toLowerCase()) !== -1 && !product.stop) return true;
          }
        })
        const menuKeyboard = products.map((prod: ConfigProduct) => [Markup.button.callback(prod.name + " | " +prod.price + " руб", "add:1:"+(prod.product_id))]);

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
        return await ctx.wizard.next();
      }
    }

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

menuActions.action("back", async (ctx: TelegrafContext) => {
  try {
    await ctx.panel.MainPanel(ctx, true);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
menuActions.action("backB", async (ctx: TelegrafContext) => {
  try {
    await ctx.panel.MenuPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

menuActions.action("order", async (ctx) => {
  try {
    await ctx.panel.OrderPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

//* * * * * Обработка выбора продукта * * * * * *
const viewProduct = new Composer<TelegrafContext>();
viewProduct.action(/^add\:/, async (ctx: TelegrafContext) => {
  try {
    await ProductCard(ctx);
    return ctx.wizard.next();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
viewProduct.action("backT", async (ctx: TelegrafContext) => {
  try {
    await ctx.panel.MenuPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
viewProduct.action("order", async (ctx) => {
  try {
    await ctx.panel.OrderPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
//* * * * * Карточка продукта (ответы на кнопки) * * * * * *
const reactionProduct = new Composer<TelegrafContext>();
reactionProduct.action(/^add\:/, async (ctx: TelegrafContext) => {
  try {
    await ProductCard(ctx);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
reactionProduct.action("plusOrder", async (ctx: TelegrafContext) => {
  try {
    if (!(ctx.callbackQuery && ctx.callbackQuery.data)) return ctx.answerCbQuery();
    const product: ConfigProduct = ctx.wizard.state.data!.viewProduct;
    if (product.additivesProducts) delete product.additivesProducts;
    if (product.description) delete product.description;
    if (product.exceptionsProducts) delete product.exceptionsProducts;
    if (ctx.session.order) {
      if (productsToString(ctx.session.order).length < 2000) {
        ctx.session.order.push(product);
        ctx.answerCbQuery(ctx.i18n.t("menuPanel-added-success"), {show_alert: true});
      } else {
        ctx.answerCbQuery(ctx.i18n.t("menuPanel-added-error-many"), {show_alert: true});
      }
    } else {
      ctx.session.order = [ product ];
    }

    await ctx.panel.MenuPanel(ctx);
    return;
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
reactionProduct.action("backT", async (ctx: TelegrafContext) => {
  try {
    await ctx.panel.MenuPanel(ctx);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
reactionProduct.action("dop:start", async (ctx: TelegrafContext) => {
  try {
    await AdditivesCard(ctx);
    return await ctx.wizard.next();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
reactionProduct.action("exceptions:start", async (ctx: TelegrafContext) => {
  try {
    await AdditivesCard(ctx, true);
    return await ctx.wizard.selectStep(4);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
//* * * * * Карточка добавок (ответы на кнопки) * * * * * *
const additives = new Composer<TelegrafContext>();
additives.action(/^dop\:/, async (ctx) => {
  try {
    await AdditivesCard(ctx);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
additives.action("save", async (ctx) => {
  try {
    await ProductCard(ctx);
    ctx.wizard.selectStep(2);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

const exceptions = new Composer<TelegrafContext>();
exceptions.action(/^dop\:/, async (ctx) => {
  try {
    await AdditivesCard(ctx, true);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
exceptions.action("save", async (ctx) => {
  try {
    await ProductCard(ctx);
    ctx.wizard.selectStep(2);
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = new Scenes.WizardScene<TelegrafContext>("menu", menuActions, viewProduct, reactionProduct, additives, exceptions);
