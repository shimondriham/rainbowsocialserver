const socket_io = require("socket.io");
exports.createSockets = (_server) => {
  let io = socket_io(_server, {
 
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })
 
  io.on("connection", (socket) => {
    console.log(`User connected ${socket.id}`);
   
    socket.on("FromAPI" , (msg)=> {
    
      socket.on("disconnected",()=>{
        console.log("User disconnected",socket.id);
      })
      io.sockets.emit("nodeJsEvent", msg);
      console.log(msg);
    } )
  })
}
