import { Component, Input } from '@angular/core'; // Add Input here


@Component({
  selector: 'app-interactive-window',
  templateUrl: './interactive-window.component.html',
  styleUrls: ['./interactive-window.component.scss']
})
export class InteractiveWindowComponent {
  @Input() windowTitle: string = '';
  public isVisible: boolean = true;

  toggleContentVisibility(): void {
    this.isVisible = !this.isVisible;
  }
}