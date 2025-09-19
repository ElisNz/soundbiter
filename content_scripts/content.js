// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'renderUI') {
    // Check if the UI already exists
    if (!document.getElementById('persistent-ui')) {
      // Create the persistent UI
      const persistentUI = document.createElement('div');
      persistentUI.id = 'persistent-ui';
      persistentUI.style.position = 'fixed';
      persistentUI.style.top = '0';
      persistentUI.style.right = '0';
      persistentUI.style.width = '300px';
      persistentUI.style.height = '100px';
      persistentUI.style.backgroundColor = '#fff';
      persistentUI.style.boxShadow = '-2px 0 5px rgba(0, 0, 0, 0.2)';
      persistentUI.style.zIndex = '9999';
      persistentUI.style.padding = '10px';
      persistentUI.innerHTML = `
        <h2>Persistent UI</h2>
        <p>This is your persistent UI!</p>
        <button id="record-button" style="margin-top: 10px;">Record</button>
        <button id="stop-button" style="margin-top: 10px;">Stop</button>
        <button id="close-ui" style="margin-top: 10px;">Close</button>
      `;
      document.body.appendChild(persistentUI);

      // Add event listener to the Record button
      document.getElementById('record-button').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'record' });
      });

      // Add event listener to the Stop button
      document.getElementById('stop-button').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'stop' });
      });

      // Add event listener to the Close button
      document.getElementById('close-ui').addEventListener('click', () => {
        persistentUI.remove();
      });
    }
  } else if (message.action === 'receiveAudio' && message.audio) {
    playAudio(message.audio);
  }
});

// Play the received audio data
function playAudio(audioBuffer) {
  const text = document.createElement('p');
  text.textContent = audioBuffer;
  document.getElementById('persistent-ui').appendChild(text);
  
}