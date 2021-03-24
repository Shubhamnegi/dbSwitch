import * as bunyan from "bunyan";

export const getLogger = (name: string) => {
    return bunyan.createLogger({
        name,
        level: "debug" // This can be taken from environment
    })
}
