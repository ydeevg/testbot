import { ConfigOrder, ConfigRestaurant } from "../../types/dbImports";
import cron from "node-cron";
import { Telegraf } from "telegraf";
import { TelegrafContext } from "../../orderBot/types";

export const getRestReport = async (rest: ConfigRestaurant, bot: Telegraf<TelegrafContext>) => {
  try {
    cron.schedule(`25 ${rest.workingHours.end} * * *`, async () => {
      const ordersAll: ConfigOrder[] = await bot.context.dbOrders!.find({$and:[{date: new Date().toLocaleDateString("ru")},{restaurant_id: rest._id}, {status: "получен"}]}).toArray();
      const orders = ordersAll.filter((ord) => ord.changeStatusTime);
      if (!orders.length) return;
      const secToCooking = Math.floor(orders.reduce((acc, order: ConfigOrder) => {
        const [oD, oM, oY] = order.date.split(".");
        const [pH, pM, pS] = order.time.split(":");
        const previousDate = new Date(Number(oY), Number(oM)-1, Number(oD), Number(pH), Number(pM), Number(pS));
        const [cH, cM, cS] = order.changeStatusTime!.toCooking!.split(":");
        const currentDate = new Date(Number(oY), Number(oM)-1, Number(oD), Number(cH), Number(cM), Number(cS));
        const ret = Math.floor((currentDate.getTime() - previousDate.getTime()) / 1000);
        return acc + ret;
      }, 0) / orders.length);
      const timeToCooking = Math.floor(secToCooking / 60) + ":" + ((secToCooking % 60).toString().length === 1 ? "0" + (secToCooking % 60) : (secToCooking % 60));
      const secToReady = Math.floor(orders.reduce((acc, order: ConfigOrder) => {
        const [oD, oM, oY] = order.date.split(".");
        const [pH, pM, pS] = order.changeStatusTime!.toCooking!.split(":");
        const previousDate = new Date(Number(oY), Number(oM)-1, Number(oD), Number(pH), Number(pM), Number(pS));
        const [cH, cM, cS] = order.changeStatusTime!.toReady!.split(":");
        const currentDate = new Date(Number(oY), Number(oM)-1, Number(oD), Number(cH), Number(cM), Number(cS));
        const ret = Math.floor((currentDate.getTime() - previousDate.getTime()) / 1000);
        return acc + ret;
      }, 0) / orders.length);
      const timeToReady = Math.floor(secToReady / 60) + ":" + ((secToReady % 60).toString().length === 1 ? "0" + (secToReady % 60) : (secToReady % 60));
      const secReceived = Math.floor(orders.reduce((acc, order: ConfigOrder) => {
        const [oD, oM, oY] = order.date.split(".");
        const [pH, pM, pS] = order.changeStatusTime!.toReady!.split(":");
        const previousDate = new Date(Number(oY), Number(oM)-1, Number(oD), Number(pH), Number(pM), Number(pS));
        const [cH, cM, cS] = order.changeStatusTime!.received!.split(":");
        const currentDate = new Date(Number(oY), Number(oM)-1, Number(oD), Number(cH), Number(cM), Number(cS));
        const ret = Math.floor((currentDate.getTime() - previousDate.getTime()) / 1000);
        return acc + ret;
      }, 0) / orders.length);
      const timeReceived = Math.floor(secReceived / 60) + ":" + ((secReceived % 60).toString().length === 1 ? "0" + (secReceived % 60) : (secReceived % 60));

      const reportTimeText = `Сформирован отчёт по скорости за ${new Date().toLocaleDateString("ru")}

Среднее время принятия заказа: ${timeToCooking}
Среднее время приготовления заказа: ${timeToReady}
Общее среднее время от принятия до приготовления: <b>${(Math.floor((secToCooking+secToReady)/60))+":"+(((secToCooking + secToReady) % 60).toString().length === 1 ? "0" + ((secToCooking + secToReady) % 60) : ((secToCooking + secToReady) % 60))}</b>

Среднее время выдачи заказа: ${timeReceived}`

      await bot.telegram.sendMessage(rest.rate_chat_id, reportTimeText, {parse_mode: "HTML"});
    });

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
