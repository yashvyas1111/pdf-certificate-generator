import dotenv from 'dotenv';
dotenv.config();

console.log('All env vars:', process.env);
console.log('MONGO_CONN:', process.env.MONGO_CONN);
console.log('PORT:', process.env.PORT);