import { Composer, Markup, Scenes } from "telegraf";
import { supportTelegrafContext } from "../types";
import { startSupBot } from "../utils/start";

const menuActions = new Composer<supportTelegrafContext>();

menuActions.action(/.+/, async (ctx) => {
  try {
    let chatSupportMessage = `<b>Открылся новый чат обращения!</b>\n\n<a href="tg://user?id=${ctx.from!.id}">Клиент ${ctx.from!.first_name}</a>${ctx.from!.username ? " @" + ctx.from!.username : ""}`
    const originalSession = (await ctx.originalSession.find({key: ctx.from!.id + ":" + ctx.from!.id}).toArray())[0].data;
    if (originalSession) {
      if (originalSession.phone) chatSupportMessage += ` (+7<code>${originalSession.phone.slice(1, 11)}</code>)`
    }
    if (ctx.callbackQuery.data === "otherOrder") {
      ctx.editMessageText("<b>Вы начали новое чат-обращение</b>\n\nОператор ответит вам сразу, как только освободится\n\nЗадайте вопрос по другому заказу: ", {parse_mode: "HTML"});
      chatSupportMessage + ` по другому заказу`;
    } else if (ctx.callbackQuery.data === "otherQ") {
      ctx.editMessageText("<b>Вы начали новое чат-обращение</b>\n\nОператор ответит вам сразу, как только освободится\n\nЗадайте ваш вопрос: ", {parse_mode: "HTML"});
      chatSupportMessage + ` по другому вопросу`;
    } else {
      ctx.editMessageText(`<b>Вы начали новое чат-обращение</b>\n\nОператор ответит вам сразу, как только освободится\n\nЗадайте ваш вопрос по заказу ${ctx.callbackQuery.data}: `, {parse_mode: "HTML"});
      chatSupportMessage += ` по заказу №<code>${ctx.callbackQuery.data}</code>`;
    }
    const ticket: {_id: number, chatId: number, status: ("open" | "close"), messages: {chatId: number, message: string, photo?: string, messageId: number}[]} = {
      _id: (Math.floor(100000 + Math.random() * 900000)),
      chatId: ctx.from!.id,
      status: "open",
      messages: [],
    }
    ctx.session.ticket = ticket._id;
    await ctx.tickets.insertOne(ticket);
    await ctx.telegram.sendMessage(process.env.SUPPORT_CHAT!, chatSupportMessage + `\nОбращение <code>#${ticket._id}</code>`, {parse_mode: "HTML"}).then(data => {
      ctx.tickets.updateOne({_id: ticket._id}, {$push: {messages: {sender: "КЛ", message: "начал обращение", mid: 0}}});
    })
    return await ctx.wizard.next();
  } catch (err) {
    console.error(`${(new Date().toString())} ${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});

const chat = new Composer<supportTelegrafContext>();
chat.on("text", async (ctx) => {
  try {
    if (!ctx.session.ticket && ctx.message.text !== "/start" ) {
      ctx.scene.leave();
      return await ctx.replyWithHTML("Если хотите отправить <b>новое обращение</b>, то введите команду <b>/start</b>")
    }
    if (ctx.message.text === "/start") {
      if (!ctx.session.ticket) return startSupBot(ctx);
      await ctx.tickets.updateOne({_id: ctx.session.ticket}, {$set: {status: "close"}});
      await ctx.telegram.sendMessage(process.env.SUPPORT_CHAT!, `<a href="tg://user?id=${ctx.from!.id}">Клиент ${ctx.from!.first_name}</a>${ctx.from!.username ? " @" + ctx.from!.username : ""} закрыл обращение <code>#${ctx.session.ticket}</code>`, {parse_mode: "HTML"});
      ctx.tickets.updateOne({_id: ctx.session.ticket}, {$push: {messages: {sender: "КЛ", message: "закрыл обращение", mid: 0}}});
      delete ctx.session.ticket;
      return startSupBot(ctx);
    }
    await ctx.forwardMessage(process.env.SUPPORT_CHAT!).then(data => {
      ctx.tickets.updateOne({_id: ctx.session.ticket}, {$push: {messages: {sender: "КЛ", message: ctx.message.text, mid: data.message_id}}});
    })
  } catch (err) {
    console.error(`${(new Date().toString())} ${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})
chat.on("message", async (ctx: supportTelegrafContext) => {
  try {
    await ctx.forwardMessage(process.env.SUPPORT_CHAT!).then(data => {
      let text = "";
      if (ctx.message.caption) {
        text = ctx.message.caption + " +файл(-ы)";
      } else {
        text = " +файл(-ы)";
      }
      ctx.tickets.updateOne({_id: ctx.session.ticket}, {$push: {messages: {sender: "КЛ", message: text, mid: data.message_id}}});
    })
  } catch (err) {
    console.error(`${(new Date().toString())} ${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
});

module.exports = new Scenes.WizardScene<supportTelegrafContext>("supportMenu", menuActions, chat);
