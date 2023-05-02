-- schema.rb

create_table "quizzes", force: :cascade do |t|
  t.string "title"
  t.text "description"
  t.integer "total_points"
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
end

create_table "sections", force: :cascade do |t|
  t.string "title"
  t.integer "points"
  t.integer "quiz_id"
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
end

create_table "questions", force: :cascade do |t|
  t.string "title"
  t.text "description"
  t.string "option_a"
  t.string "option_b"
  t.string "option_c"
  t.string "option_d"
  t.string "correct_answer"
  t.integer "points"
  t.integer "section_id"
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
end

create_table "users", force: :cascade do |t|
  t.string "email"
  t.string "password_digest"
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
end

create_table "answers", force: :cascade do |t|
  t.integer "user_id"
  t.integer "question_id"
  t.string "chosen_answer"
  t.integer "points_achieved"
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
end