import mongoose from "mongoose";
import crypto from "crypto";

const pollLinkSchema = new mongoose.Schema(
  {
    // Poll Reference
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: [true, "PollLink must belong to a poll"],
      unique: true,
      index: true,
    },

    // Unique Token (for public sharing)
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: "Unique shareable link token (e.g., j7k9p2m5q8)",
    },

    // Publishing Status true = result declare
    isPublished: {
      type: Boolean,
      default: false,
      description: "false = collecting responses, true = results visible",
    },

    // Public URL
    publicUrl: {
      type: String,
      description: "e.g., https://yoursite.com/polls/j7k9p2m5q8",
    },

    // Access Control
    accessCount: {
      type: Number,
      default: 0,
      description: "Track how many times the link was accessed",
    },

    // Timestamps
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

//INDEXES 
pollLinkSchema.index({ token: 1 });
pollLinkSchema.index({ pollId: 1 });
pollLinkSchema.index({ isPublished: 1 });

//MIDDLEWARE


//INSTANCE METHODS

//  Check if poll link is published
 pollLinkSchema.methods.getStatus = function () {
  if (this.isPublished) {
    return "published";
  }
  return "active";
};

//Publish the poll results
pollLinkSchema.methods.publish = async function () {
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
};

//Unpublish the poll results (if needed)
 pollLinkSchema.methods.unpublish = async function () {
  this.isPublished = false;
  this.publishedAt = null;
  return this.save();
};


//  Increment access count
 pollLinkSchema.methods.incrementAccessCount = async function () {
  this.accessCount += 1;
  return this.save();
};


//  Get full public URL
 
pollLinkSchema.methods.getPublicUrl = function (
  baseUrl = process.env.CLIENT_URL || "http://localhost:5173",
) {
  return `${baseUrl}/polls/${this.token}`;
};


//  Regenerate token (in case of security concern)
 pollLinkSchema.methods.regenerateToken = async function () {
  this.token = generateUniqueToken();
  this.publicUrl = this.getPublicUrl();
  return this.save();
};

// ==================== STATIC METHODS ====================

/**
 * Generate a new unique token
 */
function generateUniqueToken() {
  return crypto.randomBytes(5).toString("hex"); // 10 characters
}


//  Create a new poll link with unique token
pollLinkSchema.statics.createLink = async function (pollId) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = generateUniqueToken();
    const exists = await this.exists({ token });

    if (!exists) {
      return this.create({
        pollId,
        token,
        publicUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/polls/${token}`,
      });
    }
  }

  throw new Error("Unable to create a unique poll link");
};


//  Find by token
 pollLinkSchema.statics.findByToken = function (token) {
  return this.findOne({ token }).populate("pollId");
};


//  Find by poll ID
 
pollLinkSchema.statics.findByPollId = function (pollId) {
  return this.findOne({ pollId }).populate("pollId");
};


//  Find published links only
 pollLinkSchema.statics.findPublished = function () {
  return this.find({ isPublished: true });
};


//  Find unpublished links only
 pollLinkSchema.statics.findUnpublished = function () {
  return this.find({ isPublished: false });
};


//  Get popular links (by access count)
pollLinkSchema.statics.getPopularLinks = function (limit = 10) {
  return this.find().sort({ accessCount: -1 }).limit(limit).populate("pollId");
};

// Get recently published links
 pollLinkSchema.statics.getRecentlyPublished = function (limit = 10) {
  return this.find({ isPublished: true })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate("pollId");
};


//  Get recently created links
 pollLinkSchema.statics.getRecentlyCreated = function (limit = 10) {
  return this.find().sort({ createdAt: -1 }).limit(limit).populate("pollId");
};

//EXPORT
const PollLink = mongoose.model("PollLink", pollLinkSchema);
export default PollLink;
