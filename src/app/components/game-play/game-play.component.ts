// game-play.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { MovementService } from '../../services/movement.service';
import { TextFeedService } from '../../services/text-feed.service';
import { RoomsService } from '../../services/rooms.service';
import { CharacterService } from '../../services/character.service';
import { GameStateService } from 'src/app/services/game-state.service';
import { Characters } from 'src/app/models/character';
import { Item } from 'src/app/models/item';
import { ItemsService } from 'src/app/services/items.service';
import { firstValueFrom } from 'rxjs';



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
    private gameStateService: GameStateService,
    private itemsService: ItemsService
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

 

private async pickUpItem(itemName: string, handToUse: "leftHand" | "rightHand") {
  console.log('Starting pickUpItem function...');
  const characterId = this.gameStateService.getSelectedCharacterId();
  console.log('Character ID:', characterId);

  if (!characterId) {
    this.textFeedService.addMessage(`No character found for pickup.`);
    console.log('No character found for pickup.');
    return;
  }

  const characterDocId = await this.roomsService.getDocumentIdByCharacterId(characterId);
  console.log('Character Doc ID:', characterDocId);

  if (!characterDocId) {
    this.textFeedService.addMessage(`Character not found.`);
    console.log('Character not found.');
    return;
  }

  if (this.currentLocation === null) {
    this.textFeedService.addMessage(`Current location is not available.`);
    console.log('Current location is not available.');
    return;
  }

  // Check if the item is in the room
  const itemAvailable = await firstValueFrom(this.itemsService.isItemInRoom(itemName, this.currentLocation));
  if (!itemAvailable) {
    console.log(`Item ${itemName} not found in the room.`);
    this.textFeedService.addMessage(`${itemName} not found.`);
    return;
  }

  try {
    await this.itemsService.pickUpItem(characterDocId, itemName, handToUse, this.currentLocation);
    console.log('Item picked up successfully.');
    this.textFeedService.addMessage(`You picked up the ${itemName}.`);
  } catch (error) {
    console.error('Failed to pick up item:', error);
    if (error instanceof Error) {
      this.textFeedService.addMessage(error.message);
    } else {
      this.textFeedService.addMessage(`An unexpected error occurred.`);
    }
  }
}



 // Inside GamePlayComponent

 async dropItem(hand: 'leftHand' | 'rightHand') {
  const gameCharacterId = this.gameStateService.getSelectedCharacterId();
  if (!gameCharacterId) {
    this.textFeedService.addMessage(`No character found for dropping an item.`);
    return;
  }

  const firestoreCharacterDocId = await this.roomsService.getDocumentIdByCharacterId(gameCharacterId);
  if (!firestoreCharacterDocId) {
    this.textFeedService.addMessage(`Character not found.`);
    return;
  }

  const currentLocation = this.gameStateService.getSelectedCharacterLocation();
  if (!currentLocation) {
    this.textFeedService.addMessage(`Current location is not available.`);
    return;
  }

  // Fetch the item name from the character's hand
  const characterHands = await this.roomsService.getCharacterHands(gameCharacterId);
  const itemDocId = hand === 'leftHand' ? characterHands.leftHand : characterHands.rightHand;
  if (!itemDocId) {
    this.textFeedService.addMessage(`No item in ${hand} to drop.`);
    return;
  }

  // Fetch the actual item name using the document ID
  const item = await this.itemsService.getItemById(itemDocId);
  if (!item) {
    this.textFeedService.addMessage(`Item not found.`);
    return;
  }
  const itemName = item.name;

  // Now proceed to drop the item using its name
  try {
    await this.itemsService.dropItem(firestoreCharacterDocId, itemName, hand, currentLocation);
    this.textFeedService.addMessage(`Item dropped successfully.`);
  } catch (error) {
    console.error('Error dropping item:', error);
    if (error instanceof Error) {
      this.textFeedService.addMessage(`Error dropping item: ${error.message}`);
    } else {
      this.textFeedService.addMessage(`An unknown error occurred.`);
    }
  }
}


