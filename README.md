# ATF_Editor
A web editor for Cuneiform transliteration files.

## Overview
Both front-end (Client) and backend are built using `vite` + `typescript` + `React`.
The front-end is what will appear in the browser, it uses React-Codemirror
to provide a text editor, along with buttons to validate or lemmatise the
atf file.

The back-end (Server) is a couple `express.js` endpoints which when given a POST message, will in turn call the specified ORACC server SOAP method (this is because CORS stops us from calling ORACC directly from the front-end).

The SOAP_client code on the Server side is taken from the `Nisaba` editor, and so I have placed the `GPL 3.0` license Nisaba is available under there temporarily.

### Hosting

Currently Hosted on Google Cloud

### TODO:
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
    - * next to doenload to indicate unsaved changes
    - New file dialog
    - Maybe a new file by template (not in scope atm)

    - SERVER:
    - Use Zip to shrink the file in the browser to save data (and account for this in the backend)
