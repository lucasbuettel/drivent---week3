import { AuthenticatedRequest } from "@/middlewares";
import hotelService from "@/services/hotels-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response) {
  const {userId} = req;
    try {
      const hotels = await hotelService.getHotels(userId);
  
      return res.status(httpStatus.OK).send(hotels);
    } catch (error) {
      if (error.name === "PaymentRequiredError") {
        return res.sendStatus(httpStatus.PAYMENT_REQUIRED);
      }
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
  }

  export async function getHotelRoom(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const{hotelId} = req.params;
  
    
  try {
    const roomByHotel = await hotelService.getHotelRoom(Number(hotelId), userId);

    return res.status(httpStatus.OK).send(roomByHotel);
  } catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
  }