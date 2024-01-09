import mongoose from 'mongoose';
import { app } from './app.js';

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception, Shutting Down....');
  console.error(err.name, err.message);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.log('unhandled rejection, Shutting Down....');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose.connect(db, {}).then((con) => {
  console.log('Database Connected Successfully');
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Server is running on port ${port}`),
);
