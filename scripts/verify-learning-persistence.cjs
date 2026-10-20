// Run with: node scripts/verify-learning-persistence.cjs
// Actual course-progress and learn.js functions execute against an in-memory
// storage adapter. This never opens a browser or touches learner storage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const progressSource = fs.readFileSync(path.join(root, 'ui/course-progress.js'), 'utf8');
const learnSource = fs.readFileSync(path.join(root, 'ui/learn.js'), 'utf8');
const mergeStart = learnSource.indexOf('function quizAttempt(');
const mergeEnd = learnSource.indexOf('function names()', mergeStart);
assert(mergeStart >= 0 && mergeEnd > mergeStart, 'Locate the actual persistence functions');
const learningDoneSource = learnSource.match(/^function learningDone\(\).*$/m)[0];
const resetSource = learnSource.match(/^function resetPractice\(\).*$/m)[0];
const storageSource = learnSource.match(/^ window\.addEventListener\('storage'.*$/m)[0];
const testedSource = [learningDoneSource, learnSource.slice(mergeStart, mergeEnd), resetSource, storageSource].join('\n');
const plain = value => JSON.parse(JSON.stringify(value));
const initial = () => ({stage: 0, question: 0, answers: [], quizReview: false, gameIndex: 0,
  gameResults: [], readingPercent: 0, readingOffset: 0});
const training = (level, demo = false, completedAt = 100) => ({level, demo, stars: 3, mistakes: 0, seconds: 24, completedAt});
const key = 'et_courseflow:bev:motor';

function tab(store) {
  let writes = 0;
  const handlers = {};
  const context = vm.createContext({
    window: {addEventListener: (name, callback) => { handlers[name] = callback; }},
    localStorage: {
      getItem: name => store.get(name) ?? null,
      setItem: (name, value) => { writes++; store.set(name, String(value)); }
    },
    location: {reload() { throw new Error('Unexpected session reload'); }},
    updateProgress() {}, vehicle: 'bev'
  });
  vm.runInContext(progressSource, context);
  context.CourseProgress = context.window.CourseProgress;
  context.courseInfo = context.CourseProgress.meta('bev', 'motor');
  context.course = {partId: 'motor', games: plain(context.courseInfo.games),
    quiz: Array.from({length: context.courseInfo.quizTotal}, () => ({opts: ['A', 'B', 'C', 'D']}))};
  context.storageKey = context.CourseProgress.key('bev', 'motor');
  context.record = {...initial(), ...(plain(context.CourseProgress.get('bev', 'motor')) || {})};
  context.setStage = stage => { context.record.stage = stage; context.save(); };
  vm.runInContext(testedSource, context);
  return {context, save: () => context.save(), reset: () => context.resetPractice(),
    storage: () => handlers.storage({key}), get record() { return context.record; }, get writes() { return writes; }};
}
const stored = store => JSON.parse(store.get(key));
const passed = [];
function check(name, test) { test(); passed.push(name); }

check('A partial quiz survives a stale B reading save without moving B', () => {
  const store = new Map(), a = tab(store), b = tab(store);
  Object.assign(a.record, {read: true, readingPercent: 100, answers: [1, 2, 3], question: 3, stage: 1}); a.save();
  Object.assign(b.record, {readingPercent: 35, readingOffset: 417}); b.save();
  assert.deepEqual(stored(store).answers, [1, 2, 3]);
  assert.deepEqual([b.record.stage, b.record.question, b.record.readingOffset], [0, 0, 417]);
  assert.equal(stored(store).readingPercent, 100);
  assert.equal(b.context.CourseProgress.status('bev', 'motor').percent, 58);
});

check('Same-attempt missing answers merge at their original question positions', () => {
  const store = new Map(), a = tab(store), b = tab(store);
  Object.assign(a.record, {read: true, answers: [1, null, 3]}); a.save();
  Object.assign(b.record, {answers: [null, 2], question: 1}); b.save();
  assert.deepEqual(stored(store).answers, [1, 2, 3]);
  assert.equal(b.record.question, 1);
});

check('Completed learning and real training survive stale scrolling and answering', () => {
  const store = new Map(), a = tab(store), b = tab(store);
  Object.assign(a.record, {read: true, readingPercent: 100, answers: Array(10).fill(1), quizReview: true}); a.save();
  const result = a.context.CourseProgress.recordTraining('bev', 'motor', training('motor'));
  assert(result); a.record.gameResults = result.gameResults; a.save();
  Object.assign(b.record, {answers: [2], stage: 1, question: 1, readingOffset: 222}); b.save();
  const progress = b.context.CourseProgress.status('bev', 'motor');
  assert.equal(progress.percent, 100); assert.equal(progress.learningCompleted, true);
  assert.equal(progress.trainingDone, 1); assert.equal(progress.completed, false);
  assert.equal(stored(store).gameResults[0].demo, false);
  assert.deepEqual([b.record.stage, b.record.question, b.record.readingOffset], [1, 1, 222]);
  a.context.CourseProgress.recordTraining('bev', 'motor', training('resolver')); b.save();
  assert.equal(b.context.CourseProgress.status('bev', 'motor').completed, true);
});

check('A newer demo cannot replace real training; newer real evidence wins ties', () => {
  const store = new Map([[key, JSON.stringify({...initial(), read: true, learningCompleted: true,
    gameResults: [training('motor', false, 500)]})]]), b = tab(store);
  b.record.gameResults = [training('motor', true, 10000)]; b.save();
  assert.equal(stored(store).gameResults[0].demo, false);
  assert.equal(stored(store).gameResults[0].completedAt, 500);
  b.record.gameResults = [training('motor', false, 100)]; b.save();
  assert.equal(stored(store).gameResults[0].completedAt, 500);
  b.record.gameResults = [training('motor', false, 700)]; b.save();
  assert.equal(stored(store).gameResults[0].completedAt, 700);
});

check('Explicit redo starts an empty attempt while preserving completed credentials', () => {
  const store = new Map([[key, JSON.stringify({...initial(), read: true, learningCompleted: true,
    readingPercent: 100, answers: Array(10).fill(1), quizReview: true,
    gameResults: [training('motor')]})]]), a = tab(store);
  a.reset();
  const value = stored(store);
  assert(value.quizAttempt > 0); assert.deepEqual(value.answers, []);
  assert.equal(value.quizReview, false); assert.equal(value.learningCompleted, true);
  assert.equal(value.gameResults[0].demo, false); assert.equal(a.record.stage, 1);
});

check('An old tab cannot repopulate a newer redo or erase its partial answers', () => {
  const store = new Map([[key, JSON.stringify({...initial(), read: true, readingPercent: 100,
    answers: [1, 1, 1], question: 3})]]), old = tab(store), fresh = tab(store);
  fresh.reset(); fresh.record.answers = [2]; fresh.save();
  const attempt = stored(store).quizAttempt;
  Object.assign(old.record, {stage: 0, question: 3, readingOffset: 555}); old.save();
  assert.equal(stored(store).quizAttempt, attempt); assert.deepEqual(stored(store).answers, [2]);
  assert.equal(stored(store).quizReview, false);
  assert.deepEqual([old.record.stage, old.record.question, old.record.readingOffset], [0, 3, 555]);
  assert.deepEqual(plain(old.record.answers), [1, 1, 1]);
  fresh.record.answers.push(3); fresh.save(); assert.deepEqual(stored(store).answers, [2, 3]);
});

check('Storage notification merges evidence without a write loop or page jump', () => {
  const store = new Map(), a = tab(store), b = tab(store);
  Object.assign(a.record, {read: true, readingPercent: 100, answers: Array(10).fill(1), quizReview: true}); a.save();
  a.context.CourseProgress.recordTraining('bev', 'motor', training('motor'));
  Object.assign(b.record, {stage: 0, question: 2, readingOffset: 321});
  const writes = b.writes; b.storage();
  assert.equal(b.writes, writes); assert.equal(b.record.learningCompleted, true);
  assert.equal(b.record.gameResults[0].demo, false);
  assert.deepEqual([b.record.stage, b.record.question, b.record.readingOffset], [0, 2, 321]);
});

console.log(passed.map(name => 'PASS ' + name).join('\n'));
console.log(`All ${passed.length} persistence regression checks passed (in-memory VM only).`);
