/* ============================================================
   Fixy — Minijuego "Página en construcción"
   Inspirado en el juego del dinosaurio de Chrome sin conexión:
   mismo espíritu monocromo y minimalista, pero el personaje es
   un cadete de Fixy corriendo con un paquete en brazos. Salta
   obstáculos con la barra espaciadora (o tocando la pantalla),
   sube de nivel de velocidad a medida que avanza y, si llega al
   final del recorrido sin chocar, entrega el pedido con cartel
   y todo. Si choca en el camino, igual "entrega" el paquete como
   cierre simpático de la ronda.

   Este archivo solo se carga en /en-construccion/, así que no
   pesa en ninguna otra página del sitio. Además, el arranque del
   juego se posterga a un momento ocioso del navegador (ver el
   final del archivo) para no competir con el render inicial ni
   siquiera de esta página.
   ============================================================ */
(() => {
  "use strict";

  const canvas = document.getElementById("construction-game-canvas");
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext("2d");
  const liveRegion = document.getElementById("construction-game-status");
  const scoreEl = document.getElementById("construction-game-score");
  const bestEl = document.getElementById("construction-game-best");
  const levelEl = document.getElementById("construction-game-level");
  const promptEl = document.getElementById("construction-game-prompt");
  const HIGH_SCORE_KEY = "fixy_construction_game_highscore";

  const reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  // ---- Estado del mundo (se recalcula en cada resize para que el
  // juego se sienta igual de bien en un teléfono chico y en desktop) ----
  let dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  let W = 0, H = 0, scale = 1, groundY = 0;

  function resize() {
    const cssW = canvas.clientWidth || canvas.parentElement.clientWidth;
    const cssH = canvas.clientHeight || Math.round(cssW / 3);
    W = cssW;
    H = cssH;
    scale = H / 200; // 200 = alto de referencia del diseño
    groundY = H - Math.max(18, 22 * scale);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    runner.x = Math.max(36, Math.round(W * 0.12));
  }

  // ---- Niveles: cada uno define desde qué distancia recorrida rige y a
  // qué velocidad (valores de referencia para scale=1; se escalan al usarse).
  // Al llegar al final del último nivel más el tramo de llegada, el cadete
  // entrega el pedido en destino. ----
  const LEVELS = [
    { atDistance: 0, speed: 230 },
    { atDistance: 1100, speed: 300 },
    { atDistance: 2300, speed: 380 },
    { atDistance: 3600, speed: 460 },
    { atDistance: 5000, speed: 540 },
  ];
  const FINISH_DISTANCE = 6400; // distancia total del recorrido hasta destino
  const SPAWN_STOP_BUFFER = 900; // deja el tramo final libre de obstáculos
  const GRAVITY = 2400; // px/s^2 (a escala de referencia)
  const JUMP_VELOCITY = -800; // px/s (a escala de referencia)

  function levelInfoForDistance(d) {
    let idx = 0;
    for (let i = 0; i < LEVELS.length; i++) {
      if (d >= LEVELS[i].atDistance) idx = i;
    }
    return { speed: LEVELS[idx].speed, number: idx + 1 };
  }

  const runner = {
    x: 0,
    y: 0,
    vy: 0,
    onGround: true,
    legFrame: 0,
    legTimer: 0,
    crashed: false,
  };

  let state = "idle"; // idle | running | gameover | victory
  let distance = 0;
  let speed = LEVELS[0].speed;
  let level = 1;
  let levelUpTimer = 0;
  let obstacles = [];
  let nextSpawnAt = 0;
  let lastTime = 0;
  let endingTimer = 0;
  let restartLockUntil = 0;
  let dust = [];

  function bestScore() {
    try {
      return Number(localStorage.getItem(HIGH_SCORE_KEY) || "0");
    } catch (e) {
      return 0;
    }
  }
  function saveBestScore(v) {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(v));
    } catch (e) {
      /* Almacenamiento no disponible: seguimos sin puntaje máximo persistente. */
    }
  }
  function announce(text) {
    if (liveRegion) liveRegion.textContent = text;
  }
  function pad(n) {
    return String(Math.max(0, Math.floor(n))).padStart(5, "0");
  }
  function updateHud() {
    if (scoreEl) scoreEl.textContent = pad(distance / 10);
    if (bestEl) bestEl.textContent = pad(bestScore());
    if (levelEl) levelEl.textContent = level + "/" + LEVELS.length;
  }

  function resetRun() {
    distance = 0;
    speed = LEVELS[0].speed;
    level = 1;
    levelUpTimer = 0;
    obstacles = [];
    dust = [];
    nextSpawnAt = 900;
    runner.y = 0;
    runner.vy = 0;
    runner.onGround = true;
    runner.crashed = false;
    endingTimer = 0;
    updateHud();
  }

  function startRun() {
    resetRun();
    state = "running";
    if (promptEl) promptEl.hidden = true;
    announce("Juego iniciado. Saltá los obstáculos con espacio o tocando la pantalla.");
  }

  function jump() {
    if (state !== "running") return;
    if (runner.onGround) {
      // Escalado por `scale` para que el arco del salto guarde siempre la
      // misma proporción con el suelo y los obstáculos, sin importar si el
      // canvas es angosto (celular) o ancho (desktop).
      runner.vy = JUMP_VELOCITY * scale;
      runner.onGround = false;
      if (navigator.vibrate) navigator.vibrate(12);
    }
  }

  function endRun() {
    state = "gameover";
    runner.crashed = true;
    runner.y = 0;
    runner.vy = 0;
    runner.onGround = true;
    endingTimer = 0;
    restartLockUntil = performance.now() + 700;
    const finalScore = Math.floor(distance / 10);
    const best = bestScore();
    if (finalScore > best) saveBestScore(finalScore);
    updateHud();
    if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
    if (promptEl) {
      promptEl.hidden = false;
      promptEl.textContent = "Presioná espacio o tocá la pantalla para reintentar";
    }
    announce(
      "Chocaste, pero el paquete igualmente llegó a destino. Puntaje " +
        pad(finalScore) +
        ". Presioná espacio para reintentar."
    );
  }

  function winRun() {
    state = "victory";
    runner.crashed = false;
    runner.y = 0;
    runner.vy = 0;
    runner.onGround = true;
    endingTimer = 0;
    restartLockUntil = performance.now() + 900;
    const finalScore = Math.floor(distance / 10);
    const best = bestScore();
    if (finalScore > best) saveBestScore(finalScore);
    updateHud();
    if (navigator.vibrate) navigator.vibrate([15, 30, 15, 30, 60]);
    if (promptEl) {
      promptEl.hidden = false;
      promptEl.textContent = "Presioná espacio o tocá la pantalla para jugar de nuevo";
    }
    announce(
      "¡Pedido entregado! Completaste el recorrido. Puntaje " +
        pad(finalScore) +
        ". Presioná espacio para jugar de nuevo."
    );
  }

  function handleAction() {
    if (state === "idle") {
      startRun();
    } else if (state === "running") {
      jump();
    } else if (state === "gameover" || state === "victory") {
      if (performance.now() < restartLockUntil) return;
      startRun();
    }
  }

  // ---- Generación de obstáculos: siempre saltables a la velocidad actual ----
  const OBSTACLE_TYPES = [
    { w: 30, h: 30, kind: "crate" },
    { w: 30, h: 48, kind: "crate" },
    { w: 30, h: 66, kind: "crate" },
    { w: 46, h: 26, kind: "crate-wide" },
    { w: 20, h: 36, kind: "cone" },
  ];

  function spawnObstacle() {
    const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    obstacles.push({
      x: W + 20,
      w: type.w * scale,
      h: type.h * scale,
      kind: type.kind,
    });
    // El hueco mínimo entre obstáculos depende de la velocidad actual para
    // que el salto siempre alcance a esquivarlo (más rápido = más espacio).
    const minGapSeconds = 0.85;
    const maxGapSeconds = 1.55;
    const gapSeconds = minGapSeconds + Math.random() * (maxGapSeconds - minGapSeconds);
    nextSpawnAt = distance + speed * gapSeconds;
  }

  function update(dt) {
    // Nivel y velocidad: definidos por tabla, no por una rampa continua, para
    // que subir de nivel se sienta como un escalón real (con su aviso en
    // pantalla) y no como una aceleración invisible.
    const info = levelInfoForDistance(distance);
    if (info.number !== level) {
      level = info.number;
      levelUpTimer = 1.1;
      if (navigator.vibrate) navigator.vibrate(10);
    }
    if (levelUpTimer > 0) levelUpTimer = Math.max(0, levelUpTimer - dt);
    speed = info.speed * scale;
    distance += speed * dt;

    // Física del salto
    runner.vy += GRAVITY * scale * dt;
    runner.y += runner.vy * dt;
    if (runner.y >= 0) {
      runner.y = 0;
      runner.vy = 0;
      runner.onGround = true;
    }

    // Animación de piernas (solo si está corriendo por el piso)
    if (runner.onGround) {
      runner.legTimer += dt;
      const step = Math.max(0.09, 0.16 - speed / 6000);
      if (runner.legTimer >= step) {
        runner.legTimer = 0;
        runner.legFrame = runner.legFrame === 0 ? 1 : 0;
      }
    }

    // Polvo del piso (se omite con reduced-motion para no sumar ruido visual)
    if (!reduceMotion && runner.onGround && Math.random() < 0.35) {
      dust.push({ x: runner.x - 4 * scale, y: 4, life: 0.35 });
    }
    dust.forEach((d) => {
      d.x -= speed * dt;
      d.life -= dt;
    });
    dust = dust.filter((d) => d.life > 0);

    // Obstáculos: dejamos de generar nuevos cerca del final para que el
    // tramo de llegada quede despejado antes del cartel de entrega.
    if (distance >= nextSpawnAt && distance < FINISH_DISTANCE - SPAWN_STOP_BUFFER) {
      spawnObstacle();
    }
    obstacles.forEach((o) => (o.x -= speed * dt));
    obstacles = obstacles.filter((o) => o.x + o.w > -10);

    // Colisión (hitbox algo más chica que el dibujo, para que se sienta justo)
    const rW = 30 * scale, rH = 46 * scale;
    const rX = runner.x + 6 * scale;
    const rY = groundY - rH + runner.y;
    for (const o of obstacles) {
      const oX = o.x + 3 * scale;
      const oW = o.w - 6 * scale;
      const oY = groundY - o.h;
      const overlapX = rX < oX + oW && rX + rW - 12 * scale > oX;
      const overlapY = rY < oY + o.h && rY + rH > oY;
      if (overlapX && overlapY) {
        endRun();
        return;
      }
    }

    // Meta: llegaste al final del recorrido sin chocar.
    if (distance >= FINISH_DISTANCE && obstacles.length === 0) {
      winRun();
      return;
    }

    updateHud();
  }

  // ---- Dibujo ----
  function drawGround() {
    ctx.strokeStyle = "#535353";
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    ctx.fillStyle = "#c9c9c9";
    const dashW = 16 * scale, gap = 22 * scale;
    const period = dashW + gap;
    const offset = distance % period;
    for (let x = -offset; x < W; x += period) {
      ctx.fillRect(x, groundY + 4 * scale, dashW, Math.max(1, 2 * scale));
    }

    ctx.fillStyle = "#dadada";
    dust.forEach((d) => {
      ctx.fillRect(d.x, groundY - d.y * scale, 3 * scale, 3 * scale);
    });
  }

  function drawObstacle(o) {
    const x = o.x, w = o.w, h = o.h, y = groundY - h;
    ctx.fillStyle = "#3a3a3a";
    if (o.kind === "cone") {
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f3f3f2";
      ctx.fillRect(x + w * 0.18, y + h * 0.55, w * 0.64, Math.max(1, 2 * scale));
    } else {
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#f3f3f2";
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5, y);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.moveTo(x, y + h * 0.5);
      ctx.lineTo(x + w, y + h * 0.5);
      ctx.stroke();
    }
  }

  // Cadete corriendo con una caja: se compone de cabeza + torso + caja fija
  // en brazos, y piernas que alternan (mismo recurso que usa el dino de
  // Chrome para simular la carrera con dos cuadros). `runner.crashed` es lo
  // único que cambia la pose (tropezón gris) — en victoria sigue de pie,
  // con el paquete en brazos, como corresponde a una llegada exitosa.
  function drawRunner() {
    const bodyX = runner.x;
    const baseY = groundY + runner.y;
    ctx.fillStyle = runner.crashed ? "#8a8a8a" : "#535353";

    // Cabeza
    ctx.fillRect(bodyX + 6 * scale, baseY - 46 * scale, 12 * scale, 11 * scale);
    // Torso
    ctx.fillRect(bodyX + 4 * scale, baseY - 35 * scale, 16 * scale, 18 * scale);

    if (!runner.crashed) {
      // Brazo
      ctx.fillRect(bodyX + 18 * scale, baseY - 30 * scale, 8 * scale, 5 * scale);
      // Caja en brazos
      ctx.fillRect(bodyX + 22 * scale, baseY - 32 * scale, 13 * scale, 13 * scale);
      ctx.strokeStyle = "#f3f3f2";
      ctx.lineWidth = Math.max(1, 1.3 * scale);
      ctx.strokeRect(bodyX + 22 * scale, baseY - 32 * scale, 13 * scale, 13 * scale);
    }

    // Piernas
    if (runner.onGround && !runner.crashed) {
      if (runner.legFrame === 0) {
        ctx.fillRect(bodyX + 4 * scale, baseY - 17 * scale, 6 * scale, 17 * scale);
        ctx.fillRect(bodyX + 13 * scale, baseY - 12 * scale, 6 * scale, 12 * scale);
      } else {
        ctx.fillRect(bodyX + 4 * scale, baseY - 12 * scale, 6 * scale, 12 * scale);
        ctx.fillRect(bodyX + 13 * scale, baseY - 17 * scale, 6 * scale, 17 * scale);
      }
    } else if (!runner.crashed) {
      // En el aire: las dos piernas se recogen levemente, como el salto del dino
      ctx.fillRect(bodyX + 4 * scale, baseY - 14 * scale, 6 * scale, 14 * scale);
      ctx.fillRect(bodyX + 13 * scale, baseY - 14 * scale, 6 * scale, 14 * scale);
    } else {
      // Chocado: piernas dobladas, tropezón
      ctx.fillRect(bodyX + 2 * scale, baseY - 10 * scale, 8 * scale, 10 * scale);
      ctx.fillRect(bodyX + 15 * scale, baseY - 8 * scale, 8 * scale, 8 * scale);
    }
  }

  // Cierre de la ronda: la caja se desliza hacia una puerta y queda
  // entregada, con un cartel de texto. Se usa tanto si chocaste en el
  // camino (versión modesta, "igual llegó") como si completaste el
  // recorrido entero sin chocar (versión de victoria, cartel grande de
  // "pedido entregado").
  function drawEnding() {
    const isVictory = state === "victory";
    const t = Math.min(1, endingTimer / 0.6);
    const startX = runner.x + 30 * scale;
    const doorX = runner.x + (isVictory ? 92 : 78) * scale;
    const boxX = startX + (doorX - startX) * easeOutCubic(t);
    const boxY = groundY - 13 * scale - Math.sin(t * Math.PI) * 10 * scale;

    // Puerta / fachada de destino
    const doorH = (isVictory ? 54 : 40) * scale;
    ctx.fillStyle = "#c9c9c9";
    ctx.fillRect(doorX - 4 * scale, groundY - 4 * scale, (isVictory ? 44 : 34) * scale, 4 * scale);
    ctx.fillStyle = "#8a8a8a";
    ctx.fillRect(doorX + 6 * scale, groundY - doorH, 4 * scale, doorH - 4 * scale);
    ctx.fillRect(doorX + 6 * scale, groundY - doorH, (isVictory ? 28 : 22) * scale, 4 * scale);
    if (isVictory) {
      ctx.fillRect(doorX + 30 * scale, groundY - doorH, 4 * scale, doorH - 4 * scale);
    }

    // Caja en movimiento
    ctx.fillStyle = "#535353";
    ctx.fillRect(boxX, boxY, 13 * scale, 13 * scale);
    ctx.strokeStyle = "#f3f3f2";
    ctx.lineWidth = Math.max(1, 1.3 * scale);
    ctx.strokeRect(boxX, boxY, 13 * scale, 13 * scale);

    // Cartel con el mensaje, una vez que la caja llegó a destino
    if (t >= 1) {
      const label = isVictory ? "PEDIDO ENTREGADO" : "¡Igual entregado!";
      ctx.font = `${isVictory ? "700 " : ""}${Math.max(10, (isVictory ? 14 : 12) * scale)}px "SFMono-Regular",Consolas,monospace`;
      const metrics = ctx.measureText(label);
      const padX = 10 * scale, padY = 8 * scale;
      const signW = metrics.width + padX * 2;
      const signH = (isVictory ? 14 : 12) * scale + padY * 2;
      const signX = doorX + 12 * scale - signW / 2;
      const signY = groundY - doorH - signH - 10 * scale;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(signX, signY, signW, signH);
      ctx.strokeStyle = "#535353";
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.strokeRect(signX, signY, signW, signH);
      ctx.fillStyle = "#535353";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, signX + signW / 2, signY + signH / 2 + 1);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function drawIdleHint() {
    ctx.fillStyle = "#9a9a9a";
    ctx.font = `${Math.max(10, 12 * scale)}px "SFMono-Regular",Consolas,monospace`;
    ctx.fillText("ESPACIO / TOCÁ PARA EMPEZAR", runner.x + 40 * scale, groundY - 55 * scale);
  }

  function drawLevelUp() {
    if (levelUpTimer <= 0) return;
    const t = levelUpTimer / 1.1;
    ctx.globalAlpha = Math.min(1, t * 2);
    ctx.fillStyle = "#535353";
    ctx.font = `700 ${Math.max(12, 15 * scale)}px "SFMono-Regular",Consolas,monospace`;
    ctx.textAlign = "center";
    ctx.fillText("¡NIVEL " + level + "!", W / 2, 26 * scale);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    drawGround();
    obstacles.forEach(drawObstacle);
    drawRunner();
    if (state === "gameover" || state === "victory") drawEnding();
    if (state === "idle") drawIdleHint();
    if (state === "running" && !reduceMotion) drawLevelUp();
  }

  function loop(time) {
    if (!lastTime) lastTime = time;
    let dt = (time - lastTime) / 1000;
    lastTime = time;
    dt = Math.min(dt, 0.05); // evita saltos grandes si la pestaña estuvo en pausa

    if (state === "running") {
      update(dt);
    } else if (state === "gameover" || state === "victory") {
      endingTimer += dt;
    }

    render();
    requestAnimationFrame(loop);
  }

  // ---- Entradas ----
  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space" && e.code !== "ArrowUp") return;
    // Si el foco está en un link, botón u otro control (ej. "Volver al
    // inicio" o el menú), dejamos que la tecla haga lo suyo ahí en vez de
    // interceptarla para el juego.
    const active = document.activeElement;
    const isInteractiveElsewhere =
      active && active !== document.body && active !== canvas &&
      /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(active.tagName);
    if (isInteractiveElsewhere) return;
    e.preventDefault();
    handleAction();
  });
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    handleAction();
  });

  window.addEventListener("resize", resize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resize);
  }

  // El arranque se posterga a un momento ocioso del navegador: así el
  // juego nunca compite con la primera pintura de la página (texto,
  // header, botón "Volver al inicio"), aunque esté todo en esta misma
  // página aislada.
  function boot() {
    resize();
    resetRun();
    updateHud();
    requestAnimationFrame(loop);
  }
  if ("requestIdleCallback" in window) {
    requestIdleCallback(boot, { timeout: 1200 });
  } else {
    setTimeout(boot, 0);
  }
})();
