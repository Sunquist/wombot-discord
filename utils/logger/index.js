const fs = require('fs');
const path = require('path');
const colors = require('colors');

colors.setTheme({
  info: 'cyan',
  error: 'red'
})

const writeLogStream = fs.createWriteStream(path.join(__dirname, '../../logs/logs.log'), {flags:'a'});
const writeErrorStream = fs.createWriteStream(path.join(__dirname, '../../logs/errors.log'), {flags:'a'});

const writeMessage = (str) => {
  return `[${new Date(Date.now()).toISOString()}]: ${str} \n`
}

const consoleMessage = (str) => {
  return str
}

/**
 *  Logs to console and file
 *  @param {String} message The message to log
 *  @param {Number} level Level { 0: "debug", 1: "info",  2: "warn", 3: "error" }
 */
module.exports = (message, level) => {
  const logLevel = (level !== undefined)? level : 1
  if(logLevel === 3){
    console.log(consoleMessage(message).error)
    writeErrorStream.write(writeMessage(message));
  }
  if(logLevel === 1){
    console.log(consoleMessage(message).info)
  }else{
    console.log(consoleMessage(message))
  }
  return writeLogStream.write(writeMessage(message));
}
