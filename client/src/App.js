import { useState, useRef } from "react"
import "./index.css"

function App() {
  const [file, setFile] = useState(null)
  const [question, setQuestion] = useState("")
  const [data, setData] = useState(null)
  const [explanation, setExplanation] = useState("")
  const [email, setEmail] = useState("")
  const [result, setResult] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [loadingExtract, setLoadingExtract] = useState(false)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === "application/pdf" || droppedFile.type === "text/plain")) {
      setFile(droppedFile)
      setError(null)
    } else {
      setError("Please upload a .pdf or .txt file.")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!file) {
      setError("Please select a file.")
      return
    }
    if (!question.trim()) {
      setError("Please enter a question.")
      return
    }

    setLoadingExtract(true)
    setData(null)
    setExplanation("")
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("question", question)

    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"
      const res = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        body: formData
      })
      const apiResult = await res.json()

      if (res.ok) {
        if (apiResult.extractedData && !apiResult.extractedData.error) {
          setData(apiResult.extractedData)
          setExplanation(apiResult.explanation || "")
        } else {
          setError(apiResult.extractedData?.error || apiResult.error || "Failed to extract data.")
        }
      } else {
        setError(apiResult.error || "Server error during extraction.")
      }
    } catch (err) {
      setError("Failed to connect to the server. Ensure the backend is running.")
    } finally {
      setLoadingExtract(false)
    }
  }

  const handleSendEmail = async () => {
    setError(null)
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.")
      return
    }
    setLoadingEmail(true)

    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"
      const res = await fetch(`${apiUrl}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          data,
          question,
          explanation,
          chatHistory
        })
      })

      const apiResult = await res.json()
      if (res.ok) {
        setResult(apiResult)
      } else {
        setError(apiResult.error || "Failed to trigger webhook workflow.")
      }
    } catch (err) {
      setError("Failed to trigger email automation. Ensure backend and n8n are running.")
    } finally {
      setLoadingEmail(false)
    }
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || !file) return

    const newQuestion = chatInput
    setChatHistory(prev => [...prev, { role: "user", text: newQuestion }])
    setChatInput("")
    setLoadingChat(true)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("question", newQuestion)

    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        body: formData
      })
      const apiResult = await res.json()

      if (res.ok && apiResult.answer) {
        setChatHistory(prev => [...prev, { role: "ai", text: apiResult.answer }])
      } else {
        setChatHistory(prev => [...prev, { role: "error", text: apiResult.error || "Failed to get an answer." }])
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "error", text: "Connection error." }])
    } finally {
      setLoadingChat(false)
    }
  }

  const resetFlow = () => {
    setFile(null)
    setQuestion("")
    setData(null)
    setExplanation("")
    setEmail("")
    setResult(null)
    setError(null)
    setChatHistory([])
    setChatInput("")
  }

  return (
    <div className="app-container">
      <header className="glass-header">
        <h1>AI-Powered Document Orchestrator</h1>
      </header>

      <main className="main-content">
        {error && <div className="error-banner">{error}</div>}

        {!data && (
          <section className="glass-card upload-section fade-in">
            <h2>Upload Document</h2>
            <form onSubmit={handleSubmit}>
              <div
                className={`drag-drop-zone ${file ? "has-file" : ""}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ display: "none" }}
                  accept=".pdf,.txt"
                />
                {file ? (
                  <div className="file-info">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{file.name}</span>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <span className="upload-icon">📁</span>
                    <p>Drag & Drop your .pdf or .txt file here</p>
                    <small>or click to browse</small>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>ANY QUESTION ABOUT THE DOCUMENT</label>
                <textarea
                  placeholder="e.g. What is the information you want to extract from this document?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                />
              </div>

              <button type="submit" className="primary-btn" disabled={loadingExtract}>
                {loadingExtract ? <span className="loader"></span> : "EXTRACT THE DATA"}
              </button>
            </form>
          </section>
        )}

        {data && (
          <div className="two-column-layout fade-in">
            {/* LEFT SIDE: DOCUMENT CHAT */}
            <section className="glass-card chat-section">
              <div className="card-header">
                <h2>DOCUMENT CHAT</h2>
              </div>
              <div className="chat-container">
                {chatHistory.length === 0 ? (
                  <p className="muted-text text-center my-4">Ask any follow-up questions about your document!</p>
                ) : (
                  <div className="chat-history">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`chat-bubble ${msg.role}`}>
                        <strong>{msg.role === "user" ? "You" : (msg.role === "ai" ? "AI" : "Error")}:</strong>
                        <p>{msg.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <form onSubmit={handleChatSubmit} className="chat-form">
                  <input
                    type="text"
                    placeholder="Ask a follow-up question..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={loadingChat}
                  />
                  <button type="submit" className="primary-btn" disabled={loadingChat || !chatInput.trim()}>
                    {loadingChat ? <span className="loader" style={{width: 16, height: 16}}></span> : "SEND"}
                  </button>
                </form>
              </div>
            </section>

            {/* RIGHT SIDE: SETUP OR DASHBOARD */}
            <div className="right-dashboard-column">
              {!result ? (
                <section className="glass-card">
                  <div className="card-header">
                    <h2>OUTPUT FOR YOUR QUESTION</h2>
                    <button onClick={resetFlow} className="text-btn">Start Over</button>
                  </div>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Key Field</th>
                          <th>Extracted Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data).map(([key, value], index) => (
                          <tr key={index}>
                            <td className="key-cell">{key}</td>
                            <td>
                              {Array.isArray(value)
                                ? value.join(", ")
                                : typeof value === "object"
                                  ? JSON.stringify(value)
                                  : value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="email-trigger-section mt-4">
                    <h2>EMAIL THE OUTPUT</h2>

                    <div className="input-group row-group">
                      <input
                        type="email"
                        placeholder="Recipient Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-input"
                      />
                      <button onClick={handleSendEmail} className="primary-btn pulse-btn" disabled={loadingEmail}>
                        {loadingEmail ? <span className="loader"></span> : "SUBMIT"}
                      </button>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="glass-card success-dashboard">
                  <div className="card-header">
                    <h2>DASHBOARD</h2>
                    <button onClick={resetFlow} className="text-btn">Start Over</button>
                  </div>

                  <div className="dashboard-grid">
                    <div className="dashboard-card col-span-2">
                      <h3>DOCUMENT DATA</h3>
                      <div className="static-table">
                        {Object.entries(data).map(([key, val]) => (
                          <div className="data-row" key={key}>
                            <span className="data-key">{key}</span>
                            <span className="data-val">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="dashboard-card col-span-2">
                      <h3>FINAL ANSWER</h3>
                      <p className="insight-text">{result.answer || explanation || "No final answer provided."}</p>
                    </div>

                    <div className="dashboard-card col-span-2">
                      <div className="status-header">
                        <h3>EMAIL AUTOMATION</h3>
                        <span className={`status-badge ${result.status === "sent" ? "success" : "skipped"}`}>
                          {result.status ? result.status.toUpperCase() : "UNKNOWN"}
                        </span>
                      </div>
                      {result.email_body ? (
                        <div className="email-preview">
                          <strong>Body:</strong>
                          <p>{result.email_body}</p>
                        </div>
                      ) : (
                        <p className="muted-text">No email generated (condition skipped).</p>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App