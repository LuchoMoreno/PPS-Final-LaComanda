import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';


// ACA IMPORTO LA CONFIGURACION DE MI PROYECTO EN LA CUENTA DE FIREBASE.
import { firebaseConfig } from "../environments/environment";


// IMPORTO MODULOS DE ANGULAR
import { AngularFireModule } from "@angular/fire";

// IMPORTO EL MODULO DE AUTENTIFICACION

import { AngularFireAuthModule} from "@angular/fire/auth";


import { Camera, CameraOptions } from '@ionic-native/camera/ngx';

import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner/ngx';


@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule, 
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule],
  providers: [
    StatusBar,
    SplashScreen,
    Camera,
    QRScanner,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}