// ... rest of your component code ...



  async onSubmit() {
  console.log('onSubmit called');
  console.log('Form submitted');
  const trimmedInput = this.userInput.trim().toLowerCase();

  if (!trimmedInput) {
    console.log('Empty input submitted');
    return;
  }

  console.log('Processing command:', trimmedInput);
  this.inputHistory.unshift(trimmedInput);
  this.currentHistoryIndex = 0;

  if (trimmedInput.startsWith('say ')) {
    console.log('Say command:', trimmedInput);
    // Extract the message from the input
    const message = trimmedInput.slice(4).trim(); // Removes 'say ' from the beginning
    console.log('Message to say:', message);
    // Here you can add the logic to handle the say command
    // For example, displaying the message in the game or sending it to other players
    this.textFeedService.addMessage(`You say: ${message}`);
  }

  else if (trimmedInput.startsWith('get ')) {
    console.log('Get command:', trimmedInput);
    // Process get command
    const itemName = trimmedInput.slice(4).trim();
    console.log('Trying to pick up item:', itemName);
    this.pickUpItem(itemName, 'leftHand'); // or 'rightHand' depending on your logic
  }

  else if (trimmedInput.startsWith('drop ')) {
    console.log('** Processing drop command: ', trimmedInput);
    const itemName = trimmedInput.slice(5).trim(); // Extract the item name from the input
    console.log('** Item name before determineHandToDropFrom: ', itemName);
    const hand = await this.determineHandToDropFrom(itemName);
    console.log('** Item name after determineHandToDropFrom: ', itemName);

    console.log('** Determined hand to drop from: ', hand);
    if (hand) {
      console.log('** Dropping item from hand:', hand);
      await this.dropItem(hand); // Pass only 'hand' argument
    } else {
      console.log('** Item not found in hand.');
      this.textFeedService.addMessage(`You are not holding an item named ${itemName}.`);
    }
  }
  else {
    console.log('Unrecognized command:', trimmedInput);
    this.textFeedService.addMessage(`Unrecognized command: ${trimmedInput}`);
  }

  this.userInput = ''; // Clear the input after processing the command
}
  
  
  
  private async determineHandToDropFrom(itemName: string): Promise < 'leftHand' | 'rightHand' | null > {
  if(this.currentCharacterId) {
  const characterHands = await this.roomsService.getCharacterHands(this.currentCharacterId);
  console.log('Character hands:', characterHands);
  console.log(`determineHandToDropFrom item name: ${itemName}`);

  // Fetch item names based on the document IDs in characterHands
  const leftHandItem = characterHands.leftHand ? await this.itemsService.getItemById(characterHands.leftHand) : null;
  const rightHandItem = characterHands.rightHand ? await this.itemsService.getItemById(characterHands.rightHand) : null;
  console.log(`Determined item name for leftHand: ${leftHandItem ? leftHandItem.name : 'null'}`);
  console.log(`Determined item name for rightHand: ${rightHandItem ? rightHandItem.name : 'null'}`);
  // Compare the fetched item names with the provided itemName
  if (leftHandItem && leftHandItem.name.toLowerCase() === itemName.toLowerCase()) {
    console.log(`determineHandToDropFrom item name: ${itemName}`);
    return 'leftHand';
  } else if (rightHandItem && rightHandItem.name.toLowerCase() === itemName.toLowerCase()) {
    console.log(`determineHandToDropFrom item name: ${itemName}`);
    return 'rightHand';
  }
}
return null; // Item not found in either hand or currentCharacterId is null
  }
  
  
  

  get itemListAsString(): string {
  return this.roomItems.length > 0 ? '<span class="description-item-name">You see an </span>' + this.roomItems.map(item => `<span class="item-name">${item.name}</span>`).join(', ') : '';
}
  get characterListAsString(): string {
  return this.roomCharacters.length > 0 ? 'Also in the room ' + this.roomCharacters.map(character => `<span class="character-name">${character.characterName}</span>`).join(' and ') : '';
}


  // ... other methods ...
}