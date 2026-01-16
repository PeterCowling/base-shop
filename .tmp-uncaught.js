process.on('uncaughtException', (err) => {
  console.error('UNCaught error stack:', err && err.stack ? err.stack : err);
  throw err;
});
