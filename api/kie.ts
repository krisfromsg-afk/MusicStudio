import admin from 'firebase-admin';
import axios from 'axios';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle newlines in private key securely
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const { action, ...payload } = req.body;

    // 1. Check credits
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists || userDoc.data()?.credits < 1) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // 2. Deduct credit
    await userRef.update({ credits: admin.firestore.FieldValue.increment(-1) });

    try {
      // 3. Call KIE API
      const endpointMap = {
        generateMusic: '/generate',
        extendMusic: '/extend',
        uploadAndExtendAudio: '/upload-and-extend',
        coverGenerate: '/cover',
        uploadAndCoverAudio: '/upload-and-cover',
        separateVocals: '/separate-vocals',
        addVocals: '/add-vocals',
        addInstrumental: '/add-instrumental',
        replaceSection: '/replace-section',
        generateLyrics: '/generate-lyrics',
        getTimestampedLyrics: '/timestamped-lyrics',
        boostMusicStyle: '/boost-style',
        generatePersona: '/generate-persona',
        mashupMusic: '/mashup',
        createMusicVideo: '/create-video',
        convertToWav: '/convert-wav',
        generateMidi: '/generate-midi'
      };

      const endpoint = endpointMap[action];
      if (!endpoint) throw new Error('Invalid action');

      const finalPayload = { ...payload, callBackUrl: process.env.WEBHOOK_URL };

      const response = await axios.post(`https://api.kie.ai/api/v1${endpoint}`, finalPayload, {
        headers: {
          'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const taskId = response.data?.taskId || response.data?.data?.taskId || response.data?.id;
      if (!taskId) throw new Error("No taskId returned from KIE API");

      await db.collection('generations').doc(taskId).set({
        uid,
        taskId,
        taskType: action,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        payload_sent: finalPayload
      });

      return res.status(200).json({ success: true, taskId });
    } catch (error) {
      // Rollback credit
      await userRef.update({ credits: admin.firestore.FieldValue.increment(1) });
      throw error;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
