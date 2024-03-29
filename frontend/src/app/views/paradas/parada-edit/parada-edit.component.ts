import { Component, OnInit } from '@angular/core';
import { FormControl, UntypedFormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Parada } from 'src/app/data/parada';
import { ParadaService } from 'src/app/services/parada.service';
import { MessageService } from 'src/app/services/message.service';
import { ESRI_PARAMS } from 'src/app/services/esriConfig';

import * as L from 'leaflet';
import * as ELG from 'esri-leaflet-geocoder';
import 'esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css';
import 'esri-leaflet-geocoder';

@Component({
  selector: 'app-parada-edit',
  templateUrl: './parada-edit.component.html',
  styleUrls: ['./parada-edit.component.css']
})
export class ParadaEditComponent implements OnInit {

  spin: boolean;
  codigo: string;
  parada: Parada;

  direccionIC = new FormControl('', Validators.required);
  descripcionIC = new FormControl('');
  lat: number;
  lng: number;

  map: any;
  marker: any;
  iconParada: any = L.icon({
    iconUrl: 'assets/images/stopbus.png',
    iconSize: [45, 50],
    iconAnchor: [45, 50],
    popupAnchor: [-8, -37]
  });;
  geocodeService: any;

  constructor(private serviceParada: ParadaService,
    private _msg: MessageService,
    private router: Router,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.codigo = this.route.snapshot.paramMap.get('codigo');

    this.initMap();
    if (!this.codigo)
      this.nuevaParada();
    else {
      this.editarParada(parseInt(this.codigo));
    }
  }

  /**
   * Inicializa y prepara pantalla para registrar nueva parada.
   */
  nuevaParada() {
    this.parada = null;
    this.direccionIC.setValue('');
    this.descripcionIC.setValue('');
    this.lat = 0;
    this.lng = 0;
    if (this.marker && this.map.hasLayer(this.marker))
      this.map.removeLayer(this.marker);
  }

  /**
   * Recupera los datos de la parada, inicializa los campos y habilita pantalla para edicion.
   * @param codigo 
   */
  editarParada(codigo: number) {
    this.spin = true;
    this.serviceParada.getParada(codigo).subscribe(result => {
      this.spin = false;
      if (result.error) {
        this._msg.showMessage(result.mensaje, 'ERROR');
        this.router.navigate(['../..'], { relativeTo: this.route });
      }
      this.parada = result.data;
      this.descripcionIC.setValue(this.parada.descripcion);
      this.direccionIC.setValue(this.parada.direccion);
      this.lat = this.parada.coordenada.lat;
      this.lng = this.parada.coordenada.lng;
      this.marker = L.marker([this.parada.coordenada.lat, this.parada.coordenada.lng], { icon: this.iconParada, draggable: true })
        .addTo(this.map)
        .bindPopup(this.parada.direccion)
        .openPopup();
      this.marker.on('dragend', (e: any) => {
        const point = { latlng: new L.LatLng(e.target._latlng.lat, e.target._latlng.lng) };
        this.streetMarker(point)
      });
    });
  }

  /**
   * Inicializa div con mapa de la ciudad y habilita para indicar parada mediante click.
   */
  private initMap() {
    this.map = L.map('map', {
      center: [-42.775935, -65.038144],
      zoom: 16
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 12,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    this.geocodeService = ELG.geocodeService({
      apiKey: ESRI_PARAMS.apiKey,
      token: ESRI_PARAMS.token
    });

    this.map.on('click', (e: any) => {
      this.streetMarker(e);
    });
  }

  statusReverseOk: boolean = true;
  /**
   * Ajusta las coordenadas a la calle.
   * @param point 
   */
  streetMarker(point: any) {
    this.addMarker(point);
    /* if (this.statusReverseOk) {
      this.geocodeService.reverse().latlng(point.latlng).run((error: any, result: any) => { // Ajusta direccion a calle.
        if (error) {  // Si hay error muestra el mensaje.
          this.statusReverseOk = false;
          this._msg.showMessage('No se pudo chequear si el marcador corresponde a calle. Asegurese de que asi sea.', 'WARN');
          this.addMarker(point);
        }
        else // Si hay resultado se carga la parada en la direccion ajustada.
          this.addMarker(result);
      });
    }
    else {
      this._msg.showMessage('No se pudo verificar si el markador esta sobre la calle. Asegurese que asi sea', 'WARN');
      this.addMarker(point);
    } */
  }

  /**
   * Agrega marcador de parada en el mapa en la coordenada indicada.
   * @param coord 
   */
  addMarker(coord: any) {
    if (this.marker && this.map.hasLayer(this.marker)) // Si ya esta la parada en el mapa se elimina.
      this.map.removeLayer(this.marker);

    this.marker = L.marker(coord.latlng, { icon: this.iconParada, draggable: true }).addTo(this.map);
    this.lat = coord.latlng.lat;
    this.lng = coord.latlng.lng;
    fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&langCode=ES&featureTypes=StreetAddress&locationType=street&location=${coord.latlng.lng},${coord.latlng.lat}`)
      .then(res => res.json())
      .then(myJson => {
        this.marker.bindPopup(myJson.address.Address).openPopup();
        // centrar mapa en el marker
        /* const pointBounds = new L.LatLng( coord.latlng.lat +10, coord.latlng.lng);
        this.map.fitBounds( [this.marker.getLatLng(), pointBounds] ); */
        this.direccionIC.setValue(myJson.address.Address);
      })
      .catch(err => console.log("ERROR: ", err));
    this.marker.on('dragend', (e: any) => {
      const point = { latlng: new L.LatLng(e.target._latlng.lat, e.target._latlng.lng) };
      this.streetMarker(point)
    });
  }

  /**
   * Registra la parada
   * @returns 
   */
  guardarParada(salir: boolean) {
    if (!this.marker)
      return;
    this.parada = {
      codigo: null,
      direccion: this.direccionIC.value,
      descripcion: this.descripcionIC.value,
      estado: 'HABILITADA',
      coordenada: {
        lat: this.marker.getLatLng().lat,
        lng: this.marker.getLatLng().lng
      }
    }
    this.spin = true;
    this.serviceParada.saveParada(this.parada).subscribe(result => {
      this.spin = false;
      this._msg.showMessage(result.mensaje, result.error ? 'ERROR' : 'EXITO');
      if (!result.error) {
        if (salir)
          this.router.navigate(['../'], { relativeTo: this.route });
        else
          this.nuevaParada();
      }
    });

  }

  /**
   * Actualiza los datos de una parada
   */
  actualizarParada() {
    this.parada.direccion = this.direccionIC.value;
    this.parada.descripcion = this.descripcionIC.value;
    this.parada.coordenada = {
      lat: this.marker.getLatLng().lat,
      lng: this.marker.getLatLng().lng
    }
    this.spin = true;
    this.serviceParada.updateParada(this.parada).subscribe(result => {
      this.spin = false;
      this._msg.showMessage(result.mensaje, result.error ? 'ERROR' : 'EXITO');
      if (!result.error)
        this.router.navigate(['../..'], { relativeTo: this.route });
    });
  }
}

