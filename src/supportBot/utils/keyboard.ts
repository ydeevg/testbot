import { Markup } from "telegraf";

export const supKeyboard = {
  mainPanel: (session: any) => {
    const menu = [];
    if (session && session.data && session.data.orders && session.data.orders.length > 0) session.data.orders.forEach((el: string, index: number, array: any[]) => {
      if (index > array.length-5) menu.push([Markup.button.callback(el, el)])
    });
    menu.push([Markup.button.callback("Вопрос по другому заказу", "otherOrder")]);
    menu.push([Markup.button.callback("Вопрос не по заказу", "otherQ")]);
    return menu;
  },
  actions: (id: number | string) => [
    [Markup.button.callback("Последние сообщения", "lm:"+id)]
  ]
}
