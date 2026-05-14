import { Router } from "express";
import { optionalAuth, protect } from "../../common/middleware/auth.js";
import {
  closePoll,
  createPoll,
  getMyPolls,
  getPollById,
  getPublicPoll,
  publishPollResults,
  submitPollResponse,
} from "./poll.controller.js";

const route = Router();

route.post("/", protect, createPoll);
route.get("/", protect, getMyPolls);
route.get("/:pollId", protect, getPollById);
route.patch("/:pollId/publish", protect, publishPollResults);
route.patch("/:pollId/close", protect, closePoll);

export default route;

export const publicPollRoutes = Router();

publicPollRoutes.get("/:token", optionalAuth, getPublicPoll);
publicPollRoutes.post("/:token/responses", optionalAuth, submitPollResponse);
