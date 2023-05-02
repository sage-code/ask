## Structure

Sure, here is a sample project structure that you can use as a starting point for creating a Quiz app using Svelte, MariaDB, and Rails:

```
quiz-app/
├── backend/
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── api/
│   │   │   │   ├── questions_controller.rb
│   │   ├── models/
│   │   │   ├── question.rb
│   │   ├── views/
│   │   ├── helpers.rb
│   │   ├── app.rb
│   ├── db/
│   │   ├── migrate/
│   │   │   ├── ruby_quiz.rb
│   │   ├── schema.rb
│   ├── config/
│   │   ├── database.yml
│   ├── public/
│   ├── Gemfile
│   ├── Gemfile.lock
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Quiz.svelte
│   │   ├── routes/
│   │   ├── main.js
│   ├── package.json
│   ├── rollup.config.js
├── docker-compose.yml
```

In this structure, the backend of the Quiz app is written in Rails, while the frontend is built with Svelte. MariaDB is used as the database to store the questions.

- The `backend/` directory contains the entire Rails application, including the controllers, models, views, and helpers needed to build the API endpoints required for the Quiz app. Additionally, it contains the `db/` directory, which contains the database schema and migration files for MariaDB, as well as the `config/` directory with the database configuration file `database.yml`.
- The `frontend/` directory contains the Svelte application code that will fetch the questions from the Rails backend API and render them in the Quiz component. It includes a `src/` directory with the Svelte components and routes, as well as a `public/` directory with static files.
- In the `docker-compose.yml` file, you can define the services for MariaDB and Rails to spin up the containers.

This is just a basic structure, and you may modify it according to your specific requirements.