import { Injectable } from '@angular/core';
import { CharacterService } from './character.service';
import { RoomsService } from './rooms.service';
import { GameStateService } from './game-state.service';
import { LocationUpdateService } from './location-update-fire.service';
import { TextFeedService } from './text-feed.service';
import { RealTimeService } from './real-time.service';
import { DataFetchService } from './data-fetch.service';

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
    private locationUpdateService: LocationUpdateService,
    private textFeedService: TextFeedService,
    private realTimeService: RealTimeService,
    private dataFetchService: DataFetchService

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
      const characterName = await this.fetchCharacterName();
      const characterId = this.gameStateService.getSelectedCharacterId() || 'unknown-character';
      // Set current location to old location before the move
      const oldLocation = this.currentLocation;



      if (oldLocation) {
        const leaveMessage = `{characterName:${characterName}} went ${direction.toLowerCase()}.`;
        console.log("attempting to notify other players with realtimeservice emitCharacterLeave")
        this.realTimeService.emitCharacterLeave(oldLocation, leaveMessage, characterId);
        // Notify the player of their own movement WORKING
        
      }
      this.textFeedService.addMessage(`You moved ${direction.toLowerCase()}.`);
      // Update new location
      this.currentX = newX;
      this.currentY = newY;
      this.currentLocation = newLocation;
      console.log(`Current location before leaving: ${this.currentLocation}`);

      // Update location in other services
      this.characterService.setLocation(newLocation);
      this.gameStateService.setSelectedCharacterLocation(newLocation);

      // Clean up listeners for the current room
      this.roomsService.cleanupListeners();

      // Updates the database
      console.log('cleaning up listeners before move');
      this.locationUpdateService.updateLocation(newLocation);

      // Notify other players in the new room about arriving
      const enterMessage = `{characterName:${characterName}} just arrived.`;
      this.realTimeService.emitCharacterEnter(newLocation, enterMessage, characterId);

      // Reinitialize listeners for the new room
      this.roomsService.reinitializeListeners(newLocation);
      console.log("Reinitialize listeners for the new room");
    }
  }
  private async fetchCharacterName(): Promise<string> {
    const characterId = this.gameStateService.getSelectedCharacterId();
    if (characterId) {
      const characterDocId = await this.dataFetchService.getDocumentIdByCharacterId(characterId);
      if (characterDocId) {
        const characterName = await this.dataFetchService.fetchCharacterNameByDocumentId(characterDocId);
        return characterName || 'Unknown Character'; // Return 'Unknown Character' if characterName is null
      }
    }
    return 'Unknown Character'; // Fallback in case character name can't be retrieved
  }

}
