import { Injectable } from '@angular/core';
import { RoomsService } from './rooms.service';
import { TextFeedService } from './text-feed.service';
import { Item } from '../models/item';


@Injectable({
  providedIn: 'root'
})
export class GameDisplayService {

  private unsubscribeDisplayedRoomItems: (() => void) | null = null;


  constructor(
    private roomsService: RoomsService, 
    private textFeedService: TextFeedService
  ) { }

 
}
