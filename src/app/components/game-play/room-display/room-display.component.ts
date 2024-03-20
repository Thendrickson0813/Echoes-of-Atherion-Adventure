import { Component, Input } from '@angular/core';
import { Item } from 'src/app/models/item';
import { Characters } from 'src/app/models/character';

@Component({
  selector: 'app-room-display',
  templateUrl: './room-display.component.html',
  styleUrls: ['./room-display.component.scss']
})
export class RoomDisplayComponent {
  @Input() roomItems: Item[] = [];
  @Input() roomCharacters: Characters[] = [];

  get itemListAsString(): string {
    return this.roomItems.length > 0
      ? '<span class="description-item-name">You see an </span>' + this.roomItems.map(item => `<span class="item-name">${item.name}</span>`).join(', ')
      : '';
  }

  get characterListAsString(): string {
    return this.roomCharacters.length > 0
      ? 'Also here:  ' + this.roomCharacters.map(character => `<span class="character-name">${character.characterName}</span>`).join(' and ')
      : '';
  }
}
