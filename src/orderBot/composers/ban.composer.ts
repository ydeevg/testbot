import { Composer } from "telegraf";
import { TelegrafContext } from "../types";
import { getAdminLvl } from "../utils/getAdminLvl";

interface IProductsAPIData {
  product_id: string[];
  name: string[];
  price: string[];
}

const composer = new Composer<TelegrafContext>();

composer.command("ban",async (ctx: TelegrafContext) => {
  try {
    await ctx.deleteMessage();
    if (!ctx.from) return; // проверка на админа
    if (await getAdminLvl(ctx.from!.id) < 2) return;
    const [, number, ...comment] = ctx.message.text.trim().split(" ");
    if (!number) return;
    const regex = /[0-9]{10}/;
    if (!regex.test(number)) return;
    if (number.length !== 10) return;
    await ctx.config.updateOne({name: "ban-list"}, {$push: {"data": {phone: ("7"+number), comment: comment ? comment.join(" ") : ""} }});

    return await ctx.replyWithHTML(`<b>${"+7"+number}</b> добавлен(а) в чёрный список ${comment ? "с комментарием: <i>" + comment.join(" ") + "</i>" : ""}`);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

composer.command("unban",async (ctx: TelegrafContext) => {
  try {
    await ctx.deleteMessage();
    if (!ctx.from) return; // проверка на админа
    if (await getAdminLvl(ctx.from!.id) < 2) return;
    const messageText = ctx.message.text.trim().split(" ");
    if (messageText.length === 1) return;
    if (messageText.length > 2) return;
    const regex = /[0-9]{10}/;
    if (!regex.test(messageText[1])) return;
    if (messageText[1].length !== 10) return;
    await ctx.config.updateOne({name: "ban-list"}, {$pull: {"data": {phone: ("7"+messageText[1])}}});

    return await ctx.replyWithHTML(`<b>${"+7"+messageText[1]}</b> убран(а) из чёрного списка`);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

composer.command("banlist",async (ctx: TelegrafContext) => {
  try {
    await ctx.deleteMessage();
    if (!ctx.from) return; // проверка на админа
    if (await getAdminLvl(ctx.from!.id) < 2) return;

    const banList = (await ctx.config.find({name: "ban-list"}).toArray())[0];
    let message = "<b>Список заблокированных пользователей:</b>\n\n";
    banList.data.forEach((el: {phone: string, comment: string}) => {
      const [seven, ...phone] = el.phone
      message += `<b><code>${phone.join("")}</code></b> - <i>${el.comment}</i>`
    });
    return await ctx.replyWithHTML(message);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = composer;
