// game-play.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { MovementService } from '../../services/movement.service';
import { TextFeedService } from '../../services/text-feed.service';
import { RoomsService } from '../../services/rooms.service';
import { CharacterService } from '../../services/character.service';
import { GameStateService } from 'src/app/services/game-state.service';
import { Characters } from 'src/app/models/character';
import { Room } from 'src/app/models/locations';
import { Item } from 'src/app/models/item';




@Component({
  selector: 'app-game-play',
  templateUrl: './game-play.component.html',
  styleUrls: ['./game-play.component.scss']
})
export class GamePlayComponent implements OnInit, AfterViewInit {
  currentLocation: string | null = null;  // Allow null
  gameStateLocation: string | null = null; // Allow null
  isDetailsVisible: boolean = true; // Add this
  isInventoryVisible: boolean = true; // Add this
  userInput: string = '';
  roomName: string = '';
  roomDescription: string = '';
  roomItems: Item[] = [];
  roomCharacters: Characters[] = [];
  currentCharacterId: string | null = null;  // Add this line to declare the property
  currentHistoryIndex: number = -1; // Start at -1
  inputHistory: string[] = [];
  
  @ViewChild('messageContainer') private messageContainer!: ElementRef;


  constructor(
    public textFeedService: TextFeedService,
    private movementService: MovementService,
    private roomsService: RoomsService,
    private characterService: CharacterService,
    private gameStateService: GameStateService
  ) {
    // Subscribe to character location updates
    this.characterService.getLocation().subscribe((location: string | null) => {
      if (location) {
        this.currentLocation = location;
        this.roomsService.updateLocation(location);
      }
    });
  }
  handleArrowKey(direction: 'up' | 'down') {
    if (direction === 'up') {
      // Navigate backward in history
      if (this.currentHistoryIndex < this.inputHistory.length - 1) {
        this.currentHistoryIndex++;
        this.userInput = this.inputHistory[this.currentHistoryIndex];
      }
    } else if (direction === 'down') {
      // Navigate forward in history
      if (this.currentHistoryIndex > 0) {
        this.currentHistoryIndex--;
        this.userInput = this.inputHistory[this.currentHistoryIndex];
      } else if (this.currentHistoryIndex === 0) {
        // Clear input when reaching the end
        this.currentHistoryIndex--;
        this.userInput = '';
      }
    }
  }
  ngOnInit() {
    this.currentCharacterId = this.gameStateService.getSelectedCharacterId();
    
    const characterInitialLocation = this.gameStateService.getSelectedCharacterLocation();
    if (characterInitialLocation) {
      this.roomsService.updateLocation(characterInitialLocation);
    } else {
      console.error('Unable to retrieve character initial location');
    }
    this.roomsService.getRoomName().subscribe(name => {
      this.roomName = name;
    });

    this.roomsService.getRoomDescription().subscribe(description => {
      this.roomDescription = description;
    });
    // Subscribe to room items
    this.roomsService.getRoomItems().subscribe(items => {
      this.roomItems = items;
    });
    // Subscribe to room characters
    this.roomsService.getRoomCharacters().subscribe(characters => {
      // Filter out the current character
      this.roomCharacters = characters.filter(character => character.characterId !== this.currentCharacterId);
    });
    // Subscribe to the text feed changes
    this.textFeedService.getTextFeedChangeObservable().subscribe(() => {
      this.scrollToBottom();
    });

  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messageContainer && this.messageContainer.nativeElement) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    }, 0);
  }
  toggleWindow(window: string): void {
    switch (window) {
      case 'details':
        this.isDetailsVisible = !this.isDetailsVisible;
        break;
      case 'inventory':
        this.isInventoryVisible = !this.isInventoryVisible;
        break;
      // ... other cases ...
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeypadNavigation(event: KeyboardEvent) {
    // Check if the focused element is an input, textarea, or select
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return; // Do nothing if the user is focused on an input field
    }
  
    // Handle navigation keys
    switch (event.key) {
      case '8':
        this.move('up');
        break;
      case '2':
        this.move('down');
        break;
      case '6':
        this.move('right');
        break;
      case '4':
        this.move('left');
        break;
      // ... other cases ...
    }
  }
  
  move(direction: 'up' | 'down' | 'left' | 'right') {
    const dirMap: { [key: string]: 'North' | 'South' | 'East' | 'West' } = {
      up: 'North',
      down: 'South',
      left: 'West',
      right: 'East'
    };
    const mappedDirection = dirMap[direction];
    if (mappedDirection) {
      this.movementService.move(mappedDirection);
    } else {
      console.error(`Invalid direction: ${direction}`);
    }
  }


  reverseArray(items: any[]) {
    return items.slice().reverse();
  }

  private async pickUpItem(itemName: string) {
    const characterId = this.gameStateService.getSelectedCharacterId();
    if (!characterId) {
      this.textFeedService.addMessage(`No character found for pickup.`);
      return;
    }

    const characterDocId = await this.roomsService.getDocumentIdByCharacterId(characterId);
    if (!characterDocId) {
      this.textFeedService.addMessage(`Character not found.`);
      return;
    }

    // Use characterDocId instead of characterId
    this.roomsService.getCharacterHands(characterDocId).then(hands => {
      const handToUse = hands.rightHand ? 'leftHand' : 'rightHand'; // Use right hand by default, left if right is full

      // Use characterDocId here as well
      this.roomsService.pickUpItem(characterDocId, itemName, handToUse).then(() => {
        // Handle successful item pickup
      }).catch(error => {
        // Handle any errors
        console.error('Failed to pick up item:', error);
        this.textFeedService.addMessage(`You can't pick up this item right now.`);
      });
    }).catch(error => {
      console.error('Failed to get character hands:', error);
      this.textFeedService.addMessage(`You can't pick up this item right now.`);
    });
  }

  async dropItem(hand: 'leftHand' | 'rightHand') {
    const characterId = this.gameStateService.getSelectedCharacterId();
    if (!characterId) {
      this.textFeedService.addMessage(`No character found for dropping an item.`);
      return;
    }

    // Get the document ID using the characterId
    const characterDocId = await this.roomsService.getDocumentIdByCharacterId(characterId);
    if (!characterDocId) {
      this.textFeedService.addMessage(`Character not found.`);
      return;
    }
    const currentLocation = this.gameStateService.getSelectedCharacterLocation();
    if (currentLocation) {
      try {
        await this.roomsService.dropItem(characterDocId, hand, currentLocation);
        this.textFeedService.addMessage(`Item dropped successfully.`);
      } catch (error) {
        console.error('Error dropping item:', error);
        if (error instanceof Error) {
          // Now TypeScript knows error is an Error object and you can safely access error.message
          this.textFeedService.addMessage(`Error: ${error.message}`);
        } else {
          // If it's not an Error object, handle it differently or provide a generic message
          this.textFeedService.addMessage(`An unknown error occurred.`);
        }
      }
    }
  }
  // Update your onSubmit method to include the new logic
  onSubmit() {
    const trimmedInput = this.userInput.trim().toLowerCase();
  
    if (trimmedInput) {
      this.inputHistory.unshift(trimmedInput); // Add the trimmed input to history
      this.currentHistoryIndex = 0;
  
      if (trimmedInput.startsWith('say ') || trimmedInput.startsWith("'")) {
        // ... existing say command logic
      } else if (trimmedInput.startsWith('get ')) {
        const itemName = trimmedInput.slice(4).trim();
        this.pickUpItem(itemName);
      } else if (trimmedInput.startsWith('drop ')) {
        const hand = trimmedInput.includes('left') ? 'leftHand' : 'rightHand';
        this.dropItem(hand);
      } else {
        // Handle other cases or show an error message
        this.textFeedService.addMessage(`Unrecognized command: ${trimmedInput}`);
      }
  
      this.userInput = ''; // Clear the input after processing the command
    }
  }

  get itemListAsString(): string {
    return this.roomItems.length > 0 ? 'You see an ' + this.roomItems.map(item => `<span class="item-name">${item.name}</span>`).join(', ') : '';
  }
  get characterListAsString(): string {
    return this.roomCharacters.length > 0 ? 'Also in the room ' + this.roomCharacters.map(character => `<span class="character-name">${character.characterName}</span>`).join(' and ') : '';
  }

 
  // ... other methods ...
}