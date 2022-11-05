import { ConfigOrder, ConfigRestaurant } from "../../types/dbImports"

export const messages = {
  rateOrder:
`Спасибо за заказ 🖤

Предлагаем поставить нам оценку: `,

  changeStatusNew: (order: ConfigOrder, restaurant: ConfigRestaurant, strProd: string) =>
`<b>Новый заказ #<code>${order._id}</code></b>
${order.fp_number ? "\nНомер заказа в frontPad: <b>" + order.fp_number + "</b>\n" : ""}
Статус: <b>${order.status}</b>

Приготовить: <b>${order.cookingTime.length > 5 ? order.cookingTime : order.cookingTime + " ⏰"}</b>
Выдать ${order.take ? "в пакете (<b>на вынос</b>)" : "на подносе (<b>в зале</b>)"}

Состав:
${strProd}

Итого: <b>${order.sum}</b> руб
${order.bonusSum > 0 ? "(в том числе оплачено бонусами <b>" + order.bonusSum + "</b> руб)\n" : ""}
${order.comment.length ? "Комментарий: <b>" + order.comment.toUpperCase() + "</b>❗️\n" : ""}
Telegram клиента: ${order.client.username ? "@"+order.client.username+" | " : " "}<a href="tg://user?id=${order.client.chatId}">профиль</a>
Телефон: +7<code>${order.client.number.slice(1, 11)}</code>`,

  changeStatusClient: (order: ConfigOrder, restaurant: ConfigRestaurant, strProd: string) =>
`  ✴️ Заказ <b>${order.status}</b>!

🌯 <b>Бостон Шаурма</b> | Заказ #${order._id}

Время приготовления: ${order.cookingTime}
Сумма заказа: ${order.sum} руб
${order.bonusSum > 0 ? "(в том числе оплачено бонусами <b>" + order.bonusSum + "</b> руб)\n" : ""}

Состав:
${strProd}

Ресторан: <i>${restaurant.address}</i>

${order.status !== "получен" && order.status !== "отменён" ? `Если остались вопросы по заказу - звоните: ${restaurant.phone}` : ""}
${order.status === "получен" || order.status === "отменён" ? "Можете оформить новый заказ прямо сейчас - /menu" : ""}`
};
