import express from "express";
import HomeController  from "../controllers/HomeController.js";
import authRoutes from "../routes/auth.js";
import userRoutes from "../routes/user.js";
import inventoryRoutes from "../routes/inventory.js";
import marketRoutes from "../routes/market.js";
import fail2ban from "../middleware/fail2ban.js";

let router = express.Router();

let initWebRoutes = (app) => {
    router.get("/", HomeController.getHomePage);
    
    // Auth routes (apply Fail2Ban middleware only to auth endpoints)
    app.use("/api", fail2ban, authRoutes);
    
    // User routes (highscore and user-related endpoints)
    app.use("/api", userRoutes);

    // Inventory and drop routes (no fail2ban needed for game mechanics)
    app.use("/api", inventoryRoutes);

    // Marketplace routes
    app.use("/api", marketRoutes);

    return app.use("/", router);
}

export default initWebRoutes;

