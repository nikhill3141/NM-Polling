import { Router } from "express";
import { protect } from "../../common/middleware/auth.js";
import { getMe, logIn, logOut, refreshAccessToken, signUp } from "./user.controller.js";

const route = Router()

route.post('/signup', signUp)
route.post('/login', logIn)
route.post('/refresh-token', refreshAccessToken)
route.post('/logout', protect, logOut)
route.get('/me', protect, getMe)

export default route
