import { exec, execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const isWindows = process.platform === 'win32';

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[VideoEngine ${ts}][${level}] ${msg}`);
}

// ── Detect GPU Acceleration ─────────────────────────────────────────────────

// ── Probe video metadata ───────────────────────────────────────────────────
export async function probeVideo(inputPath) {
  const normalizedPath = path.normalize(inputPath);
  if (!fs.existsSync(normalizedPath)) {
    log(`File not found: ${normalizedPath}`, 'ERROR');
    return null;
  }
  
  const args = [
    '-v', 'error',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    normalizedPath
  ];
  
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', args);
    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (data) => stdout += data.toString());
    ffprobe.stderr.on('data', (data) => stderr += data.toString());

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        log(`Probe failed for ${normalizedPath} (code ${code}): ${stderr}`, 'WARN');
        return resolve({ error: `Probe failed: ${stderr || 'Unknown error'}` });
      }
      try {
        const data = JSON.parse(stdout);
        const video = data.streams?.find(s => s.codec_type === 'video');
        const audio = data.streams?.find(s => s.codec_type === 'audio');
        const fmt = data.format;

        if (!video) {
          log(`No video stream found in ${normalizedPath}`, 'WARN');
          return resolve({ error: 'No video stream found' });
        }

        const width = video.width || 0;
        const height = video.height || 0;

        resolve({
          width,
          height,
          duration: parseFloat(fmt?.duration || 0),
          fps: video.r_frame_rate ? (video.r_frame_rate.includes('/') ? eval(video.r_frame_rate) : parseFloat(video.r_frame_rate)) : 30,
          bitrate: parseInt(fmt?.bit_rate || 0),
          videoCodec: video.codec_name || 'unknown',
          audioCodec: audio?.codec_name || 'none',
          size: parseInt(fmt?.size || 0),
          ratio: width && height ? (width / height).toFixed(3) : '16:9',
          hasAudio: !!audio,
          hasVideo: !!video,
          path: inputPath,
        });
      } catch (e) {
        log(`JSON parse failed for probe: ${e.message}`, 'ERROR');
        resolve({ error: `Failed to parse video info: ${e.message}` });
      }
    });

    ffprobe.on('error', (err) => {
      log(`FFprobe execution error: ${err.message}`, 'ERROR');
      resolve({ error: `FFprobe execution failed: ${err.message}` });
    });
  });
}

export async function detectHardwareAccel() {
  return new Promise((resolve) => {
    const nv = spawn('ffmpeg', ['-h', 'encoder=h264_nvenc']);
    nv.on('close', (code) => {
      if (code === 0) return resolve('nvenc');
      const qsv = spawn('ffmpeg', ['-h', 'encoder=h264_qsv']);
      qsv.on('close', (code) => {
        if (code === 0) return resolve('qsv');
        const va = spawn('ffmpeg', ['-h', 'encoder=h264_vaapi']);
        va.on('close', (code) => {
          if (code === 0) return resolve('vaapi');
          resolve('software');
        });
      });
    });
  });
}

// ── Build FFmpeg filter_complex for all branding layers ────────────────────
function buildFilterComplex(cfg, probe) {
  const filters = [];
  
  // ── Determine Target Dimensions ──
  let targetW = cfg.width || 1280;
  let targetH = cfg.height || 720;

  if (cfg.targetAspect === '9:16') {
    targetW = Math.round((targetH * 9) / 16);
  } else if (cfg.targetAspect === '1:1') {
    targetW = targetH;
  }

  const z = (cfg.videoZoom || 100) / 100;
  const offX = cfg.videoOffsetX || 0;
  const offY = cfg.videoOffsetY || 0;
  
  // 1. Scale with zoom (force_original_aspect_ratio=increase ensures we fill the box)
  // 2. Crop with user offsets:
  //    Default center: (iw-ow)/2
  //    User offset: offX% of iw
  filters.push(`[0:v]scale=iw*${z}:ih*${z}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH}:(iw-ow)/2+(iw*${offX/100}):(ih-oh)/2+(ih*${offY/100}),setsar=1[v_scaled]`);

  let currentV = '[v_scaled]';

  // ── Logo Overlay ──
  if (cfg.logoOverlay?.enabled && cfg.logoPath) {
    const logoSizePct = cfg.logoOverlay.size || 15;
    const logoTargetW = Math.round(targetW * logoSizePct / 100);
    const opacity = (cfg.logoOverlay.opacity ?? 100) / 100;

    let x, y;
    if (cfg.logoOverlay.x !== undefined && cfg.logoOverlay.y !== undefined) {
      // Use custom percentage-based coordinates
      x = `(W-w)*${cfg.logoOverlay.x}/100`;
      y = `(H-h)*${cfg.logoOverlay.y}/100`;
    } else {
      // Fallback to presets
      const pos = cfg.logoOverlay.position || 'bottom-right';
      const m = 20;
      if (pos === 'top-left') { x = m; y = m; }
      else if (pos === 'top-right') { x = `W-w-${m}`; y = m; }
      else if (pos === 'bottom-left') { x = m; y = `H-h-${m}`; }
      else { x = `W-w-${m}`; y = `H-h-${m}`; }
    }
    
    filters.push(`[1:v]scale=${logoTargetW}:-1[v_logo_ready]`);
    filters.push(`${currentV}[v_logo_ready]overlay=${x}:${y}:format=auto:alpha=${opacity}[v_logo]`);
    currentV = '[v_logo]';
  }

  // ── Text Watermark ──
  if (cfg.textWatermark?.enabled && cfg.textWatermark.text) {
    let x, y;
    const m = 20;
    
    if (cfg.textWatermark.x !== undefined && cfg.textWatermark.y !== undefined) {
      x = `(W-tw)*${cfg.textWatermark.x}/100`;
      y = `(H-th)*${cfg.textWatermark.y}/100`;
    } else {
      const pos = cfg.textWatermark.position || 'bottom-left';
      x = m; y = `H-th-${m}`;
      if (pos === 'top-left') { x = m; y = m; }
      else if (pos === 'top-center') { x = '(W-tw)/2'; y = m; }
      else if (pos === 'top-right') { x = `W-tw-${m}`; y = m; }
      else if (pos === 'bottom-center') { x = '(W-tw)/2'; y = `H-th-${m}`; }
      else if (pos === 'bottom-right') { x = `W-tw-${m}`; y = `H-th-${m}`; }
    }

    const color = cfg.textWatermark.color || '#ffffff';
    const size = cfg.textWatermark.fontSize || 24;
    const safeText = cfg.textWatermark.text.replace(/'/g, "''").replace(/:/g, '\\:');
    const font = isWindows ? "fontfile='C\\:/Windows/Fonts/arial.ttf':" : '';
    filters.push(`${currentV}drawtext=${font}text='${safeText}':fontsize=${size}:fontcolor=${color}:x=${x}:y=${y}:borderw=2:bordercolor=black@0.4[v_text]`);
    currentV = '[v_text]';
  }

  // Final Main segment
  filters.push(`${currentV}setsar=1[v_main]`);

  // Build the Full Concat Chain if Intro/Outro exists
  let segments = [];
  const fontArg = isWindows ? "fontfile='C\\:/Windows/Fonts/arial.ttf':" : '';

  if (cfg.intro?.enabled) {
    const dur = cfg.intro.duration || 3;
    const bg = cfg.intro.bgColor || '#007AFF';
    const text = (cfg.intro.text || cfg.clinicName || '').replace(/'/g, "''").replace(/:/g, '\\:');
    filters.push(`color=c=${bg}:s=${targetW}x${targetH}:d=${dur}:r=30,drawtext=${fontArg}text='${text}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2,fade=t=in:st=0:d=0.5,fade=t=out:st=${dur-0.5}:d=0.5[v_intro]`);
    filters.push(`anullsrc=r=48000:cl=stereo:d=${dur}[a_intro]`);
    segments.push('[v_intro][a_intro]');
  }

  segments.push('[v_main][0:a]');

  if (cfg.outro?.enabled) {
    const dur = cfg.outro.duration || 5;
    const cta = (cfg.outro.ctaText || 'Book Your Session').replace(/'/g, "''").replace(/:/g, '\\:');
    const clinicName = (cfg.clinicName || '').replace(/'/g, "''").replace(/:/g, '\\:');
    const bg = cfg.outro.bgColor || '#007AFF';
    filters.push(`color=c=${bg}:s=${targetW}x${targetH}:d=${dur}:r=30,drawtext=${fontArg}text='${clinicName}':fontsize=32:fontcolor=white:x=(w-text_w)/2:y=h*0.35,drawtext=${fontArg}text='${cta}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h*0.55,fade=t=in:st=0:d=0.5,fade=t=out:st=${dur-0.1}:d=0.1[v_outro]`);
    filters.push(`anullsrc=r=48000:cl=stereo:d=${dur}[a_outro]`);
    segments.push('[v_outro][a_outro]');
  }

  if (segments.length > 1) {
    filters.push(`${segments.join('')}concat=n=${segments.length}:v=1:a=1[v_out][a_out]`);
    return { filterComplex: filters.join(';'), mapV: '[v_out]', mapA: '[a_out]' };
  }

  return { filterComplex: filters.join(';'), mapV: '[v_main]', mapA: '[0:a]' };
}

// ── Position helpers ─────────────────────────────────────────────────────────

// ── CRF presets ─────────────────────────────────────────────────────────────
const RESOLUTIONS = {
  '4K':   { width: 3840, height: 2160, bitrate: '8000k', crf: 18 },
  '1080': { width: 1920, height: 1080, bitrate: '4500k', crf: 20 },
  '720':  { width: 1280, height: 720,  bitrate: '2500k', crf: 22 },
  '480':  { width: 854,  height: 480,  bitrate: '1000k', crf: 24 },
};

const PRESET_MAP = {
  medium: 'superfast',
  high: 'veryfast',
  ultra: 'slow',
};

// ── Process Video ────────────────────────────────────────────────────────────
export function processVideo(inputPath, outputPath, config, onProgress) {
  return new Promise(async (resolve, reject) => {
    const jobId = uuidv4().slice(0, 8);
    const nInput = path.normalize(inputPath);
    const nOutput = path.normalize(outputPath);
    
    log(`[${jobId}] Starting video process`);
    log(`[${jobId}] Input: ${nInput}`);
    log(`[${jobId}] Output: ${nOutput}`);

    // Progress safety: if ffmpeg stops sending updates, we simulate a slow crawl
    let lastRealProgress = 5;
    let heartbeatProgress = 5;
    const heartbeat = setInterval(() => {
      if (heartbeatProgress < 90) {
        heartbeatProgress += 1;
        const finalP = Math.max(lastRealProgress, heartbeatProgress);
        onProgress?.({ phase: 'encoding', progress: finalP });
      }
    }, 15000); // Increment every 15s if stuck

    // Probe first (Now Async)
    const probe = await probeVideo(nInput);
    if (!probe) {
      clearInterval(heartbeat);
      return reject(new Error('Failed to read video file or probe timed out'));
    }

    log(`[${jobId}] Probe: ${probe.width}x${probe.height} @ ${probe.fps}fps, ${probe.duration.toFixed(1)}s, codec: ${probe.videoCodec}`);
    onProgress?.({ phase: 'analyzing', progress: 8 });

    const hw = await detectHardwareAccel();
    log(`[${jobId}] Hardware acceleration: ${hw}`);

    // Determine target resolution

    // Effective dimensions for filters
    const quality = config.quality || 'high';
    const res = RESOLUTIONS[config.resolution] || RESOLUTIONS['1080'];
    const vcodec = hw === 'nvenc' ? 'h264_nvenc' : hw === 'qsv' ? 'h264_qsv' : hw === 'vaapi' ? 'h264_vaapi' : 'libx264';
    const extraEnc = hw === 'nvenc' ? '-preset p4 -rc:v vbr' : hw === 'qsv' ? '-preset medium -global_quality 23' : hw === 'vaapi' ? '-qp 23' : '';
    const preset = PRESET_MAP[quality] || 'veryfast';
    const crf = res.crf || 20;

    // Use unified builder for ALL layers
    const { filterComplex, mapV, mapA } = buildFilterComplex({ ...config, width: res.width, height: res.height }, probe);

    const inputPathEscaped = nInput.replace(/\\/g, '\\\\');
    const outputPathEscaped = nOutput.replace(/\\/g, '\\\\');
    
    let cmd = `ffmpeg -i "${inputPathEscaped}" `;
    if (config.logoPath) {
      const logoPathEscaped = path.normalize(config.logoPath).replace(/\\/g, '\\\\');
      cmd += `-i "${logoPathEscaped}" `;
    }
    cmd += `-filter_complex "${filterComplex}" -map "${mapV}" -map "${mapA}?" -c:v ${vcodec} -crf ${crf} -preset ${preset} ${extraEnc} -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${outputPathEscaped}" -y`;

    log(`[${jobId}] Codec: ${vcodec} | CRF: ${crf} | Preset: ${preset}`);

    let duration = probe.duration;
    let startTime = Date.now();

    const proc = exec(cmd, { maxBuffer: 100 * 1024 * 1024 }, (error, stdout, stderr) => {
      clearInterval(heartbeat);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (error) {
        log(`[${jobId}] FFmpeg failed: ${error.message}`, 'ERROR');
        const logoArg = config.logoPath ? `-i "${path.normalize(config.logoPath).replace(/\\/g, '\\\\')}" ` : '';
        const fallback = `ffmpeg -i "${nInput.replace(/\\/g, '\\\\')}" ${logoArg}-filter_complex "${filterComplex}" -map "${mapV}" -map "${mapA}?" -c:v libx264 -crf ${crf} -preset ${preset} -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${nOutput.replace(/\\/g, '\\\\')}" -y`;
        
        log(`[${jobId}] Retrying with libx264...`);

        exec(fallback, { maxBuffer: 100 * 1024 * 1024 }, (err2) => {
          if (err2) {
            log(`[${jobId}] Fallback also failed: ${err2.message}`, 'ERROR');
            return reject(new Error(err2.message));
          }
          const size = fs.existsSync(outputPath) ? (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2) : '?';
          log(`[${jobId}] Done (libx264 fallback): ${size}MB in ${elapsed}s`);
          onProgress?.({ phase: 'done', progress: 100 });
          resolve({ outputPath, size, duration: elapsed, hw: 'software', crf, preset });
        });
        return;
      }

      if (fs.existsSync(outputPath)) {
        const size = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
        log(`[${jobId}] Done: ${size}MB in ${elapsed}s | CRF=${crf} | HW=${hw} | ${vfParts.length} filters`);
        onProgress?.({ phase: 'done', progress: 100 });
        resolve({ outputPath, size, duration: elapsed, hw, crf, preset });
      } else {
        reject(new Error('Output file not created'));
      }
    });

    // Real progress from FFmpeg stderr
    proc.stderr.on('data', (chunk) => {
      const line = chunk.toString();
      const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch && duration > 0) {
        const secs = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
        const pct = Math.min(95, Math.round((secs / duration) * 100));
        lastRealProgress = pct; 
        onProgress?.({ phase: 'encoding', progress: pct });
      }
    });
  });
}

