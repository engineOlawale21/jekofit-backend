import 'reflect-metadata';
import { DataSource } from 'typeorm';

// Used exclusively by TypeORM's migration commands. The application connection
// is configured separately in AppModule, with the same paths and credentials.
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'jekofit',
  entities: [__dirname + '/../**/*.entity{.js,.ts}'],
  migrations: [__dirname + '/migrations/*{.js,.ts}'],
  migrationsTableName: 'schema_migrations',
  synchronize: false,
});
