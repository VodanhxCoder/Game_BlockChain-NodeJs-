import express from "express";
import HomeController  from "../controllers/HomeController";
import authRoutes from "../routes/auth";
import userRoutes from "../routes/user";
import inventoryRoutes from "../routes/inventory";
import fail2ban from "../middleware/fail2ban";
const RecaptchaController = require("../controllers/RecaptchaController");

let router = express.Router();

let initWebRoutes = (app) => {
    router.get("/", HomeController.getHomePage);
    
    // reCAPTCHA verification endpoint
    router.post("/api/recaptcha/verify", RecaptchaController.verifyRecaptcha);
    
    // Auth routes (apply Fail2Ban middleware only to auth endpoints)
    app.use("/api", fail2ban, authRoutes);
    
    // User routes (highscore and user-related endpoints)
    app.use("/api", userRoutes);

    // Inventory and drop routes (no fail2ban needed for game mechanics)
    app.use("/api", inventoryRoutes);

    return app.use("/", router);
}

module.exports = initWebRoutes;
