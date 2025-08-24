"use client";
import { useState } from "react";
import axios from "axios";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setStatus("File too large (max 5MB)");
      return;
    }
    setStatus("");
    setProgress(0);
    try {
      setStatus("Uploading...");
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
          }
        },
      });
      if (res.status === 200) {
        setStatus("Upload and ingestion complete!");
      } else {
        setStatus(res.data?.error || "Upload failed");
      }
      setProgress(100);
    } catch (err: any) {
      setStatus(err?.response?.data?.error || "Upload failed");
      setProgress(0);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6  rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Upload VTT Zip</h1>
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        <input
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          className="mb-2 block w-full border border-gray-300 rounded px-2 py-1"
          disabled={progress > 0 && progress < 100}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
          disabled={!file || (progress > 0 && progress < 100)}
        >
          {progress > 0 && progress < 100 ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              Uploading...
            </span>
          ) : (
            "Upload"
          )}
        </button>
      </form>
      {progress > 0 && (
        <div className="w-full bg-gray-200 rounded mt-4">
          <div
            className="bg-blue-500 h-2 rounded transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      {status && <div className="mt-4 text-center">{status}</div>}
    </div>
  );
}
