import { Injectable } from '@angular/core';
import { CharacterService } from './character.service';
import { RoomsService } from './rooms.service';
import { GameStateService } from './game-state.service';
import { LocationUpdateService } from './location-update-fire.service';
@Injectable({
  providedIn: 'root'
})
export class MovementService {
  private currentX: number = 0;
  private currentY: number = 0;
  private currentLocation: string = ''; // Add this line

  constructor(
    private characterService: CharacterService,
    private roomsService: RoomsService,
    private gameStateService: GameStateService,
    private locationUpdateService: LocationUpdateService
  ) {
    this.initializeCoordinates();
  }

  private initializeCoordinates() {
    const initialLocation = this.gameStateService.getSelectedCharacterLocation();
    if (initialLocation) {
      const coords = this.parseCoordinates(initialLocation);
      this.currentX = coords.x;
      this.currentY = coords.y;
    }
  }

  private parseCoordinates(location: string): { x: number, y: number } {
    const match = location.match(/X(\d+)Y(\d+)/);
    return {
      x: match ? parseInt(match[1]) : 0,
      y: match ? parseInt(match[2]) : 0
    };
  }



  async move(direction: 'North' | 'South' | 'East' | 'West') {
    let newX = this.currentX;
    let newY = this.currentY;
  
    switch (direction) {
      case 'North': newY++; break;
      case 'South': newY--; break;
      case 'East': newX++; break;
      case 'West': newX--; break;
    }
  
    if (newX < 0 || newY < 0) {
      console.error('Invalid move: Reached the edge of the world');
      return;
    }
  
    const newLocation = `X${newX}Y${newY}`; // Combines the new X and Y coordinates into a string format 'XnYn'
  
    const isValidMove = await this.roomsService.isValidRoom(newLocation); // Checks if the new location is a valid room
  
    if (isValidMove) {
      // Unsubscribe from the current room before moving
      this.roomsService.unsubscribeFromRoom(this.currentLocation);
      console.log('movementService: Move Function is Unsubscribing from the current room before moving using unsubscribeFromRoom');

      // Update new location
      this.currentX = newX;
      this.currentY = newY;
  
      // Subscribe to new room after moving
      this.roomsService.subscribeToRoom(newLocation);
      console.log('movementService: Move Function is Subscribing to new room after moving using subscribeToRoom');

  
      // Update location in other services
      this.characterService.setLocation(newLocation);
      this.gameStateService.setSelectedCharacterLocation(newLocation);
      this.locationUpdateService.updateLocation(newLocation);
    }
  }
}
