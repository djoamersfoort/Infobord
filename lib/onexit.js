module.exports = function(handler) {
  process.stdin.resume();//so the program will not close instantly

  //do something when app is closing
  process.on('exit', handler);

  //catches ctrl+c event
  process.on('SIGINT', handler);

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', handler);
  process.on('SIGUSR2', handler);

  //catches uncaught exceptions
  process.on('uncaughtException', handler);
};
