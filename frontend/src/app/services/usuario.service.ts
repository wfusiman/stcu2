import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { HTTPCONFIG, API } from './httpconfig';


@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor(private http: HttpClient) { }

  updateUsuario(id: number, isSuper: boolean,
    apellido: string, nombre: string, email: string,
    dni: string, direccion: string, telefono: string): Observable<any> {
    const payload = {
      email: email, apellido: apellido, nombre: nombre,
      dni: dni, direccion: direccion, telefono: telefono, superusuario: isSuper
    };
    return this.http.put(HTTPCONFIG.url + API + '/usuario/' + id, payload);
  }

  getUsuarios(): Observable<any> {
    return this.http.get(HTTPCONFIG.url + API + '/usuarios');
  }

  getUsuario(id: number): Observable<any> {
    return this.http.get(HTTPCONFIG.url + API + '/usuario/' + id);
  }

  deactivateUsuario(id: number): Observable<any> {
    return this.http.delete(HTTPCONFIG.url + API + '/usuario/' + id);
  }

  activateUsuario(id: number): Observable<any> {
    return this.http.get(HTTPCONFIG.url + API + '/usuario/activate/' + id);
  }

  changePasswd(id: number, actual: string, nueva: string): Observable<any> {
    const httpOptions = { headers: new HttpHeaders({ 'Content-type': 'application/json' }) }
    return this.http.put(HTTPCONFIG.url + API + '/usuario/changepass/' + id,
      { actualPass: actual, newPass: nueva }, httpOptions
    );
  }
}
