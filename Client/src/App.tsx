
import React, { useCallback } from 'react'
import { useState } from 'react'
//import reactLogo from './assets/react.svg'
//import viteLogo from '/vite.svg'
import './App.css'
import CodeMirror from '@uiw/react-codemirror';
import {keymap, ViewUpdate} from "@codemirror/view"
import {basicSetup, EditorView} from "codemirror"
import { defaultKeymap } from "@codemirror/commands";
import { oneDarkTheme } from '@uiw/react-codemirror'
import {Diagnostic, linter, lintGutter} from "@codemirror/lint";
import {syntaxTree} from "@codemirror/language"

import * as project_options from './settings/projects.json';

//let project_options = require("./settings/projects.json")
//console.log(project_options)

function App() {

  const url = "localhost"
  const port = 3000

  const [text, setText] = useState("console.log('hello world!');");
  const [project, setProject] = useState("tests/mini");
  const [filename, setFilename] = useState("hyphens.atf");
  const [server, setServer] = useState("UPENN") //build-oracc.museum.upenn.edu or oracc.ub.uni-muenchen.de
  const [errors, setErrors] = useState("");
  let errLinesInitVar:number[] = []
  const [errorlines, setErrorLines] = useState(errLinesInitVar);

  async function PostToORACC(textbody="test", project="tests/mini", file="hyphens.atf", server="UPENN", method="validate"){
    const response = await fetch(`http://${url}:${port}/${method}`, {
      method:"POST",
      mode:"cors",
      cache:"no-cache",
      credentials:"same-origin",
      body: JSON.stringify({
        "project":project,
        "filename":file,
        "text":textbody,
        "server":server
      }),
      headers:{
        //"Access-Control-Allow-Origin":"true"
        "Access-Control-Request-Headers":"Content-Type",//"Access-Control-Request-Headers",
        "Content-Type": "application/json",
        "Accept":"application/json"
      }
    })
    const data = await response.text()
    return data;
  }

  const TextChanged = React.useCallback((val, viewUpdate) => {
    //viewUpdate.
    //console.log(val)
    //setErrors(""); //erases errors until new validation is run, we do this to stop things from highlighting
    //the incorrect lines
    
    setText(val);
  }, []);

  const ProjectChanged = React.useCallback((val) => {//, viewUpdate
    //console.log(val.target.value)
    setProject(val.target.value);
  }, []);

  const FileNameChanged = useCallback((val) => { //, viewUpdate
    //console.log(val)
    setFilename(val.target.value);
  }, []);


  const FileUploaded = (e) => {
    if(e.target.files.length > 0){
        var file = e.target.files[0]
        //console.log(file);
        setFilename(file.name)

        file.text().then((res)=>{ //read the file blob as text
          setText(res) //set the file editor text state

          // Use regex to extract any project code from the file
          const proj_re = /#project: ([\w/]+)/
          const match = text.match(proj_re);
          //console.log(match[1])
          if(match && match[1]) setProject(match[1])
        }).catch((err)=>{
          console.error(err);
        })
        //console.log(e)
        e.target.value = "" //clear the file picker
    }
  }

  function setProjectInText(e){
    const proj_re = /#project: ([\w/]+)/i
    const match = text.match(proj_re);
    var proj_string = "#project: "+ project
    if(match){
      //console.log(match)
      var modified_text = text.replace(proj_re, proj_string);
      setText(modified_text)
    }
    else{ //need to generate the project tag somewhere
      const metadata_re = /[&][\w =,.:]+/ //finds &P01234 = .... and #atf: .... lines
      const match_meta = text.match(metadata_re);
      if(match_meta){ //add the project tag after one of these
        var modified_text = text.replace(metadata_re, match_meta+"\n"+proj_string)
        setText(modified_text)
      }
      else{ //nothing, just add a new line at the start of the file
        setText(proj_string + "\n" + text)
      }
    }    
  }

  const FileDownload = (e) =>{
    var blob = new Blob([text],{type:"text/plain"})
    var url = URL.createObjectURL(blob)
    var link = document.createElement("a");
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()    
  }

  function moveToLine(view) {
    console.log("MOVE TO LINE")
    let line = prompt("Which line?")
    if (!/^\d+$/.test(line) || +line <= 0 || +line > view.state.doc.lines)
      return false
    let pos = view.state.doc.line(+line).from
    view.dispatch({selection: {anchor: pos}, userEvent: "select"})
    return true
  }

  function validate(e){

    PostToORACC(text,project,filename,server,"validate").then((data)=>{
      console.log(data)


      setErrors(data);//diagnostics);

    }).catch((e)=>{
      console.error(e)
    })
  }

  //called by codemirror to get diagnostics (err/warning messages) on document change
  //since we don't want to flood ORACC with requests, this is just going to pull from a react state
  //list for now
  function getDiagnostics(view:EditorView){
    /*let diagnostics: Diagnostic[] = []
    diagnostics.push({
      from: 1,
      to:10,
      severity: "error",
      message:"test",
    })
    return diagnostics*/

    //if all is well, then "ATF validation returned no errors."
    //invalid start line: "atf_admin1.atf:1:\n unexpected start-of-line."
    //add @# somewhere: "atf_admin1.atf:10:\n P000730: unknown block token: ."
    //after each error it says "ATF processor ox issued 1 warnings and 0 notices"
    //so: need to match [/w].atf:(\d+): for the line number
    //then the subsequent line for the error message (might want to allow for 2 lines on the tooltip)
    //since ORACC's messages aren't really the most helpful (use codemirror's linting?)
    //let diagnostics = []

    const match_err = /\w+.atf:(\d+):\s+([\w: \S]+)/g //captures line number and description in capture groups 1 and 2
    let error_matches = errors.matchAll(match_err)
    let diagnostics:Diagnostic[] = []; //.map would be better, but leaves the possibility of null
    
    setErrorLines([])

    error_matches?.forEach((err)=>{
      let lineNum = err[1]
      let message = err[2]
      //console.log(lineNum)
      //console.log(message)
      let line = view.state.doc.line(lineNum)
      //console.log(syntaxTree(view.state).resolve(line.from))
      let errs:number[] = [...errorlines, line]
      setErrorLines(errs)

      diagnostics.push({
        from: line.from,
        to: line.to,
        severity: "error",
        message:message
      })
    })


    return diagnostics;
  }

  //if the user deletes the error line, the error should go away
  //if the user adds/deletes a line before the error line, the error line number should change accordingly
  function updateDiagnostics(viewUpdate:ViewUpdate){
    if(viewUpdate.docChanged && !viewUpdate.focusChanged){
      let lenChanged = viewUpdate.state.doc.lines - viewUpdate.startState.doc.lines
      if(lenChanged==0){
        //if we removed the error line, remove the corresponding error
        errorlines.forEach((val,ind)=>{
          //if(viewUpdate.state.)
        })
      }
      else{
        //check that many lines before and after for our line
        setErrors(""); //errors invalidated

        //if(!lenChanged) return;
        errorlines.forEach((val,ind)=>{
          let cursor1 = viewUpdate.state.doc.iterLines(val-lenChanged,val-1) //just before the line
          let cursor2 = viewUpdate.state.doc.iterLines(val+1,val+lenChanged) //just after the line
          //cursor1.
        })
      }   
    }
  }

  function lemmatise(e){
    /*PostToORACC(text,project,filename,server,"lemmatise").then((data)=>{
      console.log(data)
    }).catch((e)=>{
      console.error(e)
    })*/
  }


  /*TODO:
      -server selection (not that it matters since it connects to my backend)
      -lemmatise
      -ORACC console
      -buttons for common ATF syntax things (make this highlighted word a compound, etc)
      -Buttons to convert between ORACC atf and CDLI atf?
      -Language selection (make a reusable component similar to project selector?)
      -Right to left option (arabic support is wanted)
      -Make updates to the text through CodeMirror transactions so that undo+redo are supported

      -syntax highlighting, both from my own atf model, and ORACC errors
      -Tooltips for the syntax characters to explain what they do
      -Need to get a server running all this code for demo purposes
      -Github
      -Text colouring

      Changes use view.viewUpdate.docChanged

  */
  return (
    <>

      <div>
        ATF Upload - <input type="file" onChange={FileUploaded}/><br/>
        File Name: <input type="text" onChange={FileNameChanged} value={filename}/><br/>
        <button onClick={FileDownload}>Download</button><br/><br/>

        <label htmlFor="project_select">Project </label>
        <input type="text" list="projects" id="project_select" onChange={ProjectChanged} value={project}/>
        <datalist id="projects">
          {project_options.projects.map((item,ind)=><option key={ind}>{item}</option>)}
        </datalist>
        <button onClick={setProjectInText}>Set Project</button><br/>

        <button onClick={validate}>Validate</button>
        <button onClick={lemmatise}>Lemmatise</button><br/>

        <CodeMirror value={text} height="500px" onChange={TextChanged} extensions={[
            keymap.of([{
              key: "Control-d",
              run: (v) => {moveToLine(v)}
            }, ...defaultKeymap]),
            basicSetup,
            linter(getDiagnostics),
            lintGutter(),
            EditorView.updateListener.of(updateDiagnostics)
          ]}
          theme={oneDarkTheme} //TODO: Check browser preferences to choose an appropriate theme
        />
      </div>
    </>
  )
}

/*

      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

*/

export default App
