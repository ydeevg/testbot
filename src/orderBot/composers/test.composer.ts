import { Composer } from "telegraf";
import { TelegrafContext } from "../types";

interface IProductsAPIData {
  product_id: string[];
  name: string[];
  price: string[];
}

const composer = new Composer<TelegrafContext>();

composer.command("test3",async (ctx: TelegrafContext) => {
  try {
    // const data = new FormData();
    // data.append("status", 3);
    // axios({
    //   method: "post",
    //   url: `http://${process.env.SERVER_IP}:${process.env.SERVER_PORT}/api/changeStatus/050622-941247`,
    //   data: data,
    // })
    console.log(ctx.chat)
  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
})


module.exports = composer;
