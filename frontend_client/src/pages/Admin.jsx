import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "@vladmandic/face-api";
import styles from "../style/Admin.module.css";

const Admin = () => {
  // --- States quản lý cấu hình & dữ liệu ---
  const [backend, setBackend] = useState("http://localhost:3000");
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [log, setLog] = useState("");

  // --- States quản lý HIỂN THỊ (Toggle) ---
  const [isUsersVisible, setIsUsersVisible] = useState(false);
  const [isAttendanceVisible, setIsAttendanceVisible] = useState(false);

  // --- States quản lý Token & Modal ---
  const [token, setToken] = useState("");
  const tokenRef = useRef(""); 
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [pendingAction, setPendingAction] = useState(null); 

  // --- States quản lý Panel Capture ---
  const [panelMode, setPanelMode] = useState(null); // null | 'create' | 'addFace'
  const [form, setForm] = useState({ name: "", id: "" });
  const [capLog, setCapLog] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Refs ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const overlayRef = useRef(null); 

  const MODEL_PATHS = [
    "/models",
    "https://justadudewhohacks.github.io/face-api.js/models",
  ];

  // ==========================================
  // HÀM HỖ TRỢ DÙNG CHUNG
  // ==========================================
  const fetchAPI = async (endpoint, method = "GET", body = null) => {
    if (!tokenRef.current.trim()) {
      setLog("Không thể xác thực token!");
      return null;
    }

    const options = {
      method,
      headers: { "x-admin-token": tokenRef.current.trim() }
    };
    if (body) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(`${backend}${endpoint}`, options);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errMsg = data.error || data.message || `Lỗi ${res.status}`;
        if (errMsg.includes("Không thể xác thực token!")) handleLogout();
        throw new Error(errMsg);
      }
      return method === "DELETE" ? true : await res.json();
    } catch (err) {
      const isNetworkErr = ["Failed to fetch", "NetworkError"].some(e => err.message.includes(e));
      throw new Error(isNetworkErr ? "Không thể kết nối tới server!" : err.message);
    }
  };

  const handleLogout = () => {
    setToken(""); tokenRef.current = "";
    setUsers([]); setAttendance([]);
    setIsUsersVisible(false); setIsAttendanceVisible(false); 
    closePanel();
    setLog("Đã khóa phiên bảo mật an toàn.");
    setTimeout(() => setLog(""), 3000);
  };

  const requireTokenAndExecute = (actionFunc) => {
    if (!tokenRef.current.trim()) {
      setPendingAction(() => actionFunc); 
      setTempToken(""); setShowTokenModal(true);
    } else actionFunc(); 
  };

  const handleTokenSubmit = () => {
    if (!tempToken.trim()) return setLog("Vui lòng nhập token!");
    setToken(tempToken.trim());
    tokenRef.current = tempToken.trim();
    setShowTokenModal(false); setLog("");
    if (pendingAction) { pendingAction(); setPendingAction(null); }
  };

  // ==========================================
  // LOGIC TẮT/BẬT (TOGGLE) CÁC NÚT BẤM
  // ==========================================
  const handleToggleUsers = async () => {
    if (isUsersVisible) {
      setIsUsersVisible(false); 
    } else {
      try {
        const data = await fetchAPI("/api/users");
        if (data) { setUsers(data); setIsUsersVisible(true); setLog(""); }
      } catch (err) { setLog(`Lỗi tải users: ${err.message}`); }
    }
  };

  const handleToggleAttendance = async () => {
    if (isAttendanceVisible) {
      setIsAttendanceVisible(false); 
    } else {
      try {
        const data = await fetchAPI("/api/attendance");
        if (data) { setAttendance(data); setIsAttendanceVisible(true); setLog(""); }
      } catch (err) { setLog(`Lỗi tải lịch sử: ${err.message}`); }
    }
  };

  const togglePanelMode = (mode) => {
    if (panelMode === mode) {
      closePanel(); 
    } else {
      setPanelMode(mode);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm(`Xoá user ${id} ?`)) return; 
    try {
      const success = await fetchAPI(`/api/users/${id}`, "DELETE");
      if (success) {
        setLog("Xoá thành công");
        setTimeout(() => setLog(""), 2000); 
        const data = await fetchAPI("/api/users");
        if (data) setUsers(data);
      }
    } catch (err) { setLog(`Lỗi xoá: ${err.message}`); }
  };

  // ==========================================
  // FACE API & CAMERA
  // ==========================================
  const loadModels = async () => {
    if (faceapi.nets.tinyFaceDetector.params) return true;
    for (const p of MODEL_PATHS) {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(p),
          faceapi.nets.faceLandmark68Net.loadFromUri(p),
          faceapi.nets.faceRecognitionNet.loadFromUri(p)
        ]);
        return true;
      } catch (e) { console.warn("Load models failed from", p); }
    }
    return false;
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const closePanel = () => {
    stopStream(); setPanelMode(null); setCapLog("");
    setForm({ name: "", id: "" }); setCountdown(null);
  };

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      if (panelMode === "create") {
        if (!form.name.trim()) throw new Error("Vui lòng nhập tên.");
        await fetchAPI("/api/users", "POST", { name: form.name });
        setCapLog("Tạo thành công!");
        if (isUsersVisible) { const data = await fetchAPI("/api/users"); if (data) setUsers(data); }
        setTimeout(closePanel, 1200);
      } else {
        if (!form.id.trim()) throw new Error("Vui lòng nhập ID.");
        
        setCapLog("Đang tải mô hình AI & Camera...");
        const ok = await loadModels();
        if (!ok) throw new Error("Không tải được mô hình AI.");

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream; videoRef.current.srcObject = stream;
        overlayRef.current?.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

        for (let i = 5; i > 0; i--) {
          setCountdown(i);
          await new Promise(r => setTimeout(r, 1000));
        }
        setCountdown(null);

        const video = videoRef.current; const canvas = canvasRef.current;
        const size = { width: video.videoWidth || 320, height: video.videoHeight || 240 };
        canvas.width = size.width; canvas.height = size.height;
        canvas.getContext("2d").drawImage(video, 0, 0, size.width, size.height);
        video.pause(); 

        setCapLog("Đang phân tích khuôn mặt...");
        const detection = await faceapi.detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
                                       .withFaceLandmarks().withFaceDescriptor();
        
        if (!detection) { video.play(); throw new Error("Không tìm thấy mặt. Thử lại!"); }

        const resized = faceapi.resizeResults(detection, size);
        if (overlayRef.current) {
          const octx = overlayRef.current.getContext("2d");
          overlayRef.current.width = size.width; overlayRef.current.height = size.height;
          octx.strokeStyle = "#00FF00"; octx.lineWidth = 3; 
          octx.strokeRect(resized.detection.box.x, resized.detection.box.y, resized.detection.box.width, resized.detection.box.height);
        }

        setCapLog("Đang gửi dữ liệu...");
        await fetchAPI(`/api/users/${form.id}/face`, "POST", {
          image: canvas.toDataURL("image/jpeg"),
          embedding: Array.from(detection.descriptor), 
        });
        
        setCapLog("Thêm mặt thành công!");
        if (isUsersVisible) { const data = await fetchAPI("/api/users"); if (data) setUsers(data); }
        setTimeout(closePanel, 2000);
      }
    } catch (err) { setCapLog(err.message); } 
    finally { setIsProcessing(false); }
  };

  useEffect(() => () => stopStream(), []);

  // ==========================================
  // RENDER UI (JSX)
  // ==========================================
  
  const getBtnStyle = (isActive) => ({
    opacity: isActive ? 1 : 0.6,
    transition: "all 0.2s ease-in-out",
    boxShadow: isActive ? "0 4px 8px rgba(0,0,0,0.15)" : "none"
  });

  return (
    <div className={styles.adminContainer}>
      <h2 className={styles.pageTitle}>Admin - Quản lý Users</h2>

      {/* MODAL TOKEN */}
      {showTokenModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", width: "320px", display: "flex", flexDirection: "column", gap: "15px" }}>
            <h3 style={{ margin: 0 }}>🔐 Xác thực Admin</h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>Vui lòng nhập Token bảo mật.</p>
            <input type="password" placeholder="Nhập Token..." value={tempToken} onChange={e => setTempToken(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTokenSubmit()} autoFocus style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", outline: "none" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => { setShowTokenModal(false); setPendingAction(null); }} style={{ padding: "8px 16px", cursor: "pointer", background: "#f0f0f0", border: "none", borderRadius: "4px" }}>Hủy</button>
              <button onClick={handleTokenSubmit} style={{ padding: "8px 16px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER CONFIG */}
      <div className={styles.configSection}>
        <div className={styles.inputGroup}>
          <label>Backend URL:</label>
          <input className={styles.textInput} value={backend} onChange={e => setBackend(e.target.value)} />
        </div>
        {token && (
           <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <span style={{color: "green", fontWeight: "bold"}}>Đã xác thực ✓</span>
              <button onClick={handleLogout} className={styles.btnDanger}>Khóa phiên (Logout)</button>
           </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className={styles.mainActions}>
        <button 
          className={styles.btnPrimary} 
          style={getBtnStyle(isUsersVisible)}
          onClick={() => requireTokenAndExecute(handleToggleUsers)}>
          Lấy danh sách users
        </button>

        <button 
          className={styles.btnPrimary} 
          style={getBtnStyle(isAttendanceVisible)}
          onClick={() => requireTokenAndExecute(handleToggleAttendance)}>
          Tải lịch sử điểm danh
        </button>

        <button 
          className={styles.btnSuccess} 
          style={getBtnStyle(panelMode === "create")}
          onClick={() => requireTokenAndExecute(() => togglePanelMode("create"))}>
          Tạo nhân viên
        </button>

        <button 
          className={styles.btnSuccess} 
          style={getBtnStyle(panelMode === "addFace")}
          onClick={() => requireTokenAndExecute(() => togglePanelMode("addFace"))}>
          Thêm mặt nhân viên
        </button>
      </div>

      {/* CAPTURE PANEL (FORM) */}
      {panelMode && (
        <div className={styles.capturePanel}>
          <h3 className={styles.panelTitle}>{panelMode === "create" ? "Tạo nhân viên mới" : "Đăng ký khuôn mặt"}</h3>
          <div className={styles.panelBody}>
            {panelMode === "create" ? (
              <input className={styles.textInputFull} placeholder="Tên nhân viên" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            ) : (
              <>
                <input className={styles.textInputFull} placeholder="Nhập ID nhân viên" value={form.id} onChange={e => setForm({...form, id: e.target.value})} />
                <div style={{ position: "relative", width: "320px", height: "240px", background: "#000", margin: "15px auto", borderRadius: "8px", overflow: "hidden" }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  <canvas ref={overlayRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
                  {countdown && (
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", border: "3px dashed #0f0", width: "160px", height: "200px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <span style={{ position: "absolute", top: "-30px", color: "#0f0", fontWeight: "bold" }}>Vui lòng đặt mặt vào khung</span>
                      <span style={{ fontSize: "56px", color: "white", fontWeight: "bold" }}>{countdown}</span>
                    </div>
                  )}
                  <canvas ref={canvasRef} hidden />
                </div>
              </>
            )}
            <div className={styles.panelActions}>
              <button className={styles.btnAction} onClick={handleAction} disabled={isProcessing}>
                {panelMode === "create" ? "Xác nhận tạo" : "Bắt đầu chụp mặt"}
              </button>
              <button className={styles.btnCancel} onClick={closePanel}>Đóng</button>
            </div>
            <p className={styles.capLog}>{capLog}</p>
          </div>
        </div>
      )}

      {log && <p className={styles.errorLog}>{log}</p>}

      {/* --- 6. KHU VỰC BẢNG DỮ LIỆU (DASHBOARD) --- */}
      <div className={styles.dashboardLayout} style={{
        gridTemplateColumns: (isUsersVisible && isAttendanceVisible) ? '1fr 1fr' : '1fr'
      }}>
        
        {/* Cột Danh sách Users - ÉP CỨNG NẰM Ở CỘT 1 */}
        {isUsersVisible && (
          <div className={styles.listSection}>
            <h3 className={styles.sectionTitle}>Danh sách Users</h3>
            {users.length === 0 ? (
              <p style={{color: "#666", fontStyle: "italic"}}>Danh sách trống.</p>
            ) : (
              <>
                <div className={styles.userTableHeader}>
                  <div>ID</div>
                  <div>Họ tên</div>
                  <div>Đăng ký khuôn mặt</div>
                  <div>Hành động</div>
                </div>
                <div className={styles.scrollBox}>
                  {users.map(u => (
                    <div key={u.id} className={styles.userItem}>
                      <span className={styles.userId}>{u.id}</span>
                      <span className={styles.userName}>{u.name}</span>
                      <span className={u.has_face ? styles.tagSuccess : styles.tagDanger} style={{justifySelf: "center"}}>
                        {u.has_face ? "Đã có" : "Chưa có"}
                      </span>
                      <div className={styles.userDeleteBtn}>
                        <button className={styles.btnDelete} onClick={() => requireTokenAndExecute(() => deleteUser(u.id))}>
                          Xoá
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Cột Lịch sử Điểm danh - ÉP CỨNG NẰM Ở CỘT 2 */}
        {isAttendanceVisible && (
          <div className={styles.listSection}>
            <h3 className={styles.sectionTitle}>Lịch sử điểm danh</h3>
            {attendance.length === 0 ? (
              <p style={{color: "#666", fontStyle: "italic"}}>Chưa có dữ liệu điểm danh.</p>
            ) : (
              <>
                <div className={styles.historyTableHeader}>
                  <div>ID</div>
                  <div>Họ tên</div>
                  <div>Thời gian</div>
                </div>
                <div className={styles.scrollBox}>
                  {attendance.map((a, i) => (
                    <div key={i} className={styles.historyItem}>
                      <span className={styles.historyUserId}>{a.user_id || "N/A"}</span>
                      <span className={styles.historyName}>{a.name}</span>
                      <span className={styles.historyTime}>{a.time}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default Admin;