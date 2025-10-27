/* chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "renderui") {
    console.log("Message received from background script:", message.message);

    // Respond back to the background script
    sendResponse({ reply: "Hello from the content script!" });
  }

  // Return true to indicate that the response will be sent asynchronously
  return true;
}); */


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab ? sender.tab.id : null;

  if (message.action === 'renderui') {
    // Check if the UI already exists
    
    if (!document.getElementById('persistent-ui')) {
      // Create the persistent UI
      const persistentUI = document.createElement('div');
      persistentUI.id = 'persistent-ui';
      persistentUI.style.position = 'fixed';
      persistentUI.style.top = '10px';
      persistentUI.style.right = '10px';
      persistentUI.style.width = '300px';
      persistentUI.style.height = '100px';
      persistentUI.style.backgroundColor = '#fff';
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
        chrome.runtime.sendMessage(sender.id, { action: 'record' }, (response) => {
          console.log('Response from background script:', response.action);
        });
      });

      // Add event listener to the Stop button
      document.getElementById('stop-button').addEventListener('click', () => {
        chrome.runtime.sendMessage(tabId, { action: 'stop' });
      });

      // Add event listener to the Close button
      document.getElementById('close-ui').addEventListener('click', () => {
        persistentUI.remove();
      });
    }
  } else if (message.action === 'receiveAudio' && message.audio) {
    playAudio(message.audio);
  }


  return true; // Keep the message channel open for sendResponse
});


function playAudio(audioBuffer) {
  const text = document.createElement('p');
  text.textContent = audioBuffer;
  document.getElementById('persistent-ui').appendChild(text);
  
}