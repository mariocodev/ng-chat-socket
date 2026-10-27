import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './components/chat/chat.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
	{path: '', component: LoginComponent},
	{path: 'chat/:userId/:contactId', component: ChatComponent, canActivate: [AuthGuard]},
	{path: '**', redirectTo: ''}
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
