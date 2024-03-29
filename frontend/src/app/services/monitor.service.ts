import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { HTTPCONFIG, API } from './httpconfig';

@Injectable({
  providedIn: 'root'
})
export class MonitorService {

  coordenadas = [
    { lat: -42.773298, lng: -65.052403 },
    { lat: -42.773161, lng: -65.052030 },
    { lat: -42.773027, lng: -65.051646 },
    { lat: -42.772955, lng: -65.051446 },
    { lat: -42.772889, lng: -65.051242 },
    { lat: -42.772826, lng: -65.051038 },
    { lat: -42.772734, lng: -65.050798 },
    { lat: -42.772635, lng: -65.050527 },
    { lat: -42.772559, lng: -65.050312 },
    { lat: -42.772493, lng: -65.050122 },
    { lat: -42.772415, lng: -65.049878 },
    { lat: -42.772342, lng: -65.049678 },
    { lat: -42.772258, lng: -65.049440 },
    { lat: -42.772152, lng: -65.049143 },
    { lat: -42.772098, lng: -65.048972 },
    { lat: -42.772191, lng: -65.048888 },
    { lat: -42.772380, lng: -65.048772 },
    { lat: -42.772380, lng: -65.048772 },
    { lat: -42.772613, lng: -65.048617 },
    { lat: -42.772908, lng: -65.048445 },
    { lat: -42.773030, lng: -65.048361 },
    { lat: -42.772957, lng: -65.048024 },
    { lat: -42.772851, lng: -65.047695 },
    { lat: -42.772762, lng: -65.047423 },
  ]
  data = [
    {
      id: 23, colectivo: { id: 1, unidad: 'colectivo 3', },
      lineaDenominacion: 'linea 2', recorridoDenominacion: 'IDA', transito: true,
      coordenadas: this.coordenadas.slice(0, 10)
    },
    { id: 25, colectivo: { id: 1, unidad: 'colectivo 4', }, lineaDenominacion: 'linea 2', recorridoDenominacion: 'REGRESO', transito: true },
    { id: 26, colectivo: { id: 1, unidad: 'colectivo 1', }, lineaDenominacion: 'linea 1', recorridoDenominacion: 'IDA', transito: true },
    { id: 55, colectivo: { id: 1, unidad: 'colectivo 5', }, lineaDenominacion: 'linea 5', recorridoDenominacion: 'IDA', transito: true },
    { id: 77, colectivo: { id: 1, unidad: 'colectivo 6', }, lineaDenominacion: 'linea 3', recorridoDenominacion: 'REGRESO', transito: true },
    { id: 83, colectivo: { id: 1, unidad: 'colectivo 22', }, lineaDenominacion: 'linea 1', recorridoDenominacion: 'REGRESO', transito: true }
  ];

  last: number = 9;

  constructor(private http: HttpClient) { }


  getUnidadesTransito(): Observable<any> {
    //return of({ error: false, codigo: 200, mensaje: 'lista de unidades en recorrido', data: this.data });
    return this.http.get(HTTPCONFIG.url + API + '/transito/unidades');
  }

  getUnidadRecorridoTransito(idTransito: number): Observable<any> {
    /* const transit = this.data.find((it: any) => it.id == idTransito);
    return of({ error: false, codigo: 200, mensaje: 'transito ', data: transit }) */

    return this.http.get(HTTPCONFIG.url + API + '/transito/unidad/' + idTransito);
  }

  getUltimaCoordenadaColectivoRecorrido(idColRec: number): Observable<any> {
    /* if (this.last < this.coordenadas.length)
      return of( {error:false, codigo:200, mensaje:'ultima coordenada', data: this.coordenadas[this.last++]});
    else 
      return of( {error:false, codigo:200, mensaje:'ultima coordenada', data: this.coordenadas[this.last-1]});   */
    return this.http.get(HTTPCONFIG.url + API + '/transito/coordenadas/unidad/' + idColRec);
  }

  detenerColRec(idColRec: number, idLinea: number, disabled: boolean): Observable<any> {
    return this.http.delete(HTTPCONFIG.url + API + '/transito/detener/unidad/' + idColRec + '/' + idLinea + '/' + disabled);
  }

  notificaciones = [
    {
      id: 573,
      fecha: "01/17/2024, 12:35 AM",
      descripcion: "Unidad Desviada",
      tipo: "DESVIADO",
      activa: true,
      coordenada: { id: 0, lat: -42.7763627, lng: -65.0523424, direccion: null, codigo: 0, fechaNotificacion: null, orden: 0 },
      colectivoDenom: "23", recorridoDenom: "IDA", lineaDenom: "LINEA 2"
    }
  ]
  getNotificacionesActivas(): Observable<any> {
    //return of( { error: false, codigo:200, mensaje: 'notificaciones activas', data: this.notificaciones });
    return this.http.get(HTTPCONFIG.url + API + '/notificacion/activas');
  }
}
