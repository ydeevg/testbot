import { Markup } from "telegraf";
import { TelegrafContext } from "../../../../types"
import { ConfigProduct } from "../../../../../types/dbImports";
import { keyboard } from "../../../keyboard";
import { productsSum } from "../../../../../utils/productsSum";

export const ProductCard = async (ctx: TelegrafContext) => {
  try {
    if (!(ctx.callbackQuery && ctx.callbackQuery.data)) return;

    const [, amount , product_id] = ctx.callbackQuery.data.split(":");

    if (ctx.wizard.state.data) {
      if (amount) ctx.wizard.state.data.viewProduct.amount = Number(amount);
    } else {
      const getProduct = ( await ctx.dbRestaurants.find({_id: ctx.session.restaurant_id})
        .toArray())[0].products.find((prod: ConfigProduct) => prod.product_id === product_id);
      ctx.wizard.state.data = {
        additivesCounter: 0,
        viewProduct: {
          ...getProduct,
          amount: 1,
          additives: []
        }
      }
    }
    const product: ConfigProduct = ctx.wizard.state.data!.viewProduct;

    const menuKeyboard = [keyboard.counter(product.amount!, "add", product_id, "set"),];

    if (product.additivesProducts) {
      if(product.exceptionsProducts) {
        menuKeyboard.push([keyboard.menu.product.addDop ,keyboard.menu.product.exceptions]);
        menuKeyboard.push([keyboard.menu.product.exit])
      } else {
        menuKeyboard.push([keyboard.menu.product.addDop, keyboard.menu.product.exit]);
      }
    } else {
      if(product.exceptionsProducts) {
        menuKeyboard.push([keyboard.menu.product.exceptions, keyboard.menu.product.exit]);
      } else {
        menuKeyboard.push([keyboard.menu.product.exit]);
      }
    }

    menuKeyboard.push([keyboard.menu.product.addToOrder(productsSum([product]))]);

    await ctx.editMessageText(
      ctx.i18n.t("menuPanel-viewProduct", {product: product, hat: ctx.i18n.t("hat")}),
      {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)}
    );
    ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
