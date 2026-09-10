require('dotenv').config();

module.exports = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5425,
  username: process.env.DB_USERNAME || 'reyna',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'db_reyna',
  synchronize: true,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*.js'],
  cli: {
    migrationsDir: 'src/migrations',
  },
};
