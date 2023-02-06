import app, { init } from "@/app";
import supertest from "supertest";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import { createEnrollmentWithAddress, createUser, createPayment, createTicketType, createTicket } from "../factories";
import { generateValidToken, cleanDb } from "../helpers";
import { createHotel } from "../factories/hotels-factory";


beforeAll(async () => {
    await init();
  });
  
  beforeEach(async () => {
    await cleanDb();
  });
  
  const server = supertest(app);

  describe("GET /hotels", () => {
    it("should respond with status 401 if no token is given", async () => {
      const response = await server.get("/hotels");
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if given token is not valid", async () => {
      const token = faker.lorem.word();
  
      const response = await server.get("/hotels").set("Authorization", `Bearer XXXX`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
  
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    describe("when token is valid", () => {
      it("should respond with status 404 when doesnt have an enrollment", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
  
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });
  
      it("should respond with status 404 when doesnt have a ticket", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        await createEnrollmentWithAddress(user);
  
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });
  
      it("should respond with status 402 when ticket is not paid", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const online = false;
        const hotelAvailable = true;
        const ticketType = await createTicketType(online, hotelAvailable);
        await createTicket(Number(enrollment.id), Number(ticketType.id), TicketStatus.RESERVED);
  
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
      });
  
      it("should respond with status 402 when ticket is remote ", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const online = true;
        const hotelAvailable = true;
        const ticketType = await createTicketType(online, hotelAvailable);
        await createTicket(Number(enrollment.id), Number(ticketType.id), TicketStatus.PAID);
  
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
      });
  
      it("should respond with status 402 when ticket does not include hotel ", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const online = true;
        const hotelAvailable = false;
        const ticketType = await createTicketType(online, hotelAvailable);
        await createTicket(Number(enrollment.id), Number(ticketType.id), TicketStatus.PAID);
  
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
      });
  
      it("should respond with status 200 when doesnt have a hotel yet ", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const online = false;
        const hotelAvailable = true;
        const ticketType = await createTicketType(online, hotelAvailable);
        const ticket = await createTicket(Number(enrollment.id), Number(ticketType.id), TicketStatus.PAID);
        await createPayment(Number(ticket.id), Number(ticketType.price));
  
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.OK);
        expect(response.body).toEqual([]);
      });
  
      it("should respond with status 200 and with hotels data", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const online = false;
        const hotelAvailable = true;
        const ticketType = await createTicketType(online, hotelAvailable);
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(Number(ticket.id), ticketType.price);
  
        const createdHotel = await createHotel();
        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.OK);
        expect(response.body).toEqual([{
          id: createdHotel.id,
          name: createdHotel.name,
          image: createdHotel.image,
          createdAt: createdHotel.createdAt.toISOString(),
          updatedAt: createdHotel.updatedAt.toISOString(),
        }]);
      });
    });
  });
  

