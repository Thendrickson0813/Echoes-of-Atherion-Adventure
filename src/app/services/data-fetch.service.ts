import { Injectable } from '@angular/core';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { map, first } from 'rxjs/operators';
import { Item } from '../models/item';

@Injectable({
  providedIn: 'root'
})
export class DataFetchService {
  private db = getFirestore();

  constructor() { }

  getItemsInRoom(roomLocation: string): Observable<Item[]> {
    const itemsRef = query(collection(this.db, 'items'), where('location', '==', roomLocation));
    return from(getDocs(itemsRef)).pipe(
      map(querySnapshot =>
        querySnapshot.docs.map(docSnapshot => docSnapshot.data() as Item)
      )
    );
  }

  isItemInRoom(itemName: string, roomLocation: string): Observable<boolean> {
    const itemsRef = query(collection(this.db, 'items'), where('location', '==', roomLocation), where('name', '==', itemName));
    return from(getDocs(itemsRef)).pipe(
      map(querySnapshot =>
        querySnapshot.docs.some(docSnapshot => {
          const item = docSnapshot.data() as Item;
          return !item.isPickedUp;
        }),
      ),
      first()
    );
  }
}
