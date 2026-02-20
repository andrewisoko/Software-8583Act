// import { Controller, Get } from '@nestjs/common';
// import { AppService } from './app.service';

// @Controller()
// export class AppController {
//   constructor(private readonly appService: AppService) {}

//   @Get()
//   getHello(): string {
//     return this.appService.getHello();
//   }
// }

// app.controller.ts
import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  @Get() // this is "/"
  @Redirect('http://localhost:3002/api.gateway/transaction/orchestra/', 302)
  redirectToTerminalValidation() {
  }
}
