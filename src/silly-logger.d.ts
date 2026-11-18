declare module "silly-logger" {
  export interface SillyLogger {
    info(text: string): void;
    success(text: string): void;
    error(text: string): void;
    warn(text: string): void;
    crash(text: string): void;
    debug(text: string): void;
    startup(text: string): void;
    deploy(text: string): void;
    custom(prefixInput: string, prefixColor: string, textColor: string, textInput: string): void;
    timeFormat(timeFormat: string): void;
    enableLogFiles(enable: boolean): void;
    logFolderPath(path: string): void;
  }
  const logger: SillyLogger;
  export default logger;
}
