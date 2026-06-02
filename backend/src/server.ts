import { app } from './app';
import { config } from './config/env';

app.listen(config.port, () => {
  console.warn(`Server running on port ${config.port}`);
});
