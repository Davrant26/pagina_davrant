
      const nav = document.getElementById('pageNav');
      const links = document.querySelector('.links');
      const burger = document.querySelector('.burger');
      burger.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      });
      document.querySelectorAll('.links .link').forEach((link) => {
        link.addEventListener('click', () => links.classList.remove('open'));
      });
      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 24);
      }, { passive: true });

      const canvas = document.getElementById('networkCanvas');
      const ctx = canvas.getContext('2d');
      const NODE_COUNT = 55;
      const MAX_DIST = 160;
      const NODE_COLOR = '0, 229, 255';
      const ACCENT_COLOR = '124, 92, 255';
      let nodes = [];
      const packets = [];
      let frameCount = 0;
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      function initNodes(w, h) {
        return Array.from({ length: NODE_COUNT }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.5 + 1,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.008 + Math.random() * 0.012,
        }));
      }

      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        nodes = initNodes(canvas.width, canvas.height);
      }

      function spawnPacket(activeEdges) {
        if (!activeEdges.length) return;
        const [fi, ti] = activeEdges[Math.floor(Math.random() * activeEdges.length)];
        packets.push({ fromIdx: fi, toIdx: ti, t: 0, speed: 0.012 + Math.random() * 0.018, color: Math.random() < 0.25 ? ACCENT_COLOR : NODE_COLOR });
      }

      function drawFrame() {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        frameCount++;

        nodes.forEach((n) => {
          n.x += n.vx;
          n.y += n.vy;
          n.pulse += n.pulseSpeed;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        });

        const activeEdges = [];
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > MAX_DIST) continue;
            activeEdges.push([i, j]);
            const proximity = 1 - dist / MAX_DIST;
            const isAccent = (i + j) % 7 === 0;
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            if (isAccent) {
              grad.addColorStop(0, `rgba(${NODE_COLOR}, ${proximity * 0.7})`);
              grad.addColorStop(1, `rgba(${ACCENT_COLOR}, ${proximity * 0.7})`);
            } else {
              grad.addColorStop(0, `rgba(${NODE_COLOR}, ${proximity * 0.55})`);
              grad.addColorStop(0.5, `rgba(${NODE_COLOR}, ${proximity * 0.8})`);
              grad.addColorStop(1, `rgba(${NODE_COLOR}, ${proximity * 0.55})`);
            }
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.8 + proximity * 0.7;
            ctx.shadowBlur = proximity > 0.6 ? 4 : 0;
            ctx.shadowColor = `rgba(${isAccent ? ACCENT_COLOR : NODE_COLOR}, 0.4)`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }

        if (frameCount % 38 === 0) spawnPacket(activeEdges);

        for (let k = packets.length - 1; k >= 0; k--) {
          const p = packets[k];
          const from = nodes[p.fromIdx];
          const to = nodes[p.toIdx];
          if (!from || !to) { packets.splice(k, 1); continue; }
          p.t += p.speed;
          if (p.t >= 1) { packets.splice(k, 1); continue; }
          const px = from.x + (to.x - from.x) * p.t;
          const py = from.y + (to.y - from.y) * p.t;
          const trailLen = 0.12;
          const t0 = Math.max(0, p.t - trailLen);
          const tx = from.x + (to.x - from.x) * t0;
          const ty = from.y + (to.y - from.y) * t0;
          const trail = ctx.createLinearGradient(tx, ty, px, py);
          trail.addColorStop(0, `rgba(${p.color}, 0)`);
          trail.addColorStop(1, `rgba(${p.color}, 0.9)`);
          ctx.strokeStyle = trail;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(${p.color}, 0.8)`;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(${p.color}, 1)`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${p.color}, 1)`;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        nodes.forEach((n) => {
          const glow = 0.5 + Math.sin(n.pulse) * 0.5;
          const r = n.radius + glow * 0.8;
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 5);
          grad.addColorStop(0, `rgba(${NODE_COLOR}, ${0.2 * glow})`);
          grad.addColorStop(1, `rgba(${NODE_COLOR}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 6 * glow;
          ctx.shadowColor = `rgba(${NODE_COLOR}, 0.8)`;
          ctx.fillStyle = `rgba(${NODE_COLOR}, ${0.55 + glow * 0.45})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        requestAnimationFrame(drawFrame);
      }

      function startAnimation() {
        if (!ctx || motionQuery.matches) return;
        resizeCanvas();
        drawFrame();
        window.addEventListener('resize', resizeCanvas, { passive: true });
      }

      startAnimation();