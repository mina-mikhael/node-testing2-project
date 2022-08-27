const server = require("./api/server");

const port = Number(process.env.PORT);

server.listen(port || 9000, () => {
  console.log("magic is hapenning on port: ", port);
});
