require 'mysql2'
require 'json'

def load_sections(client)
  # Load sections data from JSON file
  sections_data = JSON.parse(File.read('sections.json'))

  # Insert sections data into the database
  sections_data.each do |section|
    client.query("
      INSERT INTO sections (id, code, title, points, created_at, updated_at)
      VALUES (
        #{section['id']},
        '#{section['code']}',
        '#{section['title']}',
        #{section['points']},
        '#{section['created_at']}',
        '#{section['updated_at']}'
      );
    ")
  end
end

# Connect to the database
client = Mysql2::Client.new(
  :host => "localhost",
  :username => "root",
  :password => "password",
  :database => "database_name"
)

# Call the load_sections method to load sections data
load_sections(client)