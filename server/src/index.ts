import 'dotenv/config';
import { bootstrapApp } from './container.js';

const PORT = process.env.PORT ?? 3000;

const app = bootstrapApp();

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
