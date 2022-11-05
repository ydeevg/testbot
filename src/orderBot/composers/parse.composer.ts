import { Composer } from "telegraf";
import { bot } from "../../init/orderBot";
import { ConfigOrder, ConfigRestaurant } from "../../types/dbImports";
import { TelegrafContext } from "../types";

interface IProductsAPIData {
  product_id: string[];
  name: string[];
  price: string[];
}

const composer = new Composer<TelegrafContext>();

composer.command("sparse", async (ctx: TelegrafContext) => {
  try {
    await ctx.deleteMessage();
    const restaurants: ConfigRestaurant[] = await bot.context.dbRestaurants!.find({}).toArray();
    const restChatIds = restaurants.map(rest => rest.chat_id);
    if (restChatIds.includes(ctx.chat!.id)) {
      const currentRestaurant = restaurants.find(rest => rest.chat_id === ctx.chat!.id);
      const ordersAll: ConfigOrder[] = await bot.context.dbOrders!.find({ $and: [{ date: new Date().toLocaleDateString("ru") }, { restaurant_id: currentRestaurant!._id }, { status: "получен" }] }).toArray();
      const orders = ordersAll.filter((ord) => ord.changeStatusTime);
      if (!orders.length) return ctx.replyWithHTML("Недостаточно заказов для формирования отчёта");
      const secToCooking = Math.floor(orders.reduce((acc, order: ConfigOrder) => {
        const [oD, oM, oY] = order.date.split(".");
        const [pH, pM, pS] = order.time.split(":");
        const previousDate = new Date(Number(oY), Number(oM) - 1, Number(oD), Number(pH), Number(pM), Number(pS));
        const [cH, cM, cS] = order.changeStatusTime!.toCooking!.split(":");
        const currentDate = new Date(Number(oY), Number(oM) - 1, Number(oD), Number(cH), Number(cM), Number(cS));
        const ret = Math.floor((currentDate.getTime() - previousDate.getTime()) / 1000);
        return acc + ret;
      }, 0) / orders.length);
      const timeToCooking = Math.floor(secToCooking / 60) + ":" + ((secToCooking % 60).toString().length === 1 ? "0" + (secToCooking % 60) : (secToCooking % 60));
      const secToReady = Math.floor(orders.reduce((acc, order: ConfigOrder) => {
        const [oD, oM, oY] = order.date.split(".");
        const [pH, pM, pS] = order.changeStatusTime!.toCooking!.split(":");
        const previousDate = new Date(Number(oY), Number(oM) - 1, Number(oD), Number(pH), Number(pM), Number(pS));
        const [cH, cM, cS] = order.changeStatusTime!.toReady!.split(":");
        const currentDate = new Date(Number(oY), Number(oM) - 1, Number(oD), Number(cH), Number(cM), Number(cS));
        const ret = Math.floor((currentDate.getTime() - previousDate.getTime()) / 1000);
        return acc + ret;
      }, 0) / orders.length);
      const timeToReady = Math.floor(secToReady / 60) + ":" + ((secToReady % 60).toString().length === 1 ? "0" + (secToReady % 60) : (secToReady % 60));
      const secReceived = Math.floor(orders.reduce((acc, order: ConfigOrder) => {
        const [oD, oM, oY] = order.date.split(".");
        const [pH, pM, pS] = order.changeStatusTime!.toReady!.split(":");
        const previousDate = new Date(Number(oY), Number(oM) - 1, Number(oD), Number(pH), Number(pM), Number(pS));
        const [cH, cM, cS] = order.changeStatusTime!.received!.split(":");
        const currentDate = new Date(Number(oY), Number(oM) - 1, Number(oD), Number(cH), Number(cM), Number(cS));
        const ret = Math.floor((currentDate.getTime() - previousDate.getTime()) / 1000);
        return acc + ret;
      }, 0) / orders.length);
      const timeReceived = Math.floor(secReceived / 60) + ":" + ((secReceived % 60).toString().length === 1 ? "0" + (secReceived % 60) : (secReceived % 60));

      const reportTimeText = `Сформирован отчёт по скорости за ${new Date().toLocaleDateString("ru")}

Среднее время принятия заказа: ${timeToCooking}
Среднее время приготовления заказа: ${timeToReady}
Общее среднее время от принятия до приготовления: <b>${(Math.floor((secToCooking + secToReady) / 60)) + ":" + (((secToCooking + secToReady) % 60).toString().length === 1 ? "0" + ((secToCooking + secToReady) % 60) : ((secToCooking + secToReady) % 60))}</b>

Среднее время выдачи заказа: ${timeReceived}`

      await ctx.replyWithHTML(reportTimeText);
    }
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

composer.command("sparseM", async (ctx: TelegrafContext) => {
  try {
    const [, restId, mg] = ctx.message.text.trim().split(" ");
    await ctx.deleteMessage();
    const restaurants: ConfigRestaurant[] = await bot.context.dbRestaurants!.find({}).toArray();
    const currentRestaurant = restaurants.find(rest => rest._id === Number(restId));
    const allOrders: ConfigOrder[] = await bot.context.dbOrders!.find({ $and: [{ date: {$regex: mg, $options: 'i'} }, { restaurant_id: currentRestaurant!._id }, { status: "получен" }] }).toArray()
    const orders = allOrders.filter((ord) => ord.changeStatusTime);

    if (!orders.length) return ctx.replyWithHTML("Недостаточно заказов для формирования отчёта");
    const secToCooking = Math.floor(orders.reduce((acc, order: ConfigOrder) => {
      const [oD, oM, oY] = order.date.split(".");
      const [pH, pM, pS] = order.time.split(":");
      const previousDate = new Date(Number(oY), Number(oM) - 1, Number(oD), Number(pH), Number(pM), Number(pS));
      const [cH, cM, cS] = order.changeStatusTime!.toCooking!.split(":");
      const currentDate = new Date(Number(oY), Number(oM) - 1, Number(oD), Number(cH), Number(cM), Number(cS));
      const ret = Math.floor((currentDate.getTime() - previousDate.getTime()) / 1000);
      return acc + ret;
    }, 0) / orders.length);
    const timeToCooking = Math.floor(secToCooking / 60) + ":" + ((secToCooking % 60).toString().length === 1 ? "0" + (secToCooking % 60) : (secToCooking % 60));
    const secToReady = Math.floor(orders.reduce((acc, order: ConfigOrder) => {
      const [oD, oM, oY] = order.date.split(".");
      const [pH, pM, pS] = order.changeStatusTime!.toCooking!.split(":");
      const previousDate = new Date(Number(oY), Number(oM) - 1, Number(oD), Number(pH), Number(pM), Number(pS));
      const [cH, cM, cS] = order.changeStatusTime!.toReady!.split(":");
      const currentDate = new Date(Number(oY), Number(oM) - 1, Number(oD), Number(cH), Number(cM), Number(cS));
      const ret = Math.floor((currentDate.getTime() - previousDate.getTime()) / 1000);
      return acc + ret;
    }, 0) / orders.length);
    const timeToReady = Math.floor(secToReady / 60) + ":" + ((secToReady % 60).toString().length === 1 ? "0" + (secToReady % 60) : (secToReady % 60));
    const secReceived = Math.floor(orders.reduce((acc, order: ConfigOrder) => {
      const [oD, oM, oY] = order.date.split(".");
      const [pH, pM, pS] = order.changeStatusTime!.toReady!.split(":");
      const previousDate = new Date(Number(oY), Number(oM) - 1, Number(oD), Number(pH), Number(pM), Number(pS));
      const [cH, cM, cS] = order.changeStatusTime!.received!.split(":");
      const currentDate = new Date(Number(oY), Number(oM) - 1, Number(oD), Number(cH), Number(cM), Number(cS));
      const ret = Math.floor((currentDate.getTime() - previousDate.getTime()) / 1000);
      return acc + ret;
    }, 0) / orders.length);
    const timeReceived = Math.floor(secReceived / 60) + ":" + ((secReceived % 60).toString().length === 1 ? "0" + (secReceived % 60) : (secReceived % 60));

    const reportTimeText = `Месячный отчёт по скорости за ${mg} для ${currentRestaurant?.address}

Заказов со статусом "получен": ${orders.length}

Среднее время принятия заказа: ${timeToCooking}
Среднее время приготовления заказа: ${timeToReady}
Общее среднее время от принятия до приготовления: <b>${(Math.floor((secToCooking + secToReady) / 60)) + ":" + (((secToCooking + secToReady) % 60).toString().length === 1 ? "0" + ((secToCooking + secToReady) % 60) : ((secToCooking + secToReady) % 60))}</b>

Среднее время выдачи заказа: ${timeReceived}`

    await ctx.replyWithHTML(reportTimeText);
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

composer.command("gotoGoogleRest", async (ctx: TelegrafContext) => {
  try {
    const [, restId, mg] = ctx.message.text.trim().split(" ");
    await ctx.deleteMessage();
    const restaurants: ConfigRestaurant[] = await bot.context.dbRestaurants!.find({}).toArray();
    const currentRestaurant = restaurants.find(rest => rest._id === Number(restId));
    const allOrders: ConfigOrder[] = await bot.context.dbOrders!.find({ $and: [{ date: {$regex: mg, $options: 'i'} }, { restaurant_id: currentRestaurant!._id }, { status: "получен" }] }).toArray()
    const orders = allOrders.filter((ord) => ord.rate);

    if (!orders.length) return ctx.replyWithHTML("Недостаточно заказов для формирования отчёта");

    const sleep = ((milliseconds: number) => {
      return (new Promise((resolve) => setTimeout(resolve, milliseconds)))
    });

    for (let order of orders) {
      await ctx.google.addRow({
        date: `${order.date} ${order.time}`,
        order: String(order._id),
        grade: order.rate!.grade,
        br: order.rate?.caus ?? "",
        comment: order.rate!.comment ?? "",
        photo: "",
        client: order.client.number,
        restaurant: currentRestaurant?.address,
        fp_number: order.fp_number ?? ""
      });

      await sleep(1000);
    }

//     const reportTimeText = `Месячный отчёт по скорости за ${mg} для ${currentRestaurant?.address}

// Заказов со статусом "получен": ${ordersAll.length}

// Среднее время принятия заказа: ${timeToCooking}
// Среднее время приготовления заказа: ${timeToReady}
// Общее среднее время от принятия до приготовления: <b>${(Math.floor((secToCooking + secToReady) / 60)) + ":" + (((secToCooking + secToReady) % 60).toString().length === 1 ? "0" + ((secToCooking + secToReady) % 60) : ((secToCooking + secToReady) % 60))}</b>

// Среднее время выдачи заказа: ${timeReceived}`

    // await ctx.replyWithHTML(reportTimeText);
    await ctx.replyWithHTML("Успешно)");
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

composer.command("gotoGoogle", async (ctx: TelegrafContext) => {
  try {
    const [, mg] = ctx.message.text.trim().split(" ");
    await ctx.deleteMessage();
    const restaurants: ConfigRestaurant[] = await bot.context.dbRestaurants!.find({}).toArray();
    const allOrders: ConfigOrder[] = await bot.context.dbOrders!.find({ $and: [{ date: {$regex: mg, $options: 'i'} }, { status: "получен" }] }).toArray()
    const orders = allOrders.filter((ord) => ord.rate);

    if (!orders.length) return ctx.replyWithHTML("Недостаточно заказов для формирования отчёта");

    const sleep = ((milliseconds: number) => {
      return (new Promise((resolve) => setTimeout(resolve, milliseconds)))
    });

    for (let order of orders) {
      await ctx.google.addRow({
        date: `${order.date} ${order.time}`,
        order: String(order._id),
        grade: order.rate!.grade,
        br: order.rate?.caus ?? "",
        comment: order.rate!.comment ?? "",
        photo: "",
        client: order.client.number,
        restaurant: restaurants.find(rest => rest._id === order.restaurant_id)?.address,
        fp_number: order.fp_number ?? ""
      });

      await sleep(1000);
    }

//     const reportTimeText = `Месячный отчёт по скорости за ${mg} для ${currentRestaurant?.address}

// Заказов со статусом "получен": ${ordersAll.length}

// Среднее время принятия заказа: ${timeToCooking}
// Среднее время приготовления заказа: ${timeToReady}
// Общее среднее время от принятия до приготовления: <b>${(Math.floor((secToCooking + secToReady) / 60)) + ":" + (((secToCooking + secToReady) % 60).toString().length === 1 ? "0" + ((secToCooking + secToReady) % 60) : ((secToCooking + secToReady) % 60))}</b>

// Среднее время выдачи заказа: ${timeReceived}`

    // await ctx.replyWithHTML(reportTimeText);
    await ctx.replyWithHTML("Успешно)");
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

composer.command("getEval", async (ctx: TelegrafContext) => {
  try {
    const [, restId, mg] = ctx.message.text.trim().split(" ");
    await ctx.deleteMessage();
    const restaurants: ConfigRestaurant[] = await bot.context.dbRestaurants!.find({}).toArray();
    const currentRestaurant = restaurants.find(rest => rest._id === Number(restId));
    const allOrders: ConfigOrder[] = await bot.context.dbOrders!.find({ $and: [{ date: {$regex: mg, $options: 'i'} }, { restaurant_id: currentRestaurant!._id }, { status: "получен" }] }).toArray()
    const orders = allOrders.filter((ord) => ord.rate);

    if (!orders.length) return ctx.replyWithHTML("Недостаточно заказов для формирования отчёта");
    const heart = orders.reduce((acc, order) => acc + order.rate!.grade , 0) / orders.length;

    const reportTimeText = `Месячный отчёт по оценкам за ${mg} для ${currentRestaurant?.address}

Заказов с оценками: ${orders.length}
"1" - ${orders.filter(order => order.rate?.grade === 1).length} шт
"2" - ${orders.filter(order => order.rate?.grade === 2).length} шт
"3" - ${orders.filter(order => order.rate?.grade === 3).length} шт
"4" - ${orders.filter(order => order.rate?.grade === 4).length} шт
"5" - ${orders.filter(order => order.rate?.grade === 5).length} шт

Средняя оценка за месяц - ${heart} .
`

    await ctx.replyWithHTML(reportTimeText);
    await ctx.replyWithHTML("Успешно)");
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})

module.exports = composer;
