import express from "express";
import HomeController  from "../controllers/HomeController.js";
import authRoutes from "../routes/auth.js";
import userRoutes from "../routes/user.js";
import inventoryRoutes from "../routes/inventory.js";
import marketRoutes from "../routes/market.js";
import adminRoutes from "../routes/admin.js";
import configRoutes from "../routes/config.js";
import fail2ban from "../middleware/fail2ban.js";
import RecaptchaController from "../controllers/RecaptchaController.js";

let router = express.Router();

let initWebRoutes = (app) => {
    router.get("/", HomeController.getHomePage);
    
    // reCAPTCHA verification endpoint
    router.post("/api/recaptcha/verify", RecaptchaController.verifyRecaptcha);
    
    // Auth routes (apply Fail2Ban middleware only to login/signup, not OAuth)
    app.use("/api/auth", authRoutes);
    
    // User routes (highscore and user-related endpoints)
    app.use("/api", userRoutes);

    // Inventory and drop routes (no fail2ban needed for game mechanics)
    app.use("/api", inventoryRoutes);

    // Marketplace routes
    app.use("/api", marketRoutes);

    // Config routes (public configuration like contract address)
    app.use("/api", configRoutes);

    // Admin routes (protected by admin middleware)
    app.use("/api/admin", adminRoutes);

    return app.use("/", router);
}

export default initWebRoutes;

