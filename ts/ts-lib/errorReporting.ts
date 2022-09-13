import { Logger } from "./logger";



export class ErrorReporting {

    public static async report(type, data) {
        Logger.warn({ type, data });
        //TODO check if data is string, else json stringify it
        return true; //TODO send to AWS
    }

}