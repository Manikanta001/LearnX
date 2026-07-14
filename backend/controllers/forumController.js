const Discussion = require('../models/Discussion');
const User = require('../models/User');

// Create a new question thread
const askQuestion = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const question = new Discussion({
      title,
      content,
      tags: Array.isArray(tags) ? tags.map((t) => t.trim().toLowerCase()) : [],
      author: userId,
      name: req.user.name,
      type: 'Question',
    });

    await question.save();
    res.status(201).json(question);
  } catch (error) {
    console.error('Ask question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
};

// Answer an existing question
const answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const question = await Discussion.findById(questionId);
    if (!question || question.type !== 'Question') {
      return res.status(404).json({ error: 'Question not found' });
    }

    const answer = new Discussion({
      content,
      author: userId,
      name: req.user.name,
      type: 'Answer',
      questionRef: questionId,
    });

    await answer.save();
    res.status(201).json(answer);
  } catch (error) {
    console.error('Answer question error:', error);
    res.status(500).json({ error: 'Failed to create answer' });
  }
};

// Add comment to discussion item
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion post not found' });
    }

    discussion.comments.push({
      author: userId,
      name: req.user.name,
      content,
    });

    await discussion.save();
    res.json(discussion);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Toggle upvote/downvote
const votePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const userId = req.user.id;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ error: 'voteType must be upvote or downvote' });
    }

    const post = await Discussion.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const hasUpvoted = post.upvotes.includes(userId);
    const hasDownvoted = post.downvotes.includes(userId);

    // Remove current votes from arrays
    post.upvotes = post.upvotes.filter((uid) => uid.toString() !== userId);
    post.downvotes = post.downvotes.filter((uid) => uid.toString() !== userId);

    // If new action is matching toggle, toggle off. Otherwise add.
    if (voteType === 'upvote' && !hasUpvoted) {
      post.upvotes.push(userId);
    } else if (voteType === 'downvote' && !hasDownvoted) {
      post.downvotes.push(userId);
    }

    await post.save();
    res.json({
      upvotes: post.upvotes.length,
      downvotes: post.downvotes.length,
      hasUpvoted: post.upvotes.includes(userId),
      hasDownvoted: post.downvotes.includes(userId),
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
};

// Accept an answer for a question thread
const acceptAnswer = async (req, res) => {
  try {
    const { questionId, answerId } = req.params;
    const userId = req.user.id;

    const question = await Discussion.findById(questionId);
    if (!question || question.type !== 'Question') {
      return res.status(404).json({ error: 'Question thread not found' });
    }

    // Verify ownership
    if (question.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: You are not the author of this question' });
    }

    const answer = await Discussion.findById(answerId);
    if (!answer || answer.type !== 'Answer' || answer.questionRef.toString() !== questionId) {
      return res.status(400).json({ error: 'Invalid answer for this question thread' });
    }

    // Toggle logic
    if (question.acceptedAnswer && question.acceptedAnswer.toString() === answerId) {
      question.acceptedAnswer = null;
    } else {
      question.acceptedAnswer = answerId;
    }

    await question.save();
    res.json(question);
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({ error: 'Failed to accept answer' });
  }
};

// Get list of questions (with searches/tag filters)
const getQuestions = async (req, res) => {
  try {
    const { tag, search } = req.query;
    const query = { type: 'Question' };

    if (tag) {
      query.tags = tag.toLowerCase();
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
      ];
    }

    const questions = await Discussion.find(query)
      .populate('author', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Get full thread details (Question + Answers + comments)
const getQuestionThread = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Discussion.findById(id).populate('author', 'name profilePicture');

    if (!question || question.type !== 'Question') {
      return res.status(404).json({ error: 'Question not found' });
    }

    const answers = await Discussion.find({ questionRef: id, type: 'Answer' })
      .populate('author', 'name profilePicture')
      .sort({ createdAt: 1 });

    res.json({
      question,
      answers,
    });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ error: 'Failed to fetch discussion thread' });
  }
};

module.exports = {
  askQuestion,
  answerQuestion,
  addComment,
  votePost,
  acceptAnswer,
  getQuestions,
  getQuestionThread,
};
