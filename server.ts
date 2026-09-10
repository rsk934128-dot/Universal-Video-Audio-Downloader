import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes FIRST

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Real metadata extraction using oEmbed
  app.get('/api/metadata', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
      // YouTube oEmbed
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const resp = await fetch(oembedUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (UniversalDownloader/1.0)' },
        });
        if (resp.ok) {
          const data = await resp.json();
          return res.json({
            title: data.title,
            author: data.author_name,
            thumbnail: data.thumbnail_url,
            platform: 'youtube',
          });
        }
      }

      // Vimeo oEmbed
      if (url.includes('vimeo.com')) {
        const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
        const resp = await fetch(oembedUrl);
        if (resp.ok) {
          const data = await resp.json();
          return res.json({
            title: data.title,
            author: data.author_name,
            thumbnail: data.thumbnail_url,
            platform: 'vimeo',
          });
        }
      }

      // TikTok oEmbed
      if (url.includes('tiktok.com')) {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const resp = await fetch(oembedUrl);
        if (resp.ok) {
          const data = await resp.json();
          return res.json({
            title: data.title,
            author: data.author_name,
            thumbnail: data.thumbnail_url,
            platform: 'tiktok',
          });
        }
      }

      return res.json({
        title: null,
        author: null,
        thumbnail: null,
      });
    } catch (err: any) {
      console.warn('Metadata fetch error:', err.message);
      return res.json({ title: null, author: null, thumbnail: null });
    }
  });

  // Start media conversion (real YouTube / Facebook / Instagram / TikTok extractor)
  app.post('/api/convert/start', async (req: Request, res: Response) => {
    const { url, format } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Map requested format to loader.to format
    // Options: mp3, m4a, 360, 480, 720, 1080, 1440, 4k
    let targetFormat = 'mp3';
    const fmt = String(format || 'mp3').toLowerCase();

    if (fmt.includes('1080')) targetFormat = '1080';
    else if (fmt.includes('720')) targetFormat = '720';
    else if (fmt.includes('480')) targetFormat = '480';
    else if (fmt.includes('360')) targetFormat = '360';
    else if (fmt.includes('4k')) targetFormat = '4k';
    else if (fmt.includes('m4a')) targetFormat = 'm4a';
    else if (fmt.includes('flac')) targetFormat = 'flac';
    else if (fmt.includes('wav')) targetFormat = 'wav';
    else if (fmt.includes('mp4') || fmt.includes('video')) targetFormat = '720';
    else targetFormat = 'mp3';

    try {
      const apiUrl = `https://loader.to/ajax/download.php?format=${targetFormat}&url=${encodeURIComponent(url)}`;
      const apiResp = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://loader.to/',
        },
      });

      if (!apiResp.ok) {
        throw new Error(`Upstream returned ${apiResp.status}`);
      }

      const data = await apiResp.json();
      return res.json({
        success: data.success ?? true,
        id: data.id,
        progressUrl: data.progress_url || `https://lto2.affadaffa.com/api/progress?id=${data.id}`,
        title: data.title || data.info?.title,
        thumbnail: data.thumbnail_url || data.info?.image,
        format: data.format,
      });
    } catch (err: any) {
      console.error('Convert start error:', err.message);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to initialize media stream',
      });
    }
  });

  // Check conversion progress
  app.get('/api/convert/progress', async (req: Request, res: Response) => {
    const id = req.query.id as string;
    const progressUrl = (req.query.progressUrl as string) || (id ? `https://lto2.affadaffa.com/api/progress?id=${id}` : null);

    if (!progressUrl) {
      return res.status(400).json({ error: 'Missing progressUrl or id' });
    }

    try {
      const resp = await fetch(progressUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://loader.to/',
        },
      });

      if (!resp.ok) {
        throw new Error(`Progress query status ${resp.status}`);
      }

      const data = await resp.json();
      return res.json({
        success: data.success === 1,
        progress: data.progress || 0,
        downloadUrl: data.download_url || null,
        text: data.text || '',
        title: data.title || data.info?.title,
        format: data.format,
      });
    } catch (err: any) {
      console.error('Convert progress error:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Media stream proxy for direct device download
  app.get('/api/proxy-download', async (req: Request, res: Response) => {
    const downloadUrl = req.query.url as string;
    const rawFilename = (req.query.filename as string) || 'download';
    const stream = req.query.stream === 'true';

    if (!downloadUrl) {
      return res.status(400).send('Missing url parameter');
    }

    if (!stream) {
      return res.redirect(302, downloadUrl);
    }

    try {
      const upstream = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://loader.to/',
        },
      });

      if (!upstream.ok) {
        return res.redirect(302, downloadUrl);
      }

      const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
      const contentLength = upstream.headers.get('content-length');

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(rawFilename)}"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      if (req.method === 'HEAD') {
        return res.end();
      }

      if (upstream.body) {
        const { Readable } = await import('stream');
        // @ts-ignore
        const nodeStream = Readable.fromWeb(upstream.body);
        nodeStream.pipe(res);
      } else {
        res.redirect(302, downloadUrl);
      }
    } catch {
      res.redirect(302, downloadUrl);
    }
  });

  // Vite middleware in development or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
