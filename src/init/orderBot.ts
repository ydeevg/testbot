import "dotenv/config";
import { Db } from "mongodb";
import { Telegraf } from "telegraf";
import { session } from "telegraf-session-mongodb";
import { composers } from "../orderBot/init/composers";
import { configCron } from "../orderBot/init/cron";
import { setupI18n } from "../orderBot/init/i18n";
import { panels } from "../orderBot/init/panels";
import { ScenesStage } from "../orderBot/init/scenes";
import { TelegrafContext } from "../orderBot/types";
import { configDocsOrderBot } from "./google";

const bot = new Telegraf<TelegrafContext>(process.env.BOT_TOKEN!);
const configOrderBot = (db: Db) => {

  // bot.use(session(db, {sessionName: "session", collectionName: "sessions" }));
  // bot.context.config = db.collection("config");
  // bot.context.dbSession = db.collection("sessions");
  // bot.context.dbRestaurants = db.collection("restaurants");
  // bot.context.dbOrders = db.collection("orders");
  // bot.context.dbMenuConfig = db.collection("menu_config");

  // setupI18n(bot); // setup telegraf i18n module (подключение модуля локализаций (используется для хранения текста бота))
  // panels(bot); // часто используемые панели бота
  // bot.use(ScenesStage.middleware());
  // composers(bot); // композеры бота (команды и др.)
  // configDocsOrderBot(bot);
  // configCron(bot);

  bot.on("text", (ctx) => {
    console.log(ctx.message.chat.id, ctx.message.from.id, ctx.message.text)
  })

  bot.on("callback_query", (ctx) => {
    console.log("CQ", ctx.callbackQuery.from.id, ctx.callbackQuery.data)
  })

  bot.on("message", (ctx) => {
    console.log(ctx.message.chat.id, ctx.message.from.id)
  })
  bot.catch((e) => {console.error(e)})

  return bot;
}

export { configOrderBot, bot };
