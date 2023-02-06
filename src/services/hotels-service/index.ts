import { notFoundError, paymentRequired } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelRepository from "@/repositories/hotels-repository";
import ticketRepository from "@/repositories/ticket-repository";


async function getHotels(userId: number) {

    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) {
        throw notFoundError();
    }

    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
    if (!ticket) {
        throw notFoundError();
    }

    const hotelReserved = ticket.status;
    const online = ticket.TicketType.isRemote;
    const hotelAvailable = ticket.TicketType.includesHotel;

    if ( hotelReserved  === "RESERVED" || online || !hotelAvailable ) {
        throw paymentRequired();
      }
      const hotels = await hotelRepository.findHotels();
    
      return hotels;
}

async function getHotelRoom(userId: number, hotelId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) {
        throw notFoundError();
    }

    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    throw notFoundError();
  }

  const isReserved = ticket.status;
  const online = ticket.TicketType.isRemote;
  const hotelAvailable = ticket.TicketType.includesHotel;

  if ( !ticket || online || isReserved === "RESERVED" || !hotelAvailable ) {
    throw notFoundError();
  }

  const rooms = await hotelRepository.findHotelById(hotelId);
  
  if (!rooms) {
    throw notFoundError();
  }

  return rooms;
}


const hotelService = {
    getHotels, getHotelRoom
};

export default hotelService;
