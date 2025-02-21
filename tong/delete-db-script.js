const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert("./tong-twist-firebase-adminsdk-fbsvc-ed70621681.json"),
  databaseURL: "https://tong-twist.firebaseio.com"
});
const db = admin.firestore();

const callsCollection = db.collection('calls');

async function deleteDocumentsInCollection(collectionRef) {
    try {
        const snapshot = await collectionRef.get();
        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log('Successfully deleted all documents in the collection.');
    } catch (error) {
        console.error('Error deleting documents:', error);
    }
}


deleteDocumentsInCollection(callsCollection)
    .then(() => {
        console.log('Delete operation completed.');
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });

