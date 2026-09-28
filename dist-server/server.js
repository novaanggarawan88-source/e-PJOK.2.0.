// server.ts
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use(express.json());
var distPath = path.resolve(__dirname, "dist");
var altDistPath = path.resolve(__dirname, "..", "dist");
var finalDistPath = fs.existsSync(distPath) ? distPath : altDistPath;
app.use(express.static(finalDistPath));
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});
app.get("*", (_req, res) => {
  res.sendFile(path.join(finalDistPath, "index.html"));
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
