import { Markup } from "telegraf";
import { keyboard } from "../../keyboard";
import { TelegrafContext } from "../../../types";
import { getAdminLvl } from "../../getAdminLvl";

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
*            Создание/открытие основной панели             */
//* * * * * * * * * * * * * * * *  * * * * * * * * * * * * *
export const MainPanel = async (ctx: TelegrafContext, edit = false) => {
  try {

    if (!ctx.from) return; // проверка на админа


    //* * * * * * * * * Построение кнопок * * * * * * * * *
    const menuKeyboard = [[keyboard.mainPanel.changeRestaurantKey]];

    if (ctx.session.order) { // проверка на наличие продуктов в корзине
      menuKeyboard.push([keyboard.mainPanel.menuKey, keyboard.order(ctx)]);
      // menuKeyboard.push([keyboard.order2(ctx), keyboard.order3(ctx)]);
    } else {
      menuKeyboard.push([keyboard.mainPanel.menuKey]);
    }


    if (ctx.session.phone) { // проверка подключение к бонусной системе
      menuKeyboard.push([keyboard.mainPanel.bonusKey]);
    } else {
      menuKeyboard.push([keyboard.mainPanel.addBonusKey]);
    }
    if (await getAdminLvl(ctx.from!.id) >= 1) menuKeyboard.push([keyboard.mainPanel.adminKey])

    // узнаём какой адрес ресторана активен у пользователя
    if (!ctx.session.hasOwnProperty("restaurant_id")) ctx.session.restaurant_id = 0;
    // получаем объект ресторана по id из бд
    const restaurant = (await ctx.dbRestaurants.find({ _id: ctx.session.restaurant_id }).toArray())[0];

    if (edit) { // уточняем, редактировать или создать новое сообщение
      await ctx.editMessageText(
        ctx.i18n.t("mainPanel", { restaurant: restaurant, hat: ctx.i18n.t("hat") }),
        { parse_mode: "HTML", ...Markup.inlineKeyboard(menuKeyboard) }
      )
    } else {
      if (ctx.session.id_mes_panel) {
        try {
          await ctx.telegram.deleteMessage(ctx.from.id, ctx.session.id_mes_panel);
        } catch (err) {
          try {
            await ctx.telegram.editMessageText(ctx.from!.id, ctx.session.id_mes_panel!, "0", ctx.i18n.t("hat-nHTML"));
          } catch (err) {
            console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
          }
        }
      }

      ctx.session.id_mes_panel = (await ctx.replyWithHTML(
        ctx.i18n.t("mainPanel", { restaurant: restaurant, hat: ctx.i18n.t("hat") }),
        { ...Markup.inlineKeyboard(menuKeyboard) })).message_id;
    }

    if (ctx.wizard) await ctx.scene.leave();

    return await ctx.scene.enter("panel");

  } catch (err) {
    console.error(`${(new Date().toString())}  cant >> ${__filename} error:`, err)
  }
}
