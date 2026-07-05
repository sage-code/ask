<script>
  import { onMount } from 'svelte';

  let view = 'home';
  let navOpen = false;
  let authUser = null;
  let authToken = '';
  let quizzes = [];
  let currentQuiz = null;
  let currentQuizSlug = 'programming-basics';
  let currentQuestionIndex = 0;
  let selectedOption = null;
  let answers = [];
  let quizMessage = '';
  let quizBusy = false;
  let publicResults = [];
  let personalResults = [];
  let publicPage = 1;
  let publicPageSize = 10;
  let publicTotal = 0;
  let publicHasMore = false;
  let appMessage = '';
  let appBusy = false;
  let authStatus = 'Sign in to save progress and view your own results.';
  let loginForm = { email: '', password: '' };
  let registerForm = { name: '', email: '', password: '', confirmPassword: '', discordUsername: '', profileUrl: '' };
  let showLoginPassword = false;
  let showRegisterPassword = false;
  let showConfirmPassword = false;

  onMount(() => {
    const saved = localStorage.getItem('sage-quiz-session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        authUser = parsed.user ?? null;
        authToken = parsed.token ?? '';
        if (authUser) {
          authStatus = `Welcome back, ${authUser.name}.`;
        }
      } catch (_error) {
        localStorage.removeItem('sage-quiz-session');
      }
    }

    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get('quiz');
    if (querySlug) {
      currentQuizSlug = querySlug;
    }
    const requestedView = params.get('view');
    if (requestedView) {
      view = requestedView;
    }

    loadQuizzes();
    loadPublicResults();
    if (authUser) {
      loadPersonalResults();
    }
  });

  function persistSession(session) {
    localStorage.setItem('sage-quiz-session', JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem('sage-quiz-session');
    authUser = null;
    authToken = '';
    authStatus = 'Sign in to save progress and view your own results.';
  }

  function setView(nextView) {
    view = nextView;
    navOpen = false;
    const params = new URLSearchParams(window.location.search);
    if (nextView === 'home') {
      params.delete('view');
    } else {
      params.set('view', nextView);
    }
    if (currentQuizSlug) {
      params.set('quiz', currentQuizSlug);
    }
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', nextUrl);
  }

  async function loadQuizzes() {
    try {
      const response = await fetch('/api/quizzes');
      if (!response.ok) throw new Error('Unable to load quizzes.');
      const data = await response.json();
      quizzes = data.quizzes || [];
    } catch (error) {
      appMessage = error.message;
    }
  }

  async function loadPublicResults(page = 1) {
    publicPage = page;
    try {
      const response = await fetch(`/api/results/public?page=${page}&pageSize=${publicPageSize}`);
      if (!response.ok) throw new Error('Unable to load public results.');
      const data = await response.json();
      publicResults = data.results || [];
      publicTotal = data.total || 0;
      publicHasMore = page * publicPageSize < publicTotal;
    } catch (error) {
      appMessage = error.message;
    }
  }

  async function loadPersonalResults() {
    if (!authUser) return;
    try {
      const response = await fetch(`/api/results?userId=${encodeURIComponent(authUser.id)}`);
      if (!response.ok) return;
      const data = await response.json();
      personalResults = data.results || [];
    } catch (_error) {
      personalResults = [];
    }
  }

  async function loadQuiz(slug) {
    quizBusy = true;
    quizMessage = 'Loading quiz…';
    try {
      const response = await fetch(`/quizzes/${slug}.json`);
      if (!response.ok) throw new Error('That quiz is not available right now.');
      currentQuiz = await response.json();
      currentQuestionIndex = 0;
      selectedOption = null;
      answers = [];
      quizMessage = '';
    } catch (error) {
      currentQuiz = null;
      quizMessage = error.message;
    } finally {
      quizBusy = false;
    }
  }

  function startQuiz(slug) {
    if (!authUser) {
      view = 'login';
      appMessage = 'Please sign in before starting a quiz.';
      return;
    }
    currentQuizSlug = slug;
    view = 'quiz';
    loadQuiz(slug);
    const params = new URLSearchParams(window.location.search);
    params.set('quiz', slug);
    params.set('view', 'quiz');
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }

  function selectOption(index) {
    selectedOption = index;
  }

  async function submitAnswer() {
    if (!currentQuiz) return;
    if (selectedOption === null) {
      quizMessage = 'Choose an answer before continuing.';
      return;
    }

    answers[currentQuestionIndex] = selectedOption;
    selectedOption = null;
    currentQuestionIndex += 1;

    if (currentQuestionIndex >= currentQuiz.questions.length) {
      await submitResults();
    }
  }

  async function submitResults() {
    if (!authUser) {
      quizMessage = 'Please sign in or register before saving your result.';
      return;
    }

    if (!currentQuiz) return;

    const score = currentQuiz.questions.reduce((sum, question, index) => {
      return sum + (question.correct === answers[index] ? 1 : 0);
    }, 0);

    quizBusy = true;
    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.id,
          quizId: currentQuiz.slug,
          score,
          total: currentQuiz.questions.length,
          answers,
          quizTitle: currentQuiz.title
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save your result.');
      quizMessage = 'Quiz complete. Your result is now on the leaderboard.';
      await loadPersonalResults();
      await loadPublicResults(publicPage);
    } catch (error) {
      quizMessage = error.message;
    } finally {
      quizBusy = false;
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    appBusy = true;
    appMessage = '';
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email.trim(), password: loginForm.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed.');
      authUser = data.user;
      authToken = data.token;
      authStatus = `Welcome back, ${authUser.name}.`;
      persistSession({ user: authUser, token: authToken });
      loginForm = { email: '', password: '' };
      await loadPersonalResults();
      setView('quizzes');
    } catch (error) {
      appMessage = error.message;
    } finally {
      appBusy = false;
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    appBusy = true;
    appMessage = '';
    if (registerForm.password.length <= 4) {
      appMessage = 'Password must be longer than 4 characters.';
      appBusy = false;
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      appMessage = 'Passwords do not match.';
      appBusy = false;
      return;
    }
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name.trim(),
          email: registerForm.email.trim(),
          password: registerForm.password,
          discordUsername: registerForm.discordUsername.trim(),
          profileUrl: registerForm.profileUrl.trim()
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed.');
      authUser = data.user;
      authToken = data.token;
      authStatus = `Welcome, ${authUser.name}.`;
      persistSession({ user: authUser, token: authToken });
      registerForm = { name: '', email: '', password: '', confirmPassword: '', discordUsername: '', profileUrl: '' };
      await loadPersonalResults();
      setView('quizzes');
    } catch (error) {
      appMessage = error.message;
    } finally {
      appBusy = false;
    }
  }

  function resetQuiz() {
    currentQuiz = null;
    currentQuestionIndex = 0;
    selectedOption = null;
    answers = [];
    quizMessage = '';
  }
