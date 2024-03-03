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
    this.textFeed.push(message);
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

