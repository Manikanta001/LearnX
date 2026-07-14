const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  askQuestion,
  answerQuestion,
  addComment,
  votePost,
  acceptAnswer,
  getQuestions,
  getQuestionThread,
} = require('../controllers/forumController');

// Open questions reading, search, tags
router.get('/', getQuestions);
router.get('/:id', getQuestionThread);

// Authenticated interactions
router.post('/ask', authenticate, askQuestion);
router.post('/:questionId/answer', authenticate, answerQuestion);
router.post('/:id/comment', authenticate, addComment);
router.post('/:id/vote', authenticate, votePost);
router.post('/:questionId/accept/:answerId', authenticate, acceptAnswer);

module.exports = router;
