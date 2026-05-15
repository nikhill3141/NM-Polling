import mongoose from "mongoose";
import Option from "../Option/option.model.js";
import Poll from "./poll.model.js";
import PollLink from "../PollLink/pollLink.model.js";
import Question from "../Question/question.model.js";
import Response from "../Response/response.model.js";

//All the poll logic at one place there schemas are devided in diffrent folder for understanding Architecture


const toObjectId = (id) => new mongoose.Types.ObjectId(id);

//Get ip address for avoiding the multipal responces from same device 
function getIpAddress(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    return String(forwardedFor).split(",")[0].trim();
  }
  return req.ip;
}

//Validation of poll question
function validatePollQuestions(questions = []) {
  if (!Array.isArray(questions) || questions.length === 0) {
    const error = new Error("Add at least one question");
    error.statusCode = 400;
    throw error;
  }

  questions.forEach((question, questionIndex) => {
    if (!question.questionText?.trim()) {
      const error = new Error(`Question ${questionIndex + 1} text is required`);
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(question.options) || question.options.length < 2) {
      const error = new Error(`Question ${questionIndex + 1} needs at least two options`);
      error.statusCode = 400;
      throw error;
    }

    question.options.forEach((option, optionIndex) => {
      const optionText = typeof option === "string" ? option : option.optionText;
      if (!optionText?.trim()) {
        const error = new Error(`Option ${optionIndex + 1} in question ${questionIndex + 1} is required`);
        error.statusCode = 400;
        throw error;
      }
    });
  });
}

//Poll view
async function buildPollView(poll, link) {
  const questions = await Question.find({ pollId: poll._id }).sort({ order: 1 });
  const questionIds = questions.map((question) => question._id);
  const options = await Option.find({ questionId: { $in: questionIds } }).sort({ order: 1 });

  const optionsByQuestion = options.reduce((acc, option) => {
    const key = String(option.questionId);
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      id: option._id,
      optionText: option.optionText,
      order: option.order,
      responseCount: option.responseCount,
      percentage: option.getResponsePercentage(
        questions.find((question) => String(question._id) === key)?.totalResponses || 0,
      ),
    });
    return acc;
  }, {});

  return {
    id: poll._id,
    title: poll.title,
    description: poll.description,
    isAnonymous: poll.isAnonymous,
    expiresAt: poll.expiresAt,
    status: poll.isExpired() && poll.status === "active" ? "expired" : poll.status,
    totalResponses: poll.totalResponses,
    createdAt: poll.createdAt,
    link: link
      ? {
          token: link.token,
          publicUrl: link.publicUrl || link.getPublicUrl(),
          isPublished: link.isPublished,
          accessCount: link.accessCount,
          publishedAt: link.publishedAt,
        }
      : null,
    questions: questions.map((question) => ({
      id: question._id,
      questionText: question.questionText,
      isMandatory: question.isMandatory,
      questionType: question.questionType,
      order: question.order,
      totalResponses: question.totalResponses,
      options: optionsByQuestion[String(question._id)] || [],
    })),
  };
}

//Poll Creation
async function createPoll(req, res) {
  try {
    const {
      title,
      description,
      expiresAt,
      isAnonymous = true,
      questions,
    } = req.body;

    validatePollQuestions(questions);

    const poll = await Poll.create({
      title,
      description,
      expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      isAnonymous,
      createdBy: req.user._id,
    });

    for (const [questionIndex, questionInput] of questions.entries()) {
      const question = await Question.create({
        pollId: poll._id,
        questionText: questionInput.questionText,
        isMandatory: questionInput.isMandatory ?? true,
        questionType: "single_choice",
        order: questionIndex + 1,
      });

      const optionDocs = questionInput.options.map((optionInput, optionIndex) => ({
        questionId: question._id,
        optionText: typeof optionInput === "string" ? optionInput : optionInput.optionText,
        order: optionIndex + 1,
      }));

      await Option.insertMany(optionDocs);
    }

    const link = await PollLink.createLink(poll._id);
    const pollView = await buildPollView(poll, link);

    return res.status(201).json({
      success: true,
      message: "Poll created successfully",
      data: { poll: pollView },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: { message: error.message },
    });
  }
}

