
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import "./App.css";

const API_URL = "http://localhost:8080/api/ai/predict/latest";
const HISTORY_URL = "http://localhost:8080/api/history";

function App() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [minutes, setMinutes] = useState("60");
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchPrediction() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Prediction request failed");
        }

        const result = await response.json();

        if (active) {
          setData(result);
          setError("");
        }
      } catch {
        if (active) {
          setError(
            "Cannot connect to Spring Boot. Check that Spring Boot and Python AI are running."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchPrediction();
    const timer = setInterval(fetchPrediction, 10000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchHistory() {
      try {
        const response = await fetch(
          `${HISTORY_URL}?minutes=${minutes}`
        );

        if (!response.ok) {
          throw new Error("History request failed");
        }

        const result = await response.json();

        if (active) {
          setHistory(Array.isArray(result) ? result : []);
          setHistoryError("");
        }
      } catch {
        if (active) {
          setHistoryError(
            "Unable to load history. Check the Spring Boot history API."
          );
        }
      }
    }

    fetchHistory();
    const timer = setInterval(fetchHistory, 10000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [minutes]);

  const chartData = history.map((item) => ({
    ...item,
    time: item.measuredAt
      ? new Date(item.measuredAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      : "",
    latency: Number(item.latency),
    bandwidth: Number(item.bandwidth),
    packetLoss: Number(item.packetLoss)
  }));

  const recentHistory = [...history].reverse().slice(0, 10);

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <p className="eyebrow">AI-POWERED NETWORK MONITORING</p>
          <h1>Internet Congestion Predictor</h1>
          <p className="subtitle">
            Real-time network measurements with AI analysis
          </p>
        </div>

        <span className="live">● LIVE MONITORING</span>
      </header>

      {loading && <p className="notice">Loading network data...</p>}

      {error && (
        <div className="error">
          {error}
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          <section className="status-panel">
            <div>
              <p className="label">CURRENT CONGESTION STATUS</p>
              <h2 className={`status ${data.congestionStatus?.toLowerCase()}`}>
                {data.congestionStatus}
              </h2>
              <p className="subtitle">
                Based on network latency and packet-loss thresholds
              </p>
            </div>

            <div
              className={`ai-badge ${
                data.anomalyDetected ? "warning" : ""
              }`}
            >
              <span>{data.anomalyDetected ? "⚠" : "✓"}</span>
              <div>
                <strong>
                  {data.anomalyDetected
                    ? "Unusual Pattern Detected"
                    : "No Anomaly Detected"}
                </strong>
                <p>Isolation Forest AI</p>
              </div>
            </div>
          </section>

          <section className="metrics">
            <article className="metric-card">
              <span className="metric-icon">◷</span>
              <p>Latency</p>
              <h2>
                {Number(data.latency).toFixed(2)} <small>ms</small>
              </h2>
              <span className="description">Network response time</span>
            </article>

            <article className="metric-card">
              <span className="metric-icon">⇅</span>
              <p>Bandwidth</p>
              <h2>
                {Number(data.bandwidth).toFixed(2)} <small>Mbps</small>
              </h2>
              <span className="description">Estimated download speed</span>
            </article>

            <article className="metric-card">
              <span className="metric-icon">%</span>
              <p>Packet Loss</p>
              <h2>
                {Number(data.packetLoss).toFixed(2)}<small>%</small>
              </h2>
              <span className="description">Lost network packets</span>
            </article>

            <article className="metric-card">
              <span className="metric-icon">✳</span>
              <p>AI Anomaly Score</p>
              <h2>{Number(data.anomalyScore).toFixed(4)}</h2>
              <span className="description">
                Lower means more anomalous
              </span>
            </article>
          </section>

          <section className="details">
            <h2>AI Analysis</h2>
            <p>{data.message}</p>
            <p className="footnote">
              An anomaly does not necessarily mean the network is congested.
            </p>
          </section>
        </>
      )}

      <section className="history-section">
        <div className="section-heading">
          <div>
            <h2>Network Performance History</h2>
            <p className="subtitle">
              Historical readings saved in the database
            </p>
          </div>

          <select
            className="filter-select"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
          >
            <option value="60">Last 1 hour</option>
            <option value="360">Last 6 hours</option>
            <option value="1440">Last 24 hours</option>
            <option value="10080">Last 7 days</option>
          </select>
        </div>

        {historyError && (
          <div className="error">{historyError}</div>
        )}

        {!historyError && history.length === 0 && (
          <p className="notice">
            No historical readings found for this time range yet.
          </p>
        )}

        {history.length > 0 && (
          <>
            <div className="chart-grid">
              <article className="chart-card">
                <h3>Latency Over Time</h3>
                <p className="chart-unit">Milliseconds (ms)</p>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" minTickGap={30} />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="latency"
                      name="Latency"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </article>

              <article className="chart-card">
                <h3>Bandwidth Over Time</h3>
                <p className="chart-unit">Megabits per second (Mbps)</p>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" minTickGap={30} />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="bandwidth"
                      name="Bandwidth"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </article>

              <article className="chart-card">
                <h3>Packet Loss Over Time</h3>
                <p className="chart-unit">Packet loss (%)</p>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" minTickGap={30} />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="packetLoss"
                      name="Packet Loss"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </article>
            </div>

            <article className="history-table-card">
              <h3>Recent Measurements</h3>
              <p className="chart-unit">
                Showing the latest 10 records in the selected time range
              </p>

              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Measured At</th>
                      <th>Latency (ms)</th>
                      <th>Bandwidth (Mbps)</th>
                      <th>Packet Loss (%)</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentHistory.map((item, index) => (
                      <tr key={item.id ?? `${item.measuredAt}-${index}`}>
                        <td>
                          {item.measuredAt
                            ? new Date(item.measuredAt).toLocaleString()
                            : "—"}
                        </td>
                        <td>{Number(item.latency).toFixed(2)}</td>
                        <td>{Number(item.bandwidth).toFixed(2)}</td>
                        <td>{Number(item.packetLoss).toFixed(2)}</td>
                        <td>{item.status ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </>
        )}
      </section>
      
{data && (
  (data.congestionStatus?.toUpperCase() === "HIGH" ||
    data.anomalyDetected) && (
    <section className="alert-banner">
      <span className="alert-icon">⚠</span>

      <div>
        <h3>
          {data.congestionStatus?.toUpperCase() === "HIGH"
            ? "High Network Congestion!"
            : "Unusual Network Activity Detected!"}
        </h3>

        <p>
          {data.congestionStatus?.toUpperCase() === "HIGH"
            ? "Your network may be experiencing congestion. Check latency, bandwidth, and packet loss."
            : "The AI model detected an unusual network pattern. Review the current metrics."}
        </p>
      </div>
    </section>
  )
)}

      <footer>
        Internet Congestion Predictor | React + Spring Boot + Python AI
      </footer>
    </main>
  );
}

export default App;