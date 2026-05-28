import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-page-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './page-header.html',
    styleUrls: ['./page-header.css']
})
export class PageHeaderComponent {
    @Input() title: string = '';
    @Input() subtitle: string = '';
    @Input() backgroundImage: string = '';
}
