// Bulk-add LeetCode array problems to Firestore
// Usage: node models/bulkAddArrayProblems.js
// Add --dry-run to preview without writing  |  --start=N to resume from index N

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { db } = require('../utils/firebase');
const { fetchByProblemNumber } = require('../services/leetcodeService');

const PROBLEM_NUMBERS = [
  1295, 3232, 3452, 3285, 3467, 1979, 3206, 3423, 268,  3162,
  3131, 1551, 3745, 3264, 1929, 3591, 283,  26,   27,   136,
  628,  485,  75,   35,   3512, 540,  724,  908,  747,  169,
  905,  1013, 1089, 977,  33,   34,   217,  896,  66,   414,
  2154, 121,  122,  496,  189,  238,  162,  229,  1,    1814,
  287,  215,  860,  2073, 80,   881,  134,  11,   88,   4,
  53,   78,   319,  198,  55,   877,  164,  15,   118,  119,
  349,  350,  473,
];

const DELAY_MS = 2500;      // gap between LeetCode requests
const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 8000;

const DRY_RUN = process.argv.includes('--dry-run');
const START_ARG = process.argv.find((a) => a.startsWith('--start='));
const START_INDEX = START_ARG ? parseInt(START_ARG.split('=')[1], 10) : 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getExistingLeetcodeIds() {
  const snap = await db.collection('problems')
    .where('source', '==', 'leetcode')
    .select('leetcodeId', 'sourceUrl', 'title')
    .get();
  const ids = new Set();
  snap.forEach((doc) => {
    const d = doc.data();
    if (d.leetcodeId) ids.add(String(d.leetcodeId));
    if (d.sourceUrl) ids.add(d.sourceUrl.replace(/\/$/, ''));
  });
  return ids;
}

async function fetchWithRetry(number, attempt = 1) {
  try {
    return await fetchByProblemNumber(number);
  } catch (err) {
    if (attempt < RETRY_LIMIT && (
      err.response?.status === 429 ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'ECONNRESET'
    )) {
      const wait = RETRY_DELAY_MS * attempt;
      console.log(`  ⚠️  Rate-limited / timeout. Retrying #${number} in ${wait / 1000}s (attempt ${attempt + 1}/${RETRY_LIMIT})...`);
      await sleep(wait);
      return fetchWithRetry(number, attempt + 1);
    }
    throw err;
  }
}

async function run() {
  console.log(`\n🚀 Bulk Array Problems Import`);
  console.log(`   Total:   ${PROBLEM_NUMBERS.length} problems`);
  console.log(`   Start:   index ${START_INDEX}`);
  console.log(`   Dry run: ${DRY_RUN}\n`);

  const existing = await getExistingLeetcodeIds();
  console.log(`   Already in Firestore: ${existing.size} LeetCode problems\n`);

  const stats = { added: 0, skipped: 0, failed: 0 };
  const failed = [];

  for (let i = START_INDEX; i < PROBLEM_NUMBERS.length; i++) {
    const num = PROBLEM_NUMBERS[i];
    const prefix = `[${i + 1}/${PROBLEM_NUMBERS.length}] #${num}`;

    try {
      console.log(`${prefix} Fetching...`);
      const data = await fetchWithRetry(num);

      const normalizedUrl = (data.leetcodeUrl || '').replace(/\/$/, '');
      const lcId = String(data.leetcodeId || '');

      if (existing.has(lcId) || (normalizedUrl && existing.has(normalizedUrl))) {
        console.log(`${prefix} ✅ Already exists — skipped (${data.title})`);
        stats.skipped++;
      } else if (DRY_RUN) {
        console.log(`${prefix} 🔍 DRY RUN — would add: "${data.title}" (${data.difficulty}, ${data.topic})`);
        stats.added++;
      } else {
        const doc = {
          title: data.title,
          difficulty: data.difficulty,
          topic: data.topic || 'Arrays',
          source: 'leetcode',
          sourceUrl: data.leetcodeUrl || '',
          leetcodeId: lcId,
          description: data.description || '',
          examples: data.examples || [],
          constraints: data.constraints || [],
          hints: data.hints || [],
          starterCode: data.starterCode || {},
          testCases: [],
          createdAt: new Date(),
        };
        const ref = await db.collection('problems').add(doc);
        existing.add(normalizedUrl);
        if (lcId) existing.add(lcId);
        console.log(`${prefix} ✔  Added: "${data.title}" → ${ref.id}`);
        stats.added++;
      }
    } catch (err) {
      console.error(`${prefix} ✗  FAILED: ${err.message}`);
      stats.failed++;
      failed.push({ num, error: err.message });
    }

    if (i < PROBLEM_NUMBERS.length - 1) await sleep(DELAY_MS);
  }

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Added:   ${stats.added}`);
  console.log(`⏭  Skipped: ${stats.skipped}`);
  console.log(`❌ Failed:  ${stats.failed}`);
  if (failed.length) {
    console.log('\nFailed problems:');
    failed.forEach(({ num, error }) => console.log(`  #${num}: ${error}`));
    console.log('\nRe-run with:');
    const failedNums = failed.map((f) => f.num).join(', ');
    console.log(`  (manually set PROBLEM_NUMBERS to [${failedNums}] and run again)`);
  }
  console.log('─────────────────────────────────────\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
