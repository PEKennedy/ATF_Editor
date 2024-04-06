//Due to the TSConfig, we can use ECMA style imports instead of the require() syntax

import express from "express";
import cors from "cors";
import { validate, lemmatise } from "./SOAP_client/messages.js";

const app = express();
const test_port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(express.json())
app.use(cors())

app.post("/validate", async (req,res)=>{
    var body = req.body
    //for oracc_client.ts
    //server=http://oracc.ub.uni-muenchen.de or http://build-oracc.museum.upenn.edu
    //command = oracc.atf.check
    //filename=P393071.atf
    //data=rawText.value

    let url:string="http://build-oracc.museum.upenn.edu"
    if(body.server == "Muenchen"){
      url = "http://oracc.ub.uni-muenchen.de"
    }

    const server_result = await validate(body.filename,body.project,body.text,url).catch((err)=>{
      console.error(err);
    });
    //console.log(server_result.get_user_log("hyphens.atf"))
    if(server_result){
      res.status(200).send(server_result.get_user_log(body.filename))
    }
    else{
      res.status(500).send("Encountered an Error communicating with ORACC Server")
    }
})

app.post("/lemmatise", async (req,res)=>{
  var body = req.body
  let url:string="http://build-oracc.museum.upenn.edu"
  if(body.server == "MUENCHEN"){
    url = "http://oracc.ub.uni-muenchen.de"
  }
  const server_result = await lemmatise(body.filename,body.project,body.text,url);
  if(server_result){
    console.log(server_result)
    let resp_obj = {
      log:server_result.get_user_log(body.filename),
      lem:server_result.atf_content
    }

    res.status(200).send(JSON.stringify(resp_obj))
  }
  else{
    res.status(500).send("Encountered an Error communicating with ORACC Server")
  }
})

const PORT = process.env.PORT || test_port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
