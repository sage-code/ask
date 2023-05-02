<script>
  import { onMount } from 'svelte';

  let quizzes = [];
  let selectedQuiz = '';
  let showModal = false;
  let currentQuestionIndex = 0;
  let currentQuestion = '';

  function loadQuizzes() {
    fetch('/quizzes')
      .then(res => res.json())
      .then(data => {
        quizzes = data;
        selectedQuiz = data[0]; // set initial selection to first quiz
      })
      .catch(err => console.error(err));
  }

  function startQuiz() {
    showModal = true;
    currentQuestionIndex = 0; // reset question index when starting a new quiz
    loadQuestions();
  }

  function loadQuestions() {
    fetch(`/quizzes/${selectedQuiz.id}/questions`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          currentQuestion = data[currentQuestionIndex];
        }
      })
      .catch(err => console.error(err));
  }

  function selectQuiz(event) {
    const selectedIndex = event.currentTarget.selectedIndex;
    selectedQuiz = quizzes[selectedIndex];
    currentQuestionIndex = 0; // reset question index when selecting a new quiz
    loadQuestions();
  }

  function nextQuestion() {
    currentQuestionIndex++;
    loadQuestions();
  }

  function prevQuestion() {
    currentQuestionIndex--;
    loadQuestions();
  }

  function closeQuiz() {
    showModal = false;
  }

  onMount(() => {
    loadQuizzes();
  });
</script>

<main>
  <h1>Welcome to the Quiz App!</h1>

  <table>
    <thead>
      <tr>
        <th>Quiz ID</th>
        <th>Quiz Name</th>
      </tr>
    </thead>
    <tbody>
      {#each quizzes as quiz}
        <tr>
          <td>{quiz.id}</td>
          <td>{quiz.name}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <button on:click={startQuiz}>Start Quiz</button>

  {#if showModal}
    <div class="quiz-modal">
      <h2>{currentQuestion.question}</h2>
      <ul>
        {#each currentQuestion.answers as answer}
          <li>{answer}</li>
        {/each}
      </ul>
      <button on:click={nextQuestion}>Next Question</button>
      <button on:click={prevQuestion}>Previous Question</button>
      <button on:click={closeQuiz}>Close Quiz</button>
    </div>
  {/if}

  <select on:change={selectQuiz}>
    {#each quizzes as quiz}
      <option value={quiz.id}>{quiz.name}</option>
    {/each}
  </select>
</main>

<style>
  table {
    border-collapse: collapse;
    margin-bottom: 1rem;
  }

  th, td {
    padding: 0.5rem;
    border: 1px solid black;
  }

  .quiz-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 1rem;
    border: 1px solid black;
    background-color: white;
    z-index: 1000;
  }
</style>