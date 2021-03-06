import { Injectable } from '@angular/core';

// PRIMERO IMPORTO EL EL ANGULAR FIRE AUTH.
import { AngularFireAuth } from "@angular/fire/auth";


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private AFauth : AngularFireAuth) { }


login(email : string, password : string){

  return new Promise((resolve, rejected) => {

  this.AFauth.signInWithEmailAndPassword(email, password)
  
  .then (user => resolve(user.user.email))
  
  .catch(err => rejected(err))

  });

}

registrarUsuario(email : string, contraseña : string)
{
  return new Promise((resolve, rejected) => {

    this.AFauth.createUserWithEmailAndPassword(email, contraseña)
    
    .then (user => resolve(user))
    
    .catch(err => rejected(err))
  
    });
}

/*
mandarCorreoElectronico(email : string)
{

    return new Promise((resolve, rejected) => {

      this.AFauth.sendPasswordResetEmail(email)
      
      .then (email => resolve(email))
      
      .catch(err => rejected(err))
      });

}
*/


mandarCorreoElectronico(email : string)
{
  setTimeout(()=>{
    this.AFauth.sendPasswordResetEmail(email);
  },3000);

}


}

