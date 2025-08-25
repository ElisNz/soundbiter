/* // Select the buttons and audio element
const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
const browserAudio = document.getElementById('browserAudio');

let mediaRecorder;
let recordedChunks = [];

// Start recording the audio stream
function startRecording(stream) {
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    // Combine the recorded chunks into a single Blob
    const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
    recordedChunks = [];

    // Example: Save the audio file
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'recorded_audio.webm';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  mediaRecorder.start();
  console.log('Recording started.');
} */

// Stop recording
/* function stopRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
    console.log('Recording stopped.');
  }
} */


/* // Variables for MediaRecorder and audio data
let audioChunks = [];

// Capture the audio output of the browserAudio element
const audioStream = browserAudio.captureStream(); 

// Initialize MediaRecorder with the captured audio stream
const mediaRecorder = new MediaRecorder(audioStream);

// Event: When data is available, push it to the audioChunks array
mediaRecorder.addEventListener('dataavailable', event => {
  audioChunks.push(event.data);
});

// Event: When recording stops, create an audio file
mediaRecorder.addEventListener('stop', () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.controls = true;

  // Append the audio player to the page
  document.body.appendChild(audio);

  // Create a download link
  const downloadLink = document.createElement('a');
  downloadLink.href = audioUrl;
  downloadLink.download = 'browser-audio-recording.wav';
  downloadLink.textContent = 'Download Recording';
  document.body.appendChild(downloadLink);

  // Clear audio chunks for the next recording
  audioChunks = [];
}); */

// Listen for messages from the background script
/* chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request.action);
  if (request.action === 'startRecording') {
    // Start recording when the message is received
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      audioChunks = []; // Clear previous recordings
      // mediaRecorder.start();
      sendResponse({ action: 'recordingStatus', status: 'Recording started' });
    } else {
      sendResponse({ action: 'recordingStatus', status: 'MediaRecorder is not ready or already recording.' });
    }
  } else if (request.action === 'stopRecording') {
    // Stop recording when the message is received
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      // mediaRecorder.stop();
      sendResponse({ action: 'recordingStatus', status: 'Recording stopped' });
    } else {
      sendResponse({ action: 'recordingStatus', status: 'No recording in progress.' });
    }
  }
}); */
