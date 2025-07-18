"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Log {
  user: {
    studentId: string;
    name: string;
    email: string;
  };
  timestamp: string;
}
interface WeeklyStat {
  day: string;
  attendance: number;
  late: number;
}

export default function DashboardPage() {


  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<Log[]>([]);
  const [lateLogs, setLateLogs] = useState<Log[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) signIn();
  }, [status, session]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/attendance/logs");
        const fetchedLogs: Log[] = res.data;
        setLogs(fetchedLogs);

        const weekData: Record<string, WeeklyStat> = {};
        const now = new Date();
        const LATE_THRESHOLD_HOUR = 8;
        const LATE_THRESHOLD_MIN = 15;

        fetchedLogs.forEach((log) => {
          const logDate = new Date(log.timestamp);
          const day = logDate.toLocaleDateString("en-US", { weekday: "short" });

          if (!weekData[day]) {
            weekData[day] = { day, attendance: 0, late: 0 };
          }

          weekData[day].attendance += 1;

          const lateThreshold = new Date(logDate);
          lateThreshold.setHours(LATE_THRESHOLD_HOUR, LATE_THRESHOLD_MIN, 0, 0);

          if (logDate > lateThreshold) {
            weekData[day].late += 1;
          }
        });

        setWeeklyStats(Object.values(weekData));

        // Filter late comers
        const lateCutoff = new Date();
        lateCutoff.setHours(LATE_THRESHOLD_HOUR, LATE_THRESHOLD_MIN, 0, 0);
        const late = fetchedLogs.filter((log) => new Date(log.timestamp) > lateCutoff);
        setLateLogs(late);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };

    if (session) {
      fetchLogs();
    }
  }, [session]);

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <div>Redirecting...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Attendance Logs</h1>

      <div className="mb-10">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={weeklyStats}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="attendance" fill="#4F46E5" name="Total Attendance" />
            <Bar dataKey="late" fill="#EF4444" name="Late Comers" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="min-w-full border mb-10">
        <thead>
          <tr className="bg-gray-200 text-center">
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Student ID</th>
            <th className="px-4 py-2 border">Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={idx} className="text-center">
              <td className="border px-4 py-2">{log.user.name}</td>
              <td className="border px-4 py-2">{log.user.email}</td>
              <td className="border px-4 py-2">{log.user.studentId}</td>
              <td className="border px-4 py-2">
                {new Date(log.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mb-2">Late Comers (after 08:15)</h2>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-red-100 text-center">
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Student ID</th>
            <th className="px-4 py-2 border">Time</th>
          </tr>
        </thead>
        <tbody>
          {lateLogs.map((log, idx) => (
            <tr key={idx} className="text-center">
              <td className="border px-4 py-2">{log.user.name}</td>
              <td className="border px-4 py-2">{log.user.email}</td>
              <td className="border px-4 py-2">{log.user.studentId}</td>
              <td className="border px-4 py-2">
                {new Date(log.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );



}
