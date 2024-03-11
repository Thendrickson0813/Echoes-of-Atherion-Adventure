import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class RealTimeService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000');
    console.log('Socket initialized');
  }

  joinRoom(roomLocation: string, characterName: string, characterId: string) {
    console.log(`Joining room: ${roomLocation}`);
    this.socket.emit('join-room', { room: roomLocation, characterName, characterId });
  }

  leaveRoom(roomLocation: string, characterName: string, characterId: string) {
    console.log(`Leaving room: ${roomLocation}`);
    this.socket.emit('leave-room', { room: roomLocation, characterName, characterId });
  }

  // Listen for other characters entering the room
  onCharacterEnter(callback: (message: string) => void) {
    this.socket.on('character-enter', callback);
  }

  // Listen for other characters leaving the room
  onCharacterLeave(callback: (message: string) => void) {
    this.socket.on('character-leave', callback);
  }

  emitCharacterEnter(roomLocation: string, message: string, characterId: string) {
    console.log(`Emitting 'character-enter' event`);
    console.log(`Room Location: ${roomLocation}`);
    console.log(`Message: ${message}`);
    console.log(`Character ID: ${characterId}`);
    this.socket.emit('character-enter', { room: roomLocation, message, characterId });
    console.log(`Event emitted`);
  }
  
  
  emitCharacterLeave(roomLocation: string, message: string, characterId: string) {
    console.log(`Emitting 'character-enter' event`);
    console.log(`Room Location: ${roomLocation}`);
    console.log(`Message: ${message}`);
    console.log(`Character ID: ${characterId}`);
    this.socket.emit('character-leave', { room: roomLocation, message, characterId });
  }

  emitJoinRoom(roomLocation: string, message: string, characterId: string) {
    this.socket.emit('join-room', { room: roomLocation, message, characterId });
  }
  
  emitLeaveRoom(roomLocation: string, message: string, characterId: string) {
    this.socket.emit('leave-room', { room: roomLocation, message, characterId });
  }

  onItemPickedUp(callback: (data: { message: string; characterId: string }) => void) {
    console.log('Listening for item pickup events');
    this.socket.on('item-picked-up', callback);
  }

  emitItemPickup(roomLocation: string, message: string, characterId: string) {
    this.socket.emit('item-picked-up', { room: roomLocation, message, characterId });
  }

  removeItemPickedUpListener() {
    console.log('Removing item pickup listener');
    this.socket.off('item-picked-up');
  }

  onItemDrop(callback: (data: { message: string; characterId: string }) => void) {
    console.log('listening for item drop events');
    this.socket.on('item-drop', callback);
  }

  emitItemDrop(roomLocation: string, message: string, characterId: string) {
    this.socket.emit('item-drop', { room: roomLocation, message, characterId });
  }

  removeItemDropListener() {
    console.log('Removing item drop listener')
    this.socket.off('item-drop');
  }
  // ...other methods...
}
