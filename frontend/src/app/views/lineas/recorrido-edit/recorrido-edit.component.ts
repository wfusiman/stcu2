import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Linea } from 'src/app/data/linea';
import { Recorrido } from 'src/app/data/recorrido';
import { LineaService } from 'src/app/services/linea.service';
import { ParadaService } from 'src/app/services/parada.service';
import { MessageService } from 'src/app/services/message.service';

import * as L from 'leaflet';
import 'leaflet-routing-machine';
import 'esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css';
import 'esri-leaflet-geocoder';
import 'leaflet-geometryutil';

import { Parada } from 'src/app/data/parada';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '../../misc/confirm/confirm.component';

@Component({
  selector: 'app-recorrido-edit',
  templateUrl: './recorrido-edit.component.html',
  styleUrls: ['./recorrido-edit.component.css']
})
export class RecorridoEditComponent implements OnInit {

  modeNew: boolean;
  waiting: boolean;
  linea: Linea; // Linea actual
  recorrido: Recorrido; // Recorrido actual de la linea.
  paradas: Parada[]; // lista de paradas activas.

  trayectos: any[] = []; // trayectos del recorrido.
  waypoints: any[] = []; // waypoints del recorrido.
  rutas: any;
  rutasAnterior: any; // guarda la anterior definicion de las rutas (para permitir deshacer el ultimo cambio)

  map: any; // Mapa en pantalla.
  control: any; // Control de ruta en el mapa.
  paradasGroup: any;

  paradasDisponibles: Parada[]; // lista de paradas disponibles para agregar al recorrido.
  paradasRecorrido: any[]; // lista de paradas en el recorrido.
  paradaIC = new FormControl(null); // Parada seleccionada de la lista de disponibles.
  denominacionIC = new FormControl('', [Validators.required, Validators.maxLength(20)]);

  primeraParada: Boolean = false; // para saber si es primera parada
  rutaEntreParadas: any[]; // aux rutas entre paradas
  distancia = 0;
  tiempo = 0;

  deshacerOption: boolean = false;

  // Icono de parada general.
  iconDiv = L.divIcon({
    html: '<i class="bi bi-geo-fill" style="font-size: 30px; color:black"></i>',
    iconSize: [35, 40],
    iconAnchor: [40, 45],
    popupAnchor: [-15, -30],
    className: 'myDivIcon'
  });
  // Icono de parada que pertenece al recorrido.
  iconDivIn = L.divIcon({
    html: '<i class="bi bi-geo-fill" style="font-size: 30px; color:blue"></i>',
    iconSize: [35, 40],
    iconAnchor: [40, 45],
    popupAnchor: [-15, -30],
    className: 'myDivIcon'
  });

  // Icono de parada inicial que pertenece al recorrido.
  iconDivInicio = L.divIcon({
    html: '<i class="bi bi-geo" style="font-size: 30px; color:green"></i>',
    iconSize: [35, 40],
    iconAnchor: [40, 45],
    popupAnchor: [-15, -30],
    className: 'myDivIcon'
  });
  // Icono de parada final que pertenece al recorrido.
  iconDivFinal = L.divIcon({
    html: '<i class="bi bi-geo-fill" style="font-size: 30px; color:green"></i>',
    iconSize: [35, 40],
    iconAnchor: [40, 45],
    popupAnchor: [-15, -30],
    className: 'myDivIcon'
  });
  @ViewChild('scroller') scroller: CdkVirtualScrollViewport;

  constructor(
    private servicioLinea: LineaService,
    private servicioParada: ParadaService,
    private _msg: MessageService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog) { }

  ngOnInit(): void {
    const mod = this.route.snapshot.paramMap.get("modo");
    if (!mod) {
      this._msg.showMessage('No se indico modo (nuevo o edicion)', 'ERROR');
      this.router.navigate(['../..']);
    }
    this.modeNew = (mod == 'new');
    const id = this.route.snapshot.paramMap.get('id');
    setTimeout(() => {
      this.inicializarMapa();
      if (this.modeNew)
        this.nuevoRecorrido(parseInt(id));
      else
        this.editarRecorrido(parseInt(id));
    });
  }

