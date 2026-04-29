import React, { useEffect, useState } from "react";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import { getPortfolioReport } from "../../api";

function Portfolio() {
  const [data, setData] = useState([]);

  useEffect(() => {
    getPortfolioReport().then(setData).catch(console.error);
  }, []);

  return (
    <WorkspaceLayout role="Admin" title="Portfolio Dashboard" subtitle="High-level project portfolio overview" activeSection="Portfolio">
      <div style={{ background: "#fff", padding: 24, borderRadius: 8 }}>
        <h2>Portfolio Overview</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
              <th>Project</th>
              <th>Status</th>
              <th>Health</th>
              <th>Progress</th>
              <th>Budget Used</th>
            </tr>
          </thead>
          <tbody>
            {data.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #eee", height: 40 }}>
                <td>{p.project_title}</td>
                <td>{p.status}</td>
                <td>{p.health}</td>
                <td>{p.completionPct}%</td>
                <td>${p.expenses}</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan="5">No data available</td></tr>}
          </tbody>
        </table>
      </div>
    </WorkspaceLayout>
  );
}

export default Portfolio;
