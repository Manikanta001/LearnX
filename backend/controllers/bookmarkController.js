const User = require('../models/User');

// Toggle bookmark for a problem
const toggleBookmark = async (req, res) => {
  try {
    const { problemId } = req.body;
    const userId = req.user.id;

    if (!problemId) {
      return res.status(400).json({ error: 'problemId is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isBookmarked = user.bookmarks.includes(problemId);
    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter((id) => id !== problemId);
    } else {
      user.bookmarks.push(problemId);
    }

    await user.save();
    res.json({ bookmarked: !isBookmarked });
  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
};

// Get user's bookmarked problems
const getBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ bookmarks: user.bookmarks || [] });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
};

module.exports = { toggleBookmark, getBookmarks };
