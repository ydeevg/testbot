import path from "path";
import { Telegraf } from "telegraf";
import I18n from "telegraf-i18n";
import { TelegrafContext } from "../types";

const i18n: I18n = new I18n({
  directory: path.resolve(__dirname, "../locales"),
  useSession: false,
  allowMissing: false,
  defaultLanguage: "ru",
});

export const setupI18n = (bot: Telegraf<TelegrafContext>): void => {
  bot.use(i18n.middleware());
};
