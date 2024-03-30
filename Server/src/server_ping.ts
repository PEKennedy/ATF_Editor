import { validate, lemmatise} from "./SOAP_client/messages.js";

const server_result = await validate("hyphens.atf","tests/mini","hello there");
console.log(server_result.get_user_log("hyphens.atf"))