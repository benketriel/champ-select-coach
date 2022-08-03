import { ErrorReporting } from "./errorReporting";

export class CSCAI {
    private static _pluginInstance: any = null;

    public static async instance() {
        if (this._pluginInstance == null) {
            await new Promise(resolve => CSCAI._initialize(resolve));
        }
        return this._pluginInstance;
    }    

    private static _initialize(callback) {
        var proxy = null;

        try {
            proxy = overwolf.extensions.current.getExtraObject;
        } catch(e) {
            ErrorReporting.report('overwolf.extensions.current.getExtraObject', "overwolf.extensions.current.getExtraObject doesn't exist!");
            return callback(false);
        }

        proxy('CSCAI', function(result) {
            if (result.status != "success") {
                ErrorReporting.report('CSAI.dll', "failed to create " + 'CSCAI' + " object: " + JSON.stringify(result));
                return callback(false);
            }

            CSCAI._pluginInstance = result.object;

            return callback(true);
        });
    }



    
}