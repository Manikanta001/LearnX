// Bulk add curated LeetCode question sets by topic.
// Usage:
//   node models/bulkAddCoreTopics.js
//   node models/bulkAddCoreTopics.js --dry-run
//   node models/bulkAddCoreTopics.js --topic="String"
//
// Notes:
// - If a LeetCode problem already exists, it updates topic/source fields instead of creating duplicates.
// - If a number is listed in multiple topics, the first topic in TOPIC_SETS order is used.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { db } = require('../utils/firebase');
const { fetchByProblemNumber } = require('../services/leetcodeService');

const TOPIC_SETS = {
  String: {
    easy: [344, 541, 151, 14, 20, 242, 125, 412, 13, 387],
    medium: [3, 5, 6, 8, 12, 17, 22, 49, 71, 76, 91, 131, 139, 438, 567],
    hard: [10, 32, 44, 68, 72],
  },
  'Linked Lists': {
    easy: [206, 21, 141, 160, 234, 876, 83, 203, 1290, 237],
    medium: [2, 19, 24, 61, 82, 86, 92, 138, 142, 143, 147, 148, 328, 430, 445, 707, 725, 1019, 1171, 1721],
    hard: [],
  },
  Trees: {
    easy: [94, 100, 101, 104, 108, 110, 111, 112, 226, 700],
    medium: [98, 102, 103, 105, 106, 113, 114, 116, 117, 129, 173, 199, 230, 235, 236, 437, 450, 543, 617, 863],
    hard: [],
  },
  'Dynamic Programming': {
    easy: [70, 121, 338, 392, 509, 746, 1025, 1137],
    medium: [5, 32, 53, 62, 63, 64, 91, 120, 139, 152, 198, 213, 221, 300, 322, 377, 416, 516, 518, 1143],
    hard: [72, 124],
  },
};

const DRY_RUN = process.argv.includes('--dry-run');
const TOPIC_ARG = process.argv.find((a) => a.startsWith('--topic='));
const TOPIC_FILTER = TOPIC_ARG ? TOPIC_ARG.split('=')[1].replace(/^"|"$/g, '') : null;

const DELAY_MS = 1800;
const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 6000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildImportPlan() {
  const chosenTopics = TOPIC_FILTER
    ? Object.keys(TOPIC_SETS).filter((t) => t.toLowerCase() === TOPIC_FILTER.toLowerCase())
    : Object.keys(TOPIC_SETS);

  if (chosenTopics.length === 0) {
    throw new Error(`Unknown topic '${TOPIC_FILTER}'. Available: ${Object.keys(TOPIC_SETS).join(', ')}`);
  }

  const numberToTopic = new Map();
  const duplicateNumbers = [];

  for (const topic of chosenTopics) {
    const set = TOPIC_SETS[topic];
    const nums = [...set.easy, ...set.medium, ...set.hard];
    for (const n of nums) {
      if (!numberToTopic.has(n)) {
        numberToTopic.set(n, topic);
      } else {
        duplicateNumbers.push({ number: n, keptTopic: numberToTopic.get(n), ignoredTopic: topic });
      }
    }
  }

  return {
    numbers: Array.from(numberToTopic.keys()),
    topicByNumber: numberToTopic,
    duplicateNumbers,
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

async function findExistingDocByLeetCodeId(leetcodeId) {
  const snap = await db.collection('problems')
    .where('source', '==', 'leetcode')
    .where('leetcodeId', '==', String(leetcodeId))
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ref: doc.ref, data: doc.data() };
}

async function upsertProblem(number, topic) {
  const data = await fetchWithRetry(number);
  const leetcodeId = String(data.leetcodeId || number);

  const existing = await findExistingDocByLeetCodeId(leetcodeId);

  const payload = {
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
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    if (!DRY_RUN) {
      await existing.ref.update(payload);
    }
    return { action: 'updated', id: existing.id, title: data.title };
  }

  if (!DRY_RUN) {
    payload.createdAt = new Date().toISOString();
    payload.createdBy = 'admin';
    const ref = await db.collection('problems').add(payload);
    return { action: 'created', id: ref.id, title: data.title };
  }

  return { action: 'created', id: 'dry-run', title: data.title };
}

async function run() {
  const { numbers, topicByNumber, duplicateNumbers } = buildImportPlan();

  console.log('\nCore Topic Import');
  console.log(`Total unique numbers: ${numbers.length}`);
  console.log(`Dry run: ${DRY_RUN}`);
  if (TOPIC_FILTER) console.log(`Topic filter: ${TOPIC_FILTER}`);

  if (duplicateNumbers.length > 0) {
    console.log('\nDuplicate numbers across topic lists detected (first topic kept):');
    duplicateNumbers.slice(0, 20).forEach((d) => {
      console.log(`  #${d.number}: kept '${d.keptTopic}', ignored '${d.ignoredTopic}'`);
    });
    if (duplicateNumbers.length > 20) {
      console.log(`  ...and ${duplicateNumbers.length - 20} more`);
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
      const result = await upsertProblem(n, topic);
      stats[result.action] += 1;
      console.log(`${prefix} ${result.action.toUpperCase()} -> ${result.title} (${result.id})`);
    } catch (err) {
      stats.failed += 1;
      failures.push({ n, topic, error: err.message });
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
    failures.forEach((f) => console.log(`  #${f.n} (${f.topic}): ${f.error}`));
  }
  console.log('----------------------------------\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
