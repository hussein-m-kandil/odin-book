import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, inject } from '@angular/core';
import { Tab, Tabs, TabList } from 'primeng/tabs';
import { PostList } from '../posts';

@Component({
  selector: 'app-home',
  imports: [RouterLinkActive, RouterLink, PostList, TabList, Tabs, Tab],
  templateUrl: './home.html',
  styles: ``,
})
export class Home {
  protected readonly queryParamMap = toSignal(inject(ActivatedRoute).queryParamMap);

  protected readonly navItems = [
    { queryParams: undefined, icon: 'pi pi-globe', label: 'Everybody' },
    { queryParams: { following: 'posts' }, icon: 'pi pi-users', label: 'Following' },
  ];
}
