import { ObjectId } from "mongodb";
import { Scenes, Composer, Markup } from "telegraf";
import { TelegrafContext } from "../types";
import { ConfigOrder, ConfigRestaurant } from "../../types/dbImports";
import { keyboard } from "../utils/keyboard";
import { rateCauses } from "../utils/rateCauses";
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *           Сцена оценки заказа | rate order              *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//* * * * * Реакция на кнопки первого layout'a * * * * * *

const sendRate = async (ctx: TelegrafContext, message: boolean) => {
  try {
    let oid = false;
    let _id: string | ObjectId = "";
    if (ctx.wizard.state.data!._id.includes("-")) {
      _id = ctx.wizard.state.data!._id;
    } else {
      _id = new ObjectId(ctx.wizard.state.data!._id);
      oid = true;
    }

    const order: ConfigOrder = (await ctx.dbOrders.find({_id: _id}).toArray())[0];
    const restaurant: ConfigRestaurant = (await ctx.dbRestaurants.find({_id: order.restaurant_id}).toArray())[0];
    const getCaus = (data: any) => {
      if (!data.caus) return "";
      if (typeof data.caus === "string") return data.caus;
      return data.caus.map((el: string | number) => rateCauses[Number(el)].text).join(" | ")
    }

    if (message) {
      try {
        await ctx.deleteMessage();
      } catch (err) {
      }
    }

    try {
      await ctx.deleteMessage(ctx.session.mid);
    } catch (err) {
      try {
        await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.mid, "0", ctx.i18n.t("hat-nHTML"));
      } catch (err) {
        console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
      }
    }

    if (message) {
      if (ctx.message.photo) {
        if (ctx.message.caption) {
          if (order.rate) {
            order.rate.comment = ctx.message.caption;
            order.rate.photo = ctx.message.photo[ctx.message.photo.length-1].file_id;
          } else {
            order.rate = {
              caus: getCaus(ctx.wizard.state.data),
              comment: ctx.message.caption,
              grade: ctx.wizard.state.data!.grade,
              photo: ctx.message.photo[ctx.message.photo.length-1].file_id,
            }
          }
        } else {
          ctx.session.mid = (await ctx.replyWithHTML(ctx.i18n.t("rate-photo-addComment"), {...Markup.inlineKeyboard([keyboard.rate.no_comment])})).message_id;
          order.rate = {
            caus: getCaus(ctx.wizard.state.data),
            comment: "",
            grade: ctx.wizard.state.data!.grade,
            photo: ctx.message.photo[ctx.message.photo.length-1].file_id,
          }
          await ctx.dbOrders.updateOne({_id: order._id}, {$set: order});
          return;
        }
      } else if (ctx.message.text) {
        let comment = ctx.message.text;
        if (ctx.message.text === "/menu") comment = "";
        if (order.rate) {
          order.rate.comment = comment;
        } else {
          order.rate = {
            caus: getCaus(ctx.wizard.state.data),
            comment: comment,
            grade: ctx.wizard.state.data!.grade,
          }
        }
      }
    } else {
      if (!order.rate) {
        order.rate = {
          caus: getCaus(ctx.wizard.state.data),
          comment: "",
          grade: ctx.wizard.state.data!.grade,
        }
      }
    }
    if (order.rate!.grade < 4 || order.rate!.comment || order.rate!.photo) {
      if (order.rate!.photo) {
        await ctx.telegram.sendPhoto(restaurant.rate_chat_id, order.rate!.photo!, {
          caption: ctx.i18n.t("rate-toChat", {order: order, restaurant: restaurant}),
          parse_mode: "HTML"
        } ).then(async (data) => {
          if (order.rate!.grade < 4) {
            try {await ctx.telegram.pinChatMessage(data.chat.id, data.message_id)} catch (e) {console.error("pinErr", e)};
          }
        })
      } else {
        await ctx.telegram.sendMessage(restaurant.rate_chat_id, ctx.i18n.t("rate-toChat", {order: order, restaurant: restaurant}), {parse_mode: "HTML"}).then(async (data) => {
          if (order.rate!.grade < 4) {
            try {await ctx.telegram.pinChatMessage(data.chat.id, data.message_id)} catch (e) {console.error("pinErr", e)};
          }
        })
      }
    }
    await ctx.replyWithHTML(ctx.i18n.t("rate-thankYou"));
    await ctx.scene.leave();
    await ctx.google.addRow({
      date: order.date + " " + order.time,
      order: oid ? order._id.toString() : order._id,
      grade: order.rate!.grade,
      br: getCaus(ctx.wizard.state.data),
      comment: order.rate!.comment ? order.rate!.comment : "",
      photo: order.rate!.photo ? (await ctx.telegram.getFileLink(order.rate!.photo)).toString() : "",
      client: order.client.number,
      restaurant: restaurant.address,
      fp_number: order.fp_number ? order.fp_number : ""
    });
    await ctx.dbOrders.updateOne({_id: order._id}, {$set: order});
    delete ctx.session.mid;
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}

const startActions = new Composer<TelegrafContext>();

startActions.action(/^rCaus\:/, async (ctx: TelegrafContext) => {
  try {
    const {grade, caus, _id} = ctx.wizard.state.data!;
    const causNumber = (ctx.callbackQuery!.data!.split(":"))[1];
    if (ctx.wizard.state.data!.caus.includes(causNumber)) {
      const causIndex = ctx.wizard.state.data!.caus.findIndex((cNum: string) => causNumber === cNum);
      ctx.wizard.state.data!.caus.splice(causIndex, 1);
    } else {
      ctx.wizard.state.data!.caus.push(causNumber);
    }

    if (grade < 4) {
      await ctx.editMessageText(ctx.i18n.t("rate-noLike"), {...Markup.inlineKeyboard(keyboard.rate.rate_br(caus, grade))});
    } else if (grade === 4) {
      await ctx.editMessageText(ctx.i18n.t("rate-soSo"), {...Markup.inlineKeyboard(keyboard.rate.rate_br(caus, grade))});
    } else {
    await ctx.editMessageText(ctx.i18n.t("rate-like"), {...Markup.inlineKeyboard(keyboard.rate.rate_br(caus, grade))});
  }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

startActions.action("save", async (ctx: TelegrafContext) => {
  try {
    await sendRate(ctx, false)
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
startActions.action("comment", async (ctx: TelegrafContext) => {
  try {
    await ctx.editMessageText(ctx.i18n.t("rate-comment"), {...Markup.inlineKeyboard([keyboard.rate.no_comment])});
    return await ctx.wizard.next();
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

const comment = new Composer<TelegrafContext>();
comment.action("noComment", async (ctx: TelegrafContext) =>{
  try {
    await sendRate(ctx, false);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
comment.on("message", async (ctx: TelegrafContext) => {
  try {
    await sendRate(ctx, true);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = new Scenes.WizardScene<TelegrafContext>("rateOrder", startActions, comment);
