const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
// const downloadButton = document.getElementById('downloadButton');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const fileContainer = document.getElementById('fileContainer');
const consistentUIButton = document.getElementById('open-ui');
const timer = document.getElementById('timer');


let audioStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let currentAudio = null;

const canvas = document.getElementById('waveformCanvas');
const canvasCtx = canvas.getContext('2d');
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();

const takeTime = (audio) => {
  let timerInterval = null;
  
  
  if(!audio) {
    timer.textContent = '00:00:00';
    let minutes = 0;
    let seconds = 0;
    let hundreds = 0;

    timerInterval = setInterval(() => {
      hundreds += 1;
      if (hundreds >= 100) {
        hundreds = 0;
        seconds += 1;
      }
      if (seconds >= 60) {
        seconds = 0;
        minutes += 1;
      }
      const minutesStr = String(minutes).padStart(2, '0');
      const secondsStr = String(seconds).padStart(2, '0');
      const hundredsStr = String(hundreds).padStart(2, '0');
      timer.textContent = `${minutesStr}:${secondsStr}:${hundredsStr}`;
    }, 10);
  }

  if (audio) {
    timerInterval = setInterval(() => {
      currentTime = audio.currentTime;
      const minutes = String(Math.floor(currentTime / 60)).padStart(2, '0');
      const seconds = String(Math.floor(currentTime % 60)).padStart(2, '0');
      const hundreds = String(Math.floor((currentTime * 100) % 100)).padStart(2, '0');
      timer.textContent = `${minutes}:${seconds}:${hundreds}`;
    }, 10);
  }
  
  return timerInterval;
};

// Send audio data to the content script
function sendAudioData(tabId) {
  chrome.tabs.sendMessage(tabId, { action: 'receiveAudio', audio: currentAudio });
}

function maintainTabAudio(stream) {
  const output = new AudioContext();
  const source = output.createMediaStreamSource(stream);
  source.connect(output.destination);
};

function runAnalyzerBar(stream)  {
  
  const source = audioCtx.createMediaStreamSource(stream);

  source.connect(analyser);

  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const canvas = document.getElementById('soundwaveCanvas');
  const canvasCtx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = 100;
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    canvasCtx.fillStyle = canvas.style.backgroundColor || 'white'; // Use the canvas background color or default to white
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;
      canvasCtx.fillStyle = `rgb(${barHeight + 100},50,50)`;
      canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);
      x += barWidth + 1;
    }
  }

  draw();
}

async function displayWaveform(audioBlob) {
  
  // Decode the audio data from the Blob
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Get the audio data
  const channelData = audioBuffer.getChannelData(0); // Use the first channel
  const sampleRate = audioBuffer.sampleRate;

  // Clear the canvas
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  canvasCtx.beginPath();
  canvasCtx.lineWidth = 8;
  canvasCtx.strokeStyle = 'black';

  
  // Draw the waveform
  const width = canvas.width;
  const height = canvas.height;
  const step = Math.ceil(channelData.length / width); // Number of samples per pixel
  const amp = height / 2; // Amplitude scaling factor

  canvasCtx.beginPath();
  canvasCtx.moveTo(0, amp); // Start at the middle of the canvas

  for (let i = 0; i < width; i++) {
    const min = Math.min(...channelData.slice(i * step, (i + 1) * step));
    const max = Math.max(...channelData.slice(i * step, (i + 1) * step));
    canvasCtx.lineTo(i, amp + min * amp);
    canvasCtx.lineTo(i, amp + max * amp);
  }

  canvasCtx.strokeStyle = 'black';
  canvasCtx.stroke();
}

function startAudioCapture() {
  alert('capture started');
  chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
    if (chrome.runtime.lastError || !stream) {
      console.error('Error capturing audio:', chrome.runtime.lastError?.message);
      return;
    }

    maintainTabAudio(stream); 
    runAnalyzerBar(stream); 

    audioStream = stream;

    startRecording(stream);
  });
}

function managePlayButton(url) {
  const audio = new Audio(url); 
  playButton.disabled = false; 
  playButton.style.display = 'inline-block'; 

  playButton.addEventListener('click', () => {
    
    const timerInterval = takeTime(audio);

    audio.addEventListener('ended', () => {
      playButton.disabled = false; 
      playButton.style.display = 'inline-block';
      pauseButton.disabled = true; 
      pauseButton.style.display = 'none';
      clearInterval(timerInterval);
    });

    audio.play();

    pauseButton.disabled = false; 
    pauseButton.style.display = 'inline-block';
    playButton.disabled = true;
    playButton.style.display = 'none';

    pauseButton.addEventListener('click', () => {
      audio.pause();
      pauseButton.disabled = true;
      pauseButton.style.display = 'none';
      playButton.disabled = false; 
      playButton.style.display = 'inline-block';
    }); 
  }); 
};

function startRecording(stream) {
  mediaRecorder = new MediaRecorder(stream);
  recordedChunks = [];
  const timerInterval = takeTime();
  
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {   
    const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(audioBlob); 
    currentAudio = audioBlob;
    recordedChunks = [];
    alert('recording stopped');
    saveAudioFile(url);
    clearInterval(timerInterval);
    
    displayWaveform(audioBlob);

    managePlayButton(url);
  };

  mediaRecorder.start();
}


function saveAudioFile(url) {
  const a = document.createElement('a');

  a.href = url;
  a.download = 'recorded_audio.webm'; // Change extension to .wav if needed
  a.type = 'audio/webm';
  a.draggable = true;
  
  fileContainer.appendChild(a);

  a.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('DownloadURL', `${a.type}:${a.download}:${url}`);
  });

  a.addEventListener('drop' , (event) => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  });
}


function stopAudioCapture() {
  if (audioStream) {

    audioStream.getTracks().forEach((track) => track.stop());
    audioStream = null;

    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder = null;
    }
  } else {
    console.error('No audio stream to stop.');
  }
}

//TODO: use listeners for messegages from content script UI instead of these button listeners
recordButton.addEventListener('click', () => {

  recordButton.disabled = true; 
  stopButton.disabled = false;

  startAudioCapture();
});

stopButton.addEventListener('click', () => {
  if(!audioStream) { return; }

  recordButton.disabled = false;

  stopAudioCapture();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'record') {
    recordButton.disabled = true; 
    stopButton.disabled = false;
    alert('recording requested');
    startAudioCapture();
  } else if (message.action === 'stop') {
    if(!audioStream) { return; }
    alert('stop requested');
    recordButton.disabled = false;
    stopAudioCapture();
    sendAudioData(sender.tab.id);
  }
});

consistentUIButton.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'renderUI' });
  });
});
