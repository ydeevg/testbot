import path from "path";
import { Telegraf } from "telegraf";
import I18n from "telegraf-i18n";
import { supportTelegrafContext } from "../types";

const supI18n: I18n = new I18n({
  directory: path.resolve(__dirname, "../locales"),
  useSession: false,
  allowMissing: false,
  defaultLanguage: "ru",
});

export const setupI18sup = (bot: Telegraf<supportTelegrafContext>): void => {
  bot.use(supI18n.middleware());
};
