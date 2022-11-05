import axios from "axios";
import FormData from "form-data";
import { Composer, Markup } from "telegraf";
import { ConfigOrder } from "../../types/dbImports";
import { productsSum } from "../../utils/productsSum";
import { productsToString } from "../../utils/productsToString";
import { TelegrafContext } from "../types";
import { getAdminLvl } from "../utils/getAdminLvl";
import { keyboard } from "../utils/keyboard";
import { updatePrices } from "../utils/updatePrices";

const sleep = ((milliseconds: number) => {
  return (new Promise((resolve) => setTimeout(resolve, milliseconds)))
});

const composer = new Composer<TelegrafContext>();
composer.on("message", async (ctx: TelegrafContext) => {
  try {
    if (ctx.chat!.id > 0) return await ctx.deleteMessage(ctx.message.message_id);
    if (ctx.chat!.id === Number(process.env.MAILING_CHAT!)) {
      if (ctx.message.text === "/sendall") {
        if (ctx.message.reply_to_message) {
          if (await getAdminLvl(ctx.from!.id) < 2) return;
          const allUsers: any[] = (await ctx.dbSession.find({}).toArray());
          await ctx.replyWithHTML("Рассылка началась. <b>~" + (allUsers.length) + "</b> клиентов участвуют в рассылке. Точное количество будет отражено в конце рассылки");
          let usersNumber = 0;
          let userClose = 0;
          let noValidUsers = 0;
          for (const user of allUsers) {
            if (user.key) {
              const [key1, key2] = user.key.split(":");
              if (key1 === key2) {
                try {
                  await ctx.telegram.copyMessage(key1, Number(process.env.MAILING_CHAT!), ctx.message.reply_to_message.message_id);
                  usersNumber++;
                } catch (e) {
                  console.log(key1, "запретил(а) боту писать сообщения");
                  userClose++;
                }
                try {
                  await sleep(10000);
                } catch (e) {
                  console.log(e)
                }
              } else {
                noValidUsers++;
              }
            }
          }
          await ctx.replyWithHTML(`<b>Рассылка окончена</b>\n\nРазослано <b>${usersNumber}</b> сообщений, которые были получены\n<b>${noValidUsers}</b> пользователей оказались невалидными\n<b>${userClose}</b> пользователей остановили бота`);
        }
      } else if (~ctx.message.text.indexOf("/sendfb ")) {
        if (ctx.message.reply_to_message) {
          const [, ...phons] = ctx.message.text.split(" ");
          if (phons.length > 0) {
            for (const phone of phons) {
              const user: any = (await ctx.dbSession.find({ "data.phone": phone }).toArray())[0];
              if (!user) {
                ctx.reply("Пользователь " + phone + " не пользуется ботом");
                continue;
              }
              if (user.key) {
                const [chatId,] = user.key.split(":");
                try {
                  await ctx.telegram.copyMessage(chatId, Number(process.env.MAILING_CHAT!), ctx.message.reply_to_message.message_id, { ...Markup.inlineKeyboard([Markup.button.url("Перейти в поддержку", "https://t.me/bostonsupportbot")]) });
                  ctx.reply("Пользователю " + phone + " доставлено сообщение")
                } catch (e) {
                  console.log(chatId, "запретил(а) боту писать сообщения", e);
                  ctx.reply("Пользователь " + phone + " запретил писать боту")
                }
                try {
                  await sleep(1000);
                } catch (e) {
                  console.log(e)
                }
              } else {
                ctx.reply("Пользователь " + phone + " не пользуется ботом")
              }
            }
          } else {
            ctx.reply("Укажите пользователей через пробел /send 79519335990")
          }
        } else {
          ctx.reply("Не выделено сообщение или выделено старое сообщение")
        }
      } else if (~ctx.message.text.indexOf("/sendad ")) {
        if (ctx.message.reply_to_message) {
          const [, ...phons] = ctx.message.text.split(" ");
          if (phons.length > 0) {
            for (const phone of phons) {
              const user: any = (await ctx.dbSession.find({ "data.phone": phone }).toArray())[0];
              if (user.key) {
                const [chatId,] = user.key.split(":");
                try {
                  await ctx.telegram.copyMessage(chatId, Number(process.env.MAILING_CHAT!), ctx.message.reply_to_message.message_id);
                  ctx.reply("Пользователю " + phone + " доставлено сообщение")
                } catch (e) {
                  console.log(chatId, "запретил(а) боту писать сообщения", e);
                  ctx.reply("Пользователь " + phone + " запретил писать боту")
                }
                try {
                  await sleep(1000);
                } catch (e) {
                  console.log(e)
                }
              } else {
                ctx.reply("Пользователь " + phone + " не пользуется ботом")
              }
            }
          } else {
            ctx.reply("Укажите пользователей через пробел /send 79519335990")
          }
        } else {
          ctx.reply("Не выделено сообщение или выделено старое сообщение")
        }
      }
    }
  } catch (err) {
    console.error(`${(new Date().toString())} ${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});
composer.action(/.+/, async (ctx) => {
  try {
    if (ctx.callbackQuery.data! === "newOrder") {
      return await ctx.panel.MainPanel(ctx);
    }
    if (~ctx.callbackQuery.data!.indexOf("repeatOrder:")) {
      if (ctx.session.id_mes_panel) {
        try {
          await ctx.telegram.deleteMessage(ctx.from!.id, ctx.session.id_mes_panel);
          delete ctx.session.id_mes_panel;
        } catch (err) {
          try {
            await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "0", ctx.i18n.t("hat-nHTML"));
            delete ctx.session.id_mes_panel;
          } catch (err) {
            console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
          }
        }
      }
      const [, orderNumber] = ctx.callbackQuery.data!.split(":");
      const lastOrder: ConfigOrder = (await ctx.dbOrders.find({ "_id": orderNumber }).toArray())[0];
      ctx.session.order = await updatePrices(lastOrder.products, lastOrder.restaurant_id);
      if (productsSum(ctx.session.order!) !== productsSum(lastOrder.products)) {
        await ctx.answerCbQuery("Внимание✋\n Цены, продукты или добавки в корзине изменились\n\nПроверьте изменения перед заказом", { show_alert: true });
        if (ctx.session.order.length < 1) {
          delete ctx.session.order;
          return await ctx.panel.MainPanel(ctx);
        }
      };
      ctx.session.restaurant_id = lastOrder.restaurant_id;
      const address = (await ctx.dbRestaurants!.find({ "_id": lastOrder.restaurant_id }).toArray())[0].address;
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
      await ctx.replyWithHTML(ctx.i18n.t("repeatOrder", { hat: ctx.i18n.t("hat"), address: address, take: lastOrder.take, products: productsToString(ctx.session.order!), sum: productsSum(ctx.session.order!) }), { ...Markup.inlineKeyboard(menuKeyboard) }).then(data => {
        ctx.session.id_mes_panel = data.message_id;
      });
      await ctx.scene.enter("checkout");
      ctx.wizard.state.data = {
        take: lastOrder.take,
        time: "Как можно скорее",
        comment: lastOrder.comment,
      }
      return await ctx.wizard.selectStep(6);
    }
    if (ctx.callbackQuery.data! === ":") {
      try {
        return await ctx.answerCbQuery()
      } catch (err) {
        console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
      }
    };
    if (ctx.session.__scenes.current) {
      try {
        return ctx.answerCbQuery(ctx.i18n.t("wait"))
      } catch (err) {
        console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
      }
    };

    await ctx.answerCbQuery(ctx.i18n.t("error-answer"), { show_alert: true });
    await ctx.panel.MainPanel(ctx)
  } catch (err) {
    console.error(`${(new Date().toString())} ${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});

module.exports = composer;
