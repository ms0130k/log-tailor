const http = require('http');
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'app.log');

// Ensure log file exists
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, 'Log file created.\n');
}

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    // Serve the HTML page
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(data);
    });
  } else if (req.url === '/style.css') {
    // Serve the CSS file
    fs.readFile(path.join(__dirname, 'style.css'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading style.css');
        return;
      }
      res.writeHead(200, {'Content-Type': 'text/css'});
      res.end(data);
    });
  } else if (req.url === '/logs') {
    // Handle the log streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send a connection confirmation message
    res.write('data: Connection established. Tailing log file...\n\n');

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
          stream.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep the last, possibly incomplete line

            lines.forEach(line => {
              if (line) {
                res.write(`data: ${line}\n\n`);
              }
            });
          });
          lastSize = stats.size;
        }
      });
    }, 1000); // Check every 1 second

    // Clean up interval when client disconnects
    req.on('close', () => {
      clearInterval(interval);
      res.end();
      console.log('Client disconnected, stopped polling file.');
    });
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
  console.log(`Tailing log file: ${logFilePath}`);
});