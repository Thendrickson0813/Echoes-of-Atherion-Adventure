// game-play.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { MovementService } from '../../services/movement.service';
import { TextFeedService } from '../../services/text-feed.service';
import { RoomsService } from '../../services/rooms.service';
import { CharacterService } from '../../services/character.service';
import { GameStateService } from 'src/app/services/game-state.service';
import { CharacterActivityService } from 'src/app/services/character-activity.service';
import { Characters } from 'src/app/models/character';
import { Item } from 'src/app/models/item';
import { GameEvent } from 'src/app/models/game-event.model';
import { ItemsService } from 'src/app/services/items.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { DataFetchService } from 'src/app/services/data-fetch.service';
import { GameEventsService } from 'src/app/services/game-events.service';
import { RealTimeService } from 'src/app/services/real-time.service';


@Component({
  selector: 'app-game-play',
  templateUrl: './game-play.component.html',
  styleUrls: ['./game-play.component.scss']
})
export class GamePlayComponent implements OnInit, OnDestroy, AfterViewInit {
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
  characterName: string | null = null;
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  private roomEventsSubscription!: Subscription;
  private roomDescriptionSubscription?: Subscription;
  private roomItemsSubscription?: Subscription;
  private roomCharactersSubscription?: Subscription;
  private textFeedChangeSubscription?: Subscription;
  private characterOnlineStatusSubscription?: Subscription;
  private locationChangeSubscription?: Subscription;
  private roomNameSubscription?: Subscription;


  constructor(
    public textFeedService: TextFeedService,
    private movementService: MovementService,
    private roomsService: RoomsService,
    private characterService: CharacterService,
    private gameStateService: GameStateService,
    private itemsService: ItemsService,
    private router: Router,
    private characterActivityService: CharacterActivityService,
    private dataFetchService: DataFetchService,
    private gameEventsService: GameEventsService,
    private realTimeService: RealTimeService,

  ) { }

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

    this.fetchCharacterName(); // Call a method to fetch and store the character's name

    this.realTimeService.onCharacterEnter((message) => {
      console.log('Character enter event:', message);
      const currentCharacterId = this.gameStateService.getSelectedCharacterId();
      
      // Ensure currentCharacterId is not null before checking
      if (currentCharacterId && !message.includes(currentCharacterId)) {
        this.textFeedService.addMessage(message);
      }
    });
    
  
  
    this.realTimeService.onCharacterLeave((message) => {
      console.log('Character leave event:', message);
      const currentCharacterId = this.gameStateService.getSelectedCharacterId();
      
      if (currentCharacterId && !message.includes(currentCharacterId)) {
        this.textFeedService.addMessage(message);
      }
    });
  

    this.realTimeService.onItemPickedUp((data) => {
      console.log('Received item pickup event:', data);
      const { message, characterId } = data;
      const currentCharacterId = this.gameStateService.getSelectedCharacterId();
      console.log(`Comparing IDs: Event Character ID = ${characterId}, Current Character ID = ${currentCharacterId}`);

      if (characterId !== currentCharacterId) {
        const styledMessage = this.textFeedService.styleMessageParts(message);
        this.textFeedService.addMessage(message);
      }
    });

    this.realTimeService.onItemDrop((data) => {
      console.log('Received item drop event:', data);
      const { message, characterId } = data;
      const currentCharacterId = this.gameStateService.getSelectedCharacterId();

      console.log(`Comparing IDs: Event Character ID = ${characterId}, Current Character ID = ${currentCharacterId}`);

      if (characterId !== currentCharacterId) {
        const styledMessage = this.textFeedService.styleMessageParts(message);
        this.textFeedService.addMessage(message);
        console.log('Adding styled message for Drop item in gameplay component');
      }
    });

    // Get the selected character ID from the GameStateService
    this.currentCharacterId = this.gameStateService.getSelectedCharacterId();

    // Subscribe to game events from the GameEventsService
    this.roomEventsSubscription = this.gameEventsService.events$.subscribe((events: GameEvent[]) => {
      console.log(`Received events: ${events.length}`);
      events.forEach((event: GameEvent) => {
        console.log(`Processing event type: ${event.type}`);
        if (event.type === 'itemPickup') {
          this.handleItemPickupEvent(event);
        }
        // Additional event types can be handled here
      });
    });


    // Subscribe to changes in room description from RoomsService
    this.roomsService.getRoomDescription().subscribe(description => {
      this.roomDescription = description;
      // This is getting cleaned up using 
    });

    // Subscribe to changes in room items from RoomsService
    this.roomsService.getRoomItems().subscribe(items => {
      this.roomItems = items;
    });

