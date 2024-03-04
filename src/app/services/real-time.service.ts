import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class RealTimeService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // Your server URL
  }

  joinRoom(roomLocation: string) {
    this.socket.emit('join-room', roomLocation);
  }

  onItemPickedUp(callback: (message: string) => void) {
    this.socket.on('item-picked-up', callback);
  }

  // ...other methods...
}
