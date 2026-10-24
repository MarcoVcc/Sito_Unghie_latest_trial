(() => {
  const normalTheme = "classic";
  const supportedThemes = new Set([normalTheme, "halloween", "christmas", "newyear"]);
  const themeSettings = window.SITE_CONFIG?.theme || {};

  function getPreviewTheme() {
    if (themeSettings.showThemePreviewButton !== true) return null;

    const requestedTheme = new URLSearchParams(window.location.search).get("previewTheme");
    return supportedThemes.has(requestedTheme) ? requestedTheme : null;
  }

  function parseMonthDay(value) {
    if (typeof value !== "string" || !/^\d{2}-\d{2}$/.test(value)) return null;

    const [month, day] = value.split("-").map(Number);
    const check = new Date(Date.UTC(2000, month - 1, day));
    if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;

    return month * 100 + day;
  }

  function isInSchedule(today, entry) {
    const start = parseMonthDay(entry.start);
    const end = parseMonthDay(entry.end);
    if (start === null || end === null) return false;

    return start <= end
      ? today >= start && today <= end
      : today >= start || today <= end;
  }

  function resolveTheme() {
    const previewTheme = getPreviewTheme();
    if (previewTheme) return previewTheme;

    if (themeSettings.mode === "off") return normalTheme;

    if (themeSettings.mode === "manual") {
      return supportedThemes.has(themeSettings.selectedTheme)
        ? themeSettings.selectedTheme
        : normalTheme;
    }

    if (themeSettings.mode !== "auto" || !Array.isArray(themeSettings.schedule)) {
      return normalTheme;
    }

    const now = new Date();
    const today = (now.getMonth() + 1) * 100 + now.getDate();
    const activeEntry = themeSettings.schedule.find(entry =>
      entry && supportedThemes.has(entry.theme) && isInSchedule(today, entry)
    );

    return activeEntry?.theme || normalTheme;
  }

  const activeTheme = resolveTheme();
  document.documentElement.dataset.theme = activeTheme;

  const themeColors = {
    classic: "#E3EDF3",
    halloween: "#21152E",
    christmas: "#12382d",
    newyear: "#101b3b"
  };
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) themeColorMeta.content = themeColors[activeTheme] || themeColors.classic;

  function initThemePreviewButton() {
    if (themeSettings.showThemePreviewButton !== true || document.getElementById("devThemePreviewButton")) return;

    const previewCycle = ["config", normalTheme, "halloween", "christmas", "newyear"];
    const themeLabels = {
      classic: "Normale",
      halloween: "Halloween",
      christmas: "Natale",
      newyear: "Capodanno"
    };
    const themeNames = {
      config: `Configurazione (${themeLabels[activeTheme] || themeLabels.classic})`,
      ...themeLabels
    };
    const query = new URLSearchParams(window.location.search);
    const requestedTheme = query.get("previewTheme");
    const currentMode = supportedThemes.has(requestedTheme) ? requestedTheme : "config";
    const button = document.createElement("button");
    button.id = "devThemePreviewButton";
    button.className = "dev-theme-preview-button";
    button.type = "button";
    button.textContent = `Anteprima: ${themeNames[currentMode]}`;
    button.setAttribute("aria-label", `Cambia anteprima tema. Attuale: ${themeNames[currentMode]}`);
    button.title = "Clicca per provare il tema successivo";

    button.addEventListener("click", () => {
      const currentIndex = previewCycle.indexOf(currentMode);
      const nextMode = previewCycle[(currentIndex + 1) % previewCycle.length];
      const nextUrl = new URL(window.location.href);

      if (nextMode === "config") {
        nextUrl.searchParams.delete("previewTheme");
      } else {
        nextUrl.searchParams.set("previewTheme", nextMode);
      }

      window.location.assign(nextUrl.href);
    });

    document.body.appendChild(button);
  }

  function startHalloweenDecorations() {
    if (activeTheme !== "halloween") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function startSkeletonPeeks() {
      const skeletons = [...document.querySelectorAll(".seasonal-skeleton")];
      const animations = new Map();
      const timers = new Map();

      function stopSkeleton(skeleton) {
        window.clearTimeout(timers.get(skeleton));
        timers.delete(skeleton);
        const animation = animations.get(skeleton);
        if (animation) animation.cancel();
        animations.delete(skeleton);
        skeleton.style.opacity = "0";
        skeleton.style.transform = "";
      }

      function schedulePeek(skeleton, delay) {
        timers.set(skeleton, window.setTimeout(() => peek(skeleton), delay));
      }

      function peek(skeleton) {
        if (reducedMotion.matches) return;

        const width = skeleton.getBoundingClientRect().width || 104;
        const height = window.innerHeight;
        const fromLeft = Math.random() < 0.5;
        const direction = fromLeft ? 1 : -1;
        const top = randomBetween(85, Math.max(86, height - 175));
        const baseX = fromLeft ? -width * 0.68 : window.innerWidth - width * 0.32;
        const resting = `translate3d(0, 0, 0) rotate(${direction * -3}deg) scale(0.94)`;
        const waving = `translate3d(${direction * width * 0.34}px, -5px, 0) rotate(${direction * 4}deg) scale(1)`;

        skeleton.style.left = `${baseX}px`;
        skeleton.style.top = `${top}px`;
        skeleton.style.setProperty("--skeleton-facing", fromLeft ? "1" : "-1");
        skeleton.style.opacity = "0";
        skeleton.style.transform = "";

        if (typeof skeleton.animate !== "function") return;

        const animation = skeleton.animate([
          { offset: 0, opacity: 0, transform: resting },
          { offset: 0.12, opacity: 0.9, transform: resting },
          { offset: 0.27, opacity: 1, transform: waving },
          { offset: 0.43, opacity: 1, transform: waving },
          { offset: 0.54, opacity: 0.9, transform: resting },
          { offset: 0.66, opacity: 0, transform: resting },
          { offset: 1, opacity: 0, transform: resting }
        ], {
          duration: randomBetween(3200, 4800),
          easing: "ease-in-out",
          fill: "forwards"
        });
        animations.set(skeleton, animation);
        animation.onfinish = () => {
          animation.cancel();
          animations.delete(skeleton);
          skeleton.style.opacity = "0";
          skeleton.style.transform = "";
          schedulePeek(skeleton, randomBetween(6500, 10500));
        };
      }

      function updateMotionPreference() {
        skeletons.forEach(stopSkeleton);
        if (!reducedMotion.matches) {
          skeletons.forEach((skeleton, index) => schedulePeek(skeleton, (index + 1) * randomBetween(1200, 2600)));
        }
      }

      if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", updateMotionPreference);
      } else if (typeof reducedMotion.addListener === "function") {
        reducedMotion.addListener(updateMotionPreference);
      }

      if (!reducedMotion.matches) {
        skeletons.forEach((skeleton, index) => schedulePeek(skeleton, (index + 1) * randomBetween(1200, 2600)));
      }
    }

    startSkeletonPeeks();

    const ghost = document.querySelector(".seasonal-ghost");
    if (!ghost) return;

    let animation = null;
    let nextFlight = null;

    function stopFlight() {
      window.clearTimeout(nextFlight);
      nextFlight = null;
      if (animation) {
        animation.cancel();
        animation = null;
      }
    }

    function randomPointOnSide(side, width, height, ghostWidth, ghostHeight) {
      switch (side) {
        case "left":
          return { x: -ghostWidth, y: randomBetween(20, Math.max(21, height - ghostHeight - 20)) };
        case "right":
          return { x: width + ghostWidth, y: randomBetween(20, Math.max(21, height - ghostHeight - 20)) };
        case "top":
          return { x: randomBetween(20, Math.max(21, width - ghostWidth - 20)), y: -ghostHeight };
        default:
          return { x: randomBetween(20, Math.max(21, width - ghostWidth - 20)), y: height + ghostHeight };
      }
    }

    function makeSmoothPath(points) {
      const commands = [`M ${points[0].x} ${points[0].y}`];
      for (let index = 0; index < points.length - 1; index += 1) {
        const previous = points[index - 1] || points[index];
        const start = points[index];
        const end = points[index + 1];
        const following = points[index + 2] || end;
        const firstControl = {
          x: start.x + (end.x - previous.x) / 6,
          y: start.y + (end.y - previous.y) / 6
        };
        const secondControl = {
          x: end.x - (following.x - start.x) / 6,
          y: end.y - (following.y - start.y) / 6
        };
        commands.push(`C ${firstControl.x} ${firstControl.y}, ${secondControl.x} ${secondControl.y}, ${end.x} ${end.y}`);
      }
      return commands.join(" ");
    }

    function fly() {
      if (reducedMotion.matches) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const bounds = ghost.getBoundingClientRect();
      const ghostWidth = bounds.width || 144;
      const ghostHeight = bounds.height || 169;
      const sides = ["left", "right", "top", "bottom"];
      const startSide = sides[Math.floor(Math.random() * sides.length)];
      const endSide = { left: "right", right: "left", top: "bottom", bottom: "top" }[startSide];
      const start = randomPointOnSide(startSide, width, height, ghostWidth, ghostHeight);
      const end = randomPointOnSide(endSide, width, height, ghostWidth, ghostHeight);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.hypot(dx, dy) || 1;
      const normalX = -dy / length;
      const normalY = dx / length;
      const minX = 8;
      const maxX = Math.max(minX, width - ghostWidth - 8);
      const minY = 8;
      const maxY = Math.max(minY, height - ghostHeight - 8);
      const zigzag = [0.24, 0.49, 0.74].map((progress, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        const amplitude = randomBetween(42, Math.min(132, Math.max(56, Math.min(width, height) * 0.16)));
        const x = start.x + dx * progress + normalX * amplitude * direction;
        const y = start.y + dy * progress + normalY * amplitude * direction;
        return {
          x: Math.min(maxX, Math.max(minX, x)),
          y: Math.min(maxY, Math.max(minY, y))
        };
      });

      stopFlight();
      ghost.style.left = `${start.x}px`;
      ghost.style.top = `${start.y}px`;
      ghost.style.opacity = "";
      ghost.style.transform = "";
      const points = [start, ...zigzag, end];
      const centerPoints = points.map(point => ({
        x: point.x + ghostWidth / 2,
        y: point.y + ghostHeight / 2
      }));
      const motionPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      motionPath.setAttribute("d", makeSmoothPath(centerPoints));
      let pathLength = 0;
      try {
        pathLength = motionPath.getTotalLength();
      } catch {
        pathLength = 0;
      }
      const duration = randomBetween(400, 10000);

      if (typeof ghost.animate !== "function") {
        ghost.style.left = "12vw";
        ghost.style.top = "25vh";
        ghost.style.opacity = "0.9";
        return;
      }

      if (pathLength > 0 && typeof motionPath.getPointAtLength === "function") {
        const sampleCount = 80;
        const origin = centerPoints[0];
        const keyframes = Array.from({ length: sampleCount + 1 }, (_, index) => {
          const progress = index / sampleCount;
          const point = motionPath.getPointAtLength(pathLength * progress);
          const fadeIn = Math.min(1, progress / 0.055);
          const fadeOut = Math.min(1, (1 - progress) / 0.065);
          const opacity = Math.max(0, Math.min(fadeIn, fadeOut)) * 0.98;
          const bob = Math.sin(progress * Math.PI * 12) * 2.5;
          const rotation = Math.sin(progress * Math.PI * 5) * 4.5;
          const scale = 0.98 + Math.sin(progress * Math.PI * 8) * 0.025;
          return {
            offset: progress,
            opacity,
            transform: `translate3d(${point.x - origin.x}px, ${point.y - origin.y + bob}px, 0) rotate(${rotation}deg) scale(${scale})`
          };
        });

        animation = ghost.animate(keyframes, { duration, easing: "linear", fill: "forwards" });
      } else {
        const keyframes = centerPoints.map((point, index) => {
          const progress = index / (centerPoints.length - 1);
          return {
            offset: progress,
            opacity: progress < 0.06 ? progress / 0.06 : (progress > 0.94 ? (1 - progress) / 0.06 : 0.98),
            transform: `translate3d(${point.x - centerPoints[0].x}px, ${point.y - centerPoints[0].y}px, 0)`
          };
        });
        animation = ghost.animate(keyframes, { duration, easing: "ease-in-out", fill: "forwards" });
      }

      animation.onfinish = () => {
        animation.cancel();
        animation = null;
        ghost.style.opacity = "0";
        ghost.style.transform = "";
        nextFlight = window.setTimeout(fly, randomBetween(1500, 3400));
      };
    }

    function updateMotionPreference() {
      stopFlight();
      if (reducedMotion.matches) {
        ghost.style.left = "";
        ghost.style.top = "";
        ghost.style.opacity = "";
        ghost.style.transform = "";
      } else {
        fly();
      }
    }

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", updateMotionPreference);
    } else if (typeof reducedMotion.addListener === "function") {
      reducedMotion.addListener(updateMotionPreference);
    }

    if (!reducedMotion.matches) fly();
  }

  function startChristmasDecorations() {
    if (activeTheme !== "christmas") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lightColors = ["#f45151", "#ffd166", "#65c8ff", "#7be495"];
    const lightHeights = [11, 39, 64, 79, 83, 75, 61, 47, 35, 27, 24, 28, 40, 57];
    const lightStrands = [...document.querySelectorAll(".seasonal-lights")];

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    lightStrands.forEach(strand => {
      if (strand.childElementCount) return;

      const count = 14;
      for (let index = 0; index < count; index += 1) {
        const light = document.createElement("span");
        const progress = index / (count - 1);
        const x = 5 + progress * 90;
        light.style.left = `${x}%`;
        light.style.top = `${lightHeights[index]}%`;
        light.style.setProperty("--bulb-color", lightColors[index % lightColors.length]);
        light.style.setProperty("--twinkle-delay", `${randomBetween(-2.4, 0)}s`);
        light.style.setProperty("--twinkle-duration", `${randomBetween(1.2, 2.6)}s`);
        strand.append(light);
      }
    });

    const sleigh = document.querySelector(".seasonal-sleigh");
    if (!sleigh) return;

    let animation = null;
    let nextFlight = null;

    function stopFlight() {
      window.clearTimeout(nextFlight);
      nextFlight = null;
      if (animation) {
        animation.cancel();
        animation = null;
      }
    }

    function showStaticSleigh() {
      sleigh.style.left = "12vw";
      sleigh.style.top = "16vh";
      sleigh.style.opacity = "0.88";
      sleigh.style.transform = "";
    }

    function clearSleighPosition() {
      sleigh.style.left = "";
      sleigh.style.top = "";
      sleigh.style.opacity = "";
      sleigh.style.transform = "";
    }

    function fly() {
      if (reducedMotion.matches) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const bounds = sleigh.getBoundingClientRect();
      const sleighWidth = bounds.width || Math.min(480, viewportWidth * 0.72);
      const sleighHeight = bounds.height || 150;
      const direction = Math.random() < 0.5 ? 1 : -1;
      const startX = direction === 1 ? -sleighWidth - 24 : viewportWidth + 24;
      const endX = direction === 1 ? viewportWidth + 24 : -sleighWidth - 24;
      const minY = 18;
      const maxY = Math.max(minY, viewportHeight * 0.62 - sleighHeight);
      const startY = randomBetween(minY, maxY);
      const endY = randomBetween(minY, maxY);
      const firstControl = {
        x: startX + (endX - startX) * 0.32,
        y: Math.min(maxY, Math.max(minY, startY + randomBetween(-100, 100)))
      };
      const secondControl = {
        x: startX + (endX - startX) * 0.68,
        y: Math.min(maxY, Math.max(minY, endY + randomBetween(-100, 100)))
      };

      if (typeof sleigh.animate !== "function") {
        showStaticSleigh();
        return;
      }

      stopFlight();
      const sampleCount = 48;
      const keyframes = Array.from({ length: sampleCount + 1 }, (_, index) => {
        const progress = index / sampleCount;
        const inverse = 1 - progress;
        const x = inverse ** 3 * startX
          + 3 * inverse ** 2 * progress * firstControl.x
          + 3 * inverse * progress ** 2 * secondControl.x
          + progress ** 3 * endX;
        const y = inverse ** 3 * startY
          + 3 * inverse ** 2 * progress * firstControl.y
          + 3 * inverse * progress ** 2 * secondControl.y
          + progress ** 3 * endY;
        const nextProgress = Math.min(1, progress + 0.002);
        const nextInverse = 1 - nextProgress;
        const nextX = nextInverse ** 3 * startX
          + 3 * nextInverse ** 2 * nextProgress * firstControl.x
          + 3 * nextInverse * nextProgress ** 2 * secondControl.x
          + nextProgress ** 3 * endX;
        const nextY = nextInverse ** 3 * startY
          + 3 * nextInverse ** 2 * nextProgress * firstControl.y
          + 3 * nextInverse * nextProgress ** 2 * secondControl.y
          + nextProgress ** 3 * endY;
        const angle = Math.max(-7, Math.min(7, Math.atan2(nextY - y, nextX - x) * 180 / Math.PI));
        const fadeIn = Math.min(1, progress / 0.06);
        const fadeOut = Math.min(1, (1 - progress) / 0.08);

        return {
          offset: progress,
          opacity: Math.max(0, Math.min(fadeIn, fadeOut)) * 0.96,
          transform: `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg) scaleX(${direction})`
        };
      });

      animation = sleigh.animate(keyframes, {
        duration: randomBetween(11500, 16500),
        easing: "linear",
        fill: "forwards"
      });
      animation.onfinish = () => {
        animation.cancel();
        animation = null;
        sleigh.style.opacity = "0";
        sleigh.style.transform = "";
        nextFlight = window.setTimeout(fly, randomBetween(17000, 28000));
      };
    }

    function updateMotionPreference() {
      stopFlight();
      if (reducedMotion.matches) {
        showStaticSleigh();
      } else {
        clearSleighPosition();
        nextFlight = window.setTimeout(fly, randomBetween(1800, 5200));
      }
    }

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", updateMotionPreference);
    } else if (typeof reducedMotion.addListener === "function") {
      reducedMotion.addListener(updateMotionPreference);
    }

    if (reducedMotion.matches) {
      showStaticSleigh();
    } else {
      nextFlight = window.setTimeout(fly, randomBetween(1800, 5200));
    }
  }

  function startNewYearDecorations() {
    if (activeTheme !== "newyear") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const container = document.querySelector(".seasonal-fireworks");
    const colors = ["#ffd166", "#fff3d0", "#75d8ff", "#f77f9b", "#b99aff"];
    if (!container) return;

    const context = container.getContext("2d");
    if (!context) return;

    const tau = Math.PI * 2;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let rockets = [];
    let particles = [];
    let flashes = [];
    let delayedExplosions = [];
    let frameId = null;
    let launchTimer = null;
    let lastFrameTime = 0;
    let idleFrames = 0;

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function pickColor() {
      return colors[Math.floor(Math.random() * colors.length)];
    }

    function drawStaticBurst(x, y, color, scale = 1) {
      context.save();
      context.globalCompositeOperation = "lighter";
      context.globalAlpha = 0.24;
      context.shadowColor = color;
      context.shadowBlur = 26;
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, 10 * scale, 0, tau);
      context.fill();
      context.globalAlpha = 0.76;

      const rayCount = 34;
      for (let index = 0; index < rayCount; index += 1) {
        const angle = tau * index / rayCount;
        const innerRadius = randomBetween(8, 14) * scale;
        const outerRadius = randomBetween(30, 65) * scale;
        const rayColor = index % 4 === 0 ? "#fff8e7" : color;
        context.strokeStyle = rayColor;
        context.lineWidth = randomBetween(1.2, 2.5) * scale;
        context.beginPath();
        context.moveTo(x + Math.cos(angle) * innerRadius, y + Math.sin(angle) * innerRadius);
        context.lineTo(x + Math.cos(angle) * outerRadius, y + Math.sin(angle) * outerRadius);
        context.stroke();
      }
      context.restore();
    }

    function drawStaticScene() {
      context.clearRect(0, 0, width, height);
      drawStaticBurst(width * 0.2, height * 0.25, "#ffd166", 0.9);
      drawStaticBurst(width * 0.52, height * 0.17, "#75d8ff", 1.1);
      drawStaticBurst(width * 0.82, height * 0.3, "#f77f9b", 0.82);
      drawStaticBurst(width * 0.68, height * 0.48, "#b99aff", 0.72);
    }

    function resizeCanvas() {
      width = Math.max(1, container.clientWidth || window.innerWidth);
      height = Math.max(1, container.clientHeight || window.innerHeight);
      // This full-screen decorative layer stays sharp enough at a 1:1 backing store.
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1);
      container.width = Math.round(width * pixelRatio);
      container.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      rockets = [];
      particles = [];
      flashes = [];
      delayedExplosions = [];
      context.clearRect(0, 0, width, height);
      if (reducedMotion.matches) drawStaticScene();
    }

    function explode(x, y, color, scale = 1, secondary = false, pattern = "peony") {
      const accentColor = pickColor();
      flashes.push({
        x,
        y,
        color,
        radius: 48 * scale,
        alpha: secondary ? 0.2 : 0.52
      });

      const mobileScale = width < 540 ? 0.72 : 1;
      const sparkCount = secondary
        ? 8
        : Math.round((pattern === "willow" ? 38 : pattern === "ring" ? 36 : pattern === "chrysanthemum" ? 46 : 34) * mobileScale);
      for (let index = 0; index < sparkCount; index += 1) {
        const angle = tau * index / sparkCount + randomBetween(-0.035, 0.035);
        const speed = secondary
          ? randomBetween(1.5, 3.1) * scale
          : pattern === "ring"
            ? randomBetween(5, 6.4) * scale
            : pattern === "willow"
              ? randomBetween(2.5, 5.8) * scale
              : pattern === "chrysanthemum"
                ? randomBetween(3.5, 7.6) * scale
                : randomBetween(3, 6.8) * scale;
        const colorForSpark = index % 8 === 0 ? "#fff8e7" : index % 4 === 0 ? accentColor : color;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: pattern === "willow" ? 0.075 : 0.043,
          drag: pattern === "willow" ? 0.992 : 0.985,
          alpha: 1,
          decay: pattern === "willow" ? randomBetween(0.009, 0.014) : randomBetween(0.015, 0.023),
          radius: randomBetween(0.8, 1.5) * scale,
          glow: index % 11 === 0,
          color: colorForSpark
        });
      }

      if (!secondary) {
        const splitCount = Math.random() < 0.25 ? 2 : 1;
        for (let index = 0; index < splitCount; index += 1) {
          delayedExplosions.push({
            time: performance.now() + randomBetween(280, 520),
            x: x + randomBetween(-48, 48) * scale,
            y: y + randomBetween(-40, 40) * scale,
            color: index % 2 === 0 ? "#fff3d0" : accentColor,
            scale: scale * randomBetween(0.28, 0.4)
          });
        }
      }

      const particleCap = width < 540 ? 110 : 170;
      if (particles.length > particleCap) particles.splice(0, particles.length - particleCap);
    }

    function requestRender() {
      if (frameId === null && !reducedMotion.matches && !document.hidden) {
        lastFrameTime = 0;
        idleFrames = 0;
        frameId = window.requestAnimationFrame(renderFrame);
      }
    }

    function launchRocket(scale = randomBetween(0.9, 1.18)) {
      const startX = randomBetween(width * 0.12, width * 0.88);
      const targetX = Math.max(width * 0.08, Math.min(width * 0.92, startX + randomBetween(-width * 0.2, width * 0.2)));
      const targetY = randomBetween(height * 0.13, Math.max(height * 0.14, height * 0.5));
      const startY = height + 16;
      const distance = Math.hypot(targetX - startX, targetY - startY);
      const flightFrames = distance / randomBetween(7.5, 10.5);
      const patterns = ["peony", "ring", "willow", "chrysanthemum"];
      rockets.push({
        x: startX,
        y: startY,
        vx: (targetX - startX) / flightFrames,
        vy: (targetY - startY) / flightFrames,
        targetX,
        targetY,
        remaining: flightFrames,
        scale,
        color: pickColor(),
        pattern: patterns[Math.floor(Math.random() * patterns.length)]
      });
      requestRender();
    }

    function drawRocket(rocket) {
      context.save();
      context.globalCompositeOperation = "lighter";
      context.strokeStyle = rocket.color;
      context.fillStyle = "#fff9e8";
      context.lineWidth = 2.5;
      context.lineCap = "round";
      context.shadowColor = rocket.color;
      context.shadowBlur = 16;
      context.beginPath();
      context.moveTo(rocket.x, rocket.y);
      context.lineTo(rocket.x - rocket.vx * 3.4, rocket.y - rocket.vy * 3.4);
      context.stroke();
      context.beginPath();
      context.arc(rocket.x, rocket.y, 2.2, 0, tau);
      context.fill();
      context.restore();
    }

    function drawParticles(delta) {
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.vx *= Math.pow(particle.drag, delta);
        particle.vy = particle.vy * Math.pow(particle.drag, delta) + particle.gravity * delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.alpha -= particle.decay * delta;

        if (particle.alpha <= 0 || particle.y > height + 60) {
          particles.splice(index, 1);
          continue;
        }

        context.globalAlpha = particle.alpha;
        context.fillStyle = particle.color;
        context.shadowColor = particle.color;
        context.shadowBlur = particle.glow ? particle.radius * 1.5 : 0;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, tau);
        context.fill();
      }
      context.globalAlpha = 1;
      context.shadowBlur = 0;
    }

    function drawFlashes(delta) {
      for (let index = flashes.length - 1; index >= 0; index -= 1) {
        const flash = flashes[index];
        flash.alpha -= 0.032 * delta;
        flash.radius += 1.3 * delta;
        if (flash.alpha <= 0) {
          flashes.splice(index, 1);
          continue;
        }

        const gradient = context.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, flash.radius);
        gradient.addColorStop(0, "rgba(255, 250, 231, 0.9)");
        gradient.addColorStop(0.12, flash.color);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        context.globalAlpha = flash.alpha;
        context.fillStyle = gradient;
        context.fillRect(flash.x - flash.radius, flash.y - flash.radius, flash.radius * 2, flash.radius * 2);
      }
      context.globalAlpha = 1;
    }

    function renderFrame(timestamp) {
      frameId = null;
      if (reducedMotion.matches || document.hidden) return;

      if (lastFrameTime && timestamp - lastFrameTime < 1000 / 60) {
        frameId = window.requestAnimationFrame(renderFrame);
        return;
      }

      const delta = lastFrameTime ? Math.min(2.5, (timestamp - lastFrameTime) / 16.67) : 1;
      lastFrameTime = timestamp;
      context.globalCompositeOperation = "destination-out";
      context.globalAlpha = 0.14;
      context.fillStyle = "rgba(0, 0, 0, 1)";
      context.fillRect(0, 0, width, height);
      context.globalAlpha = 1;
      context.globalCompositeOperation = "lighter";

      const now = performance.now();
      for (let index = delayedExplosions.length - 1; index >= 0; index -= 1) {
        const delayed = delayedExplosions[index];
        if (delayed.time <= now) {
          delayedExplosions.splice(index, 1);
          explode(delayed.x, delayed.y, delayed.color, delayed.scale, true, "mini");
        }
      }

      for (let index = rockets.length - 1; index >= 0; index -= 1) {
        const rocket = rockets[index];
        rocket.x += rocket.vx * delta;
        rocket.y += rocket.vy * delta;
        rocket.remaining -= delta;
        if (rocket.remaining <= 0) {
          explode(rocket.targetX, rocket.targetY, rocket.color, rocket.scale, false, rocket.pattern);
          rockets.splice(index, 1);
          continue;
        }
        drawRocket(rocket);
      }

      drawFlashes(delta);
      drawParticles(delta);
      const hasActiveEffects = rockets.length || particles.length || flashes.length || delayedExplosions.length;
      if (hasActiveEffects) {
        idleFrames = 0;
        frameId = window.requestAnimationFrame(renderFrame);
      } else {
        idleFrames += 1;
        if (idleFrames < 8) {
          frameId = window.requestAnimationFrame(renderFrame);
        } else {
          context.clearRect(0, 0, width, height);
          idleFrames = 0;
        }
      }
    }

    function scheduleLaunch(delay = randomBetween(1400, 2000)) {
      if (reducedMotion.matches || document.hidden || launchTimer !== null) return;
      launchTimer = window.setTimeout(() => {
        launchTimer = null;
        if (Math.random() < 0.04) {
          launchRocket(1.55);
          launchRocket(1.22);
          launchRocket(1.22);
        } else {
          launchRocket();
          if (Math.random() < 0.16) launchRocket(0.98);
        }
        scheduleLaunch(randomBetween(2100, 3200));
      }, delay);
    }

    function startAnimation() {
      if (reducedMotion.matches || document.hidden) return;
      scheduleLaunch(500);
    }

    function stopAnimation() {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = null;
      window.clearTimeout(launchTimer);
      launchTimer = null;
      lastFrameTime = 0;
      rockets = [];
      particles = [];
      flashes = [];
      delayedExplosions = [];
      idleFrames = 0;
      context.clearRect(0, 0, width, height);
    }

    function updateMotionPreference() {
      stopAnimation();
      if (reducedMotion.matches) {
        drawStaticScene();
      } else {
        startAnimation();
      }
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAnimation();
      } else if (reducedMotion.matches) {
        drawStaticScene();
      } else {
        startAnimation();
      }
    });

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", updateMotionPreference);
    } else if (typeof reducedMotion.addListener === "function") {
      reducedMotion.addListener(updateMotionPreference);
    }

    updateMotionPreference();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initThemePreviewButton();
      startHalloweenDecorations();
      startChristmasDecorations();
      startNewYearDecorations();
    }, { once: true });
  } else {
    initThemePreviewButton();
    startHalloweenDecorations();
    startChristmasDecorations();
    startNewYearDecorations();
  }
})();
