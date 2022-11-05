import { ConfigProduct } from "../types/dbImports";

export const productsToString = (productsArr: ConfigProduct[]) => {
  return productsArr.map(
    (product: ConfigProduct) => {
      let additivesStr = "";
      if (product.additives) {
        additivesStr = product.additives!.map((add: ConfigProduct, i, row) => {
          if (i+1 === row.length) {
            return`  └<i> ${add.name}</i>\n`;
          } else {
            return`  ├<i> ${add.name}</i>\n`
          }
        }).join("");
      }
      const additivesSum = product.additives!.reduce((acc, cv) => acc + cv.price, 0)
      return `<i>${product.name}</i> | ${product.amount} шт | ${product.amount!*(product.price+additivesSum)} руб\n${additivesStr}`
    }
  ).join("")
}
