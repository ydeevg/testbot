import { ConfigProduct } from "../types/dbImports";

export const productsSum = (productsArr: ConfigProduct[]): number => {
  return productsArr.reduce((acc, product: ConfigProduct) =>  {
    const additivesSum = product.additives!.reduce((acc, cv) => acc + cv.price, 0);
    return acc + (product.price + additivesSum) * product.amount!;
  }, 0)
}
