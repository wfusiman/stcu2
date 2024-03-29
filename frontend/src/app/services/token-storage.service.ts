import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {

  private authStatusListener = new Subject<boolean>();
  
  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }
  
  constructor() { }

  signOut() {
    window.localStorage.clear();
    this.authStatusListener.next( false );
  }

  public saveToken(token: string) {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.setItem(TOKEN_KEY, token);
  }

  public getToken(): string | null {
    return window.localStorage.getItem(TOKEN_KEY);
  }

  public saveUser(user: any): void {
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.authStatusListener.next( true );
  }

  public getUser(): any {
    const user = window.localStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user);
    }
    return {};
  }

  public isUserAdmin(): boolean {
    const usr = this.getUser();
    return (usr && usr.roles) ? !!usr.roles.find( (r:string) => r =='ROLE_ADMIN'): false;
  }
}
