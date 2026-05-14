import mongoose from "mongoose";

const responseSchema = new mongoose.Schema(
  {
    // Poll Reference
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: [true, "Response must belong to a poll"],
    },

    // User Reference (Optional for anonymous responses)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      description: "null if anonymous response, otherwise user id",
    },

    // Question & Option Reference
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Response must belong to a question"],
    },

    selectedOptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Option",
      required: [true, "Response must have a selected option"],
    },

    // Response Metadata
    ipAddress: {
      type: String,
      description: "For tracking unique anonymous respondents",
    },

    userAgent: {
      type: String,
      description: "Browser/device info for anonymous tracking",
    },

    deviceId: {
      type: String,
      description: "Browser-generated device identifier to reduce repeat voting from the same device",
    },

    // Timestamps
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

  },
  {
    timestamps: true,
  },
);

//INDEXES
// Find responses for a specific poll
responseSchema.index({ pollId: 1, submittedAt: -1 });

// Find responses for a specific question
responseSchema.index({ pollId: 1, questionId: 1 });

// Find responses for a specific option
responseSchema.index({ questionId: 1, selectedOptionId: 1 });

// Find user responses (for preventing duplicate votes)
responseSchema.index(
  { pollId: 1, userId: 1, questionId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } },
);

// Track anonymous responses by IP & user agent
responseSchema.index(
  { pollId: 1, ipAddress: 1, questionId: 1 },
  { sparse: true },
);

responseSchema.index(
  { pollId: 1, deviceId: 1, questionId: 1 },
  { unique: true, partialFilterExpression: { deviceId: { $type: "string" } } },
);


//INSTANCE METHODS

//  Check if response is from authenticated user
responseSchema.methods.isAuthenticated = function () {
  return this.userId !== null;
};



//  Get time since response submitted (in minutes)
 responseSchema.methods.getTimeAgoMinutes = function () {
  const now = new Date();
  const submitted = new Date(this.submittedAt);
  return Math.round((now - submitted) / (1000 * 60));
};

// STATIC METHODS


//  Get all responses for a poll
responseSchema.statics.getByPoll = function (pollId) {
  return this.find({ pollId }).sort({ submittedAt: -1 });
};


//  Get all responses for a question
 responseSchema.statics.getByQuestion = function (questionId) {
  return this.find({ questionId }).sort({ submittedAt: -1 });
};


//  Get all responses for a specific option
responseSchema.statics.getByOption = function (optionId) {
  return this.find({ selectedOptionId: optionId }).sort({ submittedAt: -1 });
};


//  Get all responses from a user in a poll(if not anonymos)
responseSchema.statics.getByUserInPoll = function (userId, pollId) {
  return this.find({ userId, pollId }).sort({ submittedAt: -1 });
};


//  Check if user already responded to a question in a poll
 responseSchema.statics.hasUserRespondedToQuestion = async function (
  userId,
  pollId,
  questionId,
) {
  if (!userId) return false; // Anonymous user check

  const response = await this.findOne({
    userId,
    pollId,
    questionId,
  });

  return !!response;
};


//  Check if IP already responded to a question in a poll (for anonymous)
 responseSchema.statics.hasIPRespondedToQuestion = async function (
  ipAddress,
  pollId,
  questionId,
) {
  if (!ipAddress) return false;

  const response = await this.findOne({
    ipAddress,
    pollId,
    questionId,
  });

  return !!response;
};

// Check if browser device already responded to a question in a poll
responseSchema.statics.hasDeviceRespondedToQuestion = async function (
  deviceId,
  pollId,
  questionId,
) {
  if (!deviceId) return false;

  const response = await this.findOne({
    deviceId,
    pollId,
    questionId,
  });

  return !!response;
};

//  Get unique respondents count for a poll
responseSchema.statics.getUniqueRespondentsCount = async function (pollId) {
  const pipeline = [
    { $match: { pollId: new mongoose.Types.ObjectId(pollId) } },
    {
      $group: {
        _id: {
          userId: "$userId",
          ipAddress: "$ipAddress",
        },
      },
    },
    { $count: "uniqueCount" },
  ];

  const result = await this.aggregate(pipeline);
  return result.length > 0 ? result[0].uniqueCount : 0;
};


//  Get response statistics for a poll
responseSchema.statics.getPollStatistics = async function (pollId) {
  return this.aggregate([
    {
      $match: { pollId: new mongoose.Types.ObjectId(pollId) },
    },
    {
      $group: {
        _id: "$questionId",
        responseCount: { $sum: 1 },
        authenticatedCount: {
          $sum: {
            $cond: [{ $ne: ["$userId", null] }, 1, 0],
          },
        },
        anonymousCount: {
          $sum: {
            $cond: [{ $eq: ["$userId", null] }, 1, 0],
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
};

//  Get response statistics per option
responseSchema.statics.getOptionStatistics = async function (
  pollId,
  questionId,
) {
  return this.aggregate([
    {
      $match: {
        pollId: new mongoose.Types.ObjectId(pollId),
        questionId: new mongoose.Types.ObjectId(questionId),
      },
    },
    {
      $group: {
        _id: "$selectedOptionId",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};


//  Delete all responses for a poll (admin operation)
 responseSchema.statics.deleteByPoll = async function (pollId) {
  return this.deleteMany({ pollId });
};


//  Get responses submitted in last N hours
 responseSchema.statics.getRecentResponses = async function (
  pollId,
  hours = 24,
) {
  const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    pollId,
    submittedAt: { $gte: sinceDate },
  }).sort({ submittedAt: -1 });
};

//EXPORT
const Response = mongoose.model("Response", responseSchema);
export default Response;
