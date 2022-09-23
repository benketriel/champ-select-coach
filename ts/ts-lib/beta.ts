


export class Beta {


    public static async isBetaVersion() {
        const res = await new Promise<overwolf.settings.GetExtensionSettingsResult>(resolve => overwolf.settings.getExtensionSettings(resolve));
        return res && res.success && res.settings && (<any>res.settings).channel == 'Beta';
    }

    public static async setBetaVersion(value: boolean) {
        const res = await new Promise<any>(resolve => overwolf.settings.setExtensionSettings(<any>{ channel: value ? "Beta" : "0" }, resolve));
        return res;
    }

}