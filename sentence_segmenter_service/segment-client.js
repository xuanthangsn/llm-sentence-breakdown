const { PythonShell } = require('python-shell');

const pyshell = new PythonShell('sentence_segmenter_service/segmenter.py', { mode: 'text' });

const requestQueue = [];
let isProcessing = false;

// Function to process the queue
function processQueue() {
  if (isProcessing || requestQueue.length === 0) {
    return;
  }
  isProcessing = true;
  const { text, resolve, reject } = requestQueue.shift();

  // Send the request to the Python process
  pyshell.send(text);

  // Listen for a message from the Python process
  pyshell.on('message', message => {
    isProcessing = false;
    try {
      const {sentences, error} = JSON.parse(message);
      if (error) {
        reject(new Error(message.error));
      } else {
        resolve(sentences);
      }
    } catch (error) {   
      console.log("Failed to parse JSON:", error);
      reject(error);
    } 
 
    processQueue();
  });

  pyshell.on('error', error => {
    isProcessing = false;
    reject(error);
    processQueue();
  });
}


function segmentText(text) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ text, resolve, reject });
    processQueue();
  });
}

module.exports = { segmentText };

