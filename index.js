import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "World",
  password: "1122",
  port: 5432
});

db.connect();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


let countries = [];
let total = 0;

async function visitedCountries() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  for (var i = 0; i < result.rows.length; i++) {
    countries.push(result.rows[i].country_code);
  }
  return countries;

}
app.get("/", async (req, res) => {
  const countries = await visitedCountries();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    error: null
  });
});

app.post("/add", async (req, res) => {
  const country = req.body.country;
  try {
    const result = await db.query("SELECT country_code FROM countries WHERE country_name LIKE '%' || $1 || '%';", [country]);
    let data = result.rows[0];
    let country_code = data.country_code;
    try {
      await db.query("INSERT INTO visited_countries(country_code) VALUES ($1)", [country_code]);
      countries.push(country_code);
      total = countries.length;
      res.render("index.ejs", {
        countries: countries,
        total: total,
        error: null
      });
    } catch (err) {
      if (err.code === "23505") { // PostgreSQL unique constraint violation code
        console.log("Country already visited");
        const countries = await visitedCountries();
        res.render("index.ejs", {
          countries: countries,
          total: countries.length,
          error: "You have already visited this country!"
        });
      } else {
        console.log("Error Executing", err.stack);
        res.status(500).send("Database error");
      }
    }
  } catch (err) {
    console.log("Error Executing", err.stack);
    const countries = await visitedCountries();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "THERE IS NO SUCH COUNTRY"
    })
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
