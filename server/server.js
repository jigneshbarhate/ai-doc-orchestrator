require("dotenv").config()
const express = require("express")
const cors = require("cors")
const multer = require("multer")
const fs = require("fs")
const pdfParse = require("pdf-parse")
const axios = require("axios")

const app = express()
app.use(cors())
app.use(express.json())

const upload = multer({ dest: "uploads/" })

app.get("/", (req, res) => {
  res.send("Backend is running")
})

app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file
  const question = req.body.question

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" })
  }

  let text = ""

  if (file.mimetype === "application/pdf") {
    const dataBuffer = fs.readFileSync(file.path)
    const data = await pdfParse(dataBuffer)
    text = data.text
  } else if (file.mimetype === "text/plain") {
    text = fs.readFileSync(file.path, "utf8")
  } else {
    fs.unlinkSync(file.path);
    return res.status(400).json({ error: "Unsupported file type. Please upload a .pdf or .txt file." })
  }

  text = text.substring(0, 3000)

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "Extract 5-8 key-value pairs relevant to the user's query.\nReturn ONLY valid JSON in this format:\n{\n  \"field1\": \"value\",\n  \"field2\": \"value\"\n}\nAlso provide a short explanation."
          },
          {
            role: "user",
            content: `Document:\n${text}\n\nQuestion:\n${question}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    )

    let aiText = response.data.choices[0].message.content

    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim()

    const start = aiText.indexOf("{")
    const end = aiText.lastIndexOf("}") + 1

    if (start === -1 || end === -1) {
      fs.unlinkSync(file.path);
      return res.json({ extractedData: { error: "Invalid AI response" }, explanation: aiText })
    }

    const jsonString = aiText.substring(start, end)
    let explanationText = aiText.replace(jsonString, "").replace(/```json/g, "").replace(/```/g, "").trim()

    if (!explanationText) {
      explanationText = "No explanation provided."
    }

    let jsonData
    try {
      jsonData = JSON.parse(jsonString)
    } catch {
      fs.unlinkSync(file.path);
      return res.json({ extractedData: { error: "JSON parsing failed", raw: jsonString }, explanation: explanationText })
    }

    fs.unlinkSync(file.path);
    res.json({ extractedData: jsonData, explanation: explanationText })
  } catch (error) {
    fs.unlinkSync(file.path);
    console.log(error.response?.data || error.message)
    res.status(500).json({ error: "AI processing failed" })
  }
})

app.post("/chat", upload.single("file"), async (req, res) => {
  const file = req.file
  const question = req.body.question

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" })
  }

  let text = ""

  try {
    if (file.mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(file.path)
      const data = await pdfParse(dataBuffer)
      text = data.text
    } else if (file.mimetype === "text/plain") {
      text = fs.readFileSync(file.path, "utf8")
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Unsupported file type." })
    }

    text = text.substring(0, 3000)

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant. Answer the user's question clearly and concisely based on the document provided. Do not use JSON formatting."
          },
          {
            role: "user",
            content: `Document:\n${text}\n\nQuestion:\n${question}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    )

    const answer = response.data.choices[0].message.content.trim()
    fs.unlinkSync(file.path);
    res.json({ answer })
  } catch (error) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    console.log(error.response?.data || error.message)
    res.status(500).json({ error: "Chat AI failed" })
  }
})

app.post("/send-email", async (req, res) => {
  try {
    console.log("Sending to n8n:", req.body)

    const response = await axios.post(
      process.env.N8N_WEBHOOK_URL,
      req.body
    )

    console.log("n8n response:", response.data)

    res.json(response.data)
  } catch (error) {
    console.log("ERROR:", error.response?.data || error.message)

    res.status(500).json({
      error: error.response?.data || error.message
    })
  }
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})