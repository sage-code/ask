export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return await handleApi(request, url, env);
    }

    if (!env.ASSETS?.fetch) {
      return new Response(JSON.stringify({ error: 'Static asset binding not configured. Check wrangler.toml.' }), {
        status: 500,
        headers: jsonHeaders()
      });
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.startsWith('/api/')) {
      return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }

    return response;
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
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      }
    });
  }
  if (request.method === 'POST' && path === '/register') {
    return handleRegister(request, env);
  }
  if (request.method === 'POST' && path === '/login') {
    return handleLogin(request, env);
  }
  if (request.method === 'POST' && path === '/results') {
    return handleResults(request, env);
  }
  if (request.method === 'GET' && path === '/results') {
    return handleGetResults(url, env);
  }
  if (request.method === 'GET' && path === '/results/public') {
    return handleGetPublicResults(url, env);
  }
  if (request.method === 'GET' && path === '/quizzes') {
    return handleGetQuizzes(request, env);
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

async function ensureUserSchema(env) {
  if (!env.DATABASE) {
    throw new Error('D1 database binding is not configured.');
  }

  try {
    await env.DATABASE.prepare('ALTER TABLE users ADD COLUMN password_hash TEXT').run();
  } catch (_error) {
    // ignore if the column already exists
  }

  try {
    await env.DATABASE.prepare('ALTER TABLE users ADD COLUMN discord_username TEXT').run();
  } catch (_error) {
    // ignore if the column already exists
  }

  try {
    await env.DATABASE.prepare('ALTER TABLE users ADD COLUMN profile_url TEXT').run();
  } catch (_error) {
    // ignore if the column already exists
  }
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function handleRegister(request, env) {
  await ensureUserSchema(env);
  const body = await parseJson(request);
  const { email, name, password, discordUsername, profileUrl } = body;
  if (!email || !name || !password) {
    return new Response(JSON.stringify({ error: 'Email, name, and password are required.' }), { status: 400, headers: jsonHeaders() });
  }
  if (typeof password !== 'string' || password.length <= 4) {
    return new Response(JSON.stringify({ error: 'Password must be longer than 4 characters.' }), { status: 400, headers: jsonHeaders() });
  }

  const db = env.DATABASE;
  const existing = await db.prepare('SELECT id, email, name FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return new Response(JSON.stringify({ error: 'This email is already registered.' }), { status: 409, headers: jsonHeaders() });
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await db.prepare('INSERT INTO users (id, email, name, password_hash, discord_username, profile_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(userId, email, name, passwordHash, discordUsername || null, profileUrl || null, new Date().toISOString())
    .run();

  return new Response(JSON.stringify({
    user: { id: userId, email, name, discordUsername: discordUsername || '', profileUrl: profileUrl || '' },
    token: `sage-${userId}`
  }), { status: 201, headers: jsonHeaders() });
}

async function handleLogin(request, env) {
  await ensureUserSchema(env);
  const body = await parseJson(request);
  const { email, password } = body;
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required.' }), { status: 400, headers: jsonHeaders() });
  }

  const db = env.DATABASE;
  const user = await db.prepare('SELECT id, email, name, discord_username, profile_url FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    return new Response(JSON.stringify({ error: 'No account exists for that email.' }), { status: 404, headers: jsonHeaders() });
  }

  const passwordHash = await hashPassword(password);
  if (user.password_hash !== passwordHash) {
    return new Response(JSON.stringify({ error: 'Incorrect password.' }), { status: 401, headers: jsonHeaders() });
  }

  return new Response(JSON.stringify({
    user: { id: user.id, email: user.email, name: user.name, discordUsername: user.discord_username || '', profileUrl: user.profile_url || '' },
    token: `sage-${user.id}`
  }), { status: 200, headers: jsonHeaders() });
}

async function handleResults(request, env) {
  await ensureUserSchema(env);
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
  await ensureUserSchema(env);
  const userId = url.searchParams.get('userId');
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const pageSize = Math.max(1, Math.min(50, Number(url.searchParams.get('pageSize') || 10)));
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId is required.' }), { status: 400, headers: jsonHeaders() });
  }

  const db = env.DATABASE;
  const offset = (page - 1) * pageSize;
  const rows = await db.prepare('SELECT id, quiz_id, quiz_title, score, total, answers, taken_at FROM results WHERE user_id = ? ORDER BY taken_at DESC LIMIT ? OFFSET ?').bind(userId, pageSize, offset).all();
  return new Response(JSON.stringify({ results: rows.results || [] }), { status: 200, headers: jsonHeaders() });
}

async function handleGetPublicResults(url, env) {
  await ensureUserSchema(env);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const pageSize = Math.max(1, Math.min(50, Number(url.searchParams.get('pageSize') || 10)));
  const db = env.DATABASE;
  const offset = (page - 1) * pageSize;
  const rows = await db.prepare('SELECT r.id, r.quiz_id, r.quiz_title, r.score, r.total, r.taken_at, u.name AS user_name FROM results r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.taken_at DESC LIMIT ? OFFSET ?').bind(pageSize, offset).all();
  const totalRows = await db.prepare('SELECT COUNT(*) AS total FROM results').first();
  return new Response(JSON.stringify({
    results: (rows.results || []).map((row) => ({
      id: row.id,
      quizId: row.quiz_id,
      quizTitle: row.quiz_title,
      score: row.score,
      total: row.total,
      takenAt: row.taken_at,
      userName: row.user_name || 'Anonymous'
    })),
    total: totalRows?.total || 0
  }), { status: 200, headers: jsonHeaders() });
}

async function handleGetQuizzes(request, env) {
  await ensureUserSchema(env);
  const db = env.DATABASE;
  const catalogResponse = await env.ASSETS.fetch(new Request(new URL('/quizzes/index.json', request.url), request));
  if (!catalogResponse.ok) {
    return new Response(JSON.stringify({ quizzes: [] }), { status: 200, headers: jsonHeaders() });
  }
  const catalog = await catalogResponse.json();
  const counts = await db.prepare('SELECT quiz_id, COUNT(*) AS taker_count FROM results GROUP BY quiz_id').all();
  const countMap = Object.fromEntries((counts.results || []).map((row) => [row.quiz_id, Number(row.taker_count)]));
  const quizzes = (catalog.quizzes || []).map((quiz) => ({
    ...quiz,
    takerCount: countMap[quiz.slug] || 0
  }));
  return new Response(JSON.stringify({ quizzes }), { status: 200, headers: jsonHeaders() });
}
