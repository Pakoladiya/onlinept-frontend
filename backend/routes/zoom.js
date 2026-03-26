import { Router } from 'express';
import axios from 'axios';
import crypto from 'crypto';

/**
 * Zoom Router
 *
 * Creates Zoom meetings via Server-to-Server OAuth.
 * Docs: https://developers.zoom.us/docs/internal-apps/s2s-oauth/
 *
 * Env vars required:
 *   ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
 */

const router = Router();

// In-memory meeting store — replace with Firestore
const meetings = new Map();

async function getZoomToken() {
  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) return null;

  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
  const response = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    null,
    { headers: { Authorization: `Basic ${credentials}` } }
  );
  return response.data.access_token;
}

/**
 * POST /api/zoom/create-meeting
 * Body: { bookingId, dateTime (ISO), duration, patientName }
 * Returns: { joinUrl, startUrl, meetingId, password }
 */
router.post('/create-meeting', async (req, res) => {
  const { bookingId, dateTime, duration = 30, patientName } = req.body;

  if (!bookingId || !dateTime) {
    return res.status(400).json({ error: 'bookingId and dateTime are required' });
  }

  const isMock = !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_ACCOUNT_ID;

  if (isMock) {
    const mock = {
      meetingId: `MOCK_${Date.now()}`,
      joinUrl: `https://zoom.us/j/mock-${bookingId}`,
      startUrl: `https://zoom.us/s/mock-${bookingId}`,
      password: 'mock123',
    };
    meetings.set(bookingId, mock);
    return res.json({ ...mock, mode: 'mock' });
  }

  try {
    const token = await getZoomToken();
    const meeting = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: `Physio Consultation - ${patientName || 'Patient'}`,
        type: 2,
        start_time: dateTime,
        duration,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          waiting_room: true,
          auto_recording: 'none',
        },
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    const data = {
      meetingId: String(meeting.data.id),
      joinUrl: meeting.data.join_url,
      startUrl: meeting.data.start_url,
      password: meeting.data.password,
    };

    meetings.set(bookingId, data);
    res.json({ ...data, mode: 'live' });
  } catch (err) {
    console.error('[Zoom Error]', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create Zoom meeting', details: err.response?.data });
  }
});

/**
 * GET /api/zoom/meeting/:bookingId
 * Returns stored meeting URLs for a booking.
 */
router.get('/meeting/:bookingId', (req, res) => {
  const meeting = meetings.get(req.params.bookingId);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found for this booking' });
  }
  res.json({ meeting });
});

/**
 * POST /api/zoom/recording/:meetingId
 * Fetches recording download URL after session.
 * Requires ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET.
 */
router.post('/recording/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  const isMock = !process.env.ZOOM_CLIENT_ID;

  if (isMock) {
    return res.json({ recordingUrl: null, message: 'Recording not available in mock mode' });
  }

  try {
    const token = await getZoomToken();
    const recordings = await axios.get(
      `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const downloadToken = recordings.data.recording_files?.[0]?.download_url;
    res.json({ recordingUrl: downloadToken });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recording', details: err.response?.data });
  }
});

export default router;
