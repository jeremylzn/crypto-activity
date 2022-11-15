import { Component, OnInit } from '@angular/core';
import { FormControl,FormGroup,Validators} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  public apiKey = new FormControl('', Validators.required);
  public secretKey = new FormControl('', Validators.required);

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  Submit() {
    const formData = {
      api : this.apiKey.value,
      secret: this.secretKey.value
    }

    localStorage.setItem('formData', JSON.stringify(formData));
    this.router.navigateByUrl('/overview');
  }

}
