require("dotenv").config()
const express = require("express")
const notion = require("./notion")
const path = require("path")
const rateLimit = require("express-rate-limit")

const app = express()

app.set("views", "./views")
app.set("view engine", "ejs")
// app.set("trust proxy", 1)
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const ONE_HOUR_IN_MILLISECONDS = 1000 * 60 * 60
const ONE_DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24

let tags = []
notion.getTags().then(data => (tags = data))

const router = express.Router()
router.use(express.static(path.join(__dirname, "public")))
app.use("/suggestions", router)

setInterval(async () => {
  tags = await notion.getTags()
}, ONE_HOUR_IN_MILLISECONDS)

router.get("/", async (req, res) => {
  try {
    const currentPageCursor = req.query.pageCursor
    const suggestionResults = await notion.getSuggestions(currentPageCursor)
    res.render("index", {
      tags,
      atStart: currentPageCursor == null,
      ...suggestionResults,
    })
  } catch {
    res.status(500).send("Error")
  }
})

router.post(
  "/create-suggestion",
  rateLimit({
    max: 2,
    skipFailedRequests: true,
    windowMs: ONE_DAY_IN_MILLISECONDS,
    message: "You can only create 2 suggestions per day",
  }),
  async (req, res) => {
    try {
      const { title, description, isProject, tagIds = [] } = req.body
      await notion.createSuggestion({
        title,
        description,
        isProject: isProject != null,
        tags: tagIds.map(tagId => {
          return { id: tagId }
        }),
      })
    } catch {
      res.status(500).send("Error")
    }
    res.redirect("/suggestions")
  }
)

router.post(
  "/up-vote-suggestion",
  rateLimit({
    max: 1,
    skipFailedRequests: true,
    windowMs: ONE_DAY_IN_MILLISECONDS,
    message: "You can only up vote each suggestion once",
    keyGenerator: req => `${req.ip}-${req.body.suggestionId}`,
  }),
  async (req, res) => {
    try {
      const votes = await notion.upVoteSuggestion(req.body.suggestionId)
      res.json({ votes })
    } catch {
      res.status(500).send("Error")
    }
  }
)

app.listen(process.env.PORT)
