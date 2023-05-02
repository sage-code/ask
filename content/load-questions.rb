require 'json'
require 'mysql2'

# Connect to MariaDB database
client = Mysql2::Client.new(:host => "localhost", :username => "root", :password => "password", :database => "database_name")

# Get the quiz code from a parameter
quiz_code = ARGV[0]

# Read the JSON file and parse it into a Ruby hash
json_data = File.read("path/to/folder/#{quiz_code}/#{quiz_code}_questions.json")
questions = JSON.parse(json_data)

# Iterate over the questions hash and insert each question into the database
questions.each do |question|
  query = "INSERT INTO questions (id, code, section_id, title, description, option_a, option_b, option_c, option_d, correct_answer, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  client.query(query, question.values)
end