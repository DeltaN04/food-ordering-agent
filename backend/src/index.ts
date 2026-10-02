import { createApp } from "./app";
import { config } from "./config";

const app = createApp();
app.listen(config.port, () => {
  console.log(`food-ordering-agent backend on http://localhost:${config.port} (provider=${config.foodProvider}, payments=${config.paymentProvider})`);
});
