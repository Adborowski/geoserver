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

// app.use((req, res, next) => {
//
//   if (!apiKey || apiKey !== process.env.API_KEY) {
//     res.status(401).json({ error: "unauthorised" });
//   } else {
//     next();
//   }
// });

app.get("/api", (req, res, next) => {
  const apiKey = req.get("x-api-key");
  if (apiKey === process.env.API_KEY) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.status(200).json({
      message: "Authorized.",
      keyUsed: apiKey,
      keyNeeded: process.env.API_KEY,
      content: countriesMap,
    });
  } else {
    res.status(401).json({
      message: "Unauthorized. Provide x-api-key header.",
    });
  }
});

app.get("/api/:countryCode", function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(countriesMap[req.params.countryCode.toUpperCase()]);
});
