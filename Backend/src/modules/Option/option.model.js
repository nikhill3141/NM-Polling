import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    // Basic Info
    optionText: {
      type: String,
      required: [true, "Option text is required"],
      trim: true,
      minlength: [1, "Option must be at least 1 character"],
      maxlength: [200, "Option cannot exceed 200 characters"],
    },

    // Question Reference
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Option must belong to a question"],
    },

    // Ordering
    order: {
      type: Number,
      required: true,
      description: "1, 2, 3... to maintain option order",
    },

    // Response Tracking
    responseCount: {
      type: Number,
      default: 0,
      description: "Cache of total responses for this option",
    },

  },
  {
    timestamps: true,
  },
);

//INDEXES
optionSchema.index({ questionId: 1, order: 1 });
optionSchema.index({ questionId: 1 });

// MIDDLEWARE 


//INSTANCE METHODS


//  Increment response count
optionSchema.methods.incrementResponseCount = async function () {
  this.responseCount += 1;
  return this.save();
};


//  Decrement response count (if response is removed)
optionSchema.methods.decrementResponseCount = async function () {
  if (this.responseCount > 0) {
    this.responseCount -= 1;
  }
  return this.save();
};


//  Get response percentage
optionSchema.methods.getResponsePercentage = function (totalResponses) {
  if (totalResponses === 0) return 0;
  return Math.round((this.responseCount / totalResponses) * 100);
};

//STATIC METHODS


//  Get all options for a question
optionSchema.statics.getByQuestion = function (questionId) {
  return this.find({ questionId }).sort({ order: 1 });
};


//  Get options sorted by response count (highest first)
optionSchema.statics.getByQuestionByPopularity = function (questionId) {
  return this.find({ questionId }).sort({ responseCount: -1, order: 1 });
};


//  Reorder options after deletion
optionSchema.statics.reorderAfterDelete = async function (
  questionId,
  deletedOrder,
) {
  return this.updateMany(
    {
      questionId,
      order: { $gt: deletedOrder },
    },
    {
      $inc: { order: -1 },
    },
  );
};


//  Get max order number for a question
optionSchema.statics.getMaxOrderByQuestion = async function (questionId) {
  const result = await this.findOne({ questionId })
    .sort({ order: -1 })
    .select("order");
  return result ? result.order : 0;
};


//  Reset all response counts for a question (admin operation)
optionSchema.statics.resetCountsByQuestion = async function (questionId) {
  return this.updateMany({ questionId }, { $set: { responseCount: 0 } });
};

//EXPORT 
const Option = mongoose.model("Option", optionSchema);
export default Option;