    // Subscribe to changes in room characters from RoomsService
    this.roomsService.getRoomCharacters().subscribe(characters => {
      console.log('Room characters updated:', characters);
      // Filter out the current character
      this.roomCharacters = characters.filter(character => character.characterId !== this.currentCharacterId);
    });

    // Subscribe to changes in the text feed from TextFeedService
    this.textFeedService.getTextFeedChangeObservable().subscribe(() => {
      console.log("textfeed subscription");
      this.scrollToBottom();
    });

    // Handle the character's online status
    const selectedCharacterFirestoreDocumentId = this.gameStateService.getSelectedCharacterFirestoreDocumentId();
    if (selectedCharacterFirestoreDocumentId) {
      this.characterActivityService.setCharacterId(selectedCharacterFirestoreDocumentId); //Fetches the selected character's Firestore document ID
      this.characterActivityService.subscribeToCharacterOnlineStatus(isOnline => { // Subscribes to updates in the character's online status using
        if (!isOnline) { // Within the subscription, checks if isOnline is false
          console.log('Character is offline due to inactivity');
          this.router.navigate(['/character-list']); // Redirect to character list
          // Handle the character going offline
        }
      });
    } else {
      console.error('No Firestore Document ID found for the selected character');
    }
    // Handle the initial character location
    const initialLocation = this.gameStateService.getSelectedCharacterLocation();
    if (initialLocation) {
      this.updateLocationAndListenToEvents(initialLocation);
    } else {
      console.error('Unable to retrieve character initial location');
    }

    // Subscribe to location changes from the CharacterService
    // This will handle all future location changes after the initial setup
    this.locationChangeSubscription = this.characterService.getLocation().subscribe((newLocation: string | null) => {
      if (newLocation && this.currentLocation !== newLocation) {
        console.log("Location updated to: ", newLocation);
        this.updateLocationAndListenToEvents(newLocation);
      }
    });