</script>

<style>
  :global(body) {
    margin: 0;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: radial-gradient(circle at top, #172554 0%, #020617 55%, #01040c 100%);
    color: #f8fafc;
  }
  :global(*) {
    box-sizing: border-box;
  }
  :global(a) {
    color: inherit;
    text-decoration: none;
  }
  .app-shell {
    min-height: 100vh;
    padding: 1rem;
  }
  .app {
    max-width: 1180px;
    margin: 0 auto;
    background: rgba(2, 6, 23, 0.85);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 1.5rem;
    box-shadow: 0 20px 60px rgba(2, 8, 23, 0.45);
    overflow: hidden;
  }
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
    background: rgba(15, 23, 42, 0.95);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    font-size: 1.05rem;
  }
  .brand img {
    width: 42px;
    height: 42px;
  }
  .nav-links {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }
  .nav-links button,
  .menu-toggle {
    border: 0;
    background: transparent;
    color: #e2e8f0;
    padding: 0.7rem 0.9rem;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.95rem;
  }
  .nav-links button.active,
  .nav-links button:hover,
  .menu-toggle:hover {
    background: rgba(37, 99, 235, 0.2);
    color: white;
  }
  .menu-toggle {
    display: none;
    padding: 0.75rem;
  }
  .content {
    display: grid;
    gap: 1.25rem;
    padding: 1.25rem;
  }
  .hero,
  .panel,
  .card,
  .quiz-card,
  .table-card {
    background: linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.9));
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 1.2rem;
    padding: 1.2rem;
  }
  .hero {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 1rem;
    align-items: center;
  }
  .hero h1 {
    font-size: clamp(1.7rem, 3vw, 2.6rem);
    margin: 0 0 0.65rem;
  }
  .hero p {
    color: #cbd5e1;
    margin: 0 0 1rem;
    line-height: 1.6;
  }
  .hero .pill-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }
  .hero .pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border-radius: 999px;
    padding: 0.55rem 0.8rem;
    background: rgba(96, 165, 250, 0.15);
    color: #bfdbfe;
    font-size: 0.9rem;
  }
  .panel-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
  .stack {
    display: grid;
    gap: 1rem;
  }
  .form-grid {
    display: grid;
    gap: 0.9rem;
  }
  .field {
    display: grid;
    gap: 0.45rem;
  }
  label {
    color: #cbd5e1;
    font-size: 0.95rem;
  }
  input {
    width: 100%;
    padding: 0.8rem 0.9rem;
    border-radius: 0.8rem;
    border: 1px solid rgba(148, 163, 184, 0.22);
    background: rgba(2, 6, 23, 0.95);
    color: #f8fafc;
  }
  .password-input {
    position: relative;
  }
  .password-input button {
    position: absolute;
    right: 0.7rem;
    top: 50%;
    transform: translateY(-50%);
    border: 0;
    background: transparent;
    color: #93c5fd;
    cursor: pointer;
  }
  button.primary,
  button.secondary,
  .quiz-actions button,
  .pagination button {
    border: 0;
    border-radius: 999px;
    padding: 0.75rem 1rem;
    font-weight: 600;
    cursor: pointer;
  }
  button.primary {
    background: linear-gradient(90deg, #2563eb, #3b82f6);
    color: white;
  }
  button.secondary {
    background: rgba(148, 163, 184, 0.14);
    color: #f8fafc;
  }
  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .quiz-list {
    display: grid;
    gap: 0.9rem;
  }
  .quiz-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  .results-table {
    width: 100%;
    border-collapse: collapse;
  }
  .results-table th,
  .results-table td {
    text-align: left;
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  }
  .results-table th {
    color: #93c5fd;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .status {
    padding: 0.85rem 1rem;
    border-radius: 0.9rem;
    background: rgba(59, 130, 246, 0.12);
    color: #bfdbfe;
    border: 1px solid rgba(96, 165, 250, 0.2);
  }
  .muted {
    color: #94a3b8;
    margin: 0;
  }
  .pill-row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-top: 0.6rem;
  }
  .badge {
    padding: 0.35rem 0.65rem;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.14);
    color: #cbd5e1;
    font-size: 0.85rem;
  }
  .options {
    display: grid;
    gap: 0.7rem;
    margin-top: 0.7rem;
  }
  .option-button {
    width: 100%;
    text-align: left;
    background: rgba(15, 23, 42, 0.95);
    color: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.16);
  }
  .option-button.selected {
    outline: 2px solid #60a5fa;
  }
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.8rem;
  }
  .pagination button {
    background: rgba(148, 163, 184, 0.14);
    color: white;
  }
  @media (max-width: 860px) {
    .hero,
    .panel-grid,
    .grid-2 {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 720px) {
    .topbar {
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .menu-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .nav-links {
      display: none;
      width: 100%;
      flex-direction: column;
      align-items: stretch;
    }
    .nav-links.open {
      display: flex;
    }
    .nav-links button {
      width: 100%;
      text-align: left;
    }
  }
</style>

<div class="app-shell">
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <img src="/sage-icon.svg" alt="SageCode icon" />
        <span>Sage Quiz</span>
      </div>
      <button class="menu-toggle" type="button" on:click={() => (navOpen = !navOpen)}>☰</button>
      <nav class:open={navOpen} class="nav-links">
        <button class:active={view === 'home'} type="button" on:click={() => setView('home')}>Home</button>
        <button class:active={view === 'login'} type="button" on:click={() => setView('login')}>Login</button>
        <button class:active={view === 'register'} type="button" on:click={() => setView('register')}>Register</button>
        <button class:active={view === 'quizzes'} type="button" on:click={() => setView('quizzes')}>Quizzes</button>
        <button class:active={view === 'results'} type="button" on:click={() => setView('results')}>Results</button>
        {#if authUser}
          <button type="button" on:click={clearSession}>Logout</button>
        {/if}
      </nav>
    </header>

    <main class="content">
      {#if appMessage}
        <div class="status">{appMessage}</div>
      {/if}

      {#if view === 'home'}
        <section class="hero">
          <div>
            <h1>Learn, test yourself, and share your progress.</h1>
            <p>Welcome to Sage Quiz, a clean and modern learning space for programming and software engineering topics. Join the community, take quizzes, and watch new results appear in real time.</p>
            <div class="pill-row">
              <span class="pill">⚡ Quick sign in</span>
              <span class="pill">📚 Fresh quiz content</span>
              <span class="pill">📈 Public leaderboards</span>
            </div>
            <div class="pill-row">
              <button class="primary" type="button" on:click={() => setView('register')}>Create account</button>
              <button class="secondary" type="button" on:click={() => setView('quizzes')}>Browse quizzes</button>
            </div>
          </div>
          <div class="panel stack">
            <h3>Quick navigation</h3>
            <div class="panel-grid">
              <div class="card">
                <strong>Login</strong>
                <p class="muted">Continue where you left off with your Sage Quiz account.</p>
                <button class="secondary" type="button" on:click={() => setView('login')}>Open login</button>
              </div>
              <div class="card">
                <strong>Register</strong>
                <p class="muted">Create a profile with Discord and portfolio details.</p>
                <button class="secondary" type="button" on:click={() => setView('register')}>Join now</button>
              </div>
            </div>
          </div>
        </section>
      {/if}

      {#if view === 'login'}
        <section class="grid-2">
          <div class="panel">
            <h2>Welcome back</h2>
            <p class="muted">Use your email and password to sign in and continue your quiz journey.</p>
            <form class="form-grid" on:submit|preventDefault={handleLogin}>
              <div class="field">
                <label for="login-email">Email</label>
                <input id="login-email" type="email" bind:value={loginForm.email} placeholder="you@example.com" required />
              </div>
              <div class="field">
                <label for="login-password">Password</label>
                <div class="password-input">
                  <input id="login-password" type={showLoginPassword ? 'text' : 'password'} bind:value={loginForm.password} placeholder="Your password" required />
                  <button type="button" on:click={() => (showLoginPassword = !showLoginPassword)}>{showLoginPassword ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              <button class="primary" type="submit" disabled={appBusy}>Sign in</button>
            </form>
          </div>
          <div class="panel">
            <h3>Need an account?</h3>
            <p class="muted">Registration is quick and includes Discord and portfolio profile fields.</p>
            <button class="secondary" type="button" on:click={() => setView('register')}>Create an account</button>
          </div>
        </section>
      {/if}

      {#if view === 'register'}
        <section class="grid-2">
          <div class="panel">
            <h2>Create your account</h2>
            <p class="muted">Passwords must be longer than 4 characters. You can also share your Discord tag and profile URL.</p>
            <form class="form-grid" on:submit|preventDefault={handleRegister}>
              <div class="field">
                <label for="register-name">Full name</label>
                <input id="register-name" type="text" bind:value={registerForm.name} placeholder="Your full name" required />
              </div>
              <div class="field">
                <label for="register-email">Email</label>
                <input id="register-email" type="email" bind:value={registerForm.email} placeholder="you@example.com" required />
              </div>
              <div class="field">
                <label for="register-password">Password</label>
                <div class="password-input">
                  <input id="register-password" type={showRegisterPassword ? 'text' : 'password'} bind:value={registerForm.password} placeholder="Choose a password" required />
                  <button type="button" on:click={() => (showRegisterPassword = !showRegisterPassword)}>{showRegisterPassword ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              <div class="field">
                <label for="register-confirm">Confirm password</label>
                <div class="password-input">
                  <input id="register-confirm" type={showConfirmPassword ? 'text' : 'password'} bind:value={registerForm.confirmPassword} placeholder="Confirm password" required />
                  <button type="button" on:click={() => (showConfirmPassword = !showConfirmPassword)}>{showConfirmPassword ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              <div class="field">
                <label for="register-discord">Discord username</label>
                <input id="register-discord" type="text" bind:value={registerForm.discordUsername} placeholder="username#1234" />
              </div>
              <div class="field">
                <label for="register-profile">Profile URL</label>
                <input id="register-profile" type="url" bind:value={registerForm.profileUrl} placeholder="https://example.com" />
              </div>
              <button class="primary" type="submit" disabled={appBusy}>Create account</button>
            </form>
          </div>
          <div class="panel">
            <h3>Why join?</h3>
            <p class="muted">Track your scores, unlock the public results board, and stay connected with the SageCode community.</p>
            <div class="pill-row">
              <span class="badge">Modern UI</span>
              <span class="badge">Public results</span>
              <span class="badge">Responsive layout</span>
            </div>
          </div>
        </section>
      {/if}

      {#if view === 'quizzes'}
        <section class="stack">
          <div class="panel">
            <h2>Available quizzes</h2>
            <p class="muted">Choose a quiz to begin. Every card shows the quiz code, a short title, and how many learners have already taken it.</p>
            {#if authUser}
              <p class="muted">Signed in as {authUser.name}.</p>
            {/if}
          </div>
          <div class="quiz-list">
            {#each quizzes as quiz}
              <div class="quiz-card">
                <div>
                  <h3>{quiz.shortName || quiz.title}</h3>
                  <p class="muted">Code: {quiz.code || quiz.slug}</p>
                  <div class="pill-row">
                    <span class="badge">{quiz.takerCount || 0} taken</span>
                    <span class="badge">{quiz.title}</span>
                  </div>
                </div>
                <div class="quiz-actions">
                  <button class="primary" type="button" on:click={() => startQuiz(quiz.slug)}>Take quiz</button>
                </div>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      {#if view === 'results'}
        <section class="stack">
          <div class="panel">
            <h2>Latest results</h2>
            <p class="muted">This board is public so anyone can view recent quiz outcomes. Sign in to see your personal history.</p>
            {#if authUser}
              <p class="muted">{authStatus}</p>
            {/if}
          </div>
          <div class="table-card">
            <table class="results-table">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Person</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {#each publicResults as entry}
                  <tr>
                    <td>{entry.quizTitle}</td>
                    <td>{entry.userName}</td>
                    <td>{entry.score}/{entry.total}</td>
                    <td>{entry.takenAt}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
            <div class="pagination">
              <button type="button" disabled={publicPage === 1} on:click={() => loadPublicResults(publicPage - 1)}>Previous</button>
              <span class="muted">Page {publicPage}</span>
              <button type="button" disabled={!publicHasMore} on:click={() => loadPublicResults(publicPage + 1)}>Next</button>
            </div>
          </div>
          {#if authUser}
            <div class="table-card">
              <h3>Your recent results</h3>
              <table class="results-table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {#each personalResults as entry}
                    <tr>
                      <td>{entry.quizTitle}</td>
                      <td>{entry.score}/{entry.total}</td>
                      <td>{entry.takenAt}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </section>
      {/if}

      {#if view === 'quiz'}
        <section class="stack">
          <div class="panel">
            <h2>{currentQuiz ? currentQuiz.title : 'Loading quiz…'}</h2>
            <p class="muted">{currentQuiz ? currentQuiz.description : 'Please wait while the quiz loads.'}</p>
            {#if currentQuiz && currentQuestionIndex < currentQuiz.questions.length}
              <div class="status">
                Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
              </div>
              <p>{currentQuiz.questions[currentQuestionIndex].text}</p>
              <div class="options">
                {#each currentQuiz.questions[currentQuestionIndex].options as option, index}
                  <button class:selected={selectedOption === index} class="option-button" type="button" on:click={() => selectOption(index)}>{option}</button>
                {/each}
              </div>
              <div class="pill-row">
                <button class="primary" type="button" on:click={submitAnswer} disabled={quizBusy}>Continue</button>
                <button class="secondary" type="button" on:click={resetQuiz}>Cancel</button>
              </div>
            {:else if currentQuiz}
              <p class="muted">{quizMessage || 'Your quiz is ready to submit.'}</p>
            {/if}
            {#if quizMessage}
              <div class="status">{quizMessage}</div>
            {/if}
          </div>
        </section>
      {/if}
    </main>
  </div>
</div>
