import { Composer } from "telegraf";
import { TelegrafContext } from "../types";
import { changeStatus } from "../utils/changeStatus";
import { getAdminLvl } from "../utils/getAdminLvl";

const composer = new Composer<TelegrafContext>();
//Без уведомлений
composer.command("cst" , async (ctx: TelegrafContext) => {
  try {
    await ctx.deleteMessage();
    if (await getAdminLvl(ctx.from!.id) < 1) return;
    const [, orderNumber, status] = ctx.message.text.trim().split(" ");
    const regexpNumber = /^[0-9]{6}-[0-9]{6}/
    if (regexpNumber.test(orderNumber) && Number(status) >= 2 && Number(status) <= 7) {
      await changeStatus({status: Number(status), orderNumber: orderNumber});
      ctx.replyWithHTML(`Статус заказа <b>${orderNumber}</b> изменён!`);
    }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = composer;
