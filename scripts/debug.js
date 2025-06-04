// Save this file as debug.js next to debug.html
const fs = require('fs');
const http = require('http');
const path = require('path');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Debug LazyUncle</title>
      </head>
      <body>
        <h1>LazyUncle Debug Console</h1>
        <div id="output"></div>
        
        <script>
          // Function to log to our page
          function logToPage(msg) {
            const output = document.getElementById('output');
            const p = document.createElement('p');
            p.textContent = msg;
            output.appendChild(p);
          }
          
          // Catch all errors
          window.onerror = function(message, source, lineno, colno, error) {
            logToPage('ERROR: ' + message + ' at ' + source + ':' + lineno);
            return true;
          };
          
          // Make a request to the LazyUncle app and look for issues
          fetch('http://localhost:5174/')
            .then(response => response.text())
            .then(html => {
              logToPage('Successfully fetched the HTML');
              
              // Create an iframe to load the app
              const iframe = document.createElement('iframe');
              iframe.style.width = '100%';
              iframe.style.height = '400px';
              iframe.style.border = '1px solid black';
              document.body.appendChild(iframe);
              
              // Write the HTML to the iframe
              const doc = iframe.contentDocument || iframe.contentWindow.document;
              doc.open();
              doc.write(html);
              doc.close();
              
              // Listen for errors in the iframe
              iframe.contentWindow.onerror = function(message, source, lineno, colno, error) {
                logToPage('IFRAME ERROR: ' + message + ' at ' + source + ':' + lineno);
                return true;
              };
            })
            .catch(error => {
              logToPage('Fetch error: ' + error.message);
            });
        </script>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3000, () => {
  console.log('Debug server running at http://localhost:3000');
}); 