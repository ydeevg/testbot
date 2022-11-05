import "dotenv/config";
import { Db } from "mongodb";
import { Markup, Telegraf } from "telegraf";
import { session } from "telegraf-session-mongodb";
import { composers } from "../supportBot/init/composers";
import { setupI18sup } from "../supportBot/init/i18n";
import { ScenesStage } from "../supportBot/init/scenes";
import { supportTelegrafContext } from "../supportBot/types";
import { supKeyboard } from "../supportBot/utils/keyboard";

const supBot = new Telegraf<supportTelegrafContext>(process.env.SUPPORT_BOT_TOKEN!);
const configSupportBot = (db: Db) => {
  supBot.use(session(db, {sessionName: "session", collectionName: "sessionsSupport" }));
  supBot.context.originalSession = db.collection("sessions");
  supBot.context.supSession = db.collection("sessionsSupport");
  supBot.context.tickets = db.collection("tickets");
  supBot.use(ScenesStage.middleware());
  setupI18sup(supBot); // setup telegraf i18n module (подключение модуля локализаций (используется для хранения текста бота))
  composers(supBot); // композеры бота (команды и др.)
  supBot.catch((e) => {console.error(e)})

  supBot.on("message", async (ctx: supportTelegrafContext) => {
    if (ctx.chat!.id == -799674066) {
      if (ctx.message.text === "/close") {
        if (ctx.message.reply_to_message) {
          if (ctx.message.reply_to_message.forward_from) {
            const session = (await ctx.supSession.find({key: ctx.message.reply_to_message.forward_from.id + ":" + ctx.message.reply_to_message.forward_from.id}).toArray())[0].data;
            if (session.ticket) {
              await ctx.tickets.updateOne({_id: session.ticket}, {$set: {status: "close"}});
              ctx.telegram.sendMessage(ctx.message.reply_to_message.forward_from.id, "<b>Чат-обращение закрыл оператор</b>\n\nЕсли не согласны с последним ответом - можете открыть новое обращение прямо сейчас! /start", {parse_mode: "HTML"})
              ctx.replyWithHTML(`Обращение <code>${session.ticket}</code> успешно закрыто!`);
              await ctx.tickets.updateOne({_id: session.ticket}, {$push: {"messages": {sender: ctx.from!.first_name, message: "Закрыл обращение", mid: 0}}});
              await ctx.supSession.updateOne({key: ctx.message.reply_to_message.forward_from.id + ":" + ctx.message.reply_to_message.forward_from.id}, {$unset: {"data.ticket": ""}});
            } else {
              ctx.replyWithHTML("Обращение закрыто ранее");
            }
          } else if (ctx.message.reply_to_message.from.id === 5435674989) {
            if (ctx.message.reply_to_message.text.includes("Обращение #")) {
              const [, ticket_id] = ctx.message.reply_to_message.text.split("#");
              const ticket = (await ctx.tickets.find({_id: Number(ticket_id)}).toArray())[0];
              if (ticket.status === "open") {
                await ctx.tickets.updateOne({_id: ticket_id}, {$set: {status: "close"}});
                await ctx.tickets.updateOne({_id: ticket_id}, {$push: {"messages": {sender: ctx.from!.first_name, message: "Закрыл обращение", mid: 0}}});
                ctx.telegram.sendMessage(ticket.chatId, "<b>Чат-обращение закрыл оператор</b>\n\nЕсли не согласны с последним ответом - можете открыть новое обращение прямо сейчас! /start", {parse_mode: "HTML"})
                ctx.replyWithHTML(`Обращение <code>${ticket_id}</code> успешно закрыто!`);
                await ctx.supSession.updateOne({key: ticket.chatId + ":" + ticket.chatId}, {$unset: {"data.ticket": ""}});
              } else {
                ctx.replyWithHTML("Обращение закрыто ранее.");
              }
            } else {
              ctx.replyWithHTML("Обращение закрыто ранее или не существует.");
            }
          }
        }
        return;
      } else if (~ctx.message.text.indexOf("/info")) {
        const [, ticket_id] = ctx.message.text.split(" ");
        let ticket;
        if (ticket_id) {
          ticket = (await ctx.tickets.find({_id: Number(ticket_id)}).toArray())[0];
        } else {
          if (ctx.message.reply_to_message) {
            if (ctx.message.reply_to_message.forward_from) {
              const session = (await ctx.supSession.find({key: ctx.message.reply_to_message.forward_from.id + ":" + ctx.message.reply_to_message.forward_from.id}).toArray())[0].data;
              if (session.ticket) ticket = (await ctx.tickets.find({_id: Number(session.ticket)}).toArray())[0];
            } else if (ctx.message.reply_to_message.from.id === 5435674989) {
              if (ctx.message.reply_to_message.text.includes("Обращение #")) {
                const [, ticket_id] = ctx.message.reply_to_message.text.split("#");
                ticket = (await ctx.tickets.find({_id: Number(ticket_id)}).toArray())[0];
              }
            }
          }
        }
        if (ticket) {
          ctx.replyWithHTML(`Информация о обращении\n\n<a href="tg://user?id=${ticket.chatId}">Клиент</a> начавший переписку\n\nИстория последних сообщений:`, {...Markup.inlineKeyboard(supKeyboard.actions(ticket._id))});
        } else {
          ctx.replyWithHTML("Обращение не найдено. Если оно было закрыто, то воспользуйтесь: /info [номер обращения]");
        }
        return;
      }
      if (ctx.message.reply_to_message) {
        if (ctx.message.reply_to_message.forward_from) {
          const session = (await ctx.supSession.find({key: ctx.message.reply_to_message.forward_from.id + ":" + ctx.message.reply_to_message.forward_from.id}).toArray())[0].data;
          if (session.ticket) {
            ctx.copyMessage(ctx.message.reply_to_message.forward_from.id).then(async (data) => {
              let text = "";
              if (ctx.message.text) {
                text = ctx.message.text;
              } else if (ctx.message.caption) {
                text = ctx.message.caption + " +файл(-ы)";
              } else {
                text = "файл(-ы)"
              }
              await ctx.tickets.updateOne({_id: session.ticket}, {$push: {"messages": {sender: ctx.from!.first_name, message: text, mid: data.message_id}}});
            });
          } else {
            ctx.replyWithHTML("Сообщение не отправлено. Обращение закрыто ранее.");
          }
        } else if (ctx.message.reply_to_message.from.id === 5435674989) {
          if (ctx.message.reply_to_message.text.includes("Обращение #")) {
            const [, ticket_id] = ctx.message.reply_to_message.text.split("#");
            const ticket = (await ctx.tickets.find({_id: Number(ticket_id)}).toArray())[0];
            if (ticket.status === "open") {
              ctx.copyMessage(ticket.chatId).then(async (data) => {
                let text = "";
                if (ctx.message.text) {
                  text = ctx.message.text;
                } else if (ctx.message.caption) {
                  text = ctx.message.caption + " +файл(-ы)";
                } else {
                  text = "файл(-ы)"
                }
                await ctx.tickets.updateOne({_id: Number(ticket_id)}, {$push: {"messages": {sender: ctx.from!.first_name, message: text, mid: data.message_id}}});
              });
            } else {
              ctx.replyWithHTML("Сообщение не отправлено. Обращение закрыто ранее.");
            }
          } else {
            ctx.replyWithHTML("Сообщение не отправлено. Обращение закрыто ранее или не существует.");
          }
        }
      }
    }
  })

  supBot.action(/^lm\:/, async (ctx) => {
    try {
      const [, ticket_id] = ctx.callbackQuery!.data!.split(":");
      const ticket = (await ctx.tickets.find({_id: Number(ticket_id)}).toArray())[0];
      let counter = 0;
      let text = [];
      console.log(ctx.callbackQuery!.data)
      for (let i = ticket.messages.length-1; i >= 0; i--) {
        let message = ticket.messages[i].sender + ": " + ticket.messages[i].message;
        counter += message.length + 2;
        if (counter > 200) break;
        text.unshift(message);
      }
      await ctx.answerCbQuery(text.join("\n"), {show_alert: true});
    } catch (err) {
      console.error(`${(new Date().toString())} ${(new Date().toString())}  cant >> ${__filename} error:`, err)
    }
  });

  return supBot;
}

export { configSupportBot, supBot };
