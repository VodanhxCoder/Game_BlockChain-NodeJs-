export function runService(app, serviceName, envPortName, fallbackPort) {
  const port = parseInt(process.env[envPortName] || process.env.PORT || fallbackPort, 10);

  app.listen(port, () => {
    console.log(`[${serviceName}] listening on port ${port}`);
  });
}
