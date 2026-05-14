import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    // Basic Info
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      minlength: [3, "Question must be at least 3 characters"],
      maxlength: [500, "Question cannot exceed 500 characters"],
    },

    // Poll Reference
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: [true, "Question must belong to a poll"],
    },

    // Question Configuration
    isMandatory: {
      type: Boolean,
      default: true,
      description: "true = must answer, false = optional",
    },

    questionType: {
      type: String,
      enum: ["single_choice"], // For future: 'multiple_choice', 'rating', 'open_text'
      default: "single_choice",
    },

    // Ordering
    order: {
      type: Number,
      required: true,
      description: "1, 2, 3... to maintain question order",
    },

    // Response Tracking
    totalResponses: {
      type: Number,
      default: 0,
    },

  },
  {
    timestamps: true,
  },
);

//INDEXES 
questionSchema.index({ pollId: 1, order: 1 });
questionSchema.index({ pollId: 1 });


//INSTANCE METHODS


//  Increment response count
questionSchema.methods.incrementResponseCount = async function () {
  this.totalResponses += 1;
  return this.save();
};

//  Get response percentage for a count
questionSchema.methods.getResponsePercentage = function (count) {
  if (this.totalResponses === 0) return 0;
  return Math.round((count / this.totalResponses) * 100);
};

//STATIC METHODS


//  Get all questions for a poll in order
questionSchema.statics.getByPoll = function (pollId) {
  return this.find({ pollId }).sort({ order: 1 });
};


//  Get questions with their options populated
questionSchema.statics.getByPollWithOptions = function (pollId) {
  return this.find({ pollId }).sort({ order: 1 }).populate("options");
};


// Get mandatory questions only
questionSchema.statics.getMandatoryByPoll = function (pollId) {
  return this.find({ pollId, isMandatory: true }).sort({ order: 1 });
};


//  Reorder questions after deletion
questionSchema.statics.reorderAfterDelete = async function (
  pollId,
  deletedOrder,
) {
  return this.updateMany(
    {
      pollId,
      order: { $gt: deletedOrder },
    },
    {
      $inc: { order: -1 },
    },
  );
};


// Get max order number for a poll
questionSchema.statics.getMaxOrderByPoll = async function (pollId) {
  const result = await this.findOne({ pollId })
    .sort({ order: -1 })
    .select("order");
  return result ? result.order : 0;
};

//EXPORT
const Question = mongoose.model("Question", questionSchema);
export default Question;
