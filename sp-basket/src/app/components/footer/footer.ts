import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitService } from '../../services/visit.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent implements OnInit {
  currentYear = new Date().getFullYear();
  visitCount: number = 0;

  constructor(private visitService: VisitService) { }

  ngOnInit() {
    this.visitService.getVisitsCount().subscribe(
      res => this.visitCount = res.total,
      err => console.error('Error getting visits', err)
    );
  }
}
