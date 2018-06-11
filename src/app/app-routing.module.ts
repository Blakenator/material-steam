import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LibraryComponent} from './components/library/library.component';
import {FriendsComponent} from './components/friends/friends.component';

const routes: Routes = [
  {
    path: 'friends',
    component: FriendsComponent
  },
  {
    path: '',
    component: LibraryComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
