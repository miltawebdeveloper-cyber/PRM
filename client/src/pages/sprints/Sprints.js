import React, { useState, useEffect } from "react";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import { getSprints } from "../../api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function Sprints() {
  const [sprints, setSprints] = useState([]);

  useEffect(() => {
    getSprints().then(setSprints).catch(console.error);
  }, []);

  const dummyChartData = [
    { day: "Day 1", remaining: 100, ideal: 100 },
    { day: "Day 2", remaining: 80, ideal: 85 },
    { day: "Day 3", remaining: 60, ideal: 70 },
    { day: "Day 4", remaining: 40, ideal: 55 },
    { day: "Day 5", remaining: 10, ideal: 40 },
  ];

  return (
    <WorkspaceLayout role="Admin" title="Sprints" subtitle="Manage Agile Sprints" activeSection="Sprints">
      <div style={{ background: "#fff", padding: 24, borderRadius: 8 }}>
        <h2>Active Sprint Burndown</h2>
        <div style={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={dummyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="remaining" stroke="#8884d8" name="Actual Remaining Work" />
              <Line type="monotone" dataKey="ideal" stroke="#82ca9d" name="Ideal Burndown" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

export default Sprints;
