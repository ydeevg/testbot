import { NewInvoiceParameters } from "telegraf/typings/telegram-types";
import { ConfigOrder, ConfigProduct } from "../../types/dbImports";

interface MyInvoice extends NewInvoiceParameters {
  chat_id: number;
}

export const getInvoice = (order: ConfigOrder) => {
  const pricesArr = order.products.reduce((acc: {label: string, amount: number}[], prod: ConfigProduct) => {
    const res: {label: string, amount: number}[] = [...acc];
    res.push({label: `${prod.name} | ${prod.amount} шт | ${prod.price} руб/шт`, amount: prod.price * prod.amount! * 100});
    if (prod.additives) {
      const addsSum = prod.additives.reduce((acc, add: ConfigProduct) => acc + add.price * prod.amount!, 0);
      if (addsSum) {
        res.push({
          label: `  └добавки`,
          amount: addsSum * 100
        })
     }
    }
    return res;
  }, [])
  const invoice: MyInvoice = {
    chat_id: order.client.chatId,
    provider_token: process.env.PROVIDER_TOKEN!,
    start_parameter: 'cs',
    title: 'Заказ #'+order._id,
    description: "Необходимо оплатить в течении 20 минут после получения данного сообщения об оплате",
    currency: 'RUB',
    photo_url: "https://i.imgur.com/Fw0Zay8.jpg",
    prices: pricesArr,
    payload: JSON.stringify({
      _id: order._id,
    })
  }
  return invoice;
}
