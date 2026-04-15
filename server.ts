import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import * as admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// If FIREBASE_SERVICE_ACCOUNT_KEY is not provided, we will log a warning and the webhook will fail.
let firebaseAdminInitialized = false;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseAdminInitialized = true;
    console.log("Firebase Admin initialized successfully.");
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Webhook will not be able to update Firestore.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
}

const db = firebaseAdminInitialized ? admin.firestore() : null;

// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Initialize Gemini API
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Webhook needs raw body for signature verification
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
      console.error("Stripe is not configured.");
      res.status(500).send("Stripe is not configured.");
      return;
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.error("Webhook secret or signature missing.");
      res.status(400).send("Webhook secret or signature missing.");
      return;
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.userId;
      const creditsStr = session.metadata?.credits;
      
      if (userId && creditsStr && db) {
        const credits = parseInt(creditsStr, 10);
        
        try {
          // 1. Update user's credits
          const userRef = db.collection('users').doc(userId);
          await userRef.update({
            credits: admin.firestore.FieldValue.increment(credits)
          });

          // 2. Add transaction record
          await db.collection('transactions').add({
            userId: userId,
            amount: credits,
            type: 'add',
            description: `Purchased ${credits} Credits via Stripe`,
            createdAt: new Date().toISOString(),
            status: 'success',
            stripeSessionId: session.id
          });

          console.log(`Successfully added ${credits} credits to user ${userId}`);
        } catch (error) {
          console.error("Error updating Firestore:", error);
          res.status(500).send("Error updating database");
          return;
        }
      } else {
        console.warn("Missing userId, credits, or Firebase Admin not initialized.", { userId, creditsStr, firebaseAdminInitialized });
      }
    }

    res.json({ received: true });
  });

  // Regular JSON parsing for other routes
  app.use(express.json());

  app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) {
      res.status(500).json({ error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to secrets." });
      return;
    }

    const { priceId, userId, credits } = req.body;

    if (!userId || !credits) {
      res.status(400).json({ error: "Missing userId or credits" });
      return;
    }

    try {
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/pricing`,
        metadata: {
          userId: userId,
          credits: credits.toString()
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/generate-blueprint', async (req, res) => {
    if (!ai) {
      res.status(500).json({ error: "Gemini API is not configured." });
      return;
    }

    const { coreIdea, style, chords, instruments, systemInstruction } = req.body;

    if (!coreIdea || !style || !instruments) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    try {
      const prompt = `
        Core Idea: ${coreIdea}
        Desired Style: ${style}
        Chords (optional): ${chords}
        Main Instruments: ${instruments}
        
        Please generate the music blueprint in JSON format.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "You are an expert music producer. Generate a JSON blueprint for a song based on the user's input. The JSON must have the following keys: 'title', 'style', 'lyrics'.",
          responseMimeType: 'application/json',
        }
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Error generating blueprint:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/kie', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];

    try {
      if (!firebaseAdminInitialized || !db) {
        return res.status(500).json({ error: 'Firebase Admin not initialized' });
      }

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
        const endpointMap: Record<string, string> = {
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

        // We use dynamic import for axios or just fetch
        const response = await fetch(`https://api.kie.ai/api/v1${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(finalPayload)
        });

        const data = await response.json();
        const taskId = data?.taskId || data?.data?.taskId || data?.id;
        
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
      } catch (error: any) {
        // Rollback credit
        await userRef.update({ credits: admin.firestore.FieldValue.increment(1) });
        throw error;
      }
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
