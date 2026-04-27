import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import * as faceapi from '@vladmandic/face-api';
import styles from "../style/Home.module.css";

export default function Home() {
  // ==========================================
  // 1. STATES & REFS (Khai báo biến)
  // ==========================================
  const [backend, setBackend] = useState("http://localhost:3000");
  const [deviceId, setDeviceId] = useState("cam-frontend-01");
  const [status, setStatus] = useState("");
  const [list, setList] = useState([]);
  
  // State quản lý thông báo Camera và màu sắc của nó
  const [cameraLog, setCameraLog] = useState("");
  const [logColor, setLogColor] = useState("#333");
  
  const [debugStatus, setDebugStatus] = useState("");
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);
  const lastNotifiedRef = useRef({});

  // Đồng bộ State vào Ref để dùng an toàn trong vòng lặp while
  const backendRef = useRef(backend);
  const deviceIdRef = useRef(deviceId);

  // ==========================================
  // 2. HẰNG SỐ (Constants)
  // ==========================================
  const MODEL_PATHS = [
    "/models", 
    "https://justadudewhohacks.github.io/face-api.js/models",
  ];
  const COOLDOWN_MS = 6000;
  const SCAN_INTERVAL = 3000;

  // ==========================================
  // 3. ĐỊNH NGHĨA HÀM (Functions)
  // ==========================================

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 180);
    } catch (e) {
      console.warn("Audio not available", e);
    }
  };

  const showAttendanceNotification = (name, device) => {
    const key = `${device || ""}|${name || ""}`;
    const now = Date.now();

    if (
      lastNotifiedRef.current[key] &&
      now - lastNotifiedRef.current[key] < 3000
    )
      return;
    lastNotifiedRef.current[key] = now;

    const text = `Đã điểm danh nhân viên: ${name}`;
    setStatus(text);
    playBeep();

    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setStatus((currentStatus) =>
        currentStatus === text ? "" : currentStatus,
      );
    }, 3000);
  };

  const connectSocket = () => {
    if (socketRef.current) socketRef.current.disconnect();
    socketRef.current = io(backendRef.current.trim()); // Dùng ref để lấy giá trị mới nhất an toàn

    socketRef.current.on("connect", () =>
      setStatus("Socket connected: " + socketRef.current.id),
    );
    socketRef.current.on("disconnect", () => setStatus("Socket disconnected"));
    socketRef.current.on("attendance", (ev) => {
      setList((prev) => [ev, ...prev]);
      try {
        if (!ev) return;
        const device = ev.device_id || "";
        const name = ev.name || ev.user || ev.name;
        showAttendanceNotification(name, device);
      } catch (e) {
        console.warn(e);
      }
    });
  };

  const loadModels = async () => {
    try {
      const already = faceapi?.nets?.tinyFaceDetector?.params;
      if (already) {
        setDebugStatus("modelsLoaded=true");
        return true;
      }
    } catch (e) {
      /* ignore */
    }

    setCameraLog("Đang khởi động hệ thống AI...");
    setLogColor("#333");
    for (const p of MODEL_PATHS) {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(p);
        await faceapi.nets.faceLandmark68Net.loadFromUri(p);
        await faceapi.nets.faceRecognitionNet.loadFromUri(p);
        sessionStorage.setItem("faceapi_models_loaded", "1");
        
        setCameraLog(""); 
        setDebugStatus("modelsLoaded=true,path=" + p);
        return true;
      } catch (e) {
        console.warn("load failed", p, e);
      }
    }
    setCameraLog("Lỗi: Không tải được mô hình AI.");
    setLogColor("#dc3545");
    setDebugStatus("modelsLoaded=false");
    return false;
  };

  const handleVideoMetadata = () => {
    const v = videoRef.current;
    const overlay = overlayRef.current;
    const cap = canvasRef.current;
    if (v && overlay && cap) {
      const videoW = v.videoWidth || 320;
      const videoH = v.videoHeight || 240;
      overlay.width = videoW;
      overlay.height = videoH;
      cap.width = videoW;
      cap.height = videoH;

      const rect = v.getBoundingClientRect();
      overlay.style.width = rect.width + "px";
      overlay.style.height = rect.height + "px";
    }
  };

  const startCamera = async () => {
    if (scanningRef.current || isCameraRunning) return;
    setIsCameraRunning(true);

    const ok = await loadModels();
    if (!ok) {
      setIsCameraRunning(false);
      return;
    }

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      
      setLogColor("#333");
      scanningRef.current = true;
      scanLoop();
    } catch (err) {
      setCameraLog("Lỗi: Không thể truy cập Camera.");
      setLogColor("#dc3545");
      setIsCameraRunning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    scanningRef.current = false;
    setIsCameraRunning(false);
    setCameraLog(""); 
    
    // Xóa khung vẽ trên overlay khi tắt camera
    if (overlayRef.current) {
      const ctx = overlayRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      }
      overlayRef.current.width = 0;
      overlayRef.current.height = 0;
    }
  };

  const scanLoop = async () => {
    let lastSent = 0;

    const detectInterval = setInterval(async () => {
      if (!scanningRef.current) {
        clearInterval(detectInterval);
        return;
      }

      const video = videoRef.current;
      const overlay = overlayRef.current;

      if (!video || !overlay || video.readyState < 2) return;

      const currentBackend = backendRef.current.trim();
      const currentDevice = deviceIdRef.current.trim();

      try {
        const displaySize = {
          width: video.videoWidth,
          height: video.videoHeight,
        };

        if (overlay.width !== displaySize.width) {
          faceapi.matchDimensions(overlay, displaySize);
        }

        const detection = await faceapi.detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.15,
          })
        ).withFaceLandmarks().withFaceDescriptor();

        const octx = overlay.getContext("2d");
        octx.clearRect(0, 0, overlay.width, overlay.height);

        // Nếu tìm thấy mặt
        if (detection) {
          const resizedDetection = faceapi.resizeResults(detection, displaySize);
          const box = resizedDetection.detection.box;

          // Vẽ khung xanh
          octx.strokeStyle = "#00FF00";
          octx.lineWidth = 3; 
          octx.strokeRect(box.x, box.y, box.width, box.height);

          // Xử lý gửi API...
          const now = Date.now();
          if (now - lastSent > COOLDOWN_MS) {
            lastSent = now;
            
            const embedding = Array.from(detection.descriptor);

            try {
              const res = await fetch(currentBackend + "/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ embedding, device_id: currentDevice }),
              });
              const j = await res.json();

              // 1. NẾU ĐỦ ĐIỀU KIỆN ĐIỂM DANH (matched && không duplicate)
              if (j.success && j.matched && j.user?.name && !j.duplicate) {
                setCameraLog("✅ Điểm danh thành công!");
                setLogColor("#28a745"); 
                showAttendanceNotification(j.user.name, currentDevice);

                // In tên lên khung vuông
                octx.fillStyle = "rgba(0, 255, 0, 0.8)";
                octx.fillRect(box.x, box.y - 25, box.width, 25);
                octx.fillStyle = "#000";
                octx.fillText(j.user.name, box.x + 5, box.y - 7);
              }
              // 2. NẾU ĐÃ ĐIỂM DANH RỒI (duplicate)
              else if (j.success && j.duplicate && j.user?.name) {
                setCameraLog("⏭️ " + j.message);
                setLogColor("#ffc107");
              }
              // 3. NẾU KHÔNG TÌM THẤY NGƯỜI (unmatched)
              else if (j.success && !j.matched) {
                setCameraLog("❌ " + j.message);
                setLogColor("#dc3545"); 
              }
              // 4. LỖI SERVER
              else {
                setCameraLog("⚠️ " + (j.message || "Lỗi xử lý yêu cầu"));
                setLogColor("#dc3545");
              }
            } catch (err) {
              // 5. LỖI FETCH/SERVER DOWN
              setCameraLog("🔴 Lỗi kết nối tới server!");
              setLogColor("#dc3545"); 
              console.error("Attendance API error:", err);
            }
          }
        } 
        // Nếu KHÔNG tìm thấy mặt
        else {
          setCameraLog("🔴 Đang quét...");
          setLogColor("#333"); 
        }

      } catch (e) {
        console.warn("Lỗi vòng lặp quét camera:", e);
      }
    }, 300);
  };

  // ==========================================
  // 4. EFFECTS (Khai báo sau khi hàm đã sẵn sàng)
  // ==========================================

  useEffect(() => {
    backendRef.current = backend;
  }, [backend]);

  useEffect(() => {
    deviceIdRef.current = deviceId;
  }, [deviceId]);

  // CHẠY TỰ ĐỘNG KHI COMPONENT ĐƯỢC TẢI
  useEffect(() => {
    connectSocket(); // Tự động kết nối Socket ngay khi vào trang

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      stopCamera();
    };
  }, []); // [] đảm bảo chỉ chạy 1 lần lúc mount

  // ==========================================
  // 5. RENDER (Giao diện JSX)
  // ==========================================
  return (
    <div className={styles.homeContainer}>
      {/* Container chứa Notifications trôi nổi */}
      <div className={styles.notificationArea}>
        {notifications.map((n) => (
          <div key={n.id} className={styles.notificationToast}>
            {n.text}
          </div>
        ))}
      </div>

      <h2 className={styles.mainTitle}>Hệ Thống Điểm Danh Khuôn Mặt</h2>

      <div className={styles.configSection}>
        <label className={styles.inputLabel}>
          Backend URL:{" "}
          <input
            className={styles.textInput}
            value={backend}
            onChange={(e) => {
              setBackend(e.target.value);
              // Tùy chọn: Bạn có thể bỏ comment dòng dưới nếu muốn nó tự reconnect khi đổi URL
              // setTimeout(connectSocket, 500); 
            }}
          />
        </label>
        {/* NÚT KẾT NỐI SOCKET ĐÃ BỊ XÓA BỎ VÌ ĐÃ CHẠY TỰ ĐỘNG */}
      </div>

      {/* --- Embedded Camera Panel --- */}
      <div className={styles.cameraPanel}>
        <h3 className={styles.panelTitle}>Khu vực Camera</h3>

        <div className={styles.buttonGroup}>
          <button 
            className={styles.btnStart} 
            onClick={startCamera} 
            disabled={isCameraRunning}
          >
            Bật camera
          </button>
          <button 
            className={styles.btnStop} 
            onClick={stopCamera} 
            disabled={!isCameraRunning}
          >
            Tắt camera
          </button>
        </div>

        <label className={styles.inputLabel}>
          Device ID:{" "}
          <input
            className={styles.deviceIdInput}
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
          />
        </label>

        <div className={styles.videoWrapper}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={styles.videoStream}
            onLoadedMetadata={handleVideoMetadata}
          />
          <canvas
            ref={overlayRef}
            className={styles.overlayCanvas}
          />
          <canvas
            ref={canvasRef}
            className={styles.hiddenCanvas}
            style={{ display: 'none' }}
          />
          
          {/* Cập nhật màu động cho Camera Log */}
          {cameraLog && (
            <div 
              className={styles.cameraLog} 
              style={{ color: logColor, fontWeight: "bold", fontSize: "16px", position: "absolute", bottom: "10px", left: "10px", background: "rgba(255,255,255,0.8)", padding: "8px 12px", borderRadius: "5px" }}
            >
              {cameraLog}
            </div>
          )}
        </div>

      </div>

      {/* --- Lịch sử điểm danh --- */}
      <div className={styles.historyList}>
        {list.map((ev, idx) => (
          <div key={idx} className={styles.historyItem}>
            <img
              className={styles.historyImg}
              src={ev.image || ""}
              alt={ev.name}
            />
            <div className={styles.historyInfo}>
              <strong>{ev.name}</strong>
              <br />
              <small>{ev.time}</small>
              <br />
              <small>Device: {ev.device_id || ""}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}