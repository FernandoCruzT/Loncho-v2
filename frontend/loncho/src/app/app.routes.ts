import { Routes } from '@angular/router';
import { authGuard, noAdminGuard } from './core/guards/auth.guard';
import { adminGuard }              from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/catalogo/catalogo.component').then(m => m.CatalogoComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'carrito',
    canActivate: [noAdminGuard],
    loadComponent: () =>
      import('./components/carrito/carrito.component').then(m => m.CarritoComponent)
  },
  {
    path: 'checkout',
    canActivate: [authGuard, noAdminGuard],
    loadComponent: () =>
      import('./components/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'mis-pedidos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/mis-pedidos/mis-pedidos.component').then(m => m.MisPedidosComponent)
  },
  {
    path: 'perfil',
    canActivate: [authGuard, noAdminGuard],
    loadComponent: () =>
      import('./components/perfil/perfil.component').then(m => m.PerfilComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./components/admin/admin.component').then(m => m.AdminComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
