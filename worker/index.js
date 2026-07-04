export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, url, env);
    }
    if (env.__STATIC_CONTENT) {
      return env.__STATIC_CONTENT.fetch(request);
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: jsonHeaders() });
  }
};

async function handleApi(request, url, env) {
  const path = url.pathname.replace('/api', '');
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...jsonHeaders(),
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  if (request.method === 'POST' && path === '/register') {
    return handleRegister(request, env);
  }
  if (request.method === 'POST' && path === '/results') {
    return handleResults(request, env);
  }
  if (request.method === 'GET' && path === '/results') {
    return handleGetResults(url, env);
  }
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: jsonHeaders() });
}

function jsonHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
}

function parseJson(request) {
  return request.json();
}

async function handleRegister(request, env) {
  const body = await parseJson(request);
  const { email, name, role } = body;
  if (!email || !name || !role) {
    return new Response(JSON.stringify({ error: 'Email, name, and role are required.' }), { status: 400, headers: jsonHeaders() });
  }

  const db = env.DATABASE;
  const existing = await db.prepare('SELECT id, email, name, role FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return new Response(JSON.stringify(existing), { status: 200, headers: jsonHeaders() });
  }

  const userId = crypto.randomUUID();
  await db.prepare('INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(userId, email, name, role, new Date().toISOString())
    .run();

  return new Response(JSON.stringify({ id: userId, email, name, role }), { status: 201, headers: jsonHeaders() });
}

async function handleResults(request, env) {
  const body = await parseJson(request);
  const { userId, quizId, score, total, answers, quizTitle } = body;
  if (!userId || !quizId || typeof score !== 'number' || typeof total !== 'number') {
    return new Response(JSON.stringify({ error: 'Missing required result fields.' }), { status: 400, headers: jsonHeaders() });
  }

  const db = env.DATABASE;
  const resultId = crypto.randomUUID();
  const takenAt = new Date().toISOString();
  await db.prepare('INSERT INTO results (id, user_id, quiz_id, quiz_title, score, total, answers, taken_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(resultId, userId, quizId, quizTitle, score, total, JSON.stringify(answers), takenAt)
    .run();

  return new Response(JSON.stringify({ id: resultId, userId, quizId, score, total, takenAt }), { status: 201, headers: jsonHeaders() });
}

async function handleGetResults(url, env) {
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId is required.' }), { status: 400, headers: jsonHeaders() });
  }

  const db = env.DATABASE;
  const rows = await db.prepare('SELECT id, quiz_id, quiz_title, score, total, answers, taken_at FROM results WHERE user_id = ? ORDER BY taken_at DESC LIMIT 10').bind(userId).all();
  return new Response(JSON.stringify({ results: rows.results || [] }), { status: 200, headers: jsonHeaders() });
}
