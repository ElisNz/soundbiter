const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');

const statusElement = document.getElementById('status');
statusElement.textContent = 'Recording status: Not started';

let audioStream = null;
let mediaRecorder = null;
let recordedChunks = [];


function startAudioCapture() {
  chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
    if (chrome.runtime.lastError || !stream) {
      console.error('Error capturing audio:', chrome.runtime.lastError?.message);
      return;
    }

    const output = new AudioContext();
    const source = output.createMediaStreamSource(stream);
    source.connect(output.destination);

    console.log('Audio stream captured:', stream);
    audioStream = stream;

    // Start recording the audio stream
    startRecording(stream);
  });
}


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

    // Save the audio file
    saveAudioFile(audioBlob);
  };

  mediaRecorder.start();
  console.log('Recording started.');
}


function saveAudioFile(audioBlob) {
  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'recorded_audio.webm'; // Change extension to .wav if needed
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  console.log('Audio file saved.');
}

// Stop recording and save the audio file
function stopAudioCapture() {
  if (audioStream) {
    // Stop all tracks in the audio stream
    audioStream.getTracks().forEach((track) => track.stop());
    audioStream = null;

    // Stop the MediaRecorder
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder = null;
    }

    console.log('Audio capture stopped.');
  } else {
    console.error('No audio stream to stop.');
  }
}

recordButton.addEventListener('click', () => {
  recordButton.disabled = true; 
  stopButton.disabled = false;

  startAudioCapture();
});

stopButton.addEventListener('click', () => {
  if(!audioStream) { return; }

  stopButton.disabled = true; // Disable the stop button to prevent multiple clicks
  recordButton.disabled = false; // Re-enable the record button

  stopAudioCapture();
});
