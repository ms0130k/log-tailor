const logContainer = document.getElementById('log-container');
const eventSource = new EventSource(`./logs-${TYPE.toLowerCase()}`);
const btnCopy = document.getElementById('copy');
const btnStop = document.getElementById('stop');

eventSource.onmessage = function (event) {
  addLogLine(event.data);
  logContainer.scrollTop = logContainer.scrollHeight; // Auto-scroll
};

eventSource.addEventListener('streamError', e => {
  const {message} = JSON.parse(e.data);
  addLogLine(message, 'error');
  console.log('log stream error:', message);
  eventSource.close();
});

eventSource.onerror = function (err) {
  console.error('EventSource failed:', err);
  addLogLine('Connection lost. Refresh plz...', 'error');
  eventSource.close();
};

function addLogLine(text, type = 'info') {
  const p = document.createElement('p');
  p.textContent = text;
  if (type === 'error') {
    p.classList.add('error');
  }
  logContainer.append(p);
}

function copyText() {
  const text = [...document.querySelectorAll('p')]
    .map(el => el.textContent)
    .join('\n');

  navigator.clipboard.writeText(text)
    .then(() => {
      console.log('Copied to clipboard!');
    })
    .catch(err => {
      console.error('Copy failed:', err);
    });
}

function stop() {
  if (!eventSource) return; // 이미 꺼져 있으면 무시
  try { eventSource.close(); } catch {}
  document.querySelector('h1').textContent += ' Stopped';
  btnStop.disabled = true;
}

btnCopy.addEventListener('click', copyText);
btnStop.addEventListener('click', stop);

document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();

    copyText();
  }
});
