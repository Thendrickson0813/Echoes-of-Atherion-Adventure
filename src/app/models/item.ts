// item.model.ts

export interface Item {
    id?: string;
    description: string;
    isPickedUp: boolean;
    itemId: string;
    location: string;
    name: string;
    owner?: string; // Optional, if you want to track who owns the item
    // Add any other properties relevant to your items

}