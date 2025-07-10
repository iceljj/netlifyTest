import {Component, HostBinding} from '@angular/core';
import {trigger, state, style, animate, transition, keyframes} from '@angular/animations';
import {Router, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs/operators';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-bottom-nav',
  imports: [CommonModule, FormsModule],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
  animations: [
    trigger('bounce', [
      state('idle', style({transform: 'scale(1)'})),
      transition('idle => bounce', [
        animate('500ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', keyframes([
          style({transform: 'scale(1)', offset: 0}),
          style({transform: 'scale(1.2)', offset: 0.3}),
          style({transform: 'scale(0.9)', offset: 0.6}),
          style({transform: 'scale(1.1)', offset: 0.8}),
          style({transform: 'scale(1)', offset: 1.0})
        ]))
      ])
    ])
  ]
})
export class BottomNavComponent {
  navItems = [
    {label: '图库', icon: 'photo_library', path: '/gallery', state: 'idle'},
    {label: '投屏', icon: 'cast', path: '/projection', state: 'idle'},
    {label: '我的', icon: 'person', path: '/mine', state: 'idle'}
  ];

  @HostBinding('style.height') height = '10vh';

  constructor(private router: Router) {
    // 监听路由变化更新活动状态
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const currentPath = event.urlAfterRedirects || event.url;
      this.navItems.forEach(item => {
        item.state = 'idle';
      });
    });
  }

  navigate(path: string, index: number) {
    if (this.router.url === path) return;

    setTimeout(() => {
      this.router.navigate([path]);
      this.navItems[index].state = 'idle';
    }, 30);
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }
}