  /**
   * Configura para generar nuevo recorrido y habilita edicion.
   */
  nuevoRecorrido(idLinea: number) {
    this.paradasRecorrido = [];
    this.waypoints = [];
    this.trayectos = [];
    // Recupera los datos de la linea.
    this.waiting = true;
    this.servicioLinea.getLinea(idLinea).subscribe(result => {
      this.waiting = false;
      this.linea = result.data;
    });
    // cargar todas las paradas.
    this.waiting = true;
    this.servicioParada.getParadasActivas().subscribe(result => {
      this.waiting = false;
      if (!result.error) {
        this.paradas = result.data;
        this.paradasDisponibles = result.data;
        this.loadAllParadasToMap();
      }
    });
  }

  /**
   * Carga el recorrido y lo habilita para edicion.
   * @param id 
   */
  editarRecorrido(id: number) {
    this.waiting = true;
    this.servicioLinea.getRecorrido(id).subscribe(result => {
      this.waiting = false;
      if (!result.error) {
        this.linea = result.data.linea;
        this.recorrido = result.data;

        this.denominacionIC.setValue(this.recorrido.denominacion);
        this.waypoints = this.recorrido.waypoints;
        this.trayectos = this.recorrido.trayectos;

        // Buscar todas las paradas activas y mostrar en el mapa
        this.waiting = true;
        this.servicioParada.getParadasActivas().subscribe(result => {
          this.waiting = false;
          if (!result.error) {
            this.paradas = result.data;
            this.paradasDisponibles = result.data;
            // Agregar cada parada e ir dibujando con trayecto en el mapa sucesivamente.
            this.paradasRecorrido = []
            for (let paradaRec of this.recorrido.paradas) {
              // agrega parada al recorrido;
              this.paradasRecorrido.push(paradaRec);
              // se elimina la parada de la lista de paradas disponibles
              this.paradasDisponibles = this.paradasDisponibles.filter(par => par.codigo != paradaRec.parada.codigo);
            }
          }
          this.loadAllParadasToMap();
        });
        this.loadAllTrayectosToMap();
      }
    });
  }

