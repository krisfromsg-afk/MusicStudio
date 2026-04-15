import admin from 'firebase-admin';
import axios from 'axios';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

function getFileExtension(url) {
  if (!url) return 'mp3';
  if (url.includes('.mp4')) return 'mp4';
  if (url.includes('.wav')) return 'wav';
  if (url.includes('.mid') || url.includes('.midi')) return 'midi';
  return 'mp3';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { taskId, status, data } = req.body;

    if (!taskId) {
      return res.status(400).send("Missing taskId");
    }

    const docRef = db.collection('generations').doc(taskId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.warn(`Webhook received for unknown taskId: ${taskId}`);
      return res.status(404).send("Task not found");
    }

    const generationData = docSnap.data();
    const uid = generationData.uid;

    if (status === 'text' || status === 'first') {
      await docRef.update({
        status: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.status(200).send("Status updated");
    }

    if (status === 'failed') {
      await docRef.update({
        status: 'failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const userRef = db.collection('users').doc(uid);
      await userRef.update({
        credits: admin.firestore.FieldValue.increment(1)
      });

      return res.status(200).send("Failed status handled and refunded");
    }

    if (status === 'complete') {
      const sourceUrl = data?.audio_url || data?.video_url || data?.url;

      if (!sourceUrl) {
        return res.status(400).send("Missing source URL in complete status");
      }

      const ext = getFileExtension(sourceUrl);
      const fileName = `${taskId}.${ext}`;
      const storagePath = `outputs/${fileName}`;

      const response = await axios({
        method: 'get',
        url: sourceUrl,
        responseType: 'stream'
      });

      const file = bucket.file(storagePath);
      const writeStream = file.createWriteStream({
        public: true,
        metadata: {
          contentType: ext === 'mp4' ? 'video/mp4' : ext === 'wav' ? 'audio/wav' : ext === 'midi' ? 'audio/midi' : 'audio/mpeg'
        }
      });

      response.data.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      const bucketName = bucket.name;
      const publicGcsUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;

      await docRef.update({
        status: 'complete',
        audioUrl: publicGcsUrl,
        storagePath: storagePath,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        resultData: data
      });

      return res.status(200).send("Task completed and file saved");
    }

    return res.status(200).send("Status received");

  } catch (error) {
    console.error("Error in sunoWebhook:", error);
    return res.status(500).send("Internal Server Error");
  }
}
