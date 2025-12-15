const http = require('http');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create the Next.js app instance
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http.createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Handle media-storage files
      if (pathname.startsWith('/media-storage/')) {
        const filePath = path.join(process.cwd(), pathname);
        
        // Security check: ensure file is within media-storage directory
        const mediaStoragePath = path.join(process.cwd(), 'media-storage');
        if (!filePath.startsWith(mediaStoragePath)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        try {
          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            
            // Set appropriate content type
            let contentType = 'application/octet-stream';
            if (filePath.endsWith('.webp')) {
              contentType = 'image/webp';
            } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
              contentType = 'image/jpeg';
            } else if (filePath.endsWith('.png')) {
              contentType = 'image/png';
            } else if (filePath.endsWith('.gif')) {
              contentType = 'image/gif';
            }

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            return;
          }
        } catch (error) {
          console.error('Error serving file:', error);
        }

        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      // Handle Next.js requests
      await handle(req, res, parsedUrl);
    } catch (error) {
      console.error('Server error:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, (error) => {
    if (error) throw error;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
