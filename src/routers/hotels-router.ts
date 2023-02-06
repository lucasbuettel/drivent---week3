import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { getHotels, getHotelRoom} from "@/controllers";

const hotelsRouter = Router();

hotelsRouter
  .all("/*", authenticateToken)
  .get("/hotels", getHotels)
  .get(":/hotelId", getHotelRoom)


export { hotelsRouter };