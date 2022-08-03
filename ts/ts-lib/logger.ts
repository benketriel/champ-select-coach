


export class Logger {

    public static async log(msg) {
        console.log(msg);
    }

    public static async warn(msg) {
        console.warn(msg);
    }

    public static async debug(msg) {
        console.log(msg); //TODO comment on prod
    }

}