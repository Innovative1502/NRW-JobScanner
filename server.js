const express = require("express");
const fetch = require("node-fetch");
const webpush = require("web-push");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));

let subscribers = [];
let knownJobs = new Set();

webpush.setVapidDetails(
  "mailto:admin@example.com",
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

app.post("/subscribe", (req, res) => {
  subscribers.push(req.body);
  res.json({ status: "ok" });
});

function notifyAll(job) {
  subscribers.forEach((sub) => {
    webpush.sendNotification(sub, JSON.stringify(job)).catch(() => {});
  });
}

async function scrape(location) {
  const url = `[de.indeed.com](https://de.indeed.com/jobs?q=kaufm%C3%A4nnisch&l=${encodeURIComponent(location)})`;
  const res = await fetch(url);
  const html = await res.text();

  const regex =
    /jobTitle":"([^"]+)".*?"companyName":"([^"]+)".*?"url":"([^"]+)"/g;

  let jobs = [];
  let match;

  while ((match = regex.exec(html))) {
    jobs.push({
      title: match[1],
      company: match[2],
      link: "[indeed.com](https://indeed.com)" + match[3],
    });
  }
  return jobs;
}

async function checkJobs() {
  const locations = ["Köln", "Leverkusen"];
  for (const loc of locations) {
    const results = await scrape(loc);
    results.forEach((job) => {
      const key = job.title + job.company;
      if (!knownJobs.has(key)) {
        knownJobs.add(key);
        notifyAll(job);
      }
    });
  }
}

app.get("/run-scan", async (req, res) => {
  await checkJobs();
  res.json({ status: "scan done" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("NRW JobScanner läuft auf Port", port));
