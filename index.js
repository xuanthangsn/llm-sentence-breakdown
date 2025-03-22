const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const language_map = require('./utils/language_map');


app.use(bodyParser.urlencoded({ extended: true }));
const {segmentText} = require('./sentence_segmenter_service/segment-client');
const sentence_breakdown = require('./LLM/sentence-breakdown');
// Render a simple form on the homepage
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Sentence Breakdown App</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f7f7f7; }
          .container { max-width: 800px; margin: auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          input, select, textarea { width: 100%; padding: 10px; margin: 10px 0; }
          button { padding: 10px 20px; background: #007BFF; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Sentence Breakdown App</h1>
          <form action="/breakdown" method="post">
            <label for="text">Enter text of any language:</label>
            <textarea id="text" name="text" rows="4" required></textarea>
            
            <label for="targetLang">Select explanation language:</label>
            <select id="targetLang" name="targetLang">
              <option value="en">English</option>
              <option value="ja">Japanese</option>
              <option value="vi">Vietnamese</option>
            </select>
            
            <button type="submit">Breakdown Sentence</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

// POST endpoint to process sentence breakdown
app.post('/breakdown', async (req, res) => {
  const { text, targetLang } = req.body;
  const targetLanguage = language_map[targetLang] || 'Vietnamese';

  let segmented;
  try {
    segmented = await segmentText(text);
  } catch (error) {
    console.log(error);
    return res.status(500).send(`Error: ${error.message}`);
  }

  const breakdownPromise = segmented.map(sentence => sentence_breakdown(sentence, targetLanguage));

  let breakdowns;
  try {
    breakdowns = await Promise.all(breakdownPromise);
    breakdowns = breakdowns.map((breakdown, index) => {
      return {
        sentence: segmented[index],
        ...breakdown
      };
    })
  } catch (err) {
    console.log(err);
    return res.status(500).send(`Failed to breakdown sentences`);
  }


  try {

    let resultHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Breakdown & Translation Results</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 20px; }
        .container { max-width: 800px; margin: auto; }
        .box { background: #fff; padding: 20px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); position: relative; }
        .sentence { font-weight: bold; font-size: 1.1em; }
        .translation { margin-top: 10px; color: #555; }
        .components { margin-top: 10px; display: none; }
        .toggle-btn { margin-top: 10px; cursor: pointer; color: #007BFF; text-decoration: underline; }
        .read-aloud { position: absolute; bottom: 10px; right: 10px; background: #28a745; color: #fff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Breakdown & Translation Results</h2>
    `;

    breakdowns.forEach((breakdown, index) => {
      const {sentence, translation, components} = breakdown;
      resultHtml += `
      <div class="box" id="box-${index}">
        <div class="sentence">Original: ${sentence}</div>
        <div class="translation">Translation: ${translation}</div>
        <div class="toggle-btn" onclick="toggleComponents(${index})">Show Components</div>
        <div class="components" id="components-${index}">
      `;
      components.forEach(comp => {
        resultHtml += `<div><strong>${comp.text}</strong>: ${comp.meaning}</div>`;
      });
      resultHtml += `
        </div>
        <button class="read-aloud" onclick="readAloud(${index})">Read Aloud</button>
      </div>
      `;
    })

    resultHtml += `
    </div>
    <script>
      const sentences = ${JSON.stringify(breakdowns.map(r => r.sentence))};
      function toggleComponents(index) {
        const compDiv = document.getElementById('components-' + index);
        compDiv.style.display = compDiv.style.display === 'block' ? 'none' : 'block';
      }
      function readAloud(index) {
        const utterance = new SpeechSynthesisUtterance(sentences[index]);
        speechSynthesis.speak(utterance);
      }
    </script>
    </body>
    </html>
    `;

    res.send(resultHtml);
  } catch (err) {
    console.log(err);
    return res.status(500).send(`Failed to build HTML response from breakdown`);
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
