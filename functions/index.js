/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.checkForInactiveCharacters = functions.pubsub.schedule('every 30 minutes').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  const thresholdSeconds = 20 * 60; // 30 minutes
  const thresholdMillis = now.toMillis() - thresholdSeconds * 1000;
  const thresholdTimestamp = admin.firestore.Timestamp.fromMillis(thresholdMillis);

  const charactersRef = admin.firestore().collection('characters');
  // Query for characters that are online and last active time is older than threshold
  const snapshot = await charactersRef
                      .where('isOnline', '==', true)
                      .where('lastActiveTime', '<=', thresholdTimestamp)
                      .get();

  if (!snapshot.empty) {
    snapshot.forEach(doc => {
      doc.ref.update({ isOnline: false });
      console.log(`Character ${doc.id} set as offline due to inactivity.`);
    });
  } else {
    console.log('No inactive characters found.');
  }
});




// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
