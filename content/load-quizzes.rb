require 'mysql2'
require 'json'

# Connect to MariaDB database
client = Mysql2::Client.new(:host => "localhost", :username => "root", :password => "password", :database => "database_name")

# Load quizzes data from JSON file
quizzes_data = JSON.parse(File.read('quizzes.json'))

# Insert quizzes data into the database
quizzes_data.each do |quiz|
  client.query("
    INSERT INTO quizzes (code, title, description, total_points)
    VALUES ('#{quiz['code']}', '#{quiz['title']}', '#{quiz['description']}', #{quiz['total_points']});
  ")
end
