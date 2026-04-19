import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProdutosComponent } from './components/produtos/produtos.component';
import { NotasFiscaisComponent } from './components/notas-fiscais/notas-fiscais.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuditoriaComponent } from './components/auditoria/auditoria.component';

@NgModule({
  declarations: [
    AppComponent,
    ProdutosComponent,
    NotasFiscaisComponent,
    DashboardComponent,
    AuditoriaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
