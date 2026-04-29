import React, { useEffect, useState } from "react";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import { getWorkloadReport } from "../../api";

function Workload() {
  const [data, setData] = useState([]);

  useEffect(() => {
    getWorkloadReport().then(setData).catch(console.error);
  }, []);

  return (
    <WorkspaceLayout role="Admin" title="Workload Management" subtitle="Manage team resource allocation" activeSection="Workload">
      <div style={{ background: "#fff", padding: 24, borderRadius: 8 }}>
        <h2>Team Workload</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, marginTop: 20 }}>
          {data.map(u => (
            <div key={u.userId} style={{ border: "1px solid #eee", padding: 16, borderRadius: 8 }}>
              <h3>{u.name}</h3>
              <p>Status: <strong>{u.status}</strong></p>
              <p>Utilization: {u.utilization}%</p>
              <p>Tasks: {u.taskCount} ({u.overdueCount} overdue)</p>
            </div>
          ))}
          {data.length === 0 && <p>No data available</p>}
        </div>
      </div>
    </WorkspaceLayout>
  );
}

export default Workload;
