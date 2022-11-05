import { bot } from "../../init/orderBot";

export const getAdminLvl = async (chatId: number) => {
  const admins: {chatId: number, lvl: number}[] = (await bot.context.config!.find({name: "admins"}).toArray())[0].data;
  const adminLevel = admins.find((el) => el.chatId === chatId);
  return adminLevel ? adminLevel.lvl : 0;
}