  /**
   * Inicializa el view mapa.
   */
  inicializarMapa() {
    this.map = L.map('map', {
      center: [-42.775935, -65.038144],
      zoom: 14
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 12,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);
  }

  /**
   * Carga todas las paradas habilitadas en el mapa, diferencia las paradas que pertenecen al recorrido de las que no.
   */
  loadAllParadasToMap() {
    if (this.paradasGroup)
      this.paradasGroup.clearLayers();
    else
      this.paradasGroup = new L.LayerGroup();

    for (let i = 0; i < this.paradas.length; i++) {
      const paradaIn = this.paradasRecorrido.find(p => p.parada.codigo == this.paradas[i].codigo);
      const icon = paradaIn ? this.iconDivIn : this.iconDiv; // selecciona el icono de la parada.
      const marker = new L.Marker([this.paradas[i].coordenada.lat, this.paradas[i].coordenada.lng],
        { icon: icon, title: this.paradas[i].codigo.toString() });
      marker.bindPopup(this.paradas[i].codigo + ': ' + this.paradas[i].direccion, { closeOnClick: true, autoClose: false });

      this.paradasGroup.addLayer(marker);
    }
    this.paradasGroup.addTo(this.map);

    // Mostrar popups de todas las paradas (si no hay paradas en el recorrido) o del ultimo en el recorrido.
    /* const ultimaParadaRec = !this.paradasRecorrido ? null : this.paradasRecorrido[this.paradasRecorrido.length - 1];
    this.paradasGroup.eachLayer((mark: L.Marker) => {
      if (!ultimaParadaRec || ultimaParadaRec.parada.codigo.toString() == mark.options.title)
        mark.openPopup();
    }); */
  }

  loadAllTrayectosToMap() {
    const wps = this.trayectos.map((tray: any) => new L.LatLng(tray.lat, tray.lng));
    const routes = this.waypoints.map((wp: any) => new L.LatLng(wp.lat, wp.lng));
    this.initControlRouting(wps, routes);
  }

  /**
   * Muestra una parada en el mapa como parada general o parada del recorrido (cambia icono): segun el valor de isParadaEnRecorrido.
   */
  loadParadaToMap(isParadaEnRecorrido: boolean, paradaRecorrido: any) {
    console.log("load paradas to map: ", paradaRecorrido, ", isparadaEnRecorrido: ", isParadaEnRecorrido);
    if (paradaRecorrido) {
      for (let par of this.paradasGroup.getLayers()) {
        if (par.options.title == paradaRecorrido.parada.codigo.toString()) {
          par.setIcon(isParadaEnRecorrido ? this.iconDivIn : this.iconDiv);
          if (isParadaEnRecorrido)
            par.openPopup();
          else
            par.closePopup();
        }
        else
          par.closePopup();
      }
    }
  }

  /**
   * Agrega una parada al recorrido y la quita de paradas disponibles. Luego llama a marcar en el mapa.
   * @returns 
   */
  agregarParada() {
    if (!this.paradaIC.value) // Si no se seleccion parada no hace nada.
      return;
    if (!this.paradasRecorrido) // Si el arreglo de parada es null se inicializa.
      this.paradasRecorrido = [];

    const paradaRecAux = {
      id: null,
      parada: this.paradaIC.value,
      orden: this.paradasRecorrido.length,
      distancia: null,
      tiempo: null
    };

    if (!this.rutaEntreParadas) // Si el arreglo de parada es null se inicializa.
      this.rutaEntreParadas = [];

    this.rutaEntreParadas.push(paradaRecAux);

    if (this.primeraParada) {
      const len = this.rutaEntreParadas.length;
      const paradaOrigen = L.latLng(this.rutaEntreParadas[len - 2].parada.coordenada.lat, this.rutaEntreParadas[len - 2].parada.coordenada.lng);
      const paradaSiguiente = L.latLng(this.rutaEntreParadas[len - 1].parada.coordenada.lat, this.rutaEntreParadas[len - 1].parada.coordenada.lng);
      this.distancia = L.GeometryUtil.length([paradaOrigen, paradaSiguiente]);

      console.log("la distancia entre paradas: " + this.distancia.toFixed(0));
    } else {
      this.primeraParada = true;
    }


    // Se agrega la parada al arreglo de paradas.
    const paradaRec = {
      id: null,
      parada: this.paradaIC.value,
      orden: this.paradasRecorrido.length,
      distancia: this.distancia.toFixed(0),
      tiempo: null
    };
    //const paradaRec = { id: null, parada: this.paradaIC.value, orden: this.paradasRecorrido.length, distancia: null, tiempo: null };
    this.paradasRecorrido.push(paradaRec);
    // se elimina la parada de la lista de paradas disponibles
    this.paradasDisponibles = this.paradasDisponibles.filter(par => par.codigo != this.paradaIC.value.codigo);

    this.paradaIC.setValue(null);
    this.loadParadaToMap(true, paradaRec);
    this.addTrayectoRecorrido();
  }

  /**
   * Quita una parada al recorrido y la agrega a paradas disponibles. Luego llama a marcar en el mapa.
   * @param paradaRecorrido 
   */
  quitarParada(paradaRec: any) {
    if (paradaRec) {
      this.paradasRecorrido = this.paradasRecorrido.filter(pr => pr.parada.codigo != paradaRec.parada.codigo);
      this.rutaEntreParadas = [...this.paradasRecorrido];
      this.loadParadaToMap(false, paradaRec);
      this.addParadaToDisponibles(paradaRec.parada);
      this.removeTrayectoRecorrido();
      // si la lista queda vacia, se vuelve a resetar bandera de primeraParada
      if (this.paradasRecorrido.length == 0) {
        this.primeraParada = false;
        this.rutaEntreParadas = []; // vacia el arreglo auxiliar
        this.distancia = 0;
      }
    }
  }

  /**
   * Agrega automaticamente un trayecto de recorrido entre las ultimas dos paradas en el recorrido.
   * @returns 
   */
  addTrayectoRecorrido() {
    const len = this.paradasRecorrido.length;
    if (len <= 1)
      return;

    if (!this.control) { // Inicializa el control solo si hay dos paradas.
      const ultimaPR = this.paradasRecorrido[len - 1].parada.coordenada;
      const anteultimaPR = this.paradasRecorrido[len - 2].parada.coordenada;
      const ultimoMark = new L.LatLng(ultimaPR.lat, ultimaPR.lng);
      const anteultimoMark = new L.LatLng(anteultimaPR.lat, anteultimaPR.lng);
      this.initControlRouting([anteultimoMark, ultimoMark], [anteultimoMark, ultimoMark])
    }
    else {
      const ultimoMark = new L.LatLng(this.paradasRecorrido[len - 1].parada.coordenada.lat, this.paradasRecorrido[len - 1].parada.coordenada.lng);
      const wps = this.control.getWaypoints();
      wps.push(ultimoMark);
      this.control.setWaypoints(wps);
      this.control.addTo(this.map);
      // Oculta el itinerario
      const routingControlContainer = this.control.getContainer();
      const controlContainerParent = routingControlContainer.parentNode;
      controlContainerParent.removeChild(routingControlContainer);
      // Set map view
      const primerMark = new L.LatLng(this.paradasRecorrido[0].parada.coordenada.lat, this.paradasRecorrido[0].parada.coordenada.lng);
      this.map.fitBounds([primerMark, ultimoMark]);
    }
  }

  /**
   * Inicializa el control routing con los trayectos y rutas.
   * @param waypoints 
   * @param routes 
   */
  initControlRouting(waypoints: any[], routes: any[]) {
    this.control = L.Routing.control({
      waypoints: waypoints,
      show: false,
      autoRoute: true,
      collapsible: true,
      showAlternatives: false,
      fitSelectedRoutes: true,
      useZoomParameter: false,
      plan: L.Routing.plan(routes, {
        addWaypoints: true, draggableWaypoints: true,
        createMarker: (i, wp, n) => { return null; }
      }),
      lineOptions: {
        styles: [{ color: 'red', weight: 5 }],
        extendToWaypoints: true,
        missingRouteTolerance: 5
      }
    })
      .addTo(this.map);

    this.control.on('routeselected', (e: any) => {
      console.log("RouteSelected : ", e);

      this.rutasAnterior = this.rutas ? this.rutas : e.route;
      this.rutas = e.route;

      // Comparar si las rutas anterior y actual son disintas.
      const lengthAnterior = this.rutasAnterior ? this.rutasAnterior.waypoints.length : 0;
      const lengthActual = this.rutas ? this.rutas.waypoints.length : 0;

      // solo se analiza si se agregaron waypoints
      if (lengthActual > 0 && lengthAnterior > 0 && lengthActual > lengthAnterior) {
        const ultimaParadaActual = this.rutas.waypoints[lengthActual - 1];
        const ultimaParadaAnterior = this.rutasAnterior.waypoints[lengthAnterior - 1];
        // si la ultimas paradas son distintas, entonces se agrego o elimino una parada, entonces no se habilita deshacer.
        if (!this.equalCoordenada(ultimaParadaActual.latLng, ultimaParadaAnterior.latLng)) {
          this.deshacerOption = false;
        }
        else {
          // si las ultimas paradas del actual y el anterior son iguales entonces se modifico el recorrido, se habilita deshacer.
          this.deshacerOption = true;
        }
      }
      console.log("opcion deshace: ", this.deshacerOption );
    });

    // Oculta el itinerario
    const routingControlContainer = this.control.getContainer();
    const controlContainerParent = routingControlContainer.parentNode;
    controlContainerParent.removeChild(routingControlContainer);
  }


  /**
   * Verifica si dos coordenadas son iguales;
   * @param coord1 
   * @param coord2 
   * @returns 
   */
  equalCoordenada(coord1: any, coord2: any): boolean {
    if (!coord1 || !coord2) return false;
    if (coord1.lat == coord2.lat && coord1.lng == coord2.lng) return true;
    return false;
  }

  /**
   * Remueve los trayectos posteriores a la ultima parada del recorrido
   */
  removeTrayectoRecorrido() {
    console.log("++++ recorrido actual: ", this.rutas.waypoints );
    console.log("++++ recorrido anterior: ", this.rutasAnterior.waypoints );

    const len = this.paradasRecorrido.length;
    if (len <= 1) { // si queda una para o ninguna se reinicia el control.
      if (this.control) {
        this.control.setWaypoints([]);
        this.control.remove();
        this.control = null;
      }
    }
    else { // if (len > 2)  // si quedan mas de dos paradas, entonces se eliminan los waypoints posteriores a la ultima.
      const wps = this.control.getWaypoints();
      const ultimaPR = this.paradasRecorrido[len - 1];
      
      const ultimaParada = L.latLng( ultimaPR.parada.coordenada.lat, ultimaPR.parada.coordenada.lng );
      let lastwp = wps.pop();
      do {
        /* if (lastwp.latLng.lat != ultimaPR.parada.coordenada.lat && lastwp.latLng.lng != ultimaPR.parada.coordenada.lng) {
          console.log("--- quitando parada: ", lastwp );
          lastwp = wps.pop();
        } */
        if (!this.equalCoordenada( ultimaParada, lastwp.latLng ))
          lastwp = wps.pop();
        else {
          wps.push(lastwp);
          lastwp = null;
        }
      }
      while (lastwp != null);

      this.control.setWaypoints(wps);
    }
  }

  /**
   * Agrega una parada a la lista de disponibles y ordena la lista por codigo.
   * @param parada 
   */
  addParadaToDisponibles(parada: any) {
    this.paradasDisponibles.push(parada);
    this.paradasDisponibles.sort((p1: Parada, p2: Parada) => {
      if (p1.codigo < p2.codigo) return -1;
      else if (p1.codigo > p2.codigo) return 1;
      return 0;
    });
  }

  /**
   * Registra un nuevo recorrido.
   * @returns 
   */
  guardarRecorrido() {
    if (!this.control || this.control.getWaypoints().length == 0) {
      this._msg.showMessage('No se definio recorrido', 'ERROR');
      return;
    }
    this.waypoints = this.control.getWaypoints().map((wp: any) => {
      return { lat: wp.latLng.lat, lng: wp.latLng.lng }
    });
    this.trayectos = this.rutas.coordinates.map((coord: any) => {
      return { lat: coord.lat, lng: coord.lng };
    });
    this.recorrido = {
      id: null, activo: true, fechaInicio: new Date(), fechaFin: null,
      denominacion: this.denominacionIC.value.trim().toUpperCase(),
      linea: this.linea,
      trayectos: this.trayectos,
      waypoints: this.waypoints,
      paradas: this.paradasRecorrido //paradasRec
    }

    console.log("Guardar recorrido:", this.recorrido);
    this.waiting = true;
    this.servicioLinea.saveRecorrido(this.recorrido).subscribe(result => {
      this.waiting = false;
      this._msg.showMessage(result.mensaje, result.error ? 'ERROR' : 'EXITO');
      if (!result.error)
        this.router.navigate(['../../view', this.linea.id], { relativeTo: this.route });
    });
  }

  /**
   * Actualiza un recorrido existente.
   * @returns 
   */
  actualizarRecorrido() {
    if (!this.control || this.control.getWaypoints().length == 0) {
      this._msg.showMessage('No se definio recorrido', 'ERROR');
      return;
    }
    this.waypoints = this.control.getWaypoints().map((wp: any) => {
      return { lat: wp.latLng.lat, lng: wp.latLng.lng }
    });
    this.trayectos = this.rutas.coordinates.map((coord: any) => {
      return { lat: coord.lat, lng: coord.lng };
    });
    // Las paradas que ya estaban en el recorrido se actualiza las propiedades (id!=null).
    // Las paradas que no estaban el en recorrido se crearan (id==null)
    // Las paradas que estaban en el recorrido y no estan en el nuevo listado se eliminaran (id=-2).
    const paradasUpd = [];
    for (let pr of this.paradasRecorrido) {
      const par = { id: pr.id, parada: pr.parada, orden: pr.orden, distancia: pr.distancia, tiempo: pr.tiempo };
      if (!par.id) { // si no tiene id, se busca si estaba en el recorrido original y se copia el id para actualizar los campos.
        const updpr = this.recorrido.paradas.find(par => par.parada.codigo == pr.parada.codigo);
        if (updpr)  // si ya estaba en el recorrido se toma el id para que se actualizen las propiedades.
          par.id = updpr.id;
      }
      // si no tiene id o no se encontro en el recorrido original se va a generar el registro (id==null)
      paradasUpd.push(par);
    }
    //const paradasDelete = this.recorrido.paradas.filter(pr => !this.paradasRecorrido.find(p => p.id == pr.id));
    const paradasDel = this.recorrido.paradas.filter(pr => !this.paradasRecorrido.find(p => p.parada.codigo == pr.parada.codigo));
    for (let pd of paradasDel) // setea la parada a null (para que se elimine la paradaRecorrido) y las agrega a la lista.;
      paradasUpd.push({ id: pd.id, parada: null });

    this.recorrido.denominacion = this.denominacionIC.value.trim().toUpperCase();
    this.recorrido.trayectos = this.trayectos;
    this.recorrido.waypoints = this.waypoints;
    this.recorrido.paradas = paradasUpd;

    this.waiting = true;
    this.servicioLinea.updateRecorrido(this.recorrido.id, this.recorrido).subscribe(result => {
      this.waiting = false;
      this._msg.showMessage(result.mensaje, result.error ? 'ERROR' : 'EXITO');
      if (!result.error)
        this.cerrar();
    });
  }

  /**
   * Pide confirmacion y desactiva el recorrido seleccionado.
   */
  desactivarRecorrido() {
    const ref = this.dialog.open(ConfirmComponent, {
      data:
        { titulo: 'Recorrido', mensaje: 'Confirma desactivar recorrido ' + this.recorrido.denominacion + ' de linea ' + this.linea.denominacion + '?' }
    });
    ref.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.waiting = true;
        this.servicioLinea.deactivateRecorrido(this.recorrido.id).subscribe(result => {
          this.waiting = false;
          this._msg.showMessage(result.mensaje, result.error ? 'ERROR' : 'EXITO');
          if (!result.error)
            this.cerrar();
        });
      }
    });
  }

  /**
   * Cierra la pagina actual y regresa a la anterior.
   */
  cerrar() {
    this.router.navigate(['../../view', this.linea.id], { relativeTo: this.route });
  }

  deshacer() {
    console.log("deshacer");
    if (this.rutasAnterior) {
      this.rutas = this.rutasAnterior;
      this.control.setWaypoints(this.rutas.waypoints);
      this.rutasAnterior = null;
      this.deshacerOption = false;
    }
  }
}
