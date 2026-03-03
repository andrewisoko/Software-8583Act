import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { FullRequestDto } from './dto/request.data.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
  ){}
  
  async redirectTransaction(body: FullRequestDto) {
  const response = await firstValueFrom(
    this.httpService.post(
      'http://localhost:3002/api.gateway/transaction/orchestra',
      body
    )
  );

    return response.data;
  }

}

