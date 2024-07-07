
import React, { RefObject, useCallback, useRef } from 'react' 
import { useState } from 'react'
import './App.css'
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror'; 
import {ViewUpdate} from "@codemirror/view" //keymap, 
import {basicSetup, EditorView} from "codemirror"
//import { defaultKeymap } from "@codemirror/commands";
import { oneDarkTheme } from '@uiw/react-codemirror' //ReactCodeMirror, 
import {Diagnostic, linter, lintGutter} from "@codemirror/lint";
//import {syntaxTree} from "@codemirror/language"

import * as project_options from './settings/projects.json';
import {useTranslation} from 'react-i18next';
import LangSwitcher from './LangSwitcher';

//import JSZip from 'jszip';

function App() {

  const { t } = useTranslation() //, i18n

  //Testing >> TODO: Maybe make switching this something to do with env/automatic
  //const url = "localhost"
  //const port = ":3000"
  //Production (Cloud Hosting)
  // note: the backend must be requested with https
  const url = "backend-dot-atf-editor.uk.r.appspot.com/"
  const port = ""

  const [text, setText] = useState("");
  const [project, setProject] = useState("tests/mini");
  const [filename, setFilename] = useState("hyphens");
  const [server, setServer] = useState("UPenn") //build-oracc.museum.upenn.edu or oracc.ub.uni-muenchen.de
  const [errors, setErrors] = useState("");
  let errLinesInitVar:number[] = []
  const [errorlines, setErrorLines] = useState(errLinesInitVar);

  //Type 'MutableRefObject<ReactCodeMirrorRef | undefined>' is not assignable to
  // type 'Ref<ReactCodeMirrorRef> | undefined'

  //problem with createRef ref being null in async functions, so use useRef instead
  const editorRef: RefObject<ReactCodeMirrorRef> = useRef(null)//createRef()

  async function PostToORACC(textbody="test", project="tests/mini", file="hyphens.atf", server="UPENN", method="validate"){

    /*
    //An experiment in creating zips here to minimize traffic sent to our server
    //Main constraint is making sure these files are fine for ORACC too
    let zip = new JSZip();
    zip.file(`00atf/${file}`,textbody)
    //try base64 too
    zip.generateAsync({type:'blob'}).then((content)=>{
      console.log(content);
    })*/

    //:${port}
    //console.log(project, file, textbody, server)

    const response = await fetch(`https://${url}${port}/${method}`, {
      method:"POST",
      mode:"cors",
      cache:"no-cache",
      credentials:"same-origin",
      body: JSON.stringify({
        "project":project,
        "filename":file+".atf",
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

  const TextChanged = React.useCallback((val:string, viewUpdate:any) => {
    //console.log(val)
    //setErrors(""); //erases errors until new validation is run, we do this to stop things from highlighting
    //the incorrect lines
    
    setText(val);
    sessionStorage.setItem("unsaved","T");
  }, []);

  const ProjectChanged = React.useCallback((val:any) => {//, viewUpdate
    setProject(val.target.value);
  }, []);

  const FileNameChanged = useCallback((val:any) => { //, viewUpdate
    setFilename(val.target.value);
  }, []);

  const ServerChanged = useCallback((val:any)=>{
    setServer(val.target.value)
  },[])

  const FileUploaded = (e:any) => {
    if(e.target.files.length > 0){
        var file = e.target.files[0]
        //console.log(file);
        setFilename(file.name.split(".")[0])
        file.text().then((res:any)=>{ //read the file blob as text
          //console.log(res)
          //console.log(editorRef)
          overwriteEditor(res) //set the file editor text state
          // Use regex to extract any project code from the file
          const proj_re = /#project: ([\w/]+)/
          const match = res.match(proj_re);
          if(match && match[1]){
            setProject(match[1])
          } 
        }).catch((err:any)=>{
          console.error(err);
        })
        //console.log(e)
        e.target.value = "" //clear the file picker
    }
  };

  function setProjectInText(e:any){
    const proj_re = /#project: ([\w/]+)/i
    const match = text.match(proj_re);
    var proj_string = "#project: "+ project
    if(match){
      //console.log(match)
      var modified_text = text.replace(proj_re, proj_string);
      overwriteEditor(modified_text)
    }
    else{ //need to generate the project tag somewhere
      const metadata_re = /[&][\w =,.:]+/ //finds &P01234 = .... and #atf: .... lines
      const match_meta = text.match(metadata_re);
      if(match_meta){ //add the project tag after one of these
        var modified_text = text.replace(metadata_re, match_meta+"\n"+proj_string)
        overwriteEditor(modified_text)
      }
      else{ //nothing, just add a new line at the start of the file
        overwriteEditor(proj_string + "\n" + text)
      }
    }    
  }

  //TODO: See if npm FileSaver would be better for this
  const FileDownload = (e:any) =>{
    var blob = new Blob([text],{type:"text/plain"})
    var url = URL.createObjectURL(blob)
    var link = document.createElement("a");
    link.href = url
    link.download = filename + ".atf"
    document.body.appendChild(link)
    link.click()
    sessionStorage.setItem("unsaved","F");
  }

  /*function moveToLine(view:any) {
    console.log("MOVE TO LINE")
    let line = prompt("Which line?")
    if (!/^\d+$/.test(line) || +line <= 0 || +line > view.state.doc.lines)
      return false
    let pos = view.state.doc.line(+line).from
    view.dispatch({selection: {anchor: pos}, userEvent: "select"})
    return true
  }*/

  function validate(e:any){
    PostToORACC(text,project,filename,server,"validate").then((data)=>{
      console.log(data)
      setErrors(data);//diagnostics);
    }).catch((e)=>{
      console.error(e)
    })
  }

  function lemmatise(e:any){
    PostToORACC(text,project,filename,server,"lemmatise").then((data)=>{
      let parsed = JSON.parse(data);
      //console.log(parsed.log)
      //console.log(parsed.lem)
      setErrors(parsed.log);
      //setText(parsed.lem);
      overwriteEditor(parsed.lem)
    }).catch((e)=>{
      console.error(e)
    })
  }

  function newDoc(e:any){
    //present this dialog only if the page is 'dirty' (that is, no save since last change)
    console.log("Are you sure? (changes to current document will not be saved)")
    //yes = clear the document
    //no = don't do anything
    overwriteEditor("")
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

    Array.from(error_matches).forEach((err:RegExpExecArray)=>{
      let lineNum:number = Number(err[1])
      let message:string = err[2]
      //console.log(lineNum)
      //console.log(message)
      let line = view.state.doc.line(lineNum)
      //console.log(syntaxTree(view.state).resolve(line.from))
      let errs:number[] = [...errorlines, line.number]
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
  //without having to call ORACC's validate again
  //tricky, as so far I don't know how to see a before/after user input change directly
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
          //errors "no property length"
          //let cursor1 = viewUpdate.state.doc.iterLines(val-lenChanged,val-1) //just before the line
          //let cursor2 = viewUpdate.state.doc.iterLines(val+1,val+lenChanged) //just after the line
          //cursor1.
        })
      }   
    }
  }

  function addCharacter(char:string){
    if(!editorRef || !editorRef.current) return;
    let view = editorRef.current.view;
    if(!view) return;
    let state = view.state;

    let cursor = state.selection.main.from
    let transaction = state.update({changes: {from: cursor, insert: char}})

    view.dispatch(transaction)
  }

  //overwrite the editor in a transaction so that undo history is preserved
  //function overwriteEditor(text){
  const overwriteEditor = useCallback((newText:string)=>{
    if(!editorRef || !editorRef.current) return;
    let view = editorRef.current.view;
    if(!view) return;
    let state = view.state;

    let transaction = state.update({changes: {from: 0, to: state.doc.length, insert: newText}})
    view?.dispatch(transaction)
  },[])

  const saveToLocal = () =>{
    localStorage.setItem("text",text);
    localStorage.setItem("fileName",filename);
    localStorage.setItem("Project",project);
    console.log("Saved to local storage!");
    sessionStorage.setItem("unsaved","F");
  }

  const loadFromLocal = () => {
    let t = localStorage.getItem("text");
    let f = localStorage.getItem("fileName");
    let p = localStorage.getItem("Project");
    if(t != null) overwriteEditor(t);
    if(f != null) setFilename(f);
    if(p != null) setProject(p);
    console.log("Loaded from local storage!")
    sessionStorage.setItem("unsaved","F");
  }

  window.onbeforeunload = (event:Event) => {
    //null or F should trigger the "are you sure you want to leave" dialog
    let unsaved = sessionStorage.getItem("unsaved") == "T"; 
    if(unsaved){
      event?.preventDefault()
      event.returnValue = true;
    }
  }

  /*
      Changes use view.viewUpdate.docChanged

        <button onClick={()=>{
          console.log(server + " " + filename + " ")
        }}>Log</button>


        <button>To CDLI (ASCII)</button>
        <button>To ORACC (Unicode)</button>
        <br/>
        
        <div>Area for enabling protocols and advanced conventions 
        <select id="server_select" value="babylonian">
          <option key="1">Babylonian</option>
          <option key="2">Sumerian</option>
        </select>
        <button>Set Language</button>
        </div><br/>

          TODO: Muenchen isn't working at the moment
          <option key="DE">Muenchen</option>
  */
//https://oracc.museum.upenn.edu//doc/help/editinginatf/primer/inlinetutorial/index.html

  let awkwardChars = ['š','Š','ṣ','Ṣ','ṭ','Ṭ','ś','Ś','ʾ','ḫ','Ḫ','ŋ','Ŋ','×',
    '₀','₁','₂','₃','₄','₅','₆','₇','₈','₉','ₓ']
  return (
    <>
      <div>
        <LangSwitcher/>
        <button onClick={newDoc}>{t('NewDoc')}</button>

        <label htmlFor="file-in" className='file-upload'>{t('Upload')}</label>
        <input type="file" onChange={FileUploaded} accept=".atf" id="file-in" className='display:none;'/>
        <button onClick={FileDownload}>{t('Download')}</button>
        <button onClick={saveToLocal}>{t('SaveLocal')}</button>
        <button onClick={loadFromLocal}>{t('LoadLocal')}</button>
        <button onClick={()=>{localStorage.clear()}}>{t('ClearStorage')}</button>
        <label htmlFor="file-name"> {t('FileName')} </label>
        <input type="text" onChange={FileNameChanged} value={filename} id="file-name"/>
        <br/>

        <label htmlFor="server_select">{t('Server')} </label>
        <select id="server_select" onChange={ServerChanged} value={server}>
          <option key="US" value={"UPENN"}>{t('UPENN')}</option>

        </select>

        <label htmlFor="project_select"> {t('Project')} </label>
        <input type="text" list="projects" id="project_select" onChange={ProjectChanged} value={project}/>
        <datalist id="projects">
          {project_options.projects.map((item,ind)=><option key={ind}>{item}</option>)}
        </datalist>
        <button onClick={setProjectInText}>{t('SetProj')}</button>

        <button onClick={validate}>{t('Validate')}</button>
        <button onClick={lemmatise}>{t('Lemmatise')}</button><br/>
        <div>
          Character modifier (@c, @f, @g, etc buttons w/ pics)<br/>          
        </div>
        <div> Non-Ascii Characters:
        {awkwardChars.map((item,ind)=><button key={ind} onClick={()=>{addCharacter(item)}}>{item}</button>)}
        </div>
        
        <CodeMirror value={text} height="500px" onChange={TextChanged} ref={editorRef} extensions={[

            basicSetup,
            linter(getDiagnostics),
            lintGutter(),
            EditorView.updateListener.of(updateDiagnostics)
          ]}
          theme={oneDarkTheme} //TODO: Check browser preferences to choose an appropriate theme
        />
      </div>
      <div>
        <a href='https://github.com/PEKennedy/ATF_Editor' target="_blank">{t('Github')}</a>
      </div>
      
    </>
  )
}

            /*keymap.of([{
              key: "Control-d",
              run: (v) => {moveToLine(v)}
            }, ...defaultKeymap]),*/

export default App
