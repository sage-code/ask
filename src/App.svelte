<script>
  import { onMount } from 'svelte';

  let email = '';
  let name = '';
  let role = 'student';
  let user = null;
  let quiz = null;
  let quizSlug = 'programming-basics';
  let current = 0;
  let selected = null;
  let answers = [];
  let message = '';
  let results = null;
  let loading = false;
  let shareUrl = '';

  async function loadQuiz() {
    try {
      const response = await fetch(`/quizzes/${quizSlug}.json`);
      if (!response.ok) throw new Error('Quiz not found');
      quiz = await response.json();
      shareUrl = `${window.location.origin}?quiz=${quiz.slug}`;
      resetState();
    } catch (_error) {
      message = 'Unable to load quiz data. Please refresh or try another quiz.';
      quiz = null;
    }
  }

  function resetState() {
    current = 0;
    selected = null;
    answers = [];
    results = null;
    message = '';
  }

  async function register(event) {
    event.preventDefault();
    message = '';
    if (!email || !name) {
      message = 'Name and email are required.';
      return;
    }
    loading = true;
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      user = data;
      await fetchResults();
    } catch (error) {
      message = error.message;
    } finally {
      loading = false;
    }
  }

  async function submitAnswer() {
    if (selected === null) {
      message = 'Please choose an answer before continuing.';
      return;
    }
    answers[current] = selected;
    selected = null;
    current += 1;
    if (current >= quiz.questions.length) {
      await submitResults();
    }
  }

  async function submitResults() {
    const score = quiz.questions.reduce((sum, question, index) => {
      return sum + (question.correct === answers[index] ? 1 : 0);
    }, 0);

    const result = {
      userId: user.id,
      quizId: quiz.slug,
      score,
      total: quiz.questions.length,
      answers,
      quizTitle: quiz.title
    };

    loading = true;
    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save results');
      results = data;
      message = 'Quiz completed. Your result was saved.';
    } catch (error) {
      message = error.message;
    } finally {
      loading = false;
    }
  }

  async function fetchResults() {
    if (!user) return;
    try {
      const response = await fetch(`/api/results?userId=${encodeURIComponent(user.id)}`);
      if (!response.ok) return;
      const data = await response.json();
      results = data.results || null;
    } catch (_error) {
      results = null;
    }
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get('quiz');
    if (querySlug) {
      quizSlug = querySlug;
    }
    loadQuiz();
  });
</script>

<style>
  :global(body) {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: #0f172a;
    color: #f8fafc;
  }
  .app {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1.5rem;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid #334155;
    border-radius: 1rem;
  }
  .field {
    margin-bottom: 1rem;
  }
  button {
    background: #2563eb;
    color: white;
    border: none;
    padding: 0.9rem 1.4rem;
    border-radius: 0.7rem;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
  input,
  select {
    width: 100%;
    padding: 0.85rem;
    border-radius: 0.65rem;
    border: 1px solid #334155;
    background: #0f172a;
    color: #f8fafc;
  }
  .option {
    background: #1e293b;
    padding: 0.9rem;
    border-radius: 0.85rem;
    margin-bottom: 0.75rem;
    cursor: pointer;
  }
  .option.selected {
    border: 1px solid #93c5fd;
  }
  .status {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 0.75rem;
    background: #1e293b;
  }
  a {
    color: #93c5fd;
  }
</style>

<div class="app">
  <h1>{quiz ? quiz.title : 'Ask Quiz'}</h1>
  <p>{quiz ? quiz.description : 'Loading quiz...'}</p>

  {#if !user}
    <section>
      <h2>Register</h2>
      <form on:submit={register}>
        <div class="field">
          <label for="name">Name</label>
          <input id="name" type="text" bind:value={name} placeholder="Your full name" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" bind:value={email} placeholder="you@example.com" />
        </div>
        <div class="field">
          <label for="role">Role</label>
          <select id="role" bind:value={role}>
            <option value="student">Student</option>
            <option value="mentor">Mentor</option>
          </select>
        </div>
        <button type="submit" disabled={loading}>Register</button>
      </form>
    </section>
  {:else if quiz}
    <section>
      <div class="status">
        <strong>Signed in as:</strong> {user.name} ({user.role})
        <br />
        <strong>Quiz URL:</strong>
        <a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a>
      </div>

      {#if results}
        <div class="status">
          <p><strong>Latest result:</strong></p>
          <p>{results.score}/{results.total} correct for {results.quizTitle}</p>
          <p>Taken at {results.takenAt}</p>
        </div>
      {/if}

      {#if current < quiz.questions.length}
        <div>
          <h2>Question {current + 1} of {quiz.questions.length}</h2>
          <p>{quiz.questions[current].text}</p>

          {#each quiz.questions[current].options as option, index}
            <button
              type="button"
              class="option {selected === index ? 'selected' : ''}"
              on:click={() => { selected = index; message = '' }}
            >
              {option}
            </button>
          {/each}

          <button type="button" on:click={submitAnswer} disabled={loading}>Continue</button>
        </div>
      {:else}
        <div class="status">
          <p>Your submission is being processed.</p>
        </div>
      {/if}
    </section>
  {/if}

  {#if message}
    <div class="status">{message}</div>
  {/if}
</div>
