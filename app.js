const canvas = document.getElementById("solarCanvas");
const ctx = canvas.getContext("2d");
const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");
const togglePause = document.getElementById("togglePause");
const pauseIcon = document.getElementById("pauseIcon");
const resetView = document.getElementById("resetView");
const toggleLabels = document.getElementById("toggleLabels");
const toggleTrails = document.getElementById("toggleTrails");
const planetInfo = document.getElementById("planetInfo");
const planetList = document.getElementById("planetList");

const planets = [
  { name: "水星", color: "#b8b0a4", orbit: 58, radius: 3.5, period: 88, start: 0.2, distance: "0.39 AU" },
  { name: "金星", color: "#e6c27a", orbit: 88, radius: 6, period: 225, start: 2.1, distance: "0.72 AU" },
  { name: "地球", color: "#4aa3ff", orbit: 120, radius: 6.5, period: 365, start: 4.2, distance: "1.00 AU" },
  { name: "火星", color: "#e66b47", orbit: 155, radius: 5, period: 687, start: 1.4, distance: "1.52 AU" },
  { name: "木星", color: "#d9a66f", orbit: 215, radius: 12, period: 4333, start: 5.1, distance: "5.20 AU" },
  { name: "土星", color: "#e5d197", orbit: 275, radius: 10.5, period: 10759, start: 3.4, distance: "9.58 AU", ring: true },
  { name: "天王星", color: "#72d5dd", orbit: 330, radius: 8, period: 30687, start: 0.8, distance: "19.2 AU" },
  { name: "海王星", color: "#466bff", orbit: 382, radius: 8, period: 60190, start: 2.8, distance: "30.1 AU" }
];

let width = 0;
let height = 0;
let center = { x: 0, y: 0 };
let simDays = 0;
let lastTime = performance.now();
let isPaused = false;
let selectedPlanet = planets[2];
let scale = 1;
let trails = new Map(planets.map((planet) => [planet.name, []]));

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  width = rect.width;
  height = rect.height;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  center = { x: width * 0.5, y: height * 0.52 };
  const maxOrbit = planets[planets.length - 1].orbit;
  scale = Math.min((width * 0.45) / maxOrbit, (height * 0.43) / maxOrbit, 1.35);
}

function planetPosition(planet) {
  const angle = planet.start + (simDays / planet.period) * Math.PI * 2;
  const orbit = planet.orbit * scale;
  return {
    x: center.x + Math.cos(angle) * orbit,
    y: center.y + Math.sin(angle) * orbit * 0.72,
    angle
  };
}

function drawBackground() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#02040a";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 160; i += 1) {
    const x = (i * 137.5) % width;
    const y = (i * 91.7) % height;
    const alpha = 0.25 + ((i * 13) % 45) / 100;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(x, y, i % 7 === 0 ? 1.7 : 1, i % 7 === 0 ? 1.7 : 1);
  }
}

function drawSun() {
  const glow = ctx.createRadialGradient(center.x, center.y, 4, center.x, center.y, 70 * scale);
  glow.addColorStop(0, "rgba(255, 226, 122, 0.95)");
  glow.addColorStop(0.42, "rgba(255, 137, 58, 0.32)");
  glow.addColorStop(1, "rgba(255, 137, 58, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 70 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(center.x, center.y, 18 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawOrbits() {
  planets.forEach((planet) => {
    ctx.strokeStyle = planet === selectedPlanet ? "rgba(255, 209, 102, 0.5)" : "rgba(255, 255, 255, 0.13)";
    ctx.lineWidth = planet === selectedPlanet ? 1.6 : 1;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, planet.orbit * scale, planet.orbit * scale * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawTrails() {
  if (!toggleTrails.checked) return;
  planets.forEach((planet) => {
    const points = trails.get(planet.name);
    if (points.length < 2) return;
    ctx.strokeStyle = planet.color;
    ctx.globalAlpha = 0.32;
    ctx.lineWidth = planet === selectedPlanet ? 2 : 1;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
}

function drawPlanets() {
  planets.forEach((planet) => {
    const pos = planetPosition(planet);
    const trail = trails.get(planet.name);
    trail.push({ x: pos.x, y: pos.y });
    if (trail.length > 110) trail.shift();

    ctx.save();
    ctx.translate(pos.x, pos.y);
    if (planet.ring) {
      ctx.strokeStyle = "rgba(229, 209, 151, 0.72)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, planet.radius * 1.9 * scale, planet.radius * 0.72 * scale, -0.28, 0, Math.PI * 2);
      ctx.stroke();
    }

    const radius = Math.max(planet.radius * scale, 3);
    const body = ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, 1, 0, 0, radius * 1.2);
    body.addColorStop(0, "#ffffff");
    body.addColorStop(0.18, planet.color);
    body.addColorStop(1, "#141923");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    if (planet === selectedPlanet) {
      ctx.strokeStyle = "rgba(255, 209, 102, 0.82)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    if (toggleLabels.checked) {
      ctx.fillStyle = planet === selectedPlanet ? "#ffd166" : "rgba(243, 247, 251, 0.82)";
      ctx.font = "12px Segoe UI, Microsoft YaHei, Arial";
      ctx.textAlign = "center";
      ctx.fillText(planet.name, pos.x, pos.y - Math.max(planet.radius * scale, 3) - 12);
    }
  });
}

function render() {
  drawBackground();
  drawOrbits();
  drawTrails();
  drawSun();
  drawPlanets();
}

function tick(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.08);
  lastTime = now;
  if (!isPaused) {
    simDays += delta * Number(speedRange.value);
  }
  render();
  requestAnimationFrame(tick);
}

function setSelectedPlanet(planet) {
  selectedPlanet = planet;
  planetInfo.innerHTML = `
    <span class="info-name">${planet.name}</span>
    <span class="info-detail">轨道周期 ${planet.period.toLocaleString("zh-CN")} 天 · ${planet.distance}</span>
  `;
  document.querySelectorAll(".planet-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.planet === planet.name);
  });
}

function buildPlanetList() {
  planets.forEach((planet) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "planet-button";
    button.dataset.planet = planet.name;
    button.innerHTML = `
      <span class="planet-dot" style="color: ${planet.color}; background: ${planet.color}"></span>
      <span class="planet-meta">
        <span class="planet-name">${planet.name}</span>
        <span class="planet-distance">${planet.distance}</span>
      </span>
      <span class="planet-days">${planet.period.toLocaleString("zh-CN")} 天</span>
    `;
    button.addEventListener("click", () => setSelectedPlanet(planet));
    planetList.appendChild(button);
  });
}

function resetSimulation() {
  simDays = 0;
  trails = new Map(planets.map((planet) => [planet.name, []]));
  setSelectedPlanet(planets[2]);
}

speedRange.addEventListener("input", () => {
  speedValue.value = `${speedRange.value}x`;
});

togglePause.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseIcon.textContent = isPaused ? "▶" : "||";
});

resetView.addEventListener("click", resetSimulation);
window.addEventListener("resize", resizeCanvas);

buildPlanetList();
resizeCanvas();
setSelectedPlanet(selectedPlanet);
requestAnimationFrame(tick);
