import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { EquiposComponent } from './pages/equipos/equipos';
import { EquipoDetalleComponent } from './pages/equipo-detalle/equipo-detalle';
import { CompeticionesComponent } from './pages/competiciones/competiciones';
import { CompeticionDetalleComponent } from './pages/competicion-detalle/competicion-detalle';
import { NoticiasComponent } from './pages/noticias/noticias';
import { NoticiaDetalleComponent } from './pages/noticia-detalle/noticia-detalle';
import { DocumentacionComponent } from './pages/documentacion/documentacion';
import { ContactoComponent } from './pages/contacto/contacto';
import { GaleriaComponent } from './pages/galeria/galeria';
import { ProductosComponent } from './pages/productos/productos';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';
import { PerfilComponent } from './pages/perfil/perfil';
import { MedicalRecognitionComponent } from './pages/medical-recognition/medical-recognition';
import { authGuard } from './guards/auth-guard';
import { PioneersComponent } from './pages/pioneers/pioneers';
import { PagosComponent } from './pages/pagos/pagos';
import { HistorialComponent } from './pages/historial/historial';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'pioneers', component: PioneersComponent }, // Nueva ruta PIONEERS
  { path: 'equipos', component: EquiposComponent },
  { path: 'equipos/:id', component: EquipoDetalleComponent },
  { path: 'competiciones', component: CompeticionesComponent },
  { path: 'competiciones/:id', component: CompeticionDetalleComponent },
  { path: 'noticias', component: NoticiasComponent },
  { path: 'noticias/:id', component: NoticiaDetalleComponent },
  {
    path: 'documentacion',
    component: DocumentacionComponent,
    canActivate: [authGuard]
  },
  { path: 'medical-recognition', component: MedicalRecognitionComponent, canActivate: [authGuard] },
  { path: 'contacto', component: ContactoComponent },
  {
    path: 'galeria',
    component: GaleriaComponent,
    canActivate: [authGuard]
  },
  {
    path: 'perfil',
    component: PerfilComponent,
    canActivate: [authGuard]
  },
  {
    path: 'historial',
    component: HistorialComponent,
    canActivate: [authGuard]
  },
  { path: 'pagos', component: PagosComponent, canActivate: [authGuard] },
  { path: 'productos', component: ProductosComponent },
  { path: '**', redirectTo: '' }
];
