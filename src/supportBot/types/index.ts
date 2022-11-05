import { Document } from "mongodb";
import { Context, Scenes } from "telegraf";
import I18n from "telegraf-i18n";

interface QNASceneSession extends Scenes.WizardSessionData {
  data?: { [key: string]: any };
}

interface MyWizard extends Scenes.WizardContextWizard<supportTelegrafContext> {
  state: QNASceneSession;
}

interface session {
  __scenes: QNASceneSession;
  ticket?: number;
}

export interface supportTelegrafContext extends Context {
  i18n: I18n;
  session: session;
  scene: Scenes.SceneContextScene<supportTelegrafContext, Scenes.WizardSessionData>;
  wizard: MyWizard;
  match: RegExpExecArray | undefined;
  config: Document;
  originalSession: Document;
  supSession: Document;
  tickets: Document;
  dbMenuConfig: Document;
  dbRestaurants: Document;
  google: any;
  googleStopList: any;
  panel: any;
  message: any;
  context: supportTelegrafContext;
}
