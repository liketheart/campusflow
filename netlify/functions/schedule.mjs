// OPTIONAL: Claude-powered study schedule for CampusFlow.
// On Netlify (Git deploys), AI Gateway injects ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL automatically.
// If no key is available this returns 503 and the frontend falls back to the free rule-based planner.

const MODEL = 'claude-sonnet-5-5';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'Claude is not configured on this deploy' }, 503);

  let input;
  try { input = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const subjects = Array.isArray(input.subjects) ? input.subjects.slice(0, 12) : [];
  if (!subjects.length) return json({ blocks: [] });

  const prompt = `You are a study planner for a university student. Build a study schedule.

Today: ${input.today} (current time ${input.now}). Weekly study budget: ${input.weeklyHours} hours.
Allowed start times per day: ${(input.slotTimes || []).join(', ')}. Each block is 60 minutes.
Rules:
- Only schedule blocks from today onward; skip start times today that are already past.
- Never schedule a subject on or after its exam date.
- Cover each topic for roughly its estimated hours, in the listed order per subject.
- Prioritise subjects whose exams are closer and that have more remaining hours.
- Avoid more than 2 blocks of the same subject per day. Respect the weekly budget.
- Lighten load the day before assignment deadlines for other subjects.

Subjects (JSON): ${JSON.stringify(subjects)}
Deadlines (JSON): ${JSON.stringify(input.deadlines || [])}

Respond with ONLY a JSON array, no prose, like:
[{"date":"YYYY-MM-DD","start":"HH:MM","minutes":60,"topicId":"<topic id>"}]`;

  try {
    const base = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
    const res = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) return json({ error: `Claude request failed (${res.status})` }, 502);
    const data = await res.json();
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    const match = text.match(/\[[\s\S]*\]/);
    const blocks = match ? JSON.parse(match[0]) : [];
    return json({ blocks: Array.isArray(blocks) ? blocks.slice(0, 200) : [] });
  } catch (err) {
    return json({ error: 'Could not generate schedule' }, 502);
  }
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const config = { path: '/api/schedule' };
