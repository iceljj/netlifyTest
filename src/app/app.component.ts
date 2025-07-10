import { Component } from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {BottomNavComponent} from './components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, BottomNavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'my-ng-netlify-project';
}
