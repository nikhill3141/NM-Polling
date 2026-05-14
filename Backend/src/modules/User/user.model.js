import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
      validate: {
        validator: function (value) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
            value,
          );
        },
        message:
          "Password must contain uppercase, lowercase, number and special character",
      },
    },

    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },

    lastName: {
      type: String,
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },

    // Authentication & Security
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 2592000, // Auto-delete after 30 days (TTL)
        },
        deviceInfo: {
          userAgent: String,
          ipAddress: String,
          lastUsedAt: Date,
        },
      },
    ],

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationTokenExpires: {
      type: Date,
      select: false,
    },

    // Password Reset
    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetTokenExpires: {
      type: Date,
      select: false,
    },

    passwordChangedAt: Date,

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },

    suspensionReason: String,
    suspendedAt: Date,

    // Login Tracking
    lastLoginAt: Date,
    lastLoginIP: String,
    loginAttempts: {
      type: Number,
      default: 0,
    },

    loginLockedUntil: Date,

    // User Preferences (for future versions)
    preferences: {
      notificationsEnabled: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      theme: { type: String, enum: ["light", "dark", "auto"], default: "auto" },
    },

    // Profile
    profilePicture: {
      url: String,
      cloudinaryId: String,
    },

    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      trim: true,
    },

  },
  { timestamps: true },
);

// INDEXES 
// userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1, isSuspended: 1 });

// MIDDLEWARE
// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return 
  }

  try {
    // Don't hash if already hashed
    if (this.password.startsWith("$2a") || this.password.startsWith("$2b")) {
      return
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
    }
    
  } catch (error) {
    console.log(`Server Error:${error.message}`)
  }
});


// INSTANCE METHODS

//  Compare password with hashed password
 userSchema.methods.comparePassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};


  // Check if password changed after JWT was issued
 userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};


//  Add refresh token to user document
 userSchema.methods.addRefreshToken = function (token, userAgent, ipAddress) {
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens = this.refreshTokens.slice(-4);
  }
  this.refreshTokens.push({
    token,
    deviceInfo: { userAgent, ipAddress, lastUsedAt: new Date() },
  });
  return this.save();
};


//  Remove specific refresh token
 userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
  return this.save();
};

  // Remove all refresh tokens
 userSchema.methods.removeAllRefreshTokens = function () {
  this.refreshTokens = [];
  return this.save();
};


//  Check if user has specific refresh token
 userSchema.methods.hasRefreshToken = function (token) {
  return this.refreshTokens.some((rt) => rt.token === token);
};


//  Generate email verification token
 userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailVerificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};


//  Generate password reset token
 
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 60 * 60 * 1000;
  return token;
};


  // Verify email verification token
userSchema.methods.verifyEmailToken = function (token) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  return (
    this.emailVerificationToken === hashedToken &&
    this.emailVerificationTokenExpires > Date.now()
  );
};


//  Verify password reset token
 userSchema.methods.verifyPasswordResetToken = function (token) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  return (
    this.passwordResetToken === hashedToken &&
    this.passwordResetTokenExpires > Date.now()
  );
};

  // Check if account is locked
 userSchema.methods.isLocked = function () {
  return this.loginLockedUntil && this.loginLockedUntil > Date.now();
};

// STATIC METHODS 


  // Find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({email: email.toLowerCase().trim() });
};


  // Find user by refresh token
userSchema.statics.findByRefreshToken = function (token) {
  return this.findOne({ "refreshTokens.token": token });
};

  //EXPORT
const User = mongoose.model("User", userSchema);
export default User;
