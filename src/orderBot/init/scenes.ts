import { Scenes } from "telegraf";
import { TelegrafContext } from "../types";

//* * * * * * * * * * * *  Сцены (Scenes)  * * * * * * * * * * * * *
export const ScenesStage = new Scenes.Stage<TelegrafContext>(
  [
    require("../scenes/register.scene"), // регистрация
    require("../scenes/panel.scene"), // main panel
    require("../scenes/menu.scene"), // menu panel
    require("../scenes/order.scene"), // order panel
    require("../scenes/checkout.scene"), // checkout panel
    require("../scenes/admin.scene"), // admin panel
    require("../scenes/rateOrder.scene"), // оценка
  ]
);
