import { NestFactory } from '@nestjs/core';
import { AppModule } from './config/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api.gateway')  /* not an api gateway per se but serves as example for the main point of contact with the client.*/
  await app.listen(process.env.PORT ?? 3002); 
}
bootstrap();
