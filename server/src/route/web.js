import express from "express";
import HomeController  from "../controllers/HomeController";
import authRoutes from "../routes/auth";
import fail2ban from "../middleware/fail2ban";

let router = express.Router();

let initWebRoutes = (app) => {
    router.get("/", HomeController.getHomePage);
    
    // Auth routes (apply Fail2Ban middleware only to auth endpoints)
    app.use("/api", fail2ban, authRoutes);

    return app.use("/", router);
}

module.exports = initWebRoutes;
