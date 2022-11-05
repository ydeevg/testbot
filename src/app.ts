import { configAPI } from "./init/api";
import { mongodbConnect } from "./init/mongodb";
import { configOrderBot } from "./init/orderBot";
import { configSupportBot } from "./init/supportBot";

mongodbConnect().then(db => {
  const orderBot = configOrderBot(db);
  const supportBot = configSupportBot(db);
  const api = configAPI();

  api.listen(process.env.SERVER_PORT, () => console.log(`>>> API server success started on ${process.env.SERVER_PORT} port!`));
  orderBot.launch().then(() => console.log(">>> Bot success started! > " +new Date().toLocaleDateString("ru") + " " + new Date().toLocaleTimeString("ru")));
  supportBot.launch().then(() => console.log(">>> Bot support success started! > " +new Date().toLocaleDateString("ru") + " " + new Date().toLocaleTimeString("ru")));
})
