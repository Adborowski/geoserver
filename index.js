import express from "express";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import fetch, { Headers } from "node-fetch";
import fs from "fs";
// var cors = import("cors");
import cors from "cors";

dotenv.config();
var app = express();

app.use(
  cors({
    exposedHeaders: ["x-api-key"],
  })
);

const fetchHeaders = new Headers();
fetchHeaders.append("apikey", process.env.GEOAPIKEY);
const requestOptions = {
  method: "GET",
  redirect: "follow",
  headers: fetchHeaders,
};

const getData = async (countryCode) => {
  try {
    let response = await fetch(
      `https://api.apilayer.com/geo/country/code/${countryCode.toLowerCase()}`,
      requestOptions
    );
    let data = await response.json(); // returns an array of 1 obj
    let newObj = data[0];
    newObj.flag = `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;
    return newObj;
  } catch (e) {
    console.log(e);
  }
};

const buildMap = (codesArray) => {
  let countries = {};

  codesArray.forEach((countryCode) => {
    getData(countryCode).then((data) => {
      countries[countryCode] = data;
      if (Object.keys(countries).length == codesArray.length) {
        console.log("BUILT A MAP OF LENGTH:", Object.keys(countries).length);
        fs.writeFileSync("countriesMap.json", JSON.stringify(countries));
      }
    });
  });
};

const countryCodes = fs.readFileSync("codes.txt", "utf-8").split(",");

const countriesMap = JSON.parse(fs.readFileSync("countriesMap.json", "utf8"));
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

// check api key
app.use((req, res, next) => {
  console.log(req);
  next();
  // if (req.get("x-api-key") === process.env.API_KEY) {
  //   next();
  // } else {
  //   res.json({ code: 401, message: "Unauthorized. Use x-api-key header." });
  // }
});

app.use(express.json());

app.get("/api", (req, res, next) => {
  console.log("/api/");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.status(200).json(countriesMap);
});

app.get("/api/:countryCode", function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(countriesMap[req.params.countryCode.toUpperCase()]);
});

app.post("/api/submitScore", function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log(req.body);
  res.json({ status: 200, message: "Score received", body: req.body });
});
