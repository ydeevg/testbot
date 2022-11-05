import { bot } from "../../init/orderBot";
import { ConfigProduct } from "../../types/dbImports";

export const updatePrices = async (products: ConfigProduct[], restaurant_id: number): Promise<ConfigProduct[]> => {
  try {
    const productsClone: ConfigProduct[] = JSON.parse(JSON.stringify(products));
    const productsRest: ConfigProduct[] = (await bot.context.dbRestaurants!.find({"_id": restaurant_id}).toArray())[0].products;
    const newProducts = productsClone.filter(el => {
      const product = productsRest.find(prod => prod.product_id === el.product_id);
      if (!product) return false;
      if (product.name !== el.name) return false;
      if (product.stop) return false;
      if (el.promo) return false;
      return true;
    }).map((el: ConfigProduct) => {
      const product = productsRest.find(prod => prod.product_id === el.product_id)!;
      if (product.price !== el.price) el.price = product.price;
      if (el.additives) {
        el.additives = el.additives.filter(add => {
          const pAdd = productsRest.find(prod => prod.product_id === add.product_id);
          if (!pAdd) return false;
          if (pAdd.stop) return false;
          if (pAdd.name !== add.name) return false;
          return true;
        }).map((add: ConfigProduct) => {
          const pAdd = productsRest.find(prod => prod.product_id === add.product_id)!;
          if (pAdd.price !== add.price) add.price === pAdd.price;
          return add;
        })
      }
      return el;
    })
    return newProducts;
  } catch (err) {
    console.error(`${(new Date().toString())} ${(new Date().toString())}  cant >> ${__filename} error:`, err);
    return [];
  }
}
