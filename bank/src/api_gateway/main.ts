import { NestFactory } from '@nestjs/core';
import { AppModule } from './config/app.module';
import { Redirect } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api.gateway')  /* not an api gateway per se but serves as example for the main point of contact with the client.*/
  await app.listen(process.env.PORT ?? 3002); 

  // Redirect('http://localhost:3002/api.gateway/auth/validation-terminal')
}
bootstrap();