    // Subscribe to changes in room name
    this.roomNameSubscription = this.roomsService.getRoomName().subscribe(name => {
      this.roomName = name;
    });


  }

  ngOnDestroy() {

    // Unsubscribe from all subscriptions to prevent memory leaks
    this.realTimeService.removeItemPickedUpListener();
    this.realTimeService.removeItemDropListener();
    this.roomDescriptionSubscription?.unsubscribe();
    this.roomItemsSubscription?.unsubscribe();
    this.roomCharactersSubscription?.unsubscribe();
    this.textFeedChangeSubscription?.unsubscribe();
    this.characterOnlineStatusSubscription?.unsubscribe();
    this.locationChangeSubscription?.unsubscribe();
    this.roomEventsSubscription.unsubscribe();
    this.locationChangeSubscription?.unsubscribe();
    this.roomNameSubscription?.unsubscribe();

    // Perform cleanup in RoomsService, which unsubscribes from its observables
    this.roomsService.cleanupListeners();
    if (this.roomEventsSubscription) {
      this.roomEventsSubscription.unsubscribe();
    }
  }
  // game-play.component.ts
  private async updateLocationAndListenToEvents(newLocation: string) {
    const characterId = this.gameStateService.getSelectedCharacterId() || 'unknown-character';
    const characterName = await this.fetchCharacterName();

    if (this.currentLocation) {
      this.realTimeService.leaveRoom(this.currentLocation, characterName, characterId);
      console.log(`Left room: ${this.currentLocation}`);
    }

    this.currentLocation = newLocation;
    this.realTimeService.joinRoom(newLocation, characterName, characterId);
    console.log(`Joined room: ${newLocation}`);

    this.roomsService.updateLocation(newLocation);
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

  ngAfterViewInit() {
    // Additional logic to be executed after the view initialization
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

  private async handleItemPickupEvent(event: GameEvent) {
    if (event.details && 'characterId' in event.details && 'itemId' in event.details) {
      try {
        const characterName = await this.dataFetchService.fetchCharacterNameByOwnerId(event.details.characterId);
        const itemName = await this.dataFetchService.fetchItemNameById(event.details.itemId);

        if (characterName && itemName) {
          this.textFeedService.addMessage(`${characterName} picked up a ${itemName}.`);
        } else {
          console.log("Error: Character or Item not found for IDs:", event.details.characterId, event.details.itemId);
        }
      } catch (error) {
        console.error("Failed to fetch character or item data:", error);
        // Handle the error appropriately
      }
    } else {
      console.log("Error: event details are incomplete", event.details);
    }
  }

  private async handleItemDropEvent(event: GameEvent) {
    if (event.details && 'characterId' in event.details && 'itemId' in event.details) {
      try {
        const characterName = await this.dataFetchService.fetchCharacterNameByOwnerId(event.details.characterId);
        const itemName = await this.dataFetchService.fetchItemNameById(event.details.itemId);

        if (characterName && itemName) {
          this.textFeedService.addMessage(`${characterName} dropped an ${itemName}.`);
        } else {
          console.log("error: Character or Item not found for IDs:", event.details.characterId, event.details.itemId);
        }
      } catch (error) {
        console.error("failed to fetch character or item date:", error);
        // Handle error
      }
    } else {
      console.log("Error: event details are incomplete", event.details);
    }
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

    const characterDocId = await this.dataFetchService.getDocumentIdByCharacterId(characterId);
    if (!characterDocId) {
      this.textFeedService.addMessage(`Character document not found.`);
      console.error('Character document not found.');
      return;
    }

    // Fetch the character name using the document ID
    const characterName = await this.dataFetchService.fetchCharacterNameByDocumentId(characterDocId);
    if (!characterName) {
      console.error('Failed to retrieve character name.');
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

    let successfulPickup = false;
    try {
      await this.itemsService.pickUpItem(characterDocId, itemName, handToUse, this.currentLocation);
      console.log('Item Pickup in GamePlayComponent passed.');
      this.textFeedService.addMessage(`You picked up a {itemName: ${itemName}}.`);
      console.log(`Message sent to TextFeedService: You picked the Item: ${itemName}.`);

      successfulPickup = true;
    } catch (error) {
      console.error('Failed to pick up item:', error);
      if (error instanceof Error) {
        this.textFeedService.addMessage(error.message);
      } else {
        this.textFeedService.addMessage(`An unexpected error occurred.`);
      }
    }

    if (successfulPickup) {
      const characterId = this.gameStateService.getSelectedCharacterId() || 'unknown-character';
      const message = `{characterName:${characterName}} picked up {itemName:${itemName}}.`;
      console.log(`Emitting item pickup: ${message}, Character ID: ${characterId}`);
      this.realTimeService.emitItemPickup(this.currentLocation, message, characterId);
    }
  }


  async dropItem(hand: 'leftHand' | 'rightHand') {
    const gameCharacterId = this.gameStateService.getSelectedCharacterId();
    if (!gameCharacterId) {
      this.textFeedService.addMessage(`No character found for dropping an item.`);
      return;
    }

    const firestoreCharacterDocId = await this.dataFetchService.getDocumentIdByCharacterId(gameCharacterId);
    if (!firestoreCharacterDocId) {
      this.textFeedService.addMessage(`Character not found.`);
      return;
    }

    const currentLocation = this.gameStateService.getSelectedCharacterLocation();
    if (!currentLocation) {
      this.textFeedService.addMessage(`Current location is not available.`);
      return;
    }

    const characterName = await this.dataFetchService.fetchCharacterNameByDocumentId(firestoreCharacterDocId);
    if (!characterName) {
      console.error('Failed to retrieve character name.');
      return;
    }

    const characterHands = await this.roomsService.getCharacterHands(gameCharacterId);
    const itemDocId = hand === 'leftHand' ? characterHands.leftHand : characterHands.rightHand;
    if (!itemDocId) {
      this.textFeedService.addMessage(`No item in ${hand} to drop.`);
      return;
    }

    const item = await this.itemsService.getItemById(itemDocId);
    if (!item) {
      this.textFeedService.addMessage(`Item not found.`);
      return;
    }
    const itemName = item.name;

    let successfulDrop = false;
    try {
      await this.itemsService.dropItem(firestoreCharacterDocId, itemName, hand, currentLocation);

      successfulDrop = true;
    } catch (error) {
      console.error('Error dropping item:', error);
      if (error instanceof Error) {
        this.textFeedService.addMessage(`Error dropping item: ${error.message}`);
      } else {
        this.textFeedService.addMessage(`An unknown error occurred.`);
      }
    }

    if (successfulDrop) {
      // Use placeholders in the message string
      const messageForOthers = `{characterName:${characterName}} dropped a {itemName:${itemName}}.`;
      this.realTimeService.emitItemDrop(currentLocation, messageForOthers, gameCharacterId);
      console.log(`Item drop event emitted: ${messageForOthers}`);

      const messageForSelf = `You dropped the {itemName: ${itemName}}.`;
      this.textFeedService.addMessage(messageForSelf);
    }
  }




  // ... rest of your component code ...



  async onSubmit() {
    console.log('onSubmit called');
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



  private async determineHandToDropFrom(itemName: string): Promise<'leftHand' | 'rightHand' | null> {
    if (this.currentCharacterId) {
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

  getStyledMessage(characterName: string, action: string, itemName: string): string {
    return `<span class="character-name">${characterName}</span> ${action} <span class="item-name">${itemName}</span>`;
  }

  // ... other methods ...
}