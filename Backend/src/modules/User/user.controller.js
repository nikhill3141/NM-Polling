import User from "./user.model.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyToken,
} from "../../common/utils/token.js";
import { createUser } from "./user.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

function sendAuthResponse(res, user, accessToken, refreshToken, message) {
  res.cookie("access_token", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refresh_token", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    },
  });
}

//user signUp
async function signUp(req, res) {
  try {
    const {firstName, lastName, email, password } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({success:false,error:{message:"Provide all required fields"}})
    }

    const userValidate = await User.findByEmail(email)
    if(userValidate){
      return res.status(409).json({success:false,error:{message:"User with this email already exists"}})
    }
    const user = await createUser(firstName,lastName,email,password)
    const accessToken = createAccessToken(user?._id)
    const refreshToken = createRefreshToken(user?._id)
    await user.addRefreshToken(refreshToken, req.headers["user-agent"], req.ip);

    return sendAuthResponse(res, user, accessToken, refreshToken, "User created successfully!")
  } catch (error) {
    return res.status(error.statusCode || 500).json({success:false,error:{message:error.message}})
  }
}
//user login
async function logIn(req, res) {
  try {
    const {email, password } = req.body;
    if(!email || !password){
      return res.status(400).json({success:false,error:{message:"Provide email and password"}})
    }
    const user = await User.findByEmail(email).select("+password")
    //validate: if user is not signup
    if(!user){
      return res.status(401).json({success:false,error:{message:"Invalid email or password"}})
    }
    if (user.isLocked()) {
      return res.status(423).json({success:false,error:{message:"Account is temporarily locked. Try again later."}})
    }
    //validate: is password match
    const isPassMatch = await user.comparePassword(password)
    if(!isPassMatch){
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.loginLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({success:false,error:{message:"Invalid email or password"}})
    }
    user.loginAttempts = 0;
    user.loginLockedUntil = undefined;
    user.lastLoginAt = new Date();
    user.lastLoginIP = req.ip;
    const accessToken = createAccessToken(user?._id);
    const refreshToken = createRefreshToken(user?._id);
    await user.addRefreshToken(refreshToken, req.headers["user-agent"], req.ip);

    return sendAuthResponse(res, user, accessToken, refreshToken, "User logged in successfully!");
  } catch (error) {
    return res.status(500).json({success:false,error:{message:error.message}});
  }
}

//user logout
async function logOut(req, res){
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if(req.user && refreshToken){
      await req.user.removeRefreshToken(refreshToken);
    }
    
    res.clearCookie("refresh_token", cookieOptions);
    res.clearCookie("access_token", cookieOptions);
    return res.status(200).json({success:true,message:"User logged out successfully!"})
    
  } catch (error) {
    return res.status(500).json({success:false,error:{message:error.message}})
  }
}

async function refreshAccessToken(req, res) {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: { message: "Refresh token required" } });
    }

    const decoded = verifyToken(refreshToken);
    if (decoded.tokenType !== "refresh") {
      return res.status(401).json({ success: false, error: { message: "Invalid refresh token" } });
    }

    const user = await User.findByRefreshToken(refreshToken);
    if (!user || String(user._id) !== String(decoded.userId)) {
      return res.status(401).json({ success: false, error: { message: "Invalid refresh token" } });
    }

    await user.removeRefreshToken(refreshToken);
    const accessToken = createAccessToken(user._id);
    const newRefreshToken = createRefreshToken(user._id);
    await user.addRefreshToken(newRefreshToken, req.headers["user-agent"], req.ip);

    return sendAuthResponse(res, user, accessToken, newRefreshToken, "Token refreshed successfully!");
  } catch (error) {
    return res.status(401).json({ success: false, error: { message: "Invalid or expired refresh token" } });
  }
}

async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
      },
    },
  });
}

export{
  signUp,
  logIn,
  logOut,
  refreshAccessToken,
  getMe
}
