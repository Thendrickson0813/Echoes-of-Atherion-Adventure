import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs'; // Import Observable here

@Injectable({
  providedIn: 'root'
})
export class TextFeedService {
  private textFeed: string[] = [];
  private textFeedChange: BehaviorSubject<string[]> = new BehaviorSubject(this.textFeed);

  addMessage(message: string) {
    this.textFeed.push(message);
    this.textFeedChange.next(this.textFeed);
  }

  getTextFeedChangeObservable(): Observable<string[]> {
    return this.textFeedChange.asObservable();
  }

  public getTextFeed(): string[] {
    return this.textFeed;
  }
}
