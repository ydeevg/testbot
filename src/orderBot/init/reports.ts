import { bot } from "../../init/orderBot";
import { ConfigRestaurant } from "../../types/dbImports";
import { getRestReport } from "../utils/getRestReport";

export const reports = async () => {
  const restaurants: ConfigRestaurant[] = await bot.context.dbRestaurants!.find({}).toArray();
  for (let rest of restaurants) {
   await getRestReport(rest, bot);
  }
};
