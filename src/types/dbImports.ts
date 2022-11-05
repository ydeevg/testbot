import { ObjectId } from "mongodb";

export interface ConfigRestaurant {
  _id: number,
  address: string;
  workingHours: {
    start: number;
    end: number;
  };
  chat_id: number;
  rate_chat_id: number;
  phone?: string;
  frontPad: string;
  lastUpdate: string;
  products: ConfigProduct[];
  isStop: string;
  fpIntegration?: boolean;
}

export interface MenuConfig {
  _id: ObjectId;
  product_id: string;
  description?: string;
  additivesProducts?: string[];
  exceptionsProducts?: string[];
}

export interface ConfigProduct {
  product_id: string;
  name: string;
  price: number;
  stop: boolean;
  description?: string;
  additivesProducts?: string[];
  exceptionsProducts?: string[];
  amount?: number;
  additives?: ConfigProduct[];
  promo?: boolean;
}

export interface ConfigOrder {
  _id: string;
  fp_id?: number;
  fp_number?: number;
  sum: number;
  bonusSum: number;
  status: string;
  restaurant_id: number;
  date: string;
  time: string;
  take: boolean;
  cookingTime: string;
  comment: string;
  payType: string;
  client: {
    username: string;
    number: string;
    chatId: number;
    first_name: string;
    message_id?: number;
    restaurant_message_id?: number;
  };
  rate?:{
    grade: number;
    caus: string;
    comment: string;
    photo?: string;
  };
  changeStatusTime?: {
    toCooking?: string;
    toReady?: string;
    received?: string;
  };
  products: ConfigProduct[];
}

export interface ConfigCategory {
  id: number,
  name: string;
  indexes: string[];
  children?: number[];
  config: {
    edit: boolean;
    deleted: boolean;
    show: boolean;
  }
}

export interface ConfigPromo {
  name: string;
  type: "dish" | "dishes";
  active: boolean;
  use: 0 | 1 | 2 | 3 | 4;
  users?: (number)[];
  value: string[] | string;
  condition: number;
  counter: number;
}

