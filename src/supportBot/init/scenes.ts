import { Scenes } from "telegraf";
import { supportTelegrafContext } from "../types";

//* * * * * * * * * * * *  Сцены (Scenes)  * * * * * * * * * * * * *
export const ScenesStage = new Scenes.Stage<supportTelegrafContext>(
  [
    require("../scenes/supportMenu.scene"), // menu panel
  ]
);
