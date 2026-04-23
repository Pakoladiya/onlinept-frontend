import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { processVideo, probeVideo, detectHardwareAccel } from '../services/videoEngine.js';

const router = Router();

// ── Storage paths ────────────────────────────────────────────────────────────
const isWindows = process.platform === 'win32';
let BASE_DIR = process.env.STORAGE_DIR || (
  isWindows
    ? path.join(process.env.APPDATA || process.env.USERPROFILE || 'C:', 'OnlinePT', 'storage', 'clinics')
    : '/var/www/onlinept/storage/clinics'
);

try {
  fs.mkdirSync(BASE_DIR, { recursive: true });
} catch (err) {
  console.warn(`[Storage] Primary path ${BASE_DIR} not writable, falling back to /tmp/onlinept`);
  BASE_DIR = '/tmp/onlinept/storage/clinics';
  fs.mkdirSync(BASE_DIR, { recursive: true });
}

// ── Job tracking for video processing ──────────────────────────────────────
const jobs = new Map();

const getClinicDir = (clinicId) => path.join(BASE_DIR, clinicId);
const ensureClinicDir = (clinicId) => fs.mkdirSync(getClinicDir(clinicId), { recursive: true });

// ── Multer config ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const clinicId = req.body.clinicId || req.query.clinicId;
    if (!clinicId) return cb(new Error('clinicId is required'));
    const type = req.body.type || req.query.type || 'other';
    const dest = path.join(BASE_DIR, clinicId, type);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uuid = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uuid}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: (req, file) => {
      const type = req.body?.type || req.query?.type || 'other';
      if (type === 'videos') return 500 * 1024 * 1024;
      if (type === 'documents') return 50 * 1024 * 1024;
      if (['images', 'videos'].includes(type)) return 50 * 1024 * 1024;
      return 10 * 1024 * 1024;
    },
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['mp4', 'mov', 'webm', 'pdf', 'jpg', 'jpeg', 'png', 'webp'];
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${ext} is not allowed. Allowed: ${allowed.join(', ')}`));
    }
  },
});

// ── Helper: build public URL ────────────────────────────────────────────────
const publicUrl = (clinicId, type, filename) =>
  `http://localhost:5001/api/storage/download/${clinicId}/${type}/${filename}`;

