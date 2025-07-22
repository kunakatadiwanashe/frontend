
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSession, signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
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
  logoutTime?: string;
  user: User;
  time?: string;
  logoutTimeFormatted?: string;
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

        let logoutTimeString = "";
        if (log.logoutTime) {
          const logoutDateObj = new Date(log.logoutTime);
          logoutTimeString = logoutDateObj.toTimeString().slice(0, 5);
        }

        if (!logsGrouped[dateKey]) logsGrouped[dateKey] = [];
        logsGrouped[dateKey].push({ ...log, time: timeString, logoutTimeFormatted: logoutTimeString });

        const late = isLateDate(logDateObj);
        allStudentIdsSet.add(log.user.studentId);

        const weekday = logDateObj.getDay();
        const weekdayKey = weekday.toString();

        if (!chartGrouped[weekdayKey]) {
          chartGrouped[weekdayKey] = { date: weekdayKey, total: 0, late: 0, absent: 0 };
        }
        chartGrouped[weekdayKey].total++;
        if (late) chartGrouped[weekdayKey].late++;

        attendanceCount[log.user.studentId] = (attendanceCount[log.user.studentId] || 0) + 1;
      });

      const totalUnique = allStudentIdsSet.size;
      Object.keys(chartGrouped).forEach((weekdayKey) => {
        chartGrouped[weekdayKey].absent = totalUnique - chartGrouped[weekdayKey].total;
      });

      const formattedChartData = Object.values(chartGrouped).map((entry) => ({
        ...entry,
        date: new Date(2023, 0, parseInt(entry.date) + 1).toLocaleDateString("en-US", {
          weekday: "short",
        }),
      }));

      setLogsByDate(logsGrouped);
      setChartData(formattedChartData);
      setAttendanceStats(attendanceCount);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  useEffect(() => {
    if (!session) return;
    fetchLogs();
  }, [session]);

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

  if (status === "loading") return <div className="p-4 text-lg">Loading...</div>;
  if (!session) return <div className="p-4 text-lg">Redirecting...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Attendance Dashboard
      </Typography>

      <div className="mb-6 flex flex-wrap gap-4">
        <TextField
          type="date"
          label="Filter by Date"
          variant="outlined"
          size="small"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <FormControlLabel
          control={<Checkbox checked={filterLateOnly} onChange={(e) => setFilterLateOnly(e.target.checked)} color="error" />}
          label="Show Late Only"
        />
      </div>

      <TableContainer component={Paper} elevation={1} className="rounded-md">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Student ID</strong></TableCell>
              {filteredDates.map((date) => (
                <TableCell key={date} align="center"><strong>{date}</strong></TableCell>
              ))}
              <TableCell align="center"><strong>Attendance %</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
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
                <TableRow key={id}>
                  <TableCell>{firstLog?.user.name || "-"}</TableCell>
                  <TableCell>{firstLog?.user.email || "-"}</TableCell>
                  <TableCell>{id}</TableCell>
                  {filteredDates.map((date) => {
                    const log = getLogForStudentOnDate(id, date);
                    const late = isLateLog(log);
                    const style = log
                      ? late
                        ? { color: "#b91c1c", backgroundColor: "#fee2e2" }
                        : {}
                      : { color: "#9ca3af", fontStyle: "italic" };
                    return (
                      <TableCell key={date} align="center" style={style}>
                        {log ? (
                          <>
                            <div>In: {log.time}</div>
                            <div>Out: {log.logoutTimeFormatted || "-"}</div>
                          </>
                        ) : (
                          "Absent"
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell align="center">{attendancePercentage}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Card className="mt-10">
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Weekly Attendance Overview
          </Typography>
          <div className="h-96">
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
        </CardContent>
      </Card>
    </div>
  );
}



