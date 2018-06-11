import {Component, OnInit} from '@angular/core';
import {ElectronService} from '../../providers/electron.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  data: string;

  constructor(private electronService: ElectronService) {
  }

  ngOnInit() {
    this.getAllGames();
  }

  getAllGames() {
    this.electronService.rpc('getAllGames', [], (data) => {
      // console.log(data);
      this.data = data;
    });
  }
}