// ── Generate thumbnail ─────────────────────────────────────────────────────
export function generateThumbnail(inputPath, outputPath, timestamp = '00:00:01') {
  return new Promise((resolve, reject) => {
    const cmd = `ffmpeg -i "${inputPath}" -ss ${timestamp} -vframes 1 -q:v 2 -vf "scale=480:-1" "${outputPath}" -y`;
    exec(cmd, (err) => {
      if (err) return reject(err);
      resolve(outputPath);
    });
  });
}

// ── Merge clips ────────────────────────────────────────────────────────────
export function mergeClips(clips, outputPath, onProgress) {
  return new Promise((resolve, reject) => {
    if (clips.length < 2) return reject(new Error('Need at least 2 clips'));

    const listFile = outputPath + '.list.txt';
    const listContent = clips.map(c => `file '${c.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(listFile, listContent);

    const cmd = `ffmpeg -f concat -safe 0 -i "${listFile}" -c:v libx264 -crf 20 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 128k "${outputPath}" -y`;

    exec(cmd, { maxBuffer: 50 * 1024 * 1024 }, (err) => {
      try { fs.unlinkSync(listFile); } catch { /* ignore */ }
      if (err) return reject(err);
      resolve(outputPath);
    });
  });
}

// ── Extract audio track ────────────────────────────────────────────────────
export function extractAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const cmd = `ffmpeg -i "${inputPath}" -vn -c:a aac -b:a 192k "${outputPath}" -y`;
    exec(cmd, (err) => {
      if (err) return reject(err);
      resolve(outputPath);
    });
  });
}