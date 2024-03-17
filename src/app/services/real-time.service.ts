import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class RealTimeService {
  private socket?: Socket;

  constructor() {
    
    console.log('Socket initialized');
  }

  initializeSocketConnection() {
    if (!this.socket || !this.socket.connected) {
      this.socket = io('http://localhost:3000');
      console.log('Socket initialized and attempting to connect to game server');
      
      this.socket.on('connect', () => {
        console.log('Connected to game server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    } else {
      console.log('Socket already initialized');
    }
  }

  connectToGameServer() {
    if (this.socket?.connected) {
      console.log('Already connected to game server');
      return;
    }

    this.socket = io('http://localhost:3000', { withCredentials: true });

    this.socket.on('connect', () => {
      console.log('Connected to game server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  disconnectFromGameServer() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('Disconnected from game server');
    }
  }

  joinRoom(roomLocation: string, characterName: string, characterId: string) {
    if (this.socket) {
      console.log(`Joining room: ${roomLocation}`);
      this.socket.emit('join-room', { room: roomLocation, characterName, characterId });
    }
  }

  leaveRoom(roomLocation: string, characterName: string, characterId: string) {
    if (this.socket) {
      console.log(`Leaving room: ${roomLocation}`);
      this.socket.emit('leave-room', { room: roomLocation, characterName, characterId });
    }
  }

  // Listen for other characters entering the room
  onCharacterEnter(callback: (message: string) => void) {
    if (this.socket) {
      this.socket.on('character-enter', callback);
    }
  }

  // Listen for other characters leaving the room
  onCharacterLeave(callback: (message: string) => void) {
    if (this.socket) {
      this.socket.on('character-leave', callback);
    }
  }

  emitCharacterEnter(roomLocation: string, message: string, characterId: string) {
    if (this.socket) {
      console.log(`Emitting 'character-enter' event`);
      console.log(`Room Location: ${roomLocation}`);
      console.log(`Message: ${message}`);
      console.log(`Character ID: ${characterId}`);
      this.socket.emit('character-enter', { room: roomLocation, message, characterId });
      console.log(`Event emitted`);
    }
  }

  emitCharacterLeave(roomLocation: string, message: string, characterId: string) {
    if (this.socket) {
      console.log(`Emitting 'character-enter' event`);
      console.log(`Room Location: ${roomLocation}`);
      console.log(`Message: ${message}`);
      console.log(`Character ID: ${characterId}`);
      this.socket.emit('character-leave', { room: roomLocation, message, characterId });
    }
  }

  emitJoinRoom(roomLocation: string, message: string, characterId: string) {
    if (this.socket) {
      this.socket.emit('join-room', { room: roomLocation, message, characterId });
    }
  }

  emitLeaveRoom(roomLocation: string, message: string, characterId: string) {
    if (this.socket) {
      this.socket.emit('leave-room', { room: roomLocation, message, characterId });
    }
  }

  onItemPickedUp(callback: (data: { message: string; characterId: string }) => void) {
    if (this.socket) {
      console.log('Listening for item pickup events');
      this.socket.on('item-picked-up', callback);
    }
  }
  emitItemPickup(roomLocation: string, message: string, characterId: string) {
    if (this.socket) {
      this.socket.emit('item-picked-up', { room: roomLocation, message, characterId });
    }
  }

  removeItemPickedUpListener() {
    if (this.socket) {
      console.log('Removing item pickup listener');
      this.socket.off('item-picked-up');
    }
  }

  onItemDrop(callback: (data: { message: string; characterId: string }) => void) {
    console.log('listening for item drop events');
    if (this.socket) {
      this.socket.on('item-drop', callback);
    }
  }

  emitItemDrop(roomLocation: string, message: string, characterId: string) {
    if (this.socket) {
      console.log(`Emitting 'item-drop' event`);
      this.socket.emit('item-drop', { room: roomLocation, message, characterId });
    }
  }

  removeItemDropListener() {
    if (this.socket) {
      console.log('Removing item drop listener')
      this.socket.off('item-drop');
    }
  }
  // ...other methods...
}
