import express from "express";
import { ConfigOrder } from "../types/dbImports";
import { changeStatus } from "../orderBot/utils/changeStatus";
import { bot } from "./orderBot";

export const configAPI = () => {
  const api = express();

  api.use( express.json() );
  api.post( '/api/changeStatus', async ( req, res ) => {
    console.log('received webhook', req.body);
    res.sendStatus(200);
    const fpStatus = req.body.status;
    const order: ConfigOrder = (await bot.context.dbOrders!.find({fp_id: Number(req.body.order_id)}).toArray())[0];
    const order_number = order._id
    if (order.status === "получен") return;
    if (!order_number) return;
    if (fpStatus === "19") await changeStatus({orderNumber: order_number, status: 3});
    if (fpStatus === "20") await changeStatus({orderNumber: order_number, status: 4});
    if (fpStatus === "10") await changeStatus({orderNumber: order_number, status: 5});
  } );
  api.post( '/api/test', ( req, res ) => {
    res.sendStatus( 200 );
  } );

  return api;
}
