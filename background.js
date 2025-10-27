let audioStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let currentAudio = null;


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
  
  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);


    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;
      x += barWidth + 1;
    }
  }

  draw();
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
  a.download = 'recorded_audio.wav';
  a.type = 'audio/wav';
  a.draggable = true;
  
  fileContainer.appendChild(a);

  a.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('DownloadURL', `${a.type}:${a.download}:${url}`);
  });

  a.addEventListener('drop' , () => {
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'record') {
    //startAudioCapture();
    sendResponse({ action: 'recordingStarted' });
  } else if (message.action === 'stop') {
    if(!audioStream) { return; }

    stopAudioCapture();
    sendAudioData(sender.tab.id);
  }

  return true; 
});