//get polls
async function getMyPolls(req, res) {
  try {
    await Poll.findAndUpdateExpiredPolls();
    const polls = await Poll.findByCreator(req.user._id);
    const links = await PollLink.find({ pollId: { $in: polls.map((poll) => poll._id) } });
    const linksByPoll = new Map(links.map((link) => [String(link.pollId), link]));

    return res.status(200).json({
      success: true,
      data: {
        polls: polls.map((poll) => {
          const link = linksByPoll.get(String(poll._id));
          return {
            id: poll._id,
            title: poll.title,
            description: poll.description,
            status: poll.isExpired() && poll.status === "active" ? "expired" : poll.status,
            totalResponses: poll.totalResponses,
            expiresAt: poll.expiresAt,
            createdAt: poll.createdAt,
            link: link
              ? {
                  token: link.token,
                  publicUrl: link.publicUrl || link.getPublicUrl(),
                  isPublished: link.isPublished,
                  accessCount: link.accessCount,
                }
              : null,
          };
        }),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
}

//get one poll by id
async function getPollById(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.pollId)) {
      return res.status(400).json({ success: false, error: { message: "Invalid poll id" } });
    }

    const poll = await Poll.findById(req.params.pollId);
    if (!poll || String(poll.createdBy) !== String(req.user._id)) {
      return res.status(404).json({ success: false, error: { message: "Poll not found" } });
    }

    const link = await PollLink.findByPollId(poll._id);
    const pollView = await buildPollView(poll, link);

    return res.status(200).json({ success: true, data: { poll: pollView } });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
}

//declare the poll result
async function publishPollResults(req, res) {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll || String(poll.createdBy) !== String(req.user._id)) {
      return res.status(404).json({ success: false, error: { message: "Poll not found" } });
    }

    const link = await PollLink.findOne({ pollId: poll._id });
    await link.publish();
    const pollView = await buildPollView(poll, link);

    req.io?.to(`poll-${link.token}`).emit("poll_published_notification", {
      pollToken: link.token,
      poll: pollView,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "Poll results published",
      data: { poll: pollView },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
}

//close poll so no one can addd responce after that
async function closePoll(req, res) {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll || String(poll.createdBy) !== String(req.user._id)) {
      return res.status(404).json({ success: false, error: { message: "Poll not found" } });
    }

    await poll.closePoll();
    const link = await PollLink.findByPollId(poll._id);
    const pollView = await buildPollView(poll, link);

    req.io?.to(`poll-${link.token}`).emit("poll_closed", {
      pollToken: link.token,
      poll: pollView,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "Poll closed",
      data: { poll: pollView },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
}

//public poll
async function getPublicPoll(req, res) {
  try {
    const link = await PollLink.findByToken(req.params.token);
    if (!link || !link.pollId) {
      return res.status(404).json({ success: false, error: { message: "Poll link not found" } });
    }

    await link.incrementAccessCount();
    const poll = link.pollId;

    if (poll.isExpired() && poll.status === "active") {
      poll.status = "expired";
      await poll.save({ validateBeforeSave: false });
    }

    const pollView = await buildPollView(poll, link);
    return res.status(200).json({
      success: true,
      data: {
        poll: pollView,
        resultsVisible: link.isPublished || poll.status !== "active",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
}

//poll responce
async function submitPollResponse(req, res) {
  try {
    const link = await PollLink.findByToken(req.params.token);
    if (!link || !link.pollId) {
      return res.status(404).json({ success: false, error: { message: "Poll link not found" } });
    }

    const poll = link.pollId;
    if (!poll.canAcceptResponses()) {
      return res.status(400).json({ success: false, error: { message: "Poll is not accepting responses" } });
    }

    if (!poll.isAnonymous && !req.user) {
      return res.status(401).json({ success: false, error: { message: "Login required for this poll" } });
    }

    const answers = req.body.answers;
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, error: { message: "Submit at least one answer" } });
    }

    const questions = await Question.find({ pollId: poll._id }).sort({ order: 1 });
    const questionsById = new Map(questions.map((question) => [String(question._id), question]));
    const seenQuestionIds = new Set();

    for (const answer of answers) {
      if (!questionsById.has(String(answer.questionId))) {
        return res.status(400).json({ success: false, error: { message: "Answer includes an invalid question" } });
      }
      if (seenQuestionIds.has(String(answer.questionId))) {
        return res.status(400).json({ success: false, error: { message: "A question can only be answered once" } });
      }
      seenQuestionIds.add(String(answer.questionId));
    }

    const mandatoryQuestionIds = questions
      .filter((question) => question.isMandatory)
      .map((question) => String(question._id));
    const missingMandatory = mandatoryQuestionIds.find((questionId) => !seenQuestionIds.has(questionId));
    if (missingMandatory) {
      return res.status(400).json({ success: false, error: { message: "Answer every mandatory question" } });
    }

    const ipAddress = getIpAddress(req);
    const userAgent = req.headers["user-agent"];
    const deviceId = typeof req.body.deviceId === "string" ? req.body.deviceId.trim() : null;

    for (const answer of answers) {
      const question = questionsById.get(String(answer.questionId));
      const option = await Option.findOne({
        _id: answer.selectedOptionId,
        questionId: question._id,
      });

      if (!option) {
        return res.status(400).json({ success: false, error: { message: "Answer includes an invalid option" } });
      }

      const alreadyAnswered = req.user
        ? await Response.hasUserRespondedToQuestion(req.user._id, poll._id, question._id)
        : deviceId
          ? await Response.hasDeviceRespondedToQuestion(deviceId, poll._id, question._id)
          : await Response.hasIPRespondedToQuestion(ipAddress, poll._id, question._id);

      if (alreadyAnswered) {
        return res.status(409).json({
          success: false,
          error: { message: "You have already answered this poll" },
        });
      }
    }

    for (const answer of answers) {
      const question = questionsById.get(String(answer.questionId));
      const option = await Option.findById(answer.selectedOptionId);

      await Response.create({
        pollId: poll._id,
        userId: req.user?._id || null,
        questionId: question._id,
        selectedOptionId: option._id,
        ipAddress,
        userAgent,
        deviceId,
      });

      await Question.updateOne({ _id: question._id }, { $inc: { totalResponses: 1 } });
      await Option.updateOne({ _id: option._id }, { $inc: { responseCount: 1 } });
    }

    await Poll.updateOne({ _id: poll._id }, { $inc: { totalResponses: 1 } });
    const updatedPoll = await Poll.findById(poll._id);
    const pollView = await buildPollView(updatedPoll, link);

    req.io?.to(`poll-${link.token}`).emit("poll_results_updated", {
      pollToken: link.token,
      poll: pollView,
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: "Response submitted successfully",
      data: { poll: pollView },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { message: "You have already answered this poll" },
      });
    }

    return res.status(500).json({ success: false, error: { message: error.message } });
  }
}


//export all controllers
export {
  closePoll,
  createPoll,
  getMyPolls,
  getPollById,
  getPublicPoll,
  publishPollResults,
  submitPollResponse,
};
