// Bulk add Stack and Queue LeetCode sets.
// Usage:
//   node models/bulkAddStackQueue.js
//   node models/bulkAddStackQueue.js --dry-run

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { db } = require('../utils/firebase');
const { fetchByProblemNumber } = require('../services/leetcodeService');

const TOPIC_SETS = {
  Stacks: [
    20, 155, 225, 232, 150, 394, 496, 503, 739, 844,
    1047, 1021, 1190, 1475, 946, 32, 42, 84, 71, 224,
    227, 316, 402, 456, 636, 735, 853, 895, 901, 1249,
  ],
  Queues: [
    232, 225, 622, 641, 933, 346, 1700, 950, 239, 1823,
    1962, 2161, 2073, 1670, 649, 933, 225, 1021, 1047, 1700,
    239, 950, 346, 622, 1823, 2073, 1962, 2161, 1670, 649,
  ],
};

const DRY_RUN = process.argv.includes('--dry-run');
const DELAY_MS = 1500;
const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 5000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildPlan() {
  // Keep first topic if same problem appears in both lists.
  const topicByNumber = new Map();
  const duplicates = [];

  for (const topic of Object.keys(TOPIC_SETS)) {
    for (const n of TOPIC_SETS[topic]) {
      if (!topicByNumber.has(n)) {
        topicByNumber.set(n, topic);
      } else {
        duplicates.push({ number: n, keptTopic: topicByNumber.get(n), ignoredTopic: topic });
      }
    }
  }

  return {
    numbers: Array.from(topicByNumber.keys()),
    topicByNumber,
    duplicates,
  };
}

async function fetchWithRetry(number, attempt = 1) {
  try {
    return await fetchByProblemNumber(number);
  } catch (err) {
    const retryable = err.response?.status === 429 || err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET';
    if (retryable && attempt < RETRY_LIMIT) {
      const wait = RETRY_DELAY_MS * attempt;
      console.log(`  Retry #${number} in ${wait / 1000}s (attempt ${attempt + 1}/${RETRY_LIMIT})`);
      await sleep(wait);
      return fetchWithRetry(number, attempt + 1);
    }
    throw err;
  }
}

async function findByLeetCodeId(leetcodeId) {
  const snap = await db.collection('problems')
    .where('source', '==', 'leetcode')
    .where('leetcodeId', '==', String(leetcodeId))
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ref: doc.ref, data: doc.data() };
}

async function upsert(number, topic) {
  const data = await fetchWithRetry(number);
  const leetcodeId = String(data.leetcodeId || number);
  const existing = await findByLeetCodeId(leetcodeId);

  if (existing) {
    // Keep existing topic if already meaningful; only refresh content/source metadata.
    const keepTopic = existing.data.topic && existing.data.topic !== 'General' ? existing.data.topic : topic;
    const updatePayload = {
      title: data.title,
      difficulty: data.difficulty,
      topic: keepTopic,
      source: 'leetcode',
      sourceUrl: data.leetcodeUrl || '',
      leetcodeId,
      description: data.description || '',
      examples: Array.isArray(data.examples) ? data.examples : [],
      constraints: Array.isArray(data.constraints) ? data.constraints : [],
      hints: Array.isArray(data.hints) ? data.hints : [],
      starterCode: data.starterCode || {},
      testCases: Array.isArray(existing.data.testCases) ? existing.data.testCases : [],
      updatedAt: new Date().toISOString(),
    };

    if (!DRY_RUN) {
      await existing.ref.update(updatePayload);
    }
    return { action: 'updated', id: existing.id, title: data.title, topic: keepTopic };
  }

  const createPayload = {
    title: data.title,
    difficulty: data.difficulty,
    topic,
    source: 'leetcode',
    sourceUrl: data.leetcodeUrl || '',
    leetcodeId,
    description: data.description || '',
    examples: Array.isArray(data.examples) ? data.examples : [],
    constraints: Array.isArray(data.constraints) ? data.constraints : [],
    hints: Array.isArray(data.hints) ? data.hints : [],
    starterCode: data.starterCode || {},
    testCases: [],
    createdAt: new Date().toISOString(),
    createdBy: 'admin',
  };

  if (!DRY_RUN) {
    const ref = await db.collection('problems').add(createPayload);
    return { action: 'created', id: ref.id, title: data.title, topic };
  }

  return { action: 'created', id: 'dry-run', title: data.title, topic };
}

async function run() {
  const { numbers, topicByNumber, duplicates } = buildPlan();

  console.log('\nStack/Queue Import');
  console.log(`Unique numbers: ${numbers.length}`);
  console.log(`Dry run: ${DRY_RUN}`);

  if (duplicates.length) {
    console.log('\nDuplicates detected (first occurrence kept):');
    duplicates.slice(0, 20).forEach((d) => {
      console.log(`  #${d.number}: kept '${d.keptTopic}', ignored '${d.ignoredTopic}'`);
    });
    if (duplicates.length > 20) {
      console.log(`  ...and ${duplicates.length - 20} more`);
    }
  }

  const stats = { created: 0, updated: 0, failed: 0 };
  const failures = [];

  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i];
    const topic = topicByNumber.get(n);
    const prefix = `[${i + 1}/${numbers.length}] #${n} (${topic})`;

    try {
      console.log(`${prefix} fetching...`);
      const result = await upsert(n, topic);
      stats[result.action] += 1;
      console.log(`${prefix} ${result.action.toUpperCase()} -> ${result.title} (${result.id}) [topic=${result.topic}]`);
    } catch (err) {
      stats.failed += 1;
      failures.push({ number: n, topic, error: err.message });
      console.error(`${prefix} FAILED: ${err.message}`);
    }

    if (i < numbers.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n----------------------------------');
  console.log(`Created: ${stats.created}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Failed : ${stats.failed}`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  #${f.number} (${f.topic}): ${f.error}`));
  }
  console.log('----------------------------------\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
