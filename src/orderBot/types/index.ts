import { Document } from "mongodb";
import { Context, Scenes } from "telegraf";
import I18n from "telegraf-i18n";
import { ConfigProduct } from "../../types/dbImports";

interface QNASceneSession extends Scenes.WizardSessionData {
  data?: { [key: string]: any };
}

interface MyWizard extends Scenes.WizardContextWizard<TelegrafContext> {
  state: QNASceneSession;
}

interface session {
  __scenes: QNASceneSession;
  id_mes_panel?: number;
  order?: ConfigProduct[];
  checkout?: {
    restaurant_id: number;
    take: boolean; //true с собой, false в зале
    comment: string;
    time: string;
  }
  orders?: string[];
  phone?: string;
  last_bonus_write_off?: number;
  first_name?: string;
  restaurant_id?: number;
  used_promo?: string[];
  promo_order?: string;
  mid?: number;
}

export interface TelegrafContext extends Context {
  i18n: I18n;
  session: session;
  scene: Scenes.SceneContextScene<TelegrafContext, Scenes.WizardSessionData>;
  wizard: MyWizard;
  match: RegExpExecArray | undefined;
  config: Document;
  dbOrders: Document;
  dbMenuConfig: Document;
  dbSession: Document;
  dbRestaurants: Document;
  google: any;
  googleStopList: any;
  panel: any;
  message: any;
  context: TelegrafContext;
}
