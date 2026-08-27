import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { API_PORT } from "./common/constants";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  await app.listen(API_PORT);
  console.log(`api listening on http://localhost:${API_PORT}`);
}

void bootstrap();
