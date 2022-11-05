import { TelegrafContext } from "../types";

export const generateOrderId = async (ctx: TelegrafContext) => {
  try {
    let order_id = "";
    for (; !order_id;) {
      const number = new Date().toLocaleDateString("ru", {day: "2-digit", month: "2-digit",year: "2-digit"}).split(".").join("") + "-" + Math.floor(100000 + Math.random() * 900000);
      if (await ctx.dbOrders.find({_id: number}).toArray().length === 0) {
      } else {
        order_id = number;
      }
    }
    return order_id;
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
    const number = new Date().toLocaleDateString("ru", {day: "2-digit", month: "2-digit",year: "2-digit"}).split(".").join("") + "-" + Math.floor(100000 + Math.random() * 900000);
    return number;
  }
}
