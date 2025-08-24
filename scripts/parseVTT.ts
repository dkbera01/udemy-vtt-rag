import * as fs from "fs";
import * as path from "path";

export type Sentence = {
  id: string;
  text: string;
  start: string;
  end: string;
  lecture_id: string;
};

export function parseVTT(filePath: string): Sentence[] {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const chunks: Sentence[] = [];
  let idx = 0;
  while (idx < lines.length) {
    const line = lines[idx].trim();
    if (line.includes("-->")) {
      const [start, end] = line.split("-->").map(s => s.trim());
      idx++;
      const textLines: string[] = [];
      while (idx < lines.length && lines[idx].trim() !== "") {
        textLines.push(lines[idx].trim());
        idx++;
      }
      const text = textLines.join(" ");
      chunks.push({
        id: `${path.basename(filePath)}-${chunks.length}`,
        text,
        start,
        end,
        lecture_id: path.basename(filePath, ".vtt")
      });
    }
    idx++;
  }
  return chunks;
}

function tsToSeconds(ts: string): number {
  const [h, m, s] = ts.split(":");
  const [sec, ms="0"] = s.split(".");
  return Number(h)*3600 + Number(m)*60 + Number(sec) + Number(ms)/1000;
}
function secondsToTs(sec: number): string {
  const h = Math.floor(sec/3600);
  const m = Math.floor((sec%3600)/60);
  const s = (sec%60).toFixed(3).padStart(6, "0");
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${s}`;
}

export function chunkSentences(sentences: Sentence[], windowSec = 60) {
  const res: Sentence[] = [];
  let buf: string[] = [];
  let startTs: number | null = null;
  let lastTs: number | null = null;
  for (const s of sentences) {
    const st = tsToSeconds(s.start);
    const en = tsToSeconds(s.end);
    if (startTs === null) startTs = st;
    buf.push(s.text);
    lastTs = en;
    if (en - startTs >= windowSec) {
      res.push({
        id: `${s.lecture_id}-${res.length}`,
        text: buf.join(" "),
        start: secondsToTs(startTs),
        end: secondsToTs(lastTs),
        lecture_id: s.lecture_id
      });
      buf = [];
      startTs = null;
    }
  }
  if (buf.length && startTs !== null && lastTs !== null) {
    const lec = sentences[0]?.lecture_id || "lecture";
    res.push({
      id: `${lec}-${res.length}`,
      text: buf.join(" "),
      start: secondsToTs(startTs),
      end: secondsToTs(lastTs),
      lecture_id: lec
    });
  }
  return res;
}
