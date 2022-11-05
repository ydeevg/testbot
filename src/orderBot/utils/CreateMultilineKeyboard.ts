import { Markup } from "telegraf";

export const CreateMultilineKeyboard = (arr: [], data: string, dataKey: string, amount: 1 | 2 | 3 | 4, keyName: string) => {
  const retArr = []
  for (let i = 0; i < arr.length;) {
    const countList = [];

    for (let count = 0; count < amount; ++count){
      if (i < arr.length) {
        countList.push(Markup.button.callback(arr[i][keyName], data+":"+(arr[i][dataKey])))
        ++i;
      }
    }
    retArr.push(countList);
  };

  return retArr;
}
