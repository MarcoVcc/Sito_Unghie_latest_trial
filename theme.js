(() => {
  const normalTheme = "classic";
  const supportedThemes = new Set([normalTheme, "halloween"]);
  const themeSettings = window.SITE_CONFIG?.theme || {};

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
    halloween: "#21152E"
  };
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) themeColorMeta.content = themeColors[activeTheme] || themeColors.classic;

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startHalloweenDecorations, { once: true });
  } else {
    startHalloweenDecorations();
  }
})();
