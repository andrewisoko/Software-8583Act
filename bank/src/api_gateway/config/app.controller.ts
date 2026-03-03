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
import { Body, Controller,Post} from '@nestjs/common';
import { FullRequestDto } from './dto/request.data.dto';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor( private readonly appService:AppService ){}

  @Post()
  RedirectTransactionController(
    @Body() dataDto:FullRequestDto
  ){
    return this.appService.redirectTransaction(dataDto)
  }

}

