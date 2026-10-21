import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export async function verifyCourseFunctions(report, project, request = fetch) {
  if (!project || report.status !== 'success' || !Array.isArray(report.result))
    throw new Error('Invalid deployed functions report');
  for (const id of ['getCourseContent', 'getLessonPlayback']) {
    const endpoint = report.result.find((item) => item.id === id && item.project === project);
    if (endpoint?.state !== 'ACTIVE' || !endpoint.uri)
      throw new Error(`${id} is not active`);
    const url = new URL(endpoint.uri);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.cloudfunctions.net'))
      throw new Error(`${id} has an unexpected endpoint`);
    const response = await request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: {} }),
      signal: AbortSignal.timeout(30000),
    });
    const body = await response.json();
    if (response.status !== 401 || body.error?.status !== 'UNAUTHENTICATED')
      throw new Error(`${id} failed the authentication check`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  await verifyCourseFunctions(report, process.env.FIREBASE_PROJECT_ID);
  process.stdout.write('Course functions are active and require authentication.\n');
}
