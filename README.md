# ATF_Editor
A web editor for Cuneiform transliteration files.

## Overview
Both front-end (Client) and backend are built using `vite` + `typescript` + `React`.
The front-end is what will appear in the browser, it uses React-Codemirror
to provide a text editor, along with buttons to validate or lemmatise the
atf file.

The back-end (Server) is a couple `express.js` endpoints which when given a POST message, will in turn call the specified ORACC server SOAP method (this is because CORS stops us from calling ORACC directly from the front-end).

The SOAP_client code on the Server side is taken from the `Nisaba` editor, and so I have placed the `GPL 3.0` license Nisaba is available under there temporarily.

