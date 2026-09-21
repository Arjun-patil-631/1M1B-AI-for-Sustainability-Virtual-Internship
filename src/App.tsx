import { useState } from "react";
import "./App.css";

type WasteResult = {
  item: string;
  category: string;
  confidence: number;
  guidance: string;
  ecoTip: string;
};

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<WasteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("image", file);

      const response = await fetch(
        "http://localhost:5000/api/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
  setImage(null);
  setResult(null);
  setError(null);
  setLoading(false);
};

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">
          <span>♻️</span>
          <div>
            <strong>EcoSort</strong>
            <small>AI</small>
          </div>
        </div>

        <div className="nav-tag">
          AI for a Greener Future
        </div>
      </header>

      <main>
        {!result ? (
          <section className="hero">
            <div className="hero-content">
              <span className="badge">AI-POWERED WASTE SORTING</span>

              <h1>
                Sort smarter.
                <br />
                <span>Live greener.</span>
              </h1>

              <p>
                Upload a photo of your waste and let EcoSort AI
                identify it, classify it, and guide you toward
                responsible disposal.
              </p>

              <label className="upload-button">
                📷 Upload Waste Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  hidden
                />
              </label>

              {loading && (
                <div className="loading">
                  <div className="spinner" />
                  <p>EcoSort AI is analyzing your image...</p>
                </div>
              )}

              {error && (
                <div className="error-box">
                  ⚠️ {error}
                </div>
              )}

              <div className="supported">
                <span>Organic</span>
                <span>Paper</span>
                <span>Plastic</span>
                <span>Glass</span>
                <span>Metal</span>
                <span>E-Waste</span>
              </div>
            </div>

            <div className="hero-card">
              <div className="scan-icon">♻</div>

              <h3>How EcoSort works</h3>

              <div className="steps">
                <div>
                  <b>01</b>
                  <span>Upload an image</span>
                </div>

                <div>
                  <b>02</b>
                  <span>AI identifies the waste</span>
                </div>

                <div>
                  <b>03</b>
                  <span>Get disposal guidance</span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="result-section">
            <button className="back-button" onClick={reset}>
              ← Analyze another item
            </button>

            <div className="result-grid">
              <div className="image-card">
                <img src={image!} alt="Uploaded waste" />

                <div className="image-label">
                  AI analyzed image
                </div>
              </div>

              <div className="result-card">
                <span className="badge">AI RESULT</span>

                <h1>{result.item}</h1>

                <div className="category">
                  <span>♻️</span>

                  <div>
                    <small>Waste Category</small>
                    <strong>{result.category}</strong>
                  </div>
                </div>

                <div className="confidence">
                  <div>
                    <span>AI Confidence</span>
                    <strong>{result.confidence}%</strong>
                  </div>

                  <div className="progress">
                    <div
                      style={{
                        width: `${result.confidence}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="info-box">
                  <h3>🗑️ Disposal Guidance</h3>
                  <p>{result.guidance}</p>
                </div>

                <div className="tip-box">
                  <h3>🌱 Eco Tip</h3>
                  <p>{result.ecoTip}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer>
        <span>EcoSort AI</span>
        <span>SDG 12 · Responsible Consumption & Production</span>
      </footer>
    </div>
  );
}

export default App;