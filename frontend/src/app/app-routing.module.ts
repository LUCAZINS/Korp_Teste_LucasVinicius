import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProdutosComponent } from './components/produtos/produtos.component';
import { NotasFiscaisComponent } from './components/notas-fiscais/notas-fiscais.component';
import { AuditoriaComponent } from './components/auditoria/auditoria.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'produtos', component: ProdutosComponent },
  { path: 'notas-fiscais', component: NotasFiscaisComponent },
  { path: 'auditoria', component: AuditoriaComponent },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
