// Bulk add essential Graph LeetCode questions.
// Usage:
//   node models/bulkAddGraphs.js
//   node models/bulkAddGraphs.js --dry-run

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { db } = require('../utils/firebase');
const { fetchByProblemNumber } = require('../services/leetcodeService');

const GRAPH_NUMBERS = [
  733, 1971, 463, 997, 1791,
  200, 133, 994, 207, 210, 684, 1319, 743, 399, 1584, 785, 1091, 1466,
  127, 1192,
];

const TOPIC = 'Graphs';
const DRY_RUN = process.argv.includes('--dry-run');
const DELAY_MS = 1500;
const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 5000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function upsertGraph(number) {
  const data = await fetchWithRetry(number);
  const leetcodeId = String(data.leetcodeId || number);
  const existing = await findByLeetCodeId(leetcodeId);

  if (existing) {
    const keepTopic = existing.data.topic && existing.data.topic !== 'General' ? existing.data.topic : TOPIC;
    const payload = {
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
      await existing.ref.update(payload);
    }
    return { action: 'updated', id: existing.id, title: data.title, topic: keepTopic };
  }

  const payload = {
    title: data.title,
    difficulty: data.difficulty,
    topic: TOPIC,
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
    const ref = await db.collection('problems').add(payload);
    return { action: 'created', id: ref.id, title: data.title, topic: TOPIC };
  }

  return { action: 'created', id: 'dry-run', title: data.title, topic: TOPIC };
}

async function run() {
  const uniqueNumbers = Array.from(new Set(GRAPH_NUMBERS));

  console.log('\nGraph Import');
  console.log(`Total numbers: ${GRAPH_NUMBERS.length}`);
  console.log(`Unique numbers: ${uniqueNumbers.length}`);
  console.log(`Dry run: ${DRY_RUN}`);

  const stats = { created: 0, updated: 0, failed: 0 };
  const failures = [];

  for (let i = 0; i < uniqueNumbers.length; i++) {
    const n = uniqueNumbers[i];
    const prefix = `[${i + 1}/${uniqueNumbers.length}] #${n}`;

    try {
      console.log(`${prefix} fetching...`);
      const result = await upsertGraph(n);
      stats[result.action] += 1;
      console.log(`${prefix} ${result.action.toUpperCase()} -> ${result.title} (${result.id}) [topic=${result.topic}]`);
    } catch (err) {
      stats.failed += 1;
      failures.push({ n, error: err.message });
      console.error(`${prefix} FAILED: ${err.message}`);
    }

    if (i < uniqueNumbers.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n----------------------------------');
  console.log(`Created: ${stats.created}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Failed : ${stats.failed}`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  #${f.n}: ${f.error}`));
  }
  console.log('----------------------------------\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
