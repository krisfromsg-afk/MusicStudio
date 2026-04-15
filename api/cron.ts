import admin from 'firebase-admin';

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

export default async function handler(req, res) {
  // Simple security check for cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const snapshot = await db.collection('generations')
      .where('status', '==', 'complete')
      .where('completedAt', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ message: "No old files to clean up." });
    }

    let deletedCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const storagePath = data.storagePath;

      if (storagePath) {
        try {
          await bucket.file(storagePath).delete();
        } catch (storageError) {
          if (storageError.code !== 404) {
            console.error(`Failed to delete file ${storagePath}:`, storageError);
            continue;
          }
        }
      }

      await doc.ref.delete();
      deletedCount++;
    }

    return res.status(200).json({ message: `Cleanup finished. Deleted: ${deletedCount}` });

  } catch (error) {
    console.error("Error in cron:", error);
    return res.status(500).json({ error: error.message });
  }
}
