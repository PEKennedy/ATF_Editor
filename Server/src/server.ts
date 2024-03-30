// Load HTTP module
/*const http = require("http");

const hostname = "127.0.0.1";
const port = 8000;

// Create HTTP server
const server = http.createServer(function (req, res) {
  // Set the response HTTP header with HTTP status and Content type
  res.writeHead(200, { "Content-Type": "text/plain" });

  // Send the response body "Hello World"
  res.end("Hello World\n");
});

// Prints a log once the server starts listening
server.listen(port, hostname, function () {
  console.log(`Server running at http://${hostname}:${port}/`);
});*/

//const express = require("express");
//const xmlrpc = require("davexmlrpc")
//const bodyParser = require("body-parser")

import express from "express";
import cors from "cors";
import { validate, lemmatise } from "./SOAP_client/messages.js";

const app = express();
const port = 3000;
//const cors = require("cors")

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(express.json())
app.use(cors())

//oracc.atf.check


app.post("/validate", async (req,res)=>{
    var body = req.body//JSON.parse(req.body)
    /*res.status(200).set({
        'Access-Control-Allow-Origin': '*',//'http://localhost',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'origin'
    }).send("Hello There");*/

    //for oracc_client.ts
    //server=http://oracc.ub.uni-muenchen.de or http://build-oracc.museum.upenn.edu
    //command = oracc.atf.check
    //filename=P393071.atf
    //data=rawText.value

 
    //const server_result = await validate("hyphens.atf","tests/mini","hi there");
    const server_result = await validate(body.filename,body.project,body.text);
    //console.log(server_result.get_user_log("hyphens.atf"))

    res.status(200).send(server_result.get_user_log(body.filename))
})

app.post("/lemmatise", async (req,res)=>{
  var body = req.body
  const server_result = await lemmatise(body.filename,body.project,body.text);
  res.status(200).send(server_result.get_user_log(body.filename))
})



app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
/*app.options("/check",(req,res)=>{
    console.log("/check OPTIONS")
    res.status(200).set({
        'Access-Control-Allow-Origin': ['*'],//'http://localhost',
        //'Access-Control-Allow-Options'
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'origin'
    }).send()
})*/


