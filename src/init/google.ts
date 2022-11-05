import { GoogleSpreadsheet } from "google-spreadsheet"
import { Telegraf } from "telegraf";
import { TelegrafContext } from "../orderBot/types";

// Initialize the sheet - doc ID is the long id in the sheets URL
export const doc = new GoogleSpreadsheet('1TJk0s-S6IOYLuMlfe5rO7px5stv0EkzOANoOayqMdlU');
// Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
export const configDocsOrderBot = async (bot: Telegraf<TelegrafContext>) => {
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  });
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const sheetStopList = doc.sheetsByIndex[3];
  bot.context.google = sheet;
  bot.context.googleStopList = sheetStopList;
}
