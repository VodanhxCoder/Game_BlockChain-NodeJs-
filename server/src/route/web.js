import express from "express";
import HomeController  from "../controllers/HomeController";
import authRoutes from "../routes/auth";
import inventoryRoutes from "../routes/inventory";
import fail2ban from "../middleware/fail2ban";

let router = express.Router();

let initWebRoutes = (app) => {
    router.get("/", HomeController.getHomePage);
    
    // Auth routes (apply Fail2Ban middleware only to auth endpoints)
    app.use("/api", fail2ban, authRoutes);
    
    // Inventory and drop routes (no fail2ban needed for game mechanics)
    app.use("/api", inventoryRoutes);

    return app.use("/", router);
}

module.exports = initWebRoutes;
