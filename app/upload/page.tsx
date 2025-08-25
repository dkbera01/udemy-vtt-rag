"use client";
import { useState } from "react";
import axios from "axios";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("");
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if(file.type !== "application/zip") {
      setStatus("File must be a zip file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus("File too large (max 5MB)");
      return;
    }

    setStatus("Uploading...");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 200) {
        setStatus("Upload completed!");
      } else {
        setStatus(res.data?.error || "Upload failed");
      }
    } catch (err: any) {
      setStatus(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 shadow-lg rounded-xl p-8 border border-gray-800">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Upload VTT Zip
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Choose a .zip file
            </label>
            <input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            <p className="pt-1 text-xs opacity-60">Note: Only .zip files are supported</p>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
            disabled={!file || uploading}
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </button>
        </form>

        {status && (
          <div
            className={`mt-6 text-center text-sm font-medium ${
              status.includes("complete") ? "text-green-400" : 
              status.includes("large") || status.includes("failed") ? "text-red-400" : "text-gray-300"
            }`}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
