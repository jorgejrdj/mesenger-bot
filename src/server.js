require("dotenv").config();
import express from "express";
import viewEngine from "./config/viewEngine";
import initWebRoute from "./routes/routes";
import bodyParser from "body-parser";

let app = express();

// configuraçção do view engine
viewEngine(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Iniciando todas as todas
initWebRoute(app);

let port = process.env.PORT || 8080;

app.listen(port, () => {
   console.log(`App está usando a porta ${port}`);
});