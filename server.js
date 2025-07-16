const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('__dirname', __dirname);
const logFilePath = getLogFilePath();
ensureFileExists(logFilePath);

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    serveStaticFile(res, 'index.html', 'text/html');
  } else if (req.url === '/style.css') {
    serveStaticFile(res, 'style.css', 'text/css');
  } else if (req.url === '/logs') {
    streamLog(res, req);
  } else if (req.url === '/down') {
    downloadFile(res, logFilePath);
  } else if (req.url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Tailing log file:', logFilePath);
});

function getLogFilePath() {
  if (process.env.LOG_FILE_PATH) {
    return process.env.LOG_FILE_PATH;
  }
  const argvIndex = process.argv.indexOf('--log-file');
  if (argvIndex > -1 && process.argv[argvIndex + 1]) {
    return process.argv[argvIndex + 1];
  }
  return path.join(__dirname, 'app.log');
}

function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '');
  }
}

function serveStaticFile(res, filePath, contentType) {
  fs.readFile(path.join(__dirname, filePath), (err, data) => {
    if (err) {
      console.log('index:', __dirname);
      res.writeHead(500);
      res.end(`Error loading ${filePath}`);
      return;
    }
    res.writeHead(200, {'Content-Type': contentType});
    res.end(data);
  });
}

function streamLog(res, req) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  let lastSize = fs.statSync(logFilePath).size;
  let buffer = '';

  const interval = setInterval(() => {
    fs.stat(logFilePath, (err, stats) => {
      if (err) {
        console.error('Error stating file:', err);
        return;
      }
      if (stats.size > lastSize) {
        const stream = fs.createReadStream(logFilePath, {start: lastSize, end: stats.size - 1});
        stream.on('data', chunk => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop();
          lines.forEach(line => {
            if (line) {
              res.write(`data: ${line}\n\n`);
            }
          });
        });
        stream.on('error', err => {
          console.error('Error reading log stream:', err);
          res.write('event: streamError\n');
          res.write(`data: ${JSON.stringify({message: err.message})}\n\n`);
          res.end();
          clearInterval(interval);
        });
        lastSize = stats.size;
      }
    })
  }, 1000);

  const heartbeatInterval = setInterval(() => {
    res.write(':\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(interval);
    clearInterval(heartbeatInterval);
    res.end();
    console.log('Client disconnected, stopped polling file.');
  });
}

function downloadFile(res, filePath, downloadName = path.basename(filePath)) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${downloadName}"`,
      'Content-Length': stats.size,
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  });
}