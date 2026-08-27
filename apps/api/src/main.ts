import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const PORT = Number(process.env.PORT ?? 3001);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  await app.listen(PORT);
  console.log(`api listening on http://localhost:${PORT}`);
}

void bootstrap();
