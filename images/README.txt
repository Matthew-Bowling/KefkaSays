DROP YOUR TRIVIA IMAGES IN THIS FOLDER.

Then reference them in index.html like this:

  image: "images/yourfile.png"

Supported formats: PNG, JPG, JPEG, GIF, WEBP

To add a new question, open index.html and find the QUESTIONS array near the top of the <script> section.
Each entry looks like:

  {
    question: "Your question text here?",
    image: "images/yourimage.png",   <-- or null for no image
    options: ["Choice A", "Choice B", "Choice C", "Choice D"],
    correct: 0    <-- 0 = A, 1 = B, 2 = C, 3 = D
  },

Questions are shuffled each game, so order doesn't matter.
