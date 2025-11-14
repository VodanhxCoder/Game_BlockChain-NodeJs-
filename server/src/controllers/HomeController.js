
const getHomePage = (req, res) => {
    console.log("Chuyển đến HomeController");
    console.log("Rendering HomePage.ejs");
    return res.render("HomePage.ejs");
};

export default { getHomePage };
