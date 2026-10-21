const test = require('node:test');
const assert = require('node:assert/strict');

test('deployment requires both active course functions and authentication', async () => {
  const { verifyCourseFunctions } = await import('../scripts/verify-functions.mjs');
  const report = {
    status: 'success',
    result: ['getCourseContent', 'getLessonPlayback'].map((id) => ({
      id,
      project: 'demo-project',
      state: 'ACTIVE',
      uri: `https://us-central1-demo-project.cloudfunctions.net/${id}`,
    })),
  };
  let calls = 0;
  const denied = async () => {
    calls += 1;
    return { status: 401, json: async () => ({ error: { status: 'UNAUTHENTICATED' } }) };
  };
  await verifyCourseFunctions(report, 'demo-project', denied);
  assert.equal(calls, 2);
  await assert.rejects(
    verifyCourseFunctions({ ...report, result: report.result.slice(0, 1) }, 'demo-project', denied),
    /getLessonPlayback is not active/,
  );
  await assert.rejects(
    verifyCourseFunctions(report, 'another-project', denied),
    /getCourseContent is not active/,
  );
  await assert.rejects(
    verifyCourseFunctions(report, 'demo-project', async () => ({ status: 200, json: async () => ({}) })),
    /authentication check/,
  );
  await assert.rejects(
    verifyCourseFunctions(report, 'demo-project', async () => ({ status: 401, json: async () => ({}) })),
    /authentication check/,
  );
});
