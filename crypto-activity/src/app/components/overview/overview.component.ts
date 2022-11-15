import { Component, OnInit } from '@angular/core';
import { OverviewService } from 'src/app/shared/services/overview.service';

export interface OverviewElement {
  SAVE: string;
  SPOT: { free: string, locked: string };
  STACK: string;
  asset: string;
  priceUSD: string;
  priceUSDT: string;
}


export interface ResultOverview {
  data: OverviewElement[];
  error: number;
}

const ELEMENT_DATA: OverviewElement[] = [];

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {
  public tableReady = false;
  public isLoading = false;
  public dataSource = [];

  public displayedColumns: string[] = ['asset', 'priceUSD', 'spot', 'earn', 'total', 'totalUSD', 'percent'];

  constructor(private overviewService: OverviewService) { }

  ngOnInit(): void {

    this.isLoading = true;
    const formData = JSON.parse(localStorage.getItem('formData')!);
    console.log('formData :', formData)
    this.overviewService.getOverviewData(formData).subscribe((res: any) => {
      console.log(res)
      this.dataSource = res['data'];
      this.tableReady = true
      this.isLoading = false;
    })
  }
}
