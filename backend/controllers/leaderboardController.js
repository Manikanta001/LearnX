const User = require('../models/User');

// Get leaderboard sorted by XP, problems solved, or streak
const getLeaderboard = async (req, res) => {
  try {
    const { sortBy } = req.query; // 'xp', 'solved', or 'streak'
    const users = await User.find({}).select('name email role xp streak solvedProblems profilePicture');

    const formattedUsers = users.map((u) => ({
      id: u._id,
      name: u.name || 'Anonymous',
      profilePicture: u.profilePicture || '',
      xp: u.xp || 0,
      streak: u.streak || 0,
      solvedCount: (u.solvedProblems || []).length,
    }));

    if (sortBy === 'streak') {
      formattedUsers.sort((a, b) => b.streak - a.streak);
    } else if (sortBy === 'solved') {
      formattedUsers.sort((a, b) => b.solvedCount - a.solvedCount);
    } else {
      // Default: sort by XP
      formattedUsers.sort((a, b) => b.xp - a.xp);
    }

    res.json(formattedUsers.slice(0, 50));
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

module.exports = { getLeaderboard };
