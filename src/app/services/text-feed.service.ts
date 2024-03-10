import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TextFeedService {
  private textFeed: string[] = [];
  private textFeedChange: BehaviorSubject<string[]> = new BehaviorSubject(this.textFeed);
  private characterMessageMap: Map<string, string[]> = new Map();

  addMessage(message: string) {
    console.log("Original message:", message);
    const styledMessage = this.styleMessageParts(message);
    console.log("Styled message:", styledMessage);
    this.textFeed.push(styledMessage);
    this.textFeedChange.next(this.textFeed);
  }

  addMessageToCharacter(characterId: string, message: string) {
    let messages = this.characterMessageMap.get(characterId);
  
    if (!messages) {
      messages = [];
      this.characterMessageMap.set(characterId, messages);
    }
  
    messages.push(message);
    // Optionally, you can create a separate BehaviorSubject for each character
  }

  public styleMessageParts(message: string): string {
    // Regular expression patterns to find placeholders
    const characterNamePattern = /{characterName:(.*?)}/g;
    const itemNamePattern = /{itemName:(.*?)}/g;

    // Replace placeholders with styled spans
    let styledMessage = message
      .replace(characterNamePattern, (_, charName) => `<span class="character-name">${charName}</span>`)
      .replace(itemNamePattern, (_, itemName) => `<span class="item-name">${itemName}</span>`);

    return styledMessage;
}
  
  getTextFeedChangeObservable(): Observable<string[]> {
    return this.textFeedChange.asObservable();
  }

  public getTextFeed(): string[] {
    return this.textFeed;
  }

  public getCharacterMessages(characterId: string): string[] {
    return this.characterMessageMap.get(characterId) || [];
  }
}

