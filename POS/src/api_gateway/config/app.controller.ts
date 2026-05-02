
import { Body, Controller,Post, UseGuards} from '@nestjs/common';
import { FullRequestDto } from './dto/request.data.dto';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';


@Controller()
export class AppController {
  constructor( private readonly appService:AppService ){}

  // @UseGuards(AuthGuard('card-jwt'))
  @Post()
  RedirectTransactionController(
    @Body() dataDto:FullRequestDto
  ){
    return this.appService.redirectTransaction(dataDto)
  }

}

