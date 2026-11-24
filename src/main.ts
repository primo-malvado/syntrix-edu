import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { LessonComponent } from './lesson.component';

bootstrapApplication(AppComponent, {
  providers: [provideRouter([
    { path: '', pathMatch: 'full', redirectTo: 'course/foundations' },
    { path: 'course/:id', component: LessonComponent },
    { path: '**', redirectTo: 'course/foundations' }
  ], withHashLocation(), withInMemoryScrolling({ scrollPositionRestoration: 'top' }))]
}).catch(error => console.error(error));
