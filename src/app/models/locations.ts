//location.ts
export interface Room {
    location: string; // This seems to be a unique identifier like 'X1Y2'
    name: string; // The name of the room
    description: string; // A description for the room
    visited: boolean; // Whether the room has been visited or not
  }