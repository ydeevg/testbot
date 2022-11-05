import { Markup } from "telegraf";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";
import { TelegrafContext } from "../types";
import { productsSum } from "../../utils/productsSum";
import { rateCauses } from "./rateCauses";
interface ITimeCounterPromise {
  amountH: number;
  amountM: number;
  workTime: {
    start: number;
    end: number;
  };
}

export const keyboard = {
  RegisterPanel: [
    [Markup.button.callback("Продолжить ✅", "yes")],
  ],
  mainPanel: {
    changeRestaurantKey: Markup.button.callback("Изменить шаурмаркет 🏘", "changeRestaurant"),
    menuKey: Markup.button.callback("Меню 🍱", "menu"),
    bonusKey: Markup.button.callback("Бонусный счёт 💸", "bonus"),
    addBonusKey: Markup.button.callback("Добавить бонусный счёт 💸", "addBonus"),
    adminKey: Markup.button.callback("Админка ⌨️", "adminPanelA"),
    promo: Markup.button.callback("Применить промокод 🃏", "promoMain"),
  },
  order: (ctx: TelegrafContext) => {
    const sum = productsSum(ctx.session.order!);
    return Markup.button.callback(`🛒 Корзина - ${sum}₽`, "order")
  },
  order2: (ctx: TelegrafContext) => {
    const sum = productsSum(ctx.session.order!);
    return Markup.button.callback(`🛒 Корзина - ${sum}₽`, "order")
  },
  order3: (ctx: TelegrafContext) => {
    const sum = productsSum(ctx.session.order!);
    return Markup.button.callback(`🛒 Корзина`, "order")
  },
  next: Markup.button.callback("Продолжить", "next"),
  nextNn: Markup.button.callback("Продолжить без номера", "next"),
  back: Markup.button.callback("Назад ⏪", "back"),
  backT: Markup.button.callback("Назад ⏪", "backT"),
  backB: Markup.button.callback("Назад ⏪", "backB"),
  backToMain: Markup.button.callback("В меню выбора ⏪", "back"),
  counter: (amount: number, data: string, dataKey: string, centerData: string) => {
    if (amount > 1) {
      return [Markup.button.callback("-", data+":"+(amount-1)+":"+dataKey), Markup.button.callback(amount+" шт", ":"), Markup.button.callback("+", data+":"+(amount+1)+":"+dataKey)];
    } else {
      return [Markup.button.callback("⠀", ":"), Markup.button.callback(amount+" шт", ":"), Markup.button.callback("+", data+":"+(amount+1)+":"+dataKey)];
    }
  },
  menu: {
    product: {
      addToOrder: (sum: number) => Markup.button.callback(`Добавить 🛒 (+ ${sum} руб)`, "plusOrder"),
      exceptions: Markup.button.callback("Состав ✏️", "exceptions:start"),
      addDop: Markup.button.callback("Добавки 🥓", "dop:start"),
      exit: Markup.button.callback("Отмена 🚫 (назад)", "backT"),
    }
  },
  orderPanel: {
    editOrder: Markup.button.callback("Редактировать заказ 📝", "edit"),
    promo: Markup.button.callback("Применить промокод 🃏", "promo"),
    pay: Markup.button.callback("Оплатить 💳", "pay"),
    checkout: Markup.button.callback("Оформить ❇️", "checkout"),
    clear: Markup.button.callback("Очистить корзину 🚫 ", "clear"),
    save: Markup.button.callback("Сохранить 💾", "save"),
    delete: (prodIndex: number | string) => Markup.button.callback("Удалить блюдо 🚫", "del:"+prodIndex)
  },
  checkout: {
    yes: Markup.button.callback("Подтвердить ✅", "yes"),
    return: Markup.button.callback("Вернуться в корзину ⏮", "backT"),
    here: Markup.button.callback("В зале 🍱", "here"),
    take: Markup.button.callback("На вынос 🛍", "take"),
    soon: Markup.button.callback("Как можно скорей ⚡️", "soon"),
    inTime: Markup.button.callback("Ко времени ⏰", "inTime"),
    noComment: Markup.button.callback("Без комментария ❌", "noComment"),
    payInRestaurant: Markup.button.callback("При получении 💸", "payInRestaurant"),
    payBonus: (bonus: number, sum: number) => {
      if (bonus < sum) {
        return Markup.button.callback(`Бонусы ${bonus} 🎁 + ${sum-bonus} руб при получении`, "bonusPay:"+bonus)
      } else {
        return Markup.button.callback(`Бонусы (${sum}) 100% 🎁`, "bonusPay:"+sum)
      }
    },
    payOnline: Markup.button.callback("Картой (онлайн) 💳", "payOnline"),
    payButton: (date: string) => Markup.button.pay("Оплатить 💳 до "+date),
    payCancel: (_id: string) => Markup.button.callback("Отменить заказ ❌", "cancelOrd:"+_id),
    timeCounter: (props: ITimeCounterPromise) => {
      let { amountH, amountM, workTime } = props;
      const curHours = new Date().getHours();
      const [cD, cM, cY] = (new Date().toLocaleDateString("ru")).split(".");
      const currentDate = new Date(Number(cY), Number(cM)-1, Number(cD), Number(amountH), Number(amountM)).getTime();
      const nowDate = new Date().getTime() + (30 * 60000);

      const menuH: InlineKeyboardButton[] = [];
      if (amountH > workTime.start && amountH > curHours) {
        if (currentDate-(60000 * 60) < nowDate) {
          menuH.push(Markup.button.callback("⠀", ":"));
        } else {
          menuH.push(Markup.button.callback("-", "time:"+(amountH-1)+":"+amountM));
        }
      } else {
        menuH.push(Markup.button.callback("⠀", ":"));
      }
      menuH.push(Markup.button.callback(amountH+" час", ":"));
      if (amountH < workTime.end - 1) {
        menuH.push(Markup.button.callback("+", "time:"+(amountH+1)+":"+amountM));
      } else {
        menuH.push(Markup.button.callback("⠀", ":"));
      }

      const menuM: InlineKeyboardButton[] = [];
      if (currentDate - (60000 * 10) < nowDate) {
        menuM.push(Markup.button.callback("⠀", ":"));
      } else {
        menuM.push(Markup.button.callback("-10", "time:"+amountH+":"+(amountM-10)));
      }
      menuM.push(Markup.button.callback(amountM+" мин", ":"));
      if (amountH === workTime.end-1 && amountM+10 > 59) {
        menuM.push(Markup.button.callback("⠀", ":"));
      } else {
        menuM.push(Markup.button.callback("+10", "time:"+amountH+":"+(amountM+10)))
      }

      const menu: InlineKeyboardButton[][] = [menuH, menuM, [Markup.button.callback("Подтвердить ✅", "yes:"+amountH+":"+amountM)], [keyboard.checkout.return]];

      return menu;
    },
  },
  changeStatus: {
    accept: (_id: string) => Markup.button.callback("Готовим ✅", "ordCS:Accept:"+_id),
    ready: (_id: string) => Markup.button.callback("Приготовлен ✅", "ordCS:Ready:"+_id),
    placed: (_id: string) => Markup.button.callback("Выдан ✅", "ordCS:Placed:"+_id),
    cancel: (_id: string) => Markup.button.callback("Отменить ❌", "ordCS:Cancel:"+_id),
    repeat: (order_id: string) => Markup.button.callback("Повторить заказ 🌯", "repeatOrder:"+order_id),
    newOrder: Markup.button.callback("Новый заказ 🍽", "newOrder")
  },
  adminPanel: {
    main: {
      parsingKey: Markup.button.callback("Парсинг меню", "adminParseMenuA"),
      workTimeKey: Markup.button.callback("Время работы", "changeWorkTimeA"),
      stopRest: Markup.button.callback("Стоп ресторан", "stopRestA"),
      stopList: Markup.button.callback("Стоп-лист меню", "stopListA")
    },
    workingTime: (props: {start: number, end: number, restId: number}) => {
      const {start, end, restId} = props;
      const menuStart: InlineKeyboardButton[] = [];
      if (start-1 <= 0 || start-1 >= end) {
        menuStart.push(Markup.button.callback("⠀", ":"));
      } else {
        menuStart.push(Markup.button.callback("-", "changeTime:"+(start-1)+":"+end+":"+restId));
      }
      menuStart.push(Markup.button.callback(start+" час.", ":"));
      if (start+1 > 23 || start+1 >= end) {
        menuStart.push(Markup.button.callback("⠀", ":"));
      } else {
        menuStart.push(Markup.button.callback("+", "changeTime:"+(start+1)+":"+end+":"+restId));
      }
      const menuEnd: InlineKeyboardButton[] = [];
      if (end-1 <= 0 || end-1 <= start) {
        menuEnd.push(Markup.button.callback("⠀", ":"));
      } else {
        menuEnd.push(Markup.button.callback("-", "changeTime:"+start+":"+(end-1)+":"+restId));
      }
      menuEnd.push(Markup.button.callback(end+" час.", ":"));
      if (end+1 > 23 || end+1 <= start) {
        menuEnd.push(Markup.button.callback("⠀", ":"));
      } else {
        menuEnd.push(Markup.button.callback("+", "changeTime:"+start+":"+(end+1)+":"+restId));
      }
      const menu: InlineKeyboardButton[][] = [menuStart, menuEnd, [Markup.button.callback("Подтвердить ✅", "save:"+start+":"+end+":"+restId)]];
      return menu;
    }
  },
  rate: {
    grades: (_id: string) => [
      Markup.button.callback("1️⃣", "rateOrder:1:"+_id),
      Markup.button.callback("2️⃣", "rateOrder:2:"+_id),
      Markup.button.callback("3️⃣", "rateOrder:3:"+_id),
      Markup.button.callback("4️⃣", "rateOrder:4:"+_id),
      Markup.button.callback("5️⃣", "rateOrder:5:"+_id),
    ],
    rate_noLike: [
        [Markup.button.callback("Время обслуживания", "rCaus:1")],
        [Markup.button.callback("Качество еды", "rCaus:2")],
        [Markup.button.callback("Чистота", "rCaus:3")],
        [Markup.button.callback("Что-то не так с заказом", "rCaus:4")],
        [Markup.button.callback("Работа бота", "rCaus:5")],
        [Markup.button.callback("Другое", "rCaus:6")],
    ],
    rate_like: [
      [Markup.button.callback("Время обслуживания", "rCaus:1")],
      [Markup.button.callback("Качество еды", "rCaus:2")],
      [Markup.button.callback("Работа бота", "rCaus:5")],
      [Markup.button.callback("Другое", "rCaus:6")],
    ],
    rate_br: (reacts: string[], grade: number) => {
      const causButton = [];
       try {rateCauses.forEach((el, index) => {
        if (el.grade <= grade && el.gradeEnd >= grade) causButton.push([Markup.button.callback(el.text + (reacts.includes(index.toString()) ? " ☑️" : ""), "rCaus:"+index.toString())])
      })} catch(e) {console.log(e)}
      causButton.push([Markup.button.callback("Комментарий ✍️", "comment"), Markup.button.callback("Готово 👌", "save")])
      return causButton;
    },
    no_comment: Markup.button.callback("Без комментария 🙅‍♀️", "noComment"),
  },
  hideThisMessage: Markup.button.callback("Прочитано | Убрать сообщение ❌ ", "hideThisMessage"),
};
