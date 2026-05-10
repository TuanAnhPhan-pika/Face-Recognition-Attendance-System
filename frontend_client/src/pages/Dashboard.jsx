import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../style/Dashboard.module.css";
import { getAdminToken, getSavedBackendUrl, saveAdminToken, clearAdminToken } from "../utils/storage";
import { formatDateValue, getLocalYMD, getWeekString, inputTypeForFilter, isLateAttendance } from "../utils/date";
import { fetchAttendanceRaw } from "../services/attendance.service";
import { validateAdminToken } from "../services/users.service";

function TrendChart({ labels, presentData, lateData }) {
  const width = 900;
  const height = 320;
  const padding = { top: 20, right: 28, bottom: 70, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxY = Math.max(1, ...presentData, ...lateData);

  const getX = (index) => {
    if (labels.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (labels.length - 1)) * plotWidth;
  };
  const getY = (value) => padding.top + plotHeight - (value / maxY) * plotHeight;
  const toPath = (values) => values.map((value, index) => `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(value)}`).join(" ");
  const toArea = (values) => {
    if (!values.length) return "";
    const lastX = getX(values.length - 1);
    const firstX = getX(0);
    const baseY = padding.top + plotHeight;
    return `${toPath(values)} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };
  const labelStep = labels.length > 10 ? Math.ceil(labels.length / 10) : 1;
  const tickCount = Math.min(maxY, 5);
  const yTicks = Array.from({ length: tickCount + 1 }, (_, index) => Math.round((maxY / tickCount) * index));

  return (
    <div className={styles.chartBox}>
      {labels.length === 0 ? (
        <div className={styles.emptyChart}>Chưa có dữ liệu trong bộ lọc này</div>
      ) : (
        <svg className={styles.chartSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biểu đồ xu hướng điểm danh">
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line className={styles.gridLine} x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
                <text className={styles.axisText} x={padding.left - 12} y={y + 4} textAnchor="end">{tick}</text>
              </g>
            );
          })}

          <path className={styles.presentArea} d={toArea(presentData)} />
          <path className={styles.lateArea} d={toArea(lateData)} />
          <path className={styles.presentLine} d={toPath(presentData)} />
          <path className={styles.lateLine} d={toPath(lateData)} />

          {presentData.map((value, index) => (
            <circle key={`present-${labels[index]}`} className={styles.presentPoint} cx={getX(index)} cy={getY(value)} r="4" />
          ))}
          {lateData.map((value, index) => (
            <circle key={`late-${labels[index]}`} className={styles.latePoint} cx={getX(index)} cy={getY(value)} r="4" />
          ))}

          {labels.map((label, index) => (
            index % labelStep === 0 || index === labels.length - 1 ? (
              <text key={label} className={styles.axisText} x={getX(index)} y={height - 42} textAnchor="middle">
                {label.slice(5)}
              </text>
            ) : null
          ))}

          <g transform={`translate(${width / 2 - 150} ${height - 18})`}>
            <rect className={styles.legendPresent} width="24" height="4" y="-3" rx="2" />
            <text className={styles.legendText} x="32" y="2">Số người có mặt</text>
            <rect className={styles.legendLate} width="24" height="4" x="170" y="-3" rx="2" />
            <text className={styles.legendText} x="202" y="2">Số người đi trễ</text>
          </g>
        </svg>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [backend] = useState(getSavedBackendUrl);
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState(getAdminToken);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [globalAtt, setGlobalAtt] = useState([]);
  const [globalUsr, setGlobalUsr] = useState([]);
  const [chartFilterType, setChartFilterType] = useState("month");
  const [chartVal1, setChartVal1] = useState(() => formatDateValue("month", new Date()));
  const [chartVal2, setChartVal2] = useState(() => formatDateValue("date", new Date()));
  const [statsFilterType, setStatsFilterType] = useState("month");
  const [statsFilterVal, setStatsFilterVal] = useState(() => formatDateValue("month", new Date()));
  const [topX, setTopX] = useState(5);

  const findUser = useCallback((rec) => {
    return globalUsr.find(u => u.id === rec.user_id || u._id === rec.user_id || u.name === rec.name) || { name: rec.name || "N/A", id: rec.user_id || "temp" };
  }, [globalUsr]);

  const testToken = useCallback(async (candidateToken) => {
    try {
      const res = await validateAdminToken(backend, candidateToken);
      if (res.ok) {
        saveAdminToken(candidateToken);
        setToken(candidateToken);
        setIsAuthorized(true);
        setLoginError("");
        return true;
      }
      setIsAuthorized(false);
      setLoginError("Token không hợp lệ!");
      clearAdminToken();
      return false;
    } catch {
      setLoginError("Lỗi kết nối Server!");
      return false;
    }
  }, [backend]);

  const fetchApiData = useCallback(async () => {
    if (!token) return;
    try {
      const [attRes, usrRes] = await Promise.all([
        fetchAttendanceRaw(backend, token),
        validateAdminToken(backend, token)
      ]);
      if (usrRes.status === 401) {
        clearAdminToken();
        setToken("");
        setIsAuthorized(false);
        return;
      }

      const attJson = await attRes.json();
      const usrJson = await usrRes.json();
      setGlobalAtt(Array.isArray(attJson) ? attJson : (attJson.data || []));
      setGlobalUsr(Array.isArray(usrJson) ? usrJson : (usrJson.data || []));
    } catch (err) {
      console.error("Lỗi API:", err);
    }
  }, [backend, token]);

  useEffect(() => {
    if (token) testToken(token);
  }, [testToken, token]);

  useEffect(() => {
    if (!isAuthorized) return undefined;
    fetchApiData();
    const id = setInterval(fetchApiData, 10000);
    return () => clearInterval(id);
  }, [fetchApiData, isAuthorized]);

  const recentLogs = useMemo(() => {
    return [...globalAtt].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 50);
  }, [globalAtt]);

  const statsData = useMemo(() => {
    const stats = {};
    globalUsr.forEach(u => stats[u.id] = { id: u.id, name: u.name, presentDays: 0, lateCount: 0 });
    const checkSet = new Set();

    globalAtt.forEach(rec => {
      const localYMD = getLocalYMD(rec.time);
      const d = new Date(rec.time);
      let isMatch = false;
      if (statsFilterType === "day") isMatch = localYMD === statsFilterVal;
      else if (statsFilterType === "week") isMatch = getWeekString(new Date(localYMD)) === statsFilterVal;
      else if (statsFilterType === "month") isMatch = localYMD.startsWith(statsFilterVal);
      else if (statsFilterType === "year") isMatch = localYMD.startsWith(statsFilterVal.toString());

      if (isMatch) {
        const u = findUser(rec);
        if (stats[u.id]) {
          const key = `${u.id}_${localYMD}`;
          if (!checkSet.has(key)) {
            checkSet.add(key);
            stats[u.id].presentDays++;
            if (d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 0)) stats[u.id].lateCount++;
          }
        }
      }
    });

    const userArray = Object.values(stats);
    const totalEmployees = globalUsr.length;
    const usersWithPresence = userArray.filter(u => u.presentDays > 0).length;
    const absentRate = totalEmployees > 0 ? Math.round(((totalEmployees - usersWithPresence) / totalEmployees) * 100) : 0;
    const usersWhoWereLate = userArray.filter(u => u.lateCount > 0).length;
    const lateRate = usersWithPresence > 0 ? Math.round((usersWhoWereLate / usersWithPresence) * 100) : 0;
    const topLate = [...userArray].filter(u => u.lateCount > 0).sort((a, b) => b.lateCount - a.lateCount).slice(0, topX);
    const topAbsent = statsFilterType === "day"
      ? [...userArray].filter(u => u.presentDays === 0).slice(0, topX)
      : [...userArray].sort((a, b) => a.presentDays - b.presentDays).slice(0, topX);
    const label = statsFilterType === "day" ? "Ngày này" : (statsFilterType === "week" ? "Tuần này" : (statsFilterType === "month" ? "Tháng này" : "Năm này"));

    return {
      label,
      presentText: `${usersWithPresence} / ${totalEmployees}`,
      absentRate,
      lateRate,
      topLate,
      topAbsent
    };
  }, [findUser, globalAtt, globalUsr, statsFilterType, statsFilterVal, topX]);

  const trendData = useMemo(() => {
    if (!chartVal1) return { labels: [], presentData: [], lateData: [] };
    const dailyStats = {};

    globalAtt.forEach(rec => {
      const localYMD = getLocalYMD(rec.time);
      const d = new Date(rec.time);
      let isMatch = false;
      if (chartFilterType === "week") isMatch = getWeekString(new Date(localYMD)) === chartVal1;
      else if (chartFilterType === "month") isMatch = localYMD.startsWith(chartVal1);
      else if (chartFilterType === "year") isMatch = localYMD.startsWith(chartVal1.toString());
      else if (chartFilterType === "range") isMatch = Boolean(chartVal1 && chartVal2 && localYMD >= chartVal1 && localYMD <= chartVal2);

      if (isMatch) {
        if (!dailyStats[localYMD]) dailyStats[localYMD] = { total: 0, late: 0, uniqueUsers: new Set() };
        const u = findUser(rec);
        if (!dailyStats[localYMD].uniqueUsers.has(u.id)) {
          dailyStats[localYMD].uniqueUsers.add(u.id);
          dailyStats[localYMD].total++;
          if (d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 0)) dailyStats[localYMD].late++;
        }
      }
    });

    const labels = Object.keys(dailyStats).sort();
    return {
      labels,
      presentData: labels.map(day => dailyStats[day].total),
      lateData: labels.map(day => dailyStats[day].late)
    };
  }, [chartFilterType, chartVal1, chartVal2, findUser, globalAtt]);

  const handleLogin = async () => {
    const candidateToken = tokenInput.trim();
    if (!candidateToken) return;
    await testToken(candidateToken);
  };

  const handleChartFilterTypeChange = (event) => {
    const type = event.target.value;
    setChartFilterType(type);
    if (type === "range") {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setChartVal1(formatDateValue("date", past));
      setChartVal2(formatDateValue("date", new Date()));
    } else {
      setChartVal1(formatDateValue(type, new Date()));
    }
  };

  const handleStatsFilterTypeChange = (event) => {
    const type = event.target.value;
    setStatsFilterType(type);
    setStatsFilterVal(formatDateValue(type, new Date()));
  };

  return (
    <div className={styles.dashboardPage}>
      {!isAuthorized && (
        <div className={styles.loginOverlay}>
          <div className={styles.loginBox}>
            <h2 className={styles.loginTitle}>Đăng nhập hệ thống</h2>
            <input
              className={styles.loginInput}
              type="password"
              placeholder="Nhập Admin Token..."
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleLogin();
              }}
              autoFocus
            />
            <button className={styles.loginButton} onClick={handleLogin}>Truy cập</button>
            {loginError && <p className={styles.loginError}>{loginError}</p>}
          </div>
        </div>
      )}

      <div className={styles.container}>
        <h2 className={styles.mainTitle}>Dashboard quản trị & phân tích</h2>

        <div className={styles.topGrid}>
          <div className={styles.totalCard}>
            <h3>Tổng nhân viên</h3>
            <p>{globalUsr.length}</p>
          </div>
          <div className={`${styles.panel} ${styles.activityPanel}`}>
            <div className={styles.sectionTitle}>Hoạt động điểm danh</div>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log, index) => {
                    const d = new Date(log.time);
                    const user = findUser(log);
                    const late = isLateAttendance(log.time);
                    return (
                      <tr key={`${log.user_id || user.id}-${log.time}-${index}`}>
                        <td><strong>{user.name}</strong></td>
                        <td>{d.toLocaleTimeString("vi-VN")} - {d.toLocaleDateString("vi-VN")}</td>
                        <td>
                          <span className={`${styles.badge} ${late ? styles.lateBadge : styles.onTimeBadge}`}>
                            {late ? "Đi trễ" : "Đúng giờ"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {recentLogs.length === 0 && (
                    <tr>
                      <td colSpan="3" className={styles.emptyCell}>Chưa có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.sectionTitle}>
            <span>Biểu đồ xu hướng điểm danh & đi trễ</span>
            <div className={styles.controlsGroup}>
              <label>Hiển thị theo:</label>
              <select value={chartFilterType} onChange={handleChartFilterTypeChange}>
                <option value="week">Tuần cụ thể</option>
                <option value="month">Tháng cụ thể</option>
                <option value="year">Năm cụ thể</option>
                <option value="range">Từ ngày ... Đến ngày</option>
              </select>
              <input
                type={inputTypeForFilter(chartFilterType)}
                min={chartFilterType === "year" ? "2000" : undefined}
                max={chartFilterType === "year" ? "2100" : undefined}
                value={chartVal1}
                onChange={(event) => setChartVal1(event.target.value)}
              />
              {chartFilterType === "range" && (
                <>
                  <span className={styles.rangeDivider}>➝</span>
                  <input type="date" value={chartVal2} onChange={(event) => setChartVal2(event.target.value)} />
                </>
              )}
            </div>
          </div>
          <TrendChart labels={trendData.labels} presentData={trendData.presentData} lateData={trendData.lateData} />
        </div>

        <div className={styles.panel}>
          <div className={styles.sectionTitle}>
            <span>Thống kê chi tiết & bảng xếp hạng</span>
            <div className={styles.controlsGroup}>
              <label>Bộ lọc:</label>
              <select value={statsFilterType} onChange={handleStatsFilterTypeChange}>
                <option value="day">Ngày cụ thể</option>
                <option value="week">Trong tuần</option>
                <option value="month">Trong tháng</option>
                <option value="year">Trong năm</option>
              </select>
              <input
                type={inputTypeForFilter(statsFilterType)}
                min={statsFilterType === "year" ? "2000" : undefined}
                max={statsFilterType === "year" ? "2100" : undefined}
                value={statsFilterVal}
                onChange={(event) => setStatsFilterVal(event.target.value)}
              />
              <span className={styles.controlSeparator}>|</span>
              <label>Lấy Top:</label>
              <input
                className={styles.topInput}
                type="number"
                value={topX}
                min="1"
                max="50"
                onChange={(event) => setTopX(Number.parseInt(event.target.value, 10) || 5)}
              />
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div className={styles.statTitle}>Có mặt ({statsData.label.toUpperCase()})</div>
              <div className={styles.statValue}>{statsData.presentText}</div>
            </div>
            <div className={`${styles.statBox} ${styles.lateStat}`}>
              <div className={styles.statTitle}>Tỉ lệ đi trễ</div>
              <div className={styles.statValue}>{statsData.lateRate}%</div>
            </div>
            <div className={`${styles.statBox} ${styles.absentStat}`}>
              <div className={styles.statTitle}>Tỉ lệ vắng mặt</div>
              <div className={styles.statValue}>{statsData.absentRate}%</div>
            </div>
          </div>

          <div className={styles.rankingGrid}>
            <div className={styles.rankingPanel}>
              <h4 className={styles.lateHeading}>Top nhân viên trễ nhiều nhất</h4>
              <ul className={styles.rankingList}>
                {statsData.topLate.length === 0 ? (
                  <li><span className={styles.emptyRank}>Không có</span></li>
                ) : statsData.topLate.map((user, index) => (
                  <li key={`${user.id}-late`}>
                    <span className={styles.rank}>#{index + 1}</span>
                    <span className={styles.name}>{user.name}</span>
                    <span className={`${styles.count} ${styles.lateCount}`}>{user.lateCount} lần</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.rankingPanel}>
              <h4 className={styles.absentHeading}>Top nhân viên vắng nhiều nhất</h4>
              <ul className={styles.rankingList}>
                {statsData.topAbsent.length === 0 ? (
                  <li><span className={styles.emptyRank}>Không có</span></li>
                ) : statsData.topAbsent.map((user, index) => (
                  <li key={`${user.id}-absent`}>
                    <span className={styles.rank}>#{index + 1}</span>
                    <span className={styles.name}>{user.name}</span>
                    <span className={`${styles.count} ${styles.absentCount}`}>
                      {statsFilterType === "day" ? "Vắng mặt" : `Có mặt: ${user.presentDays} ngày`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
