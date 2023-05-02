<html lang="en" data-bs-theme="dark"><head>
  <meta charset="utf-8">
  <meta name="description" content="Prepare environment for working to Ask project. Software requirements.">
  <meta name="author" content="Elucian Moise">
  <meta name="keywords" content="sage-code, ask project, requirements, tech stack">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Website title -->
  <title>Requirement</title>  

  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <!-- Icon -->
  <link rel="icon" type="image/png"  href="../images/favicon.ico">  
  <!-- Prism Highlighter -->
  <link rel="stylesheet" href="../prism.css">
  <!-- custom css -->
  <link rel="stylesheet" href="../sage.css">
  </head>
<body>

<div class="container">
        
<!-- header -->
<div class="row">
    <div class="col">
        <a href="https://sagecode.net"><img src="../images/sage-logo.svg" alt="Sage-Code Laboratory" height="80"/></a>
    </div>  
    <div class="col  bottom-right">
        <a href="index.html#lang-index" rel="nofollow">index</a>&lt;--
    </div>
</div><hr>

<h1>Requirements</h1>

<div class="alert alert-secondary shadow-sm">
What do I need to install on my computer to create a Svelte front-end with Ruby back-end and MariaDB database?
</div>


<p>To create a Svelte front-end with a Ruby back-end and MariaDB database, you'll need to install a few tools on your computer. Here are the steps you should follow:</p>

<ol>
  <li>Install Ruby on your computer. You can download Ruby from the official website (<a href="https://www.ruby-lang.org/en/downloads/">https://www.ruby-lang.org/en/downloads/</a>) or use a package manager like Homebrew (for Mac) or Chocolatey (for Windows).</li>
  
  <li>Install Rails, the Ruby framework for building web applications. Open a terminal or command prompt and run the following command:<br><br><code>gem install rails</code></li>
  
  <li>Install MariaDB, the open-source database system. You can download MariaDB from the official website (<a href="https://mariadb.org/download/">https://mariadb.org/download/</a>) or use a package manager like Homebrew or Chocolatey.</li>
  
  <li>Set up a new Rails application using the following command:<br><br><code>rails new myapp --database=mariadb</code><br><br>This command will create a new Rails application with MariaDB as the default database.</li>
  
  <li>Install the <code>svelte-rails</code> gem by adding the following line to your <code>Gemfile</code>:<br><br><code>gem 'svelte-rails'</code><br><br>Then run <code>bundle install</code> to install the gem.</li>
  
  <li>Create a new Svelte component using the following command:<br><br><code>rails g svelte:component Hello name:string</code><br><br>This command will create a new Svelte component called "Hello" with a prop called "name".</li>
  
  <li>Finally, start the Rails server and the Svelte development server by running the following commands in separate terminal windows:<br><br><code>rails server</code><br><br><code>npm run dev --prefix frontend</code><br><br>Running the above commands should start the Rails server and the Svelte development server, and you should be able to access your application at <a href="http://localhost:3000">http://localhost:3000</a>.</li>
</ol>

<p>That's it! After following these steps, you should have a working setup for a Svelte front-end with a Ruby back-end and MariaDB database.</p>

<hr>
<p><b>Read next:</b>
<a href="index.html">Index</a></p>

<!-- Footer -->
<footer class="footer">
  <div class="footer-copyright text-center"></div>
</footer>
</div>
</body>
</html>