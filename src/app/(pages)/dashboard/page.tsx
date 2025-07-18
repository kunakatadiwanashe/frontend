"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSession, signIn } from "next-auth/react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface User {
  studentId: string;
  name: string;
  email: string;
}

interface Log {
  timestamp: string;
  user: User;
  time?: string;
}

interface LogsByDate {
  [date: string]: Log[];
}

interface ChartDataEntry {
  date: string;
  total: number;
  late: number;
  absent: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [logsByDate, setLogsByDate] = useState<LogsByDate>({});
  const [chartData, setChartData] = useState<ChartDataEntry[]>([]);
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterLateOnly, setFilterLateOnly] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (status === "loading") return;
    if (!session) signIn();
  }, [status, session]);

  const isLateDate = (date: Date) => {
    return date.getHours() > 8 || (date.getHours() === 8 && date.getMinutes() > 15);
  };

  useEffect(() => {
    if (!session) return;

    const fetchLogs = async () => {
      try {
        const res = await axios.get<Log[]>("http://localhost:5000/api/attendance/logs");
        const logs = res.data;

        const logsGrouped: LogsByDate = {};
        const chartGrouped: Record<string, ChartDataEntry> = {};
        const allStudentIdsSet = new Set<string>();
        const attendanceCount: Record<string, number> = {};

        logs.forEach((log) => {
          const logDateObj = new Date(log.timestamp);
          const dateKey = logDateObj.toISOString().split("T")[0];
          const timeString = logDateObj.toTimeString().slice(0, 5);

          if (!logsGrouped[dateKey]) logsGrouped[dateKey] = [];
          logsGrouped[dateKey].push({ ...log, time: timeString });

          const late = isLateDate(logDateObj);
          const weekday = logDateObj.toLocaleDateString("en-US", { weekday: "short" });

          allStudentIdsSet.add(log.user.studentId);

          if (!chartGrouped[weekday]) chartGrouped[weekday] = { date: weekday, total: 0, late: 0, absent: 0 };
          chartGrouped[weekday].total++;
          if (late) chartGrouped[weekday].late++;

          attendanceCount[log.user.studentId] = (attendanceCount[log.user.studentId] || 0) + 1;
        });

        // Calculate absentees for chart
        Object.keys(chartGrouped).forEach((weekday) => {
          const totalUnique = allStudentIdsSet.size;
          chartGrouped[weekday].absent = totalUnique - chartGrouped[weekday].total;
        });

        setLogsByDate(logsGrouped);
        setChartData(Object.values(chartGrouped));
        setAttendanceStats(attendanceCount);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };

    fetchLogs();
  }, [session]);

  if (status === "loading") return <div className="p-4 text-lg">Loading...</div>;
  if (!session) return <div className="p-4 text-lg">Redirecting...</div>;

  const allStudentIds = new Set<string>();
  Object.values(logsByDate).forEach((logs) => {
    logs.forEach((log) => allStudentIds.add(log.user.studentId));
  });

  const sortedDates = Object.keys(logsByDate).sort();
  const filteredDates = filterDate ? sortedDates.filter((d) => d === filterDate) : sortedDates;

  const getLogForStudentOnDate = (id: string, date: string): Log | undefined => {
    return logsByDate[date]?.find((log) => log.user.studentId === id);
  };

  const isLateLog = (log?: Log): boolean => {
    if (!log || !log.time) return false;
    const [h, m] = log.time.split(":" ).map(Number);
    return h > 8 || (h === 8 && m > 15);
  };

  const totalDays = sortedDates.length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Attendance Dashboard</h1>

      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Filter by Date:</label>
          <input
            type="date"
            className="border border-gray-300 px-3 py-2 rounded-md shadow-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filterLateOnly}
            onChange={(e) => setFilterLateOnly(e.target.checked)}
            className="accent-red-500"
          />
          <label className="text-sm font-medium">Show Late Only</label>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full border-collapse bg-white shadow rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-sm text-left">
              <th className="px-4 py-3 border-b">Name</th>
              <th className="px-4 py-3 border-b">Email</th>
              <th className="px-4 py-3 border-b">Student ID</th>
              {filteredDates.map((date) => (
                <th key={date} className="px-4 py-3 border-b text-center">{date}</th>
              ))}
              <th className="px-4 py-3 border-b text-center">Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {[...allStudentIds].map((id) => {
              const firstLog = Object.values(logsByDate).flat().find((l) => l.user.studentId === id);
              const shouldShow = filteredDates.some((date) => {
                const log = getLogForStudentOnDate(id, date);
                return log && (!filterLateOnly || isLateLog(log));
              });
              if (!shouldShow) return null;

              const attendanceCount = attendanceStats[id] || 0;
              const attendancePercentage = totalDays > 0 ? Math.round((attendanceCount / totalDays) * 100) : 0;

              return (
                <tr key={id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{firstLog?.user.name || "-"}</td>
                  <td className="border px-4 py-2">{firstLog?.user.email || "-"}</td>
                  <td className="border px-4 py-2">{id}</td>
                  {filteredDates.map((date) => {
                    const log = getLogForStudentOnDate(id, date);
                    const late = isLateLog(log);
                    const className = log
                      ? late
                        ? "bg-red-200 text-red-800"
                        : "text-gray-800"
                      : "text-gray-400 italic";
                    return (
                      <td key={date} className={`border px-4 py-2 text-center ${className}`}>
                        {log ? log.time : "Absent"}
                      </td>
                    );
                  })}
                  <td className="border px-4 py-2 text-center font-semibold">{attendancePercentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-800">Weekly Attendance Overview</h2>
      <div className="w-full h-96 bg-white rounded-lg shadow p-4">
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#4f46e5" name="Total Attendance" />
            <Line type="monotone" dataKey="late" stroke="#ef4444" name="Late Comers" />
            <Line type="monotone" dataKey="absent" stroke="#9ca3af" name="Absent" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
