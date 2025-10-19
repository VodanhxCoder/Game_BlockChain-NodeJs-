
let getHomePage = (req, res) => {
    console.log("Chuyển đến HomeController");
    console.log("Rendering HomePage.ejs");
    return res.render("HomePage.ejs");
};
module.exports = {
    getHomePage: getHomePage,
};
