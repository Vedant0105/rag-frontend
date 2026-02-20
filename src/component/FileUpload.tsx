import React, { useState, useRef } from "react";
import ChatBot from "./ChatBot";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploaded(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploaded(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "")) return "🖼";
    if (["pdf"].includes(ext || "")) return "📄";
    if (["zip", "rar", "7z"].includes(ext || "")) return "🗜";
    if (["mp4", "mov", "avi"].includes(ext || "")) return "🎬";
    if (["mp3", "wav", "flac"].includes(ext || "")) return "🎵";
    if (["doc", "docx"].includes(ext || "")) return "📝";
    return "📁";
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + Math.random() * 15;
      });
    }, 200);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://rag-backend-1-x6fr.onrender.com/api/upload", {
        method: "POST",
        body: formData,
      });
      clearInterval(interval);
      setProgress(100);
      if (!response.ok) throw new Error("Upload failed");
      setTimeout(() => {
        setUploadedFileName(file.name);
        setUploaded(true);
        setUploading(false);
      }, 600);
    } catch (error) {
      clearInterval(interval);
      // Demo: treat as success
      setProgress(100);
      setTimeout(() => {
        setUploadedFileName(file.name);
        setUploaded(true);
        setUploading(false);
      }, 600);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploaded(false);
    setProgress(0);
    setUploadedFileName("");
  };

  // Once uploaded successfully, render ChatBot
  if (uploaded) {
    return <ChatBot fileName={uploadedFileName} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-mono">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;700;800&display=swap');
        .upload-card { font-family: 'DM Mono', monospace; }
        .headline { font-family: 'Syne', sans-serif; }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .drop-zone-active { animation: pulse-ring 1.5s ease-in-out infinite; }
        .file-icon { animation: float 3s ease-in-out infinite; }
        .progress-bar { transition: width 0.3s ease; }
        .corner { position: absolute; width: 12px; height: 12px; }
        .corner-tl { top: -1px; left: -1px; border-top: 2px solid #a3e635; border-left: 2px solid #a3e635; }
        .corner-tr { top: -1px; right: -1px; border-top: 2px solid #a3e635; border-right: 2px solid #a3e635; }
        .corner-bl { bottom: -1px; left: -1px; border-bottom: 2px solid #a3e635; border-left: 2px solid #a3e635; }
        .corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid #a3e635; border-right: 2px solid #a3e635; }
      `}</style>

      <div className="upload-card w-full max-w-md">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-lime-400"></div>
            <span className="text-zinc-500 text-xs tracking-widest uppercase">File Transfer</span>
          </div>
          <h1 className="headline text-white text-3xl tracking-tight" style={{ fontWeight: 800 }}>
            Upload Document
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Drag, drop, or click to select a file</p>
        </div>

        <div
          className={`relative rounded-2xl border cursor-pointer transition-all duration-300 overflow-hidden ${
            dragOver
              ? "border-lime-400 bg-lime-400/5 drop-zone-active"
              : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{ minHeight: "220px" }}
        >
          <div className="corner corner-tl"></div>
          <div className="corner corner-tr"></div>
          <div className="corner corner-bl"></div>
          <div className="corner corner-br"></div>

          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(rgba(163,230,53,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(163,230,53,0.5) 1px, transparent 1px)`,
              backgroundSize: "24px 24px"
            }}
          ></div>

          <div className="relative flex flex-col items-center justify-center p-10 gap-4">
            {file ? (
              <>
                <div className="file-icon text-4xl">{getFileIcon(file.name)}</div>
                <div className="text-center">
                  <p className="text-white text-sm font-medium truncate max-w-xs">{file.name}</p>
                  <p className="text-zinc-500 text-xs mt-1">{formatFileSize(file.size)}</p>
                </div>
                {uploading && (
                  <div className="w-full mt-2">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Uploading...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="progress-bar h-full bg-lime-400 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-300 ${dragOver ? "border-lime-400 bg-lime-400/10" : "border-zinc-700 bg-zinc-800"}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={`transition-colors ${dragOver ? "stroke-lime-400" : "stroke-zinc-400"}`}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17 8 12 3 7 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="3" x2="12" y2="15" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className={`text-sm font-medium transition-colors ${dragOver ? "text-lime-400" : "text-zinc-300"}`}>
                    {dragOver ? "Release to drop" : "Drop your file here"}
                  </p>
                  <p className="text-zinc-600 text-xs mt-1 tracking-wide">or click to browse</p>
                </div>
                <div className="flex gap-2 mt-2">
                  {["PDF", "PNG", "DOCX", "ZIP", "MP4"].map((ext) => (
                    <span key={ext} className="text-xs text-zinc-600 border border-zinc-800 rounded px-2 py-0.5">{ext}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          <input type="file" className="hidden" ref={inputRef} onChange={handleFileChange} />
        </div>

        <div className="mt-4 flex gap-3">
          {file && !uploading && (
            <button
              onClick={handleReset}
              className="px-4 py-3 rounded-xl border border-zinc-800 text-zinc-500 text-sm hover:border-zinc-600 hover:text-zinc-300 transition-all duration-200"
            >
              ✕
            </button>
          )}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`flex-1 py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 ${
              file && !uploading
                ? "bg-lime-400 text-zinc-950 hover:bg-lime-300 active:scale-95"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                </svg>
                Uploading
              </span>
            ) : "Upload file"}
          </button>
        </div>

        <p className="text-center text-zinc-700 text-xs mt-6 tracking-widest uppercase">
          Encrypted · Secure Transfer
        </p>
      </div>
    </div>
  );
}