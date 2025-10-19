import express from "express";


let configViewEngine =(app)=>{
    app.use(express.static("./src/public")); //cau hinh su dung file static
    app.set("view engine","ejs"); //cau hinh su dung ejs
    app.set("views","./src/views"); //cau hinh thu muc chua file ejs
}


export default configViewEngine;