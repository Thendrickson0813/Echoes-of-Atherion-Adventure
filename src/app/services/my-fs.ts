import { Injectable } from '@angular/core';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  QueryDocumentSnapshot,
  DocumentData,
  getDocs,
  QuerySnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MyFs {
  private db = getFirestore();
  private auth = getAuth();

  constructor() { }

  // Method to add data to a Firestore collection
  async addData(collectionPath: string, data: any): Promise<any> {
    const user = this.auth.currentUser;
    if (user) {
      return await addDoc(collection(this.db, collectionPath), {
        ...data,
        userId: user.uid, // Append the user's UID to the data
      });
    } else {
      throw new Error('No authenticated user');
    }
  }

  // Method to get data from a Firestore collection
  getData(collectionPath: string): Observable<any[]> {
    const q = query(collection(this.db, collectionPath));
    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot<DocumentData>) =>
        querySnapshot.docs.map(doc => doc.data())
      )
    );
  }

  // Method to get characters by user ID
  getCharactersByUserId(userId: string): Observable<any[]> {
    const q = query(collection(this.db, 'characters'), where('userId', '==', userId));
    return from(getDocs(q)).pipe(
      map((querySnapshot: QuerySnapshot<DocumentData>) =>
        querySnapshot.docs.map(doc => ({
          ...doc.data(),
          documentId: doc.id // Include the Firestore Document ID
        }))
      )
    );
  }
 // New method to get the document ID by characterId
 async getDocumentIdByCharacterId(characterId: string): Promise<string | null> {
  const characterQuery = query(collection(this.db, 'characters'), where('characterId', '==', characterId));
  const querySnapshot = await getDocs(characterQuery);

  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id; // Return the first document's ID
  }
  return null; // Return null if no document found
}
updateCharacterOnlineStatus(characterId: string, isOnline: boolean): Promise<void> {
  const characterRef = doc(this.db, 'characters', characterId);
  return updateDoc(characterRef, { isOnline });
}

  // Additional methods for updating, deleting, etc.
}
