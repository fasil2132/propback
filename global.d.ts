// declare namespace NodeJS {
//     interface ProcessEnv {
//       DATABASE_URL: string;
//       JWT_SECRET: string;
//     }
//   }
  
declare namespace NodeJS {
  interface ProcessEnv {
    DB_HOST: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    JWT_SECRET: string;
    PORT: string;
    NODE_ENV: string;
  }
}