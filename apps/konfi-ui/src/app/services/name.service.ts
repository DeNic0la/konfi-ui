import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NameService {
  public username = '';
  public nameConfirmed = false;
  public confirmName() {
    if (this.username.trim() !== '') {
      this.nameConfirmed = true;
    }
  }
}
