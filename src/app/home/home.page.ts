import { Component } from '@angular/core';


// IMPORTO EL ROUTER COMO ULTIMO PASO.
import { Router } from "@angular/router";
import { MenuController, LoadingController, AlertController } from '@ionic/angular';
import { async } from '@angular/core/testing';
import {AngularFirestore} from "@angular/fire/firestore";
import { DatabaseService } from '../servicios/database.service';
import { AuthService } from '../servicios/auth.service';

// BARCODE SCANNER:
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { ComplementosService } from '../servicios/complementos.service';
import { flatten } from '@angular/compiler';
import { Camera,CameraOptions } from '@ionic-native/camera/ngx';
import {AngularFireStorage} from "@angular/fire/storage"

import * as firebase from 'firebase/app';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  perfilUsuario : any;
  coleccionRef ;
  tieneCorreo : string; // Comprobamos si tiene correo el usuario
 
  // Nombre del usuario anonimo que se va aguardar en la lista de espera.
  nombreAnonimo;

  // Lista de usuarios que se registran
  listaUsuarios = [];

  // Lista de usuarios en espera
  listaEspera = [];

  // Lista de pedidos
  listaPedidos = [];

  constructor(private router : Router,
    private barcodeScanner : BarcodeScanner,
    private menu: MenuController ,
    private firestore : AngularFirestore,
    private bd : DatabaseService,
    public complemento: ComplementosService,
    private camera : Camera,
    private auth : AuthService,
    private st : AngularFireStorage,
    public alertController: AlertController) {  }

    // Informacion de la lista de espera
  usuarioMesa = {
    mesa : "",
    estadoMesa : "",
    nombreUsuario: "",
    perfilUsuario : "",
    consulta: "noRealizo",
    consultaDescripcion : "",
  }

  // Datos del anonimo
  anonimoNombre;
  anonimoFoto;
  usuarioAnonimo : any ;
  
  // Se obtiene el correo del cliente
  correoCliente ;

  // Se obtiene la info de la persona que ingreso
  infoUsuario : any;

  // Correo del usuario que ingreso
  correoUsuario : string;

  // Mensaje avisando al cliente  su asignacion de mesa
  informarEstadoMesa ={
    mesa: "",
    seAsignoMesa : "no",
  };

  // Variable que nos mostrara los productos una vez escaneado el codigo qr
  mostrarProductos : boolean = false;

  // Lista de los productos que se mostraran
  listaProductos = [];

  // Lista de los pedidos cargados con su respectivo perfil
  listaPedidoCocinero=[];
  listaPedidoBartender = [];

  // Lista de pedidos finalizados
  listaPedidosFinalizados = []

  //Contadores para las notificaciones
  //Para el mozo:
  contadorMozoConsulta = 0;
  contadorMozoPedidoFinalizado = 0;
  contadorMozoPedidoPendiente= 0;


  ngOnInit() {

    this.complemento.presentLoading();

    this.tieneCorreo  = localStorage.getItem('tieneCorreo');

    if(this.tieneCorreo == 'conCorreo') // Si ingreso con correo, comprobara el perfil de la base de datos
    {
      
       this.correoUsuario = localStorage.getItem('correoUsuario'); // Obtenemos el correo del usuario que ingreso 
       //this.perfilUsuario = this.bd.obtenerUsuariosBD('usuarios',auxCorreoUsuario); // Lo que obtenemos aca es el perfil del usuario 
       //console.log(this.perfilUsuario);
       this.firestore.collection('usuarios').get().subscribe((querySnapShot) => {

        querySnapShot.forEach(datos => {
  
          if(datos.data().correo == this.correoUsuario  )
          {
            this.perfilUsuario = datos.data().perfil;
            this.infoUsuario = datos.data();
            
            if(this.perfilUsuario == 'Dueño' || this.perfilUsuario == 'Supervisor')
            {
              // Voy a obtener la colección de usuarios y la guardo en FB.
            let fb = this.firestore.collection('usuarios');
              
      
            // Me voy a suscribir a la colección, y si el usuario está "ESPERANDO", se va a guardar en una lista de usuarios.
            fb.valueChanges().subscribe(datos =>{       // <-- MUESTRA CAMBIOS HECHOS EN LA BASE DE DATOS.
              
              this.listaUsuarios = [];
      
              datos.forEach( (dato:any) =>{
      
                if(dato.estado == 'esperando') // Verifico que el estado sea esperando.
                {
                  this.listaUsuarios.push(dato);      // <--- LISTA DE USUARIOS ESPERANDO
                }
                
               });
      
              })
            }

            else if (this.perfilUsuario == 'Mozo')
            {
              // ** verificamos que al mozo le carguen las consultas
              let fb = this.firestore.collection('listaEspera');
  
              // Me voy a suscribir a la colección, y si el usuario está "ESPERANDO", se va a guardar en una lista de usuarios.
              fb.valueChanges().subscribe(datos =>{       // <-- MUESTRA CAMBIOS HECHOS EN LA BASE DE DATOS.
                
                this.listaEspera = [];
        
                datos.forEach( (dato:any) =>{
        
                  if(dato.consulta == 'realizoConsulta') // Verifico que el estado sea esperando.
                  {
                    this.listaEspera.push(dato);      // <--- LISTA DE USUARIOS.
                  }
                  
                });
                
                this.contadorMozoConsulta = this.listaEspera.length;

                 })

                 this.correoCliente = this.correoUsuario ;
                 let fb2 = this.firestore.collection('pedidos');
   
                 fb2.valueChanges().subscribe(datos =>{       // <-- MUESTRA CAMBIOS HECHOS EN LA BASE DE DATOS.
                 
                 this.listaPedidos = [];
                 this.listaPedidosFinalizados = [];
         
                   datos.forEach((dato:any) => {
   
                     if(dato.estadoPedido == 'enEspera'){
   
                       this.listaPedidos.push(dato);
   
                     }
                     else if(dato.estadoBartender == 'finalizado' && dato.estadoChef == 'finalizado' && dato.estadoPedido == 'enPreparacion') // Pedir bebida
                     {
                       this.listaPedidosFinalizados.push(dato);
                     }
                   })

                   
                   this.contadorMozoPedidoPendiente = this.listaPedidos.length;
                   this.contadorMozoPedidoFinalizado = this.listaPedidosFinalizados.length;
                  })
                  
            }
            // SI EL PERFIL ES COCINERO
            else if (this.perfilUsuario == 'Cocinero')
            {
              this.infoUsuario = datos.data();
              let fb = this.firestore.collection('pedidos');

      
            // Me voy a suscribir a la colección, y si el usuario está "ESPERANDO", se va a guardar en una lista de usuarios.
            fb.valueChanges().subscribe(datos =>{       // <-- MUESTRA CAMBIOS HECHOS EN LA BASE DE DATOS.
              
              this.listaPedidoCocinero = [];
      
              datos.forEach( (dato:any) =>{
      
                if((dato.estadoChef == 'enProceso' || dato.estadoChef == 'enPreparacion') && (dato.estadoPedido=="pendiente" || dato.estadoPedido=="enPreparacion")) // Verifico que el estado sea esperando.
                {
                  this.listaPedidoCocinero.push(dato);      // <--- LISTA DE USUARIOS.
                }
                
              });
      
               })
            
            }

            else if (this.perfilUsuario == 'BarTender')
            {
              this.infoUsuario = datos.data();
              let fb = this.firestore.collection('pedidos');

      
            // Me voy a suscribir a la colección, y si el usuario está "ESPERANDO", se va a guardar en una lista de usuarios.
            fb.valueChanges().subscribe(datos =>{       // <-- MUESTRA CAMBIOS HECHOS EN LA BASE DE DATOS.
              
              this.listaPedidoBartender = [];
      
              datos.forEach( (dato:any) =>{
      
                if((dato.estadoBartender == 'enProceso' || dato.estadoBartender == 'enPreparacion') && (dato.estadoPedido=="pendiente" || dato.estadoPedido=="enPreparacion")) // Verifico que el estado sea esperando.
                {
                  this.listaPedidoBartender.push(dato);      // <--- LISTA DE USUARIOS.
                }
                
              });
      
               })
            
            }

      
            // Si el perfil es metre le cargara la lista de espera
            else if (this.perfilUsuario == 'Metre')
            {
              this.infoUsuario = datos.data();
              let fb = this.firestore.collection('listaEspera');

      
            // Me voy a suscribir a la colección, y si el usuario está "ESPERANDO", se va a guardar en una lista de usuarios.
            fb.valueChanges().subscribe(datos =>{       // <-- MUESTRA CAMBIOS HECHOS EN LA BASE DE DATOS.
              
              this.listaEspera = [];
      
              datos.forEach( (dato:any) =>{
      
                if(dato.estadoMesa == 'enEspera') // Verifico que el estado sea esperando.
                {
                  this.listaEspera.push(dato);      // <--- LISTA DE USUARIOS.
                }
                
              });
      
               })
            
            }
            //Si el perfil del usuario que ingreso es un cliente, comprobara el estado de lista de espera
            else if (this.perfilUsuario == 'Cliente')
            {
              // Obtenemos el correo del usuario que 
              this.correoCliente = this.correoUsuario ;
              let fb = this.firestore.collection('listaEspera');
          
              fb.valueChanges().subscribe(datos =>{       // <-- MUESTRA CAMBIOS HECHOS EN LA BASE DE DATOS.
              
              this.listaEspera = [];
      
              datos.forEach( (datoCl:any) =>{
                
                // Si el estado de la mesa esta asignada y coincide la informacion del usuario que inicio sesion, se guardara en un json el numero de mesa que se le asigno uy una bandera
                if(datoCl.estadoMesa == 'mesaAsignada' && datoCl.nombreUsuario == this.infoUsuario.nombre) 
                {
                  this.informarEstadoMesa.mesa = datoCl.mesa;
                  this.informarEstadoMesa.seAsignoMesa = "si";
                }
                
                });
      
               })

               let fb2 = this.firestore.collection('pedidos');
          
               fb2.valueChanges().subscribe(datos =>{       // <-- MUESTRA CAMBIOS HECHOS EN LA BASE DE DATOS.
               
       
               datos.forEach( (datoCl:any) =>{
                 
                 // Si el estado de la mesa esta asignada y coincide la informacion del usuario que inicio sesion, se guardara en un json el numero de mesa que se le asigno uy una bandera
                 if(datoCl.estadoPedido=="finalizado" && datoCl.mesa == this.informarEstadoMesa.mesa) 
                 {
                  this.presentAlert();
                 }
                 
                 });
       
                })


              
            }
            
        
          
          }
        })
  
      })

    }

    else // Si no ingreso con correo, automaticamente sabe que es un usuario anonimo
    {
      
      let variable = localStorage.getItem('nombreAnonimo'); //***** VALIDAR EL NOMBRE TAMBIEN PORQUE SE VA ROMPER TODO */
      this.nombreAnonimo = JSON.parse(variable);
      this.perfilUsuario = "Anonimo";
      let fb = this.firestore.collection('listaEspera');
          
      fb.valueChanges().subscribe(datos =>{       // <-- MUESTRA CAMBIOS HECHOS EN LA BASE DE DATOS.
      
      this.listaEspera = [];

      datos.forEach( (datoCl:any) =>{
        
        // Si el estado de la mesa esta asignada y coincide la informacion del usuario que inicio sesion, se guardara en un json el numero de mesa que se le asigno uy una bandera
        if(datoCl.estadoMesa == 'mesaAsignada' && datoCl.nombreUsuario == this.nombreAnonimo.nombre) 
        {
          this.informarEstadoMesa.mesa = datoCl.mesa;
          this.informarEstadoMesa.seAsignoMesa = "si";
        }
        
        });

       })
    }

    this.cargarProductos(); // Probamos a ver si funciona

  }


  redireccionar(perfil)
  {
    switch(perfil)
    {
      case 'supervisor' :  
      this.router.navigate(['/alta-supervisor']);
        break;
      case 'empleado' : 
      this.router.navigate(['/alta-empleado']);
      break;
      case 'cliente' : 
      this.router.navigate(['/alta-cliente']);
      break;
      case 'producto' : 
      this.router.navigate(['/alta-producto']);
      break;
      case 'atras' : 
      this.router.navigate(['/login']);
      break;
    }
     
  }

  // PARA EL DUEÑO O SUPERVISOR -> aceptara o rechazara al cliente se le carga el estado del boton y los dtos del usuario
  organizarUsuario(usuario,estado){


    let indice = this.listaUsuarios.indexOf(usuario); // Encontrar el indice del usuario.

    this.listaUsuarios.splice(indice,1); // Borrar exclusivamente ese índice.
    // Esto borra de la LISTA, no de la base de datos.


    // A partir de acá empiezo a realizar cambios en la base de datos.

    // Obtengo la coleción y me suscribo a ella.
    this.firestore.collection('usuarios').get().subscribe((querySnapShot) => {
      querySnapShot.forEach((doc) => {

      
        // Correo de la BD == Correo de la lista.
       if(doc.data().correo == usuario.correo)
       {

        // Si lo rechaza.
         if(estado == "rechazado")
         {
          usuario.estado = estado;                        // El cliente pasa a estar rechazado.
          this.bd.actualizar('usuarios',usuario,doc.id);  // Actualiza el estado del cliente.
          this.listaUsuarios = [];
         }

         else{    // Estado aceptado.


          if (doc.data().perfil == "Cliente")
          {
          usuario.estado = estado;                                          // El cliente pasa a estar aceptado.
          this.bd.actualizar('usuarios',usuario,doc.id);                    // Actualiza el estado del cliente.               
          this.auth.registrarUsuario(usuario.correo,usuario.contrasenia);   // Registra el usuario en la BD. Asi puede ingresar al login. Con el estado aceptado.
          this.auth.mandarCorreoElectronico(usuario.correo);    
          this.listaUsuarios = [];            // Le envia un correo electrónico informado lo sucedido.
          }

          else
          {
            usuario.estado = estado;                                          // El cliente pasa a estar aceptado.
            this.bd.actualizar('usuarios',usuario,doc.id);    
            this.listaUsuarios = [];                // Actualiza el estado del cliente.              
          }

         }
        
         this.listaUsuarios = []; // esto pone la lista vacía para que quede facherisima.
       }

      })
    })

    
  
    
  }

  // PARA EL ANONIMO ->Recorre la coleccion de usuarios de la bd verificando su nombre
  listaEsperaQRAnonimo()
  {
    this.firestore.collection('usuarios').get().subscribe((querySnapShot) => {
      querySnapShot.forEach((doc) => {

        console.log(this.nombreAnonimo.nombre);
        console.log(this.nombreAnonimo.foto);
        if(doc.data().nombre == this.nombreAnonimo.nombre && doc.data().foto == this.nombreAnonimo.foto)
        {

                this.usuarioMesa.nombreUsuario = doc.data().nombre;
                this.usuarioMesa.estadoMesa = "enEspera";
                this.usuarioMesa.perfilUsuario = doc.data().perfil;
                this.bd.crear('listaEspera', this.usuarioMesa);
            console.log("estoy adentro");
        }

          this.listaEspera = []; // esto pone la lista vacía para que quede facherisima.

      })

    })


    /*
    let auxMesa;

    this.barcodeScanner.scan().then(barcodeData => {

    auxMesa = JSON.parse(barcodeData.text);

    this.firestore.collection('usuarios').get().subscribe((querySnapShot) => {
      querySnapShot.forEach((doc) => {

        if(doc.data().nombre == this.nombreAnonimo)
        {
          if(auxMesa == 101010)
          {
                this.usuarioMesa.nombreUsuario = doc.data().nombre;
                this.usuarioMesa.estadoMesa = "enEspera";
                this.usuarioMesa.perfilUsuario = doc.data().perfil;
                this.bd.crear('listaEspera', this.usuarioMesa);
          }
          
        }

          this.listaEspera = []; // esto pone la lista vacía para que quede facherisima.

      })

    })


     }).catch(err => {
         console.log('Error', err);
     });*/
     
  }

  // PARA EL CLIENTE -> Recorre la coleccion de usuarios de la bd verificando el correo del cliente y no su nombre
  listaEsperaQRCliente()
  {

    this.firestore.collection('usuarios').get().subscribe((querySnapShot) => {
      querySnapShot.forEach((doc) => {

        if(doc.data().correo == this.correoCliente)
        {
 
                this.usuarioMesa.nombreUsuario = doc.data().nombre;
                this.usuarioMesa.estadoMesa = "enEspera";
                this.usuarioMesa.perfilUsuario = doc.data().perfil;
                this.bd.crear('listaEspera', this.usuarioMesa);
          // Tendria que poner una validacion que compruebe que la  mesa esta vacia, ocupada, desocupada
          
        }

          this.listaEspera = []; // esto pone la lista vacía para que quede facherisima.

      })

    })
    /*
    let auxMesa;

    this.barcodeScanner.scan().then(barcodeData => {

    auxMesa = JSON.parse(barcodeData.text);

    this.firestore.collection('usuarios').get().subscribe((querySnapShot) => {
      querySnapShot.forEach((doc) => {

        if(doc.data().correo == this.correoCliente)
        {
          if(auxMesa == 101010)
          {
                this.usuarioMesa.nombreUsuario = doc.data().nombre;
                this.usuarioMesa.estadoMesa = "enEspera";
                this.usuarioMesa.perfilUsuario = doc.data().perfil;
                this.bd.crear('listaEspera', this.usuarioMesa);
          }
          // Tendria que poner una validacion que compruebe que la  mesa esta vacia, ocupada, desocupada
          
        }

          this.listaEspera = []; // esto pone la lista vacía para que quede facherisima.

      })

    })

     }).catch(err => {
         console.log('Error', err);
     });*/
     
  }

 // PARA TODOS -> Cerrara sesion, redireccionara a login y se vaciara el correoUsuario
  cerrarSesion()
  {
    this.correoUsuario  = "";
    localStorage.removeItem('tieneCorreo');
    localStorage.removeItem('correoUsuario');
    this.router.navigate(['/login']);
  }

   // PARA EL METRE -> cuando se seleccione un usuario en espera, se redireccionara a la pagina de  listado-mesas y se guardara en el local storage la info del usuario seleccionado
  comprobarMesas(mesa)
  {
    localStorage.setItem('usuarioSelMesa',JSON.stringify(mesa));
    this.router.navigate(['/listado-mesas']);
  }

  mostrarCuentaBoton = false;
  mostrarEncuestaBoton = false;

  mostrarCuentaDiv = false;
  mostrarEncuestaDiv = false;

  mostrarEncuestaLista()
  {
    this.mostrarCuentaDiv = false;
    this.mostrarEncuestaDiv = true;
    this.mostrarProductos = false;
  }

  mostrarCuentaLista()
  {
    this.mostrarCuentaDiv = true;
    this.mostrarEncuestaDiv = false;
    this.mostrarProductos = false;
  }

  banderaQrMesa = false;
  // PARA CLIENTES Y ANONIMOS -> El usuario al escanear el codigo qr de la mesa podra ver los productos
  qrMesa()
  {
    this.mostrarCuentaDiv = false;
    this.mostrarEncuestaDiv = false;

    this.mostrarProductos = true;
    localStorage.setItem("mesa",this.informarEstadoMesa.mesa);
    
    let fb = this.firestore.collection('pedidos');

    // Me voy a suscribir a la colección, y si el usuario está "ESPERANDO", se va a guardar en una lista de usuarios.
    fb.valueChanges().subscribe(datos =>{       // <-- MUESTRA CAMBIOS HECHOS EN LA BASE DE DATOS.
      
      datos.forEach( (dato:any) =>{

        if(this.informarEstadoMesa.mesa == dato.mesa ) // Verifico que el estado sea esperando.
        {
         
          if(dato.estadoPedido == 'finalizado')
          {
            this.complemento.presentToastConMensajeYColor("Su pedido se finalizo con exito","success");
            if(this.banderaQrMesa == true)
            {
              this.complemento.presentToastConMensajeYColor("Podra acceder a la encuesta y a la cuenta","success");
              this.mostrarCuentaBoton = true;
              this.mostrarEncuestaBoton = true;
            }
            else
            {
              this.banderaQrMesa = true;
            }
          }
          else if(dato.estadoPedido == 'enProceso')
          {
            this.complemento.presentToastConMensajeYColor("Su pedido esta pendiente del mozo","primary");
          }
          else if(dato.estadoPedido == 'enPreparacion')
          {
            this.complemento.presentToastConMensajeYColor("Su pedido esta en preparacion","primary");
          }

    
        }
        
      });

    })
    /*let auxMesa;

    this.barcodeScanner.scan().then(barcodeData => {

    auxMesa = JSON.parse(barcodeData.text);

    let auxMesaString = auxMesa.toString();
    this.firestore.collection('listaMesas').get().subscribe((querySnapShot) => {
      querySnapShot.forEach((doc) => {

        if(doc.data().numero == auxMesaString) //Recorremos las mesas y comprobamos que coincida
        {
          this.mostrarProductos = true;
        }

      })

    })

     }).catch(err => {
         console.log('Error', err);
     });*/
  }

  // PARA LOS CLIENTES Y ANONIMOS -> Cargara un listado completo de los productos
  cargarProductos()
  {
    let fb = this.firestore.collection('productos');
              
    fb.valueChanges().subscribe(datos =>{       // <-- MUESTRA CAMBIOS HECHOS EN LA BASE DE DATOS.
      
      this.listaProductos = [];

      datos.forEach( (dato:any) =>{

     this.listaProductos.push(dato);      // <--- LISTA DE USUARIOS.
        
      });

    })
  }

  // CLIENTE O ANONIMO -> Se realiza una consulta al mozo (no se cargara)
  consultarMozo(numeroMesa)
  {
    let auxConsulta ;

    this.firestore.collection('listaEspera').get().subscribe((querySnapShot) => {
      
      querySnapShot.forEach(dato => {

        if(dato.data().mesa == numeroMesa)
        {
          auxConsulta = dato.data();
          auxConsulta.consulta = "realizoConsulta";
          auxConsulta.consultaDescripcion = this.consulta;
          this.bd.actualizar('listaEspera',auxConsulta,dato.id);
          this.cancelarConsulta();
        }

      })
    
    });
      
  }

  // Creamos la bandera que lo activara
  deplegarConsultaMozo : boolean = false;

  // VARIABLE CONSULTA 
  consulta  : string;

  // PARA EL CLIENTE Y ANONIMO -> Abrira una mini pestaña para mostrar si se envia o no
  desplegarConsulta()
  {
    this.deplegarConsultaMozo = true;
  }
  
  cancelarConsulta()
  {
    this.consulta = "";
    this.deplegarConsultaMozo = false;
  }

  //Banderas del MOZO
  banderaMostrarPedidos = false;
  banderaMostrarConsultas = false;
  mostrarPedidoFinalizado:boolean = false;
  

  // PARA EL MOZO -> muestra los pedidos 
  mostrarPedidos()
  {
    this.banderaMostrarPedidos = true;
    this.banderaMostrarConsultas = false;
    this.mostrarPedidoFinalizado = false
  }

  mostrarConsultas()
  {
    this.banderaMostrarPedidos = false;
    this.banderaMostrarConsultas = true;
    this.mostrarPedidoFinalizado = false
  }

  mostrarPedidosFinalizados()
  {
    this.banderaMostrarPedidos = false;
    this.banderaMostrarConsultas = false;
    this.mostrarPedidoFinalizado = true;
  }


  enviarPedidos(mesa)
  {
    let auxPedido;

    this.firestore.collection('pedidos').get().subscribe((querySnapShot) => {
      
      querySnapShot.forEach(dato => {

        if(dato.data().mesa == mesa)
        {
          auxPedido = dato.data();
          auxPedido.estadoChef = "enProceso";
          auxPedido.estadoBartender = "enProceso";
          auxPedido.estadoPedido = "pendiente";
          this.bd.actualizar('pedidos',auxPedido,dato.id);
          this.cancelarConsulta();
        }

      })
    
    });
  }

  cancelarPedido(mesa)
  {
    let auxPedido;

    this.firestore.collection('pedidos').get().subscribe((querySnapShot) => {
      
      querySnapShot.forEach(dato => {

        if(dato.data().mesa == mesa)
        {
          auxPedido = dato.data();
          auxPedido.estadoPedido = "cancelado";
          this.bd.actualizar('pedidos',auxPedido,dato.id);
          this.cancelarConsulta();
        }

      })
    
    });
  }

  enviarPedidoFinalizado(mesa)
  {
    let auxPedido;

    this.firestore.collection('pedidos').get().subscribe((querySnapShot) => {
      
      querySnapShot.forEach(dato => {

        if(dato.data().mesa == mesa)
        {
            auxPedido = dato.data();
            auxPedido.estadoPedido = "finalizado"; // Cuando le da a enviar, el cliente escaneara el codigo QR donde el estado le saldra finalizado
            this.bd.actualizar('pedidos',auxPedido,dato.id);
        }

      })
    
    });
  }


  // PARA EL BARTENDER O COCINERO -> PREPARARA EL PEDIDO 
  // estados del pedido .. 
  // enProceso -> cuando el mozo le asigna al bartender y/o al Cocinero
  // enPreparacion -> cuando el bartender y/o el cocinero 
  // finalizado -> cuando el pedido se finalizo
  elaborarPedido(mesa, estadoPedido,perfil)
  {
    let auxPedido;
    
    this.firestore.collection('pedidos').get().subscribe((querySnapShot) => {
      
      querySnapShot.forEach(dato => {

        if(dato.data().mesa == mesa)
        {
          if(perfil == "BarTender" && estadoPedido == "enPreparacion")
          {
            auxPedido = dato.data();
            auxPedido.estadoBartender =estadoPedido;
            auxPedido.estadoPedido = estadoPedido;
            this.bd.actualizar('pedidos',auxPedido,dato.id);
            this.cancelarConsulta();
          }
          else if(perfil == "BarTender" && estadoPedido == "finalizado")
          {
            auxPedido = dato.data();
            auxPedido.estadoBartender =estadoPedido;
            this.bd.actualizar('pedidos',auxPedido,dato.id);
            this.cancelarConsulta();
          }
          if(perfil == "Cocinero" && estadoPedido == "enPreparacion")
          {
            auxPedido = dato.data();
            auxPedido.estadoChef =estadoPedido;
            auxPedido.estadoPedido = estadoPedido;
            this.bd.actualizar('pedidos',auxPedido,dato.id);
            this.cancelarConsulta();
          }
          else if(perfil == "Cocinero" && estadoPedido == "finalizado")
          {
            auxPedido = dato.data();
            auxPedido.estadoChef =estadoPedido;
            this.bd.actualizar('pedidos',auxPedido,dato.id);
            this.cancelarConsulta();
          }
          
        }

      })
    
    });


  }

  gradoSatisfaccion ;
  gradoSatisfaccionRes;

  jsonEncuesta ={
    preguntaUno: 0,
    preguntaDos: 0,
    fotos : [],
  }

  cambioRango(event){

    this.gradoSatisfaccion = event.detail.value;
  }
  cambioRangoRes(event){

    console.log(event.detail.value);
    this.gradoSatisfaccionRes = event.detail.value;
  }

  async presentAlert() {

      const alert = await this.alertController.create({
        cssClass: 'danger',
        header: 'Su pedido se a completado',
        message: '<div>Hola</div>',
        buttons: [
          {
            text:'Cancelar',
            role:'cancel',
            cssClass:'danger',
            handler:(bla) =>{
              console.log("confirm cancel:blah");
            }

          },
          {
            text:'Okey',
            cssClass:'success',
            handler: (ok) =>{
              console.log("COnfirmar");
            }
          }

        ]
      });
  
      await alert.present();

  }

  pathImagen = [];
  tomarTresFotografias()
  {
    if(this.jsonEncuesta.fotos.length <=3)
    {
    
    const options: CameraOptions =  { 
      quality:100,
      targetHeight:600,
      targetWidth:600,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
    }
  
    this.camera.getPicture(options).then((imageData)=> {
  
      var base64Str = 'data:image/jpeg;base64,'+imageData;
      //Para que la fotografia se muestre apenas se tomo
  
      var storageRef = firebase.storage().ref();
     
      let obtenerMili = new Date().getTime(); 
  
      var nombreFoto = "encuestas/"+obtenerMili+".jpg";
  
      var childRef = storageRef.child(nombreFoto);
  
      this.pathImagen.push(nombreFoto);
  
      childRef.putString(base64Str,'data_url').then(function(snapshot)
      {
        
        this.pathImagen.array.forEach(element => {
          this.st.storage.ref(element).getDownloadURL().then((link) =>
          {
            this.this.jsonEncuesta.fotos.push(link);
          });
        });
       
      })
  
    },(Err)=>{
      alert(JSON.stringify(Err));
      })
    }
  }

  verEncuestas()
  {

  }

  enviarEncuesta()
  {
    this.jsonEncuesta.preguntaUno=this.gradoSatisfaccion;
    this.jsonEncuesta.preguntaDos=this.gradoSatisfaccionRes;
     this.bd.crear('encuestas',this.jsonEncuesta);
  } 

}