// ── Helper: try to save file metadata to SQLite ──────────────────────────────
async function saveFileMeta(clinicId, meta) {
  try {
    const { getDb } = await import('../services/sqlite.js');
    const db = getDb();
    if (!db) return;
    db.prepare(`
      INSERT OR REPLACE INTO clinic_files
        (id, clinic_id, file_id, name, type, url, size, tags, body_part, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      meta.fileId, clinicId, meta.fileId, meta.name, meta.type,
      meta.url, meta.size, JSON.stringify(meta.tags || []), meta.bodyPart || null,
      new Date().toISOString()
    );
  } catch (err) {
    console.warn('[storage/saveFileMeta]', err.message);
  }
}

async function deleteFileMeta(clinicId, fileId) {
  try {
    const { getDb } = await import('../services/sqlite.js');
    const db = getDb();
    if (!db) return;
    db.prepare('DELETE FROM clinic_files WHERE clinic_id = ? AND file_id = ?').run(clinicId, fileId);
  } catch (err) {
    console.warn('[storage/deleteFileMeta]', err.message);
  }
}

async function getFileMetaList(clinicId, type) {
  try {
    const { getDb } = await import('../services/sqlite.js');
    const db = getDb();
    if (!db) return [];
    const rows = type
      ? db.prepare('SELECT * FROM clinic_files WHERE clinic_id = ? AND type = ?').all(clinicId, type)
      : db.prepare('SELECT * FROM clinic_files WHERE clinic_id = ?').all(clinicId);
    return rows.map(r => ({
      fileId:    r.file_id,
      name:      r.name,
      type:      r.type,
      url:       r.url,
      size:      r.size,
      tags:      JSON.parse(r.tags || '[]'),
      bodyPart:  r.body_part,
      uploadedAt: r.uploaded_at,
    }));
  } catch (err) {
    console.warn('[storage/getFileMetaList]', err.message);
    return [];
  }
}

// ── POST /upload ─────────────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const clinicId = req.body.clinicId;
    const type = req.body.type || 'other';
    const name = req.body.name || req.file.originalname;
    const tagsRaw = req.body.tags || '';
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const bodyPart = req.body.bodyPart || null;
    const fileId = uuidv4();

    const ext = path.extname(req.file.originalname).slice(1).toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
    const isVideo = ['mp4', 'mov', 'webm'].includes(ext);

    let finalPath = req.file.path;
    let finalSize = req.file.size;
    let finalFilename = req.file.filename;

    if (isImage) {
      const webpName = `${fileId}.webp`;
      const webpPath = path.join(path.dirname(req.file.path), webpName);
      try {
        await sharp(req.file.path)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(webpPath);
        fs.unlinkSync(req.file.path);
        finalPath = webpPath;
        finalFilename = webpName;
        finalSize = fs.statSync(webpPath).size;
      } catch (err) {
        console.warn('[storage/upload] Sharp compression failed, keeping original:', err.message);
      }
    } else if (isVideo) {
      const compressedName = `${fileId}_compressed.mp4`;
      const compressedPath = path.join(path.dirname(req.file.path), compressedName);
      try {
        const { execSync: exec } = await import('child_process');
        exec(`ffmpeg -i "${req.file.path}" -vcodec libx264 -crf 28 -preset fast -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" -c:a aac -b:a 128k "${compressedPath}" -y`, { stdio: 'ignore' });
        if (fs.existsSync(compressedPath)) {
          const compressedSize = fs.statSync(compressedPath).size;
          if (compressedSize < req.file.size) {
            fs.unlinkSync(req.file.path);
            finalPath = compressedPath;
            finalFilename = compressedName;
            finalSize = compressedSize;
          } else {
            fs.unlinkSync(compressedPath);
          }
        }
      } catch (err) {
        console.warn('[storage/upload] FFmpeg compression failed, keeping original:', err.message);
      }
    }

    const meta = {
      fileId,
      name,
      type,
      filename: finalFilename,
      url: publicUrl(clinicId, type, finalFilename),
      size: finalSize,
      tags,
      bodyPart,
    };
    await saveFileMeta(clinicId, meta);

    res.json(meta);
  } catch (err) {
    console.error('[storage/upload]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /files/:clinicId ─────────────────────────────────────────────────────
router.get('/files/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const type = req.query.type || null;
    const files = await getFileMetaList(clinicId, type);
    res.json(files);
  } catch (err) {
    console.error('[storage/files]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /files/:clinicId/:fileId ──────────────────────────────────────────
router.delete('/files/:clinicId/:fileId', async (req, res) => {
  try {
    const { clinicId, fileId } = req.params;
    const clinicDir = getClinicDir(clinicId);
    let deletedDisk = false;
    try {
      const typeDirs = fs.readdirSync(clinicDir);
      for (const t of typeDirs) {
        const entries = fs.readdirSync(path.join(clinicDir, t));
        for (const entry of entries) {
          if (entry.startsWith(fileId)) {
            fs.unlinkSync(path.join(clinicDir, t, entry));
            deletedDisk = true;
            break;
          }
        }
      }
    } catch {
      // Directory may be empty or missing
    }

    await deleteFileMeta(clinicId, fileId);
    res.json({ success: true, deletedDisk });
  } catch (err) {
    console.error('[storage/delete]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /download/:clinicId/:type/:filename ──────────────────────────────────
router.get('/download/:clinicId/:type/:filename', (req, res) => {
  try {
    const { clinicId, type, filename } = req.params;
    const filePath = path.join(BASE_DIR, clinicId, type, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const ext = path.extname(filename).slice(1).toLowerCase();
    const mimeMap = {
      mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
      pdf: 'application/pdf',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('[storage/download]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /compress ────────────────────────────────────────────────────────────
router.post('/compress', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const clinicId = req.body.clinicId;
    if (!clinicId) return res.status(400).json({ error: 'clinicId required' });

    const dir = path.join(BASE_DIR, clinicId, 'images');
    fs.mkdirSync(dir, { recursive: true });

    const inputPath = req.file.path;
    const outputName = req.file.filename.replace(/\.[^.]+$/, '.webp');
    const outputPath = path.join(dir, outputName);

    await sharp(inputPath).resize(1920, 1080, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(outputPath);

    res.json({
      originalUrl: publicUrl(clinicId, 'images', req.file.filename),
      webpUrl: publicUrl(clinicId, 'images', outputName),
    });
  } catch (err) {
    console.error('[storage/compress]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /process-video ─────────────────────────────────────────────────────
router.post('/process-video', upload.single('logoFile'), async (req, res) => {
  try {
    const { clinicId, videoFilename } = req.body;
    if (!clinicId) return res.status(400).json({ error: 'clinicId required' });
    if (!videoFilename) return res.status(400).json({ error: 'videoFilename required' });

    let config = {};
    try {
      config = req.body.config ? JSON.parse(req.body.config) : {};
    } catch {
      config = {};
    }

    let ffmpegAvailable = false;
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      ffmpegAvailable = true;
    } catch {
      ffmpegAvailable = false;
    }

    if (!ffmpegAvailable) {
      return res.json({ error: 'ffmpeg_required', message: 'FFmpeg is not installed.' });
    }

    const jobId = uuidv4();
    const job = { jobId, status: 'processing', progress: 5, outputUrl: null };
    jobs.set(jobId, job);

    console.log(`[VideoEngine][${jobId}] Step 1: Searching for ${videoFilename}`);
    const recordDir = path.join(BASE_DIR, clinicId, 'recordings');
    const videoDir  = path.join(BASE_DIR, clinicId, 'videos');
    if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
    
    let inputPath = path.resolve(recordDir, videoFilename);
    const inRecordings = fs.existsSync(inputPath);
    console.log(`[VideoEngine][${jobId}] Check recordings: ${inRecordings} (${inputPath})`);
    
    if (!inRecordings) {
      inputPath = path.resolve(videoDir, videoFilename);
      const inVideos = fs.existsSync(inputPath);
      console.log(`[VideoEngine][${jobId}] Check videos: ${inVideos} (${inputPath})`);
    }
    
    if (!fs.existsSync(inputPath)) {
      console.error(`[VideoEngine][${jobId}] ERROR: Source file not found anywhere!`);
      job.status = 'error';
      job.error = `Video source file not found: ${videoFilename}`;
      return res.json({ jobId, status: 'error', error: job.error });
    }

    console.log(`[VideoEngine][${jobId}] Step 2: Probing video...`);
    const probe = await probeVideo(inputPath);
    if (!probe || probe.error) {
      console.error(`[VideoEngine][${jobId}] ERROR: Probe failed: ${probe?.error || 'Unknown'}`);
      job.status = 'error';
      job.error = probe?.error || 'Invalid video file format';
      return res.json({ jobId, status: 'error', error: job.error });
    }

    console.log(`[VideoEngine][${jobId}] Step 3: Detecting hardware...`);
    const hw = await detectHardwareAccel();
    console.log(`[VideoEngine][${jobId}] Step 4: Starting process (HW: ${hw})`);

    if (req.file) config.logoPath = req.file.path;

    // --- Fix: Define outputPath ---
    const outputFilename = `branded_${Date.now()}_${videoFilename}`;
    const outputPath = path.resolve(videoDir, outputFilename);
    const outputUrl = publicUrl(clinicId, 'videos', outputFilename);
    job.outputUrl = outputUrl;
    // ------------------------------

    processVideo(inputPath, outputPath, config, (progressData) => {
      const j = jobs.get(jobId);
      if (j) { j.progress = progressData.progress; j.phase = progressData.phase; }
    }).then(({ outputPath: outPath, size, duration, hw: hwUsed, crf, preset }) => {
      const j = jobs.get(jobId);
      if (j) {
        j.status = 'done'; // Changed from completed to done
        j.progress = 100;
        j.outputUrl = publicUrl(clinicId, 'videos', path.basename(outPath));
        j.sizeMB = size;
        j.encodeTime = `${duration}s`;
        j.hwUsed = hwUsed;
        j.crf = crf;
        j.preset = preset;
      }
      console.log(`[VideoEngine][${jobId}] Done: ${size}MB in ${duration}s (${hwUsed})`);
    }).catch((err) => {
      const j = jobs.get(jobId);
      if (j) { j.status = 'error'; j.error = err.message; } // Changed from failed to error
      console.error(`[VideoEngine][${jobId}] Error: ${err.message}`);
    });

    res.json({ jobId, status: 'processing', progress: 5, hw });
  } catch (err) {
    console.error('[storage/process-video]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /video-status/:jobId ─────────────────────────────────────────────────
router.get('/video-status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ ...job });
});

// ── POST /generate-pdf ───────────────────────────────────────────────────────
router.post('/generate-pdf', async (req, res) => {
  try {
    const { clinicId, canvas } = req.body;
    if (!clinicId || !Array.isArray(canvas) || !canvas.length) {
      return res.status(400).json({ error: 'clinicId and canvas (non-empty array) required' });
    }

    const { generateBrandedPDF } = await import('../services/pdfGenerator.js');
    const buffer = await generateBrandedPDF(clinicId, canvas);

    const dir = path.join(BASE_DIR, clinicId, 'documents');
    fs.mkdirSync(dir, { recursive: true });
    const fileId = uuidv4();
    const filePath = path.join(dir, `${fileId}.pdf`);
    fs.writeFileSync(filePath, buffer);

    res.json({ url: publicUrl(clinicId, 'documents', `${fileId}.pdf`), fileId });
  } catch (err) {
    console.error('[storage/generate-pdf]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /generate-summary ───────────────────────────────────────────────────
router.post('/generate-summary', async (req, res) => {
  try {
    const { clinicId, bookingId } = req.body;
    if (!clinicId || !bookingId) {
      return res.status(400).json({ error: 'clinicId and bookingId required' });
    }

    const { generateSessionSummaryPDF } = await import('../services/pdfGenerator.js');
    const buffer = await generateSessionSummaryPDF(bookingId, clinicId);

    const dir = path.join(BASE_DIR, clinicId, 'summaries');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${bookingId}.pdf`);
    fs.writeFileSync(filePath, buffer);

    res.json({ url: publicUrl(clinicId, 'summaries', `${bookingId}.pdf`) });
  } catch (err) {
    console.error('[storage/generate-summary]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Bundles helpers (SQLite) ──────────────────────────────────────────────────
async function getBundlesList(clinicId) {
  try {
    const { getDb } = await import('../services/sqlite.js');
    const db = getDb();
    if (!db) return [];
    const rows = clinicId === 'platform'
      ? db.prepare("SELECT * FROM bundles WHERE clinic_id = 'platform'").all()
      : db.prepare('SELECT * FROM bundles WHERE clinic_id = ?').all(clinicId);
    return rows.map(r => ({
      ...r,
      resources: r.resources ? JSON.parse(r.resources) : [],
    }));
  } catch (err) {
    console.warn('[storage/getBundlesList]', err.message);
    return [];
  }
}

async function deleteBundle(clinicId, bundleId) {
  const { getDb } = await import('../services/sqlite.js');
  const db = getDb();
  if (!db) throw new Error('Database not configured');
  db.prepare('DELETE FROM bundles WHERE id = ? AND clinic_id = ?').run(bundleId, clinicId);
}

// ── GET /bundles/:clinicId ────────────────────────────────────────────────────
router.get('/bundles/:clinicId', async (req, res) => {
  try {
    const bundles = await getBundlesList(req.params.clinicId);
    res.json(bundles);
  } catch (err) {
    console.error('[storage/bundles]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /bundles/:clinicId/:bundleId ──────────────────────────────────────
router.delete('/bundles/:clinicId/:bundleId', async (req, res) => {
  try {
    await deleteBundle(req.params.clinicId, req.params.bundleId);
    res.json({ success: true });
  } catch (err) {
    console.error('[storage/bundles/delete]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /bundles/:clinicId ────────────────────────────────────────────────────
router.post('/bundles/:clinicId', async (req, res) => {
  try {
    const { getDb } = await import('../services/sqlite.js');
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Database not configured' });

    const { name, description, condition, resources, recommendedSessions } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO bundles (id, clinic_id, name, description, condition, resources, recommended_sessions, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.clinicId, name, description, condition,
      JSON.stringify(resources || []), recommendedSessions || 4, new Date().toISOString());
    res.json({ id });
  } catch (err) {
    console.error('[storage/bundles/create]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /bundles/:clinicId/:bundleId ─────────────────────────────────────────
router.put('/bundles/:clinicId/:bundleId', async (req, res) => {
  try {
    const { getDb } = await import('../services/sqlite.js');
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Database not configured' });

    const { name, description, condition, resources, recommendedSessions } = req.body;
    db.prepare(`
      UPDATE bundles SET name = ?, description = ?, condition = ?, resources = ?, recommended_sessions = ?
      WHERE id = ? AND clinic_id = ?
    `).run(name, description, condition, JSON.stringify(resources || []),
      recommendedSessions || 4, req.params.bundleId, req.params.clinicId);
    res.json({ success: true });
  } catch (err) {
    console.error('[storage/bundles/update]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
