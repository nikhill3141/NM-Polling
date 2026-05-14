import mongoose from "mongoose";

const pollSchema = new mongoose.Schema(
  {
    // Basic Info
    title: {
      type: String,
      required: [true, "Poll title is required"],
      trim: true,
      minlength: [5, "Poll title must be at least 5 characters"],
      maxlength: [200, "Poll title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // Creator Info
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Poll must be created by a user"],
    },

    // Poll Configuration
    isAnonymous: {
      type: Boolean,
      default: true,
      description: "true = no authentication needed, false = track user",
    },

    expiresAt: {
      type: Date,
      required: [true, "Poll expiry date is required"],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Expiry date must be in the future",
      },
    },

    // Poll Status
    status: {
      type: String,
      enum: ["active", "closed", "expired"],
      default: "active",
    },
    //for no of user who participates
    totalResponses: {
      type: Number,
      default: 0,
    },

    // // Timestamp
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// INDEXES
pollSchema.index({ createdBy: 1, createdAt: -1 });
pollSchema.index({ status: 1 });
pollSchema.index({ expiresAt: 1 });

//MIDDLEWARE


//INSTANCE METHODS 
//  Check if poll is expired
 pollSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};


//  Check if poll is active (not expired and not closed)
 pollSchema.methods.isActive = function () {
  return !this.isExpired() && this.status === "active";
};


//  Increment response count
 pollSchema.methods.incrementResponseCount = async function () {
  this.totalResponses += 1;
  return this.save();
};


//  Close poll (stop accepting responses)
 pollSchema.methods.closePoll = async function () {
  this.status = "closed";
  this.closedAt = new Date();
  return this.save();
};


//  Get poll duration in minutes
 pollSchema.methods.getDurationMinutes = function () {
  const now = new Date();
  const createdAt = new Date(this.createdAt);
  return Math.round((now - createdAt) / (1000 * 60));
};


//  Get time remaining in minutes
 pollSchema.methods.getTimeRemainingMinutes = function () {
  const now = new Date();
  const expiresAt = new Date(this.expiresAt);
  const remaining = Math.round((expiresAt - now) / (1000 * 60));
  return remaining > 0 ? remaining : 0;
};


//  Check if poll can accept responses
 pollSchema.methods.canAcceptResponses = function () {
  return this.isActive() && !this.isExpired();
};

//STATIC METHODS 

//Find poll by creator
 pollSchema.statics.findByCreator = function (userId) {
  return this.find({ createdBy: userId }).sort({ createdAt: -1 });
};


//Find active polls
 pollSchema.statics.findActive = function () {
  return this.find({
    status: "active",
    expiresAt: { $gt: new Date() },
  });
};


//  Find expired polls and update status
 pollSchema.statics.findAndUpdateExpiredPolls = async function () {
  return this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      status: { $ne: "expired" },
    },
    {
      $set: { status: "expired" },
    },
  );
};

//EXPORT the schema
const Poll = mongoose.model("Poll", pollSchema);
export default Poll;
