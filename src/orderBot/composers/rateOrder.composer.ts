import { ObjectId } from "mongodb";
import { Composer, Markup } from "telegraf";
import { TelegrafContext } from "../types";
import { ConfigOrder, ConfigRestaurant } from "../../types/dbImports";
import { keyboard } from "../utils/keyboard";

const composer = new Composer<TelegrafContext>();
composer.action(/^rateOrder\:/, async (ctx: TelegrafContext) => {
  try {
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
    const [, grade, order_id] = ctx.callbackQuery!.data!.split(":");
    await ctx.replyWithHTML(ctx.i18n.t(Number(grade) < 5 ? (Number(grade) < 4 ? "rate-noLike" : "rate-soSo") : "rate-like"), { ...Markup.inlineKeyboard(keyboard.rate.rate_br([], Number(grade))) }).then((data) => {
      ctx.session.mid = data.message_id;
      setTimeout(async () => {
        let oid = false;
        let _id: string | ObjectId = "";
        if (order_id.includes("-")) {
          _id = order_id;
        } else {
          _id = new ObjectId(order_id);
          oid = true;
        }
        const order: ConfigOrder = (await ctx.dbOrders.find({ _id: _id }).toArray())[0];
        if (order.rate) return;
        const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({ _id: order.restaurant_id }).toArray())[0];
        order.rate = {
          grade: Number(grade),
          caus: "",
          comment: "",
        }
        if (order.rate?.comment.length || order.rate.grade < 4) {
          await ctx.telegram.sendMessage(restaurant.rate_chat_id, ctx.i18n.t("rate-toChat", { order: order, restaurant: restaurant }), { parse_mode: "HTML" }).then(async (data) => {
            if (order.rate!.grade < 4) {
              try { await ctx.telegram.pinChatMessage(data.chat.id, data.message_id) } catch (e) { console.error("pinErr", e) };
            }
          })
        }
        try { await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.mid, "", ctx.i18n.t("rate-thankYou")) } catch (e) { }
        await ctx.google.addRow({
          date: order.date + " " + order.time,
          order: oid ? order._id.toString() : order._id,
          grade: order.rate.grade,
          br: "",
          comment: "",
          photo: "",
          client: order.client.number,
          restaurant: restaurant.address,
          fp_number: order.fp_number ? order.fp_number : ""
        });
        await ctx.dbOrders.updateOne({ _id: order._id }, { $set: order });
        delete ctx.session.mid;
      }, 120 * 60000)
    });
    await ctx.scene.enter("rateOrder", { data: { _id: order_id, grade: Number(grade), caus: [] } });
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
module.exports = composer;
