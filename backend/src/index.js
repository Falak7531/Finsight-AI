import 'dotenv/config'; // must be first so env vars exist when other modules load
import app from './app.js';
import { validateJwtConfiguration } from '../utils/tokens.js';

validateJwtConfiguration();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
