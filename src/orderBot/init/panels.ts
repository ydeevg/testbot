import { Telegraf } from "telegraf";
import { TelegrafContext } from "../types";
import { MainPanel } from "../utils/layouts/MainPanel";
import { AddBonusAccountPanel } from "../utils/layouts/MainPanel/AddBonusAccountPanel";
import { AdminPanel } from "../utils/layouts/MainPanel/AdminPanel";
import { MenuPanel } from "../utils/layouts/MainPanel/MenuPanel";
import { OrderPanel } from "../utils/layouts/MainPanel/OrderPanel";
import { RegisterPanel } from "../utils/layouts/RegisterPanel";

export const panels = (bot: Telegraf<TelegrafContext>) => {
  bot.context.panel = {};
  bot.context.panel.RegisterPanel = RegisterPanel;
  bot.context.panel.MainPanel = MainPanel;
  bot.context.panel.MenuPanel = MenuPanel;
  bot.context.panel.OrderPanel = OrderPanel;
  bot.context.panel.AddBonusAccountPanel = AddBonusAccountPanel;
  bot.context.panel.AdminPanel = AdminPanel;
}
