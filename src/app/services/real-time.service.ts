import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class RealTimeService {
  private socket?: Socket; // Marked as optional
  private eventNames = ['character-enter', 'character-leave', 'item-picked-up', 'item-drop']; // Add all event names here


  constructor() {
    /* this.socket = io('http://localhost:3000'); */
    console.log('Socket initialized');
  }

  connectToGameServer() {
    if (this.socket && this.socket.connected) {
      console.log('Already connected to game server');
      this.disconnectFromGameServer();
      return;
    }
    this.socket = io('http://localhost:3000');
    console.log('Socket initialized and connected to game server');
    this.setupListeners(); // Set up event listeners
  }

  disconnectFromGameServer() {
    if (this.socket) {
      this.removeAllListeners(); // Remove all listeners before disconnecting
      this.socket.disconnect();
      console.log('Disconnected from game server');
    }
  }

  joinRoom(roomLocation: string, characterName: string, characterId: string) {
    console.log(`Joining room: ${roomLocation}`);
    this.emitEvent('join-room', { room: roomLocation, characterName, characterId });
  }

  leaveRoom(roomLocation: string, characterName: string, characterId: string) {
    console.log(`Leaving room: ${roomLocation}`);
    this.emitEvent('leave-room', { room: roomLocation, characterName, characterId });
  }

  // Listen for other characters entering the room
  onCharacterEnter(callback: (message: string) => void) {
    this.onEvent('character-enter', callback);
  }

  // Listen for other characters leaving the room
  onCharacterLeave(callback: (message: string) => void) {
    this.onEvent('character-leave', callback);
  }

  emitCharacterEnter(roomLocation: string, message: string, characterId: string) {
    console.log(`Emitting 'character-enter' event`);
    console.log(`Room Location: ${roomLocation}`);
    console.log(`Message: ${message}`);
    console.log(`Character ID: ${characterId}`);
    this.emitEvent('character-enter', { room: roomLocation, message, characterId });
    console.log(`Event emitted`);
  }
  
  
  emitCharacterLeave(roomLocation: string, message: string, characterId: string) {
    console.log(`Emitting 'character-enter' event`);
    console.log(`Room Location: ${roomLocation}`);
    console.log(`Message: ${message}`);
    console.log(`Character ID: ${characterId}`);
    this.emitEvent('character-leave', { room: roomLocation, message, characterId });
  }

  emitJoinRoom(roomLocation: string, message: string, characterId: string) {
    this.emitEvent('join-room', { room: roomLocation, message, characterId });
  }
  
  emitLeaveRoom(roomLocation: string, message: string, characterId: string) {
    this.emitEvent('leave-room', { room: roomLocation, message, characterId });
  }

  onItemPickedUp(callback: (data: { message: string; characterId: string }) => void) {
    console.log('Listening for item pickup events');
    this.onEvent('item-picked-up', callback);
  }

  emitItemPickup(roomLocation: string, message: string, characterId: string) {
    this.emitEvent('item-picked-up', { room: roomLocation, message, characterId });
  }

  removeItemPickedUpListener() {
    if (this.socket) {
      this.socket.off('item-picked-up');
    } else {
      console.error('Cannot remove item pickup listener, socket not connected');
    }
  }

  onItemDrop(callback: (data: { message: string; characterId: string }) => void) {
    console.log('listening for item drop events');
    this.onEvent('item-drop', callback);
  }

  emitItemDrop(roomLocation: string, message: string, characterId: string) {
    this.emitEvent('item-drop', { room: roomLocation, message, characterId });
  }

  removeItemDropListener() {
    if (this.socket) {
      this.socket.off('item-drop');
    } else {
      console.error('Cannot remove item drop listener, socket not connected');
    }
  }

  private emitEvent(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.error(`Cannot emit ${event}, socket not connected`);
    }
  }
  
  private onEvent(event: string, callback: (data: any) => void) {
    if (this.socket && this.socket.connected) {
      this.socket.on(event, callback);
    } else {
      console.error(`Cannot listen to ${event}, socket not connected or disconnected`);
    }
  }

  private removeAllListeners() {
    const socket = this.socket;
    if (socket) {
      this.eventNames.forEach(eventName => {
        socket.off(eventName);
      });
    }
  }

  private setupListeners() {
    this.onCharacterEnter((data) => {
      // Your logic to handle character enter event
    });
  
    this.onCharacterLeave((data) => {
      // Your logic to handle character leave event
    });
  
    this.onItemPickedUp((data) => {
      // Your logic to handle item pickup event
    });
  
    this.onItemDrop((data) => {
      // Your logic to handle item drop event
    });
  
    // ... setup other listeners as needed ...
  }
  
  // ...other methods...
}
