import { Composer } from "telegraf";
import { supportTelegrafContext } from "../types";
import { startSupBot } from "../utils/start";

const composer = new Composer<supportTelegrafContext>();

composer.command("start", async (ctx) => {
  await startSupBot(ctx);
})

module.exports = composer;
