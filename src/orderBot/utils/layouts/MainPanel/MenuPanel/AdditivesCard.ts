import { Markup } from "telegraf";
import { TelegrafContext } from "../../../../types"
import { ConfigProduct } from "../../../../../types/dbImports";
import { keyboard } from "../../../keyboard";

export const AdditivesCard = async (ctx: TelegrafContext, exceptions?: boolean) => {
  try {
    const [, dopId] = ctx.callbackQuery!.data!.split(":");

    const adds = ( await ctx.dbRestaurants.find({_id: ctx.session.restaurant_id})
      .toArray())[0].products
      .filter((product: ConfigProduct) => exceptions
        ? ctx.wizard.state.data!.viewProduct.exceptionsProducts.includes(product.product_id)
        : ctx.wizard.state.data!.viewProduct.additivesProducts.includes(product.product_id)
    );

    if (dopId !== "start") {
      if (ctx.wizard.state.data!.viewProduct.additives.find((prod: ConfigProduct) => prod.product_id === dopId)) {
        const currentIndex = ctx.wizard.state.data!.viewProduct.additives.findIndex((prod: ConfigProduct) => prod.product_id === dopId);
        ctx.wizard.state.data!.viewProduct.additives.splice(currentIndex, 1);
        exceptions ? ctx.wizard.state.data!.additivesCounter : ctx.wizard.state.data!.additivesCounter -=1;
      } else {
        if (ctx.wizard.state.data!.additivesCounter > 3 && !exceptions) return ctx.answerCbQuery(ctx.i18n.t("additives-much"), {show_alert: true});
        ctx.wizard.state.data!.viewProduct.additives.push(adds.find((prod: ConfigProduct) => prod.product_id === dopId));
        exceptions ? ctx.wizard.state.data!.additivesCounter : ctx.wizard.state.data!.additivesCounter +=1;
      }
    }

    const currentAdds = ctx.wizard.state.data!.viewProduct.additives;
    const icon = (id:string, price: number) => {
      if (currentAdds.find((prod: ConfigProduct) => prod.product_id === id)) {
        return ` ✅ ${exceptions ? "" : `+ ${price} руб`}`
      } else return ` ${exceptions ? "" : `| ${price} руб`}`;
    }

    const menuKeyboard = adds.map(
      (prod: ConfigProduct) => [Markup.button.callback(prod.name + icon(prod.product_id, prod.price), "dop:"+(prod.product_id))]
    );
    menuKeyboard.push([keyboard.orderPanel.save]);
    await ctx.editMessageText(ctx.i18n.t("menuPanel-adds", {product: ctx.wizard.state.data!.viewProduct, hat: ctx.i18n.t("hat")}), {parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard)});
    return ctx.answerCbQuery();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
