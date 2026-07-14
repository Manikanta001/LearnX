const Problem = require('../models/Problem');

// Get daily challenge - deterministic based on date
const getDailyChallenge = async (req, res) => {
  try {
    const problems = await Problem.find({});

    if (problems.length === 0) {
      return res.status(404).json({ error: 'No problems available' });
    }

    // Use day of year as index for deterministic daily selection
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const index = dayOfYear % problems.length;

    res.json({
      date: now.toISOString().split('T')[0],
      problem: problems[index],
    });
  } catch (error) {
    console.error('Daily challenge error:', error);
    res.status(500).json({ error: 'Failed to fetch daily challenge' });
  }
};

module.exports = { getDailyChallenge };
