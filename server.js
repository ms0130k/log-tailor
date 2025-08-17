const http = require('http');
const fs = require('fs');
const path = require('path');

logWithTime('__dirname', __dirname);
const logFilePath = getLogFilePath('WEB');
const logFilePathBatch = getLogFilePath('BATCH');
ensureFileExists(logFilePath);
ensureFileExists(logFilePathBatch);

const server = http.createServer((req, res) => {
  logWithTime(`Request from ${getClientIp(req)}: ${req.method } ${req.url}`);
  const routes = {
    '/': () => serveStaticFile(res, 'index.html', 'text/html'),
    '/batch': () => serveStaticFile(res, 'index-batch.html', 'text/html'),
    '/script.js': () => serveStaticFile(res, 'script.js', 'text/javascript'),
    '/style.css': () => serveStaticFile(res, 'style.css', 'text/css'),
    '/logs-web': () => streamLog(res, req, logFilePath),
    '/logs-batch': () => streamLog(res, req, logFilePathBatch),
    '/down': () => downloadFile(res, logFilePath),
    '/down-batch': () => downloadFile(res, logFilePathBatch),
    '/favicon.ico': () => {
      res.writeHead(204);
      res.end();
    }
  };

  const handler = routes[req.url];
  if (handler) {
    handler();
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});


const PORT = 3000;
server.listen(PORT, () => {
  logWithTime(`Server running at http://localhost:${PORT}/`);
  logWithTime(`Tailing log file: ${logFilePath}, ${logFilePathBatch}`);
});

function getLogFilePath(type) {
  if (process.env['LOG_FILE_PATH' + type]) {
    return process.env['LOG_FILE_PATH' + type];
  }
  const argvIndex = process.argv.indexOf(`--log-file-${type.toLowerCase()}`);
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
      logWithTime('index:', __dirname);
      res.writeHead(500);
      res.end(`Error loading ${filePath}`);
      return;
    }
    res.writeHead(200, {'Content-Type': contentType});
    res.end(data);
  });
}

function streamLog(res, req, filePath) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  let lastSize = fs.statSync(filePath).size;
  let buffer = '';

  const interval = setInterval(() => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        errorWithTime('Error stating file:', err);
        return;
      }
      if (stats.size > lastSize) {
        const stream = fs.createReadStream(filePath, {start: lastSize, end: stats.size - 1});
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
          errorWithTime('Error reading log stream:', err);
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
    logWithTime('Client disconnected, stopped polling file.');
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

function logWithTime(...args) {
  const now = new Date().toLocaleString('ko-KR', {hour12: false});
  console.log(`[${now}]`, ...args);
}

function errorWithTime(...args) {
  const now = new Date().toLocaleString('ko-KR', {hour12: false});
  console.error(`[${now}]`, ...args);
}

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf) {
    return xf.split(',')[0].trim(); // 여러개일 수 있으니 첫번째만
  }
  return req.socket.remoteAddress;
}