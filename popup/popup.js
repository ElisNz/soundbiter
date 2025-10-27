const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
// const downloadButton = document.getElementById('downloadButton');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const fileContainer = document.getElementById('fileContainer');
const consistentUIButton = document.getElementById('open-ui');
const timer = document.getElementById('timer');


consistentUIButton.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'renderui', message: 'hej' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError.message);
      } else {
          consistentUIButton.innerText = response.action;
          alert(response.action);      
      }
    });
  });

  // Send a message to the content script
/*   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "renderui", message: "Hello from the background script!" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error:", chrome.runtime.lastError.message);
      } else {
        console.log("Response from content script:", response.reply);
      }
    });
  }); */
});
