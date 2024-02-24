// item.model.ts
import { Timestamp } from 'firebase/firestore';


export interface Item {
    id?: string;
    description: string;
    isPickedUp: boolean;
    itemId: string;
    location: string;
    name: string;
    owner?: string; // Optional, if you want to track who owns the item
    lastUpdated?: Timestamp;
    // Add any other properties relevant to your items

}