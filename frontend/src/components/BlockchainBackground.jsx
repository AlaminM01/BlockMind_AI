import React, { useEffect, useRef } from 'react';

const BlockchainBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse tracking for interactive repulsion/attraction
    const mouse = { x: null, y: null, radius: 150 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Node count proportional to screen size
    const nodeCount = Math.min(65, Math.floor((width * height) / 22000));
    const nodes = [];

    const colors = [
      { r: 0, g: 229, b: 255 }, // #00E5FF Cyan
      { r: 123, g: 97, b: 255 }, // #7B61FF Purple
      { r: 0, g: 255, b: 178 }   // #00FFB2 Mint/Green
    ];

    // Initialize blockchain nodes
    for (let i = 0; i < nodeCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        radius: Math.random() * 2.5 + 2,
        baseRadius: Math.random() * 2.5 + 2,
        color: color,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.03 + Math.random() * 0.02,
        isBlock: Math.random() > 0.7,
        hash: '0x' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
      });
    }

    const maxDistance = 140;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Move
        node.x += node.vx;
        node.y += node.vy;

        // Bounce on borders
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Mouse interaction
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            node.x -= (dx / dist) * force * 3;
            node.y -= (dy / dist) * force * 3;
          }
        }

        // Pulse
        node.pulse += node.pulseSpeed;
        const currentRadius = node.baseRadius + Math.sin(node.pulse) * 1;

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.35;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            
            // Gradient connection
            const grad = ctx.createLinearGradient(node.x, node.y, other.x, other.y);
            grad.addColorStop(0, `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, ${alpha})`);
            grad.addColorStop(1, `rgba(${other.color.r}, ${other.color.g}, ${other.color.b}, ${alpha})`);
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Draw Node or Block
        if (node.isBlock) {
          // Draw small cryptographic block
          const size = currentRadius * 3;
          ctx.save();
          ctx.translate(node.x, node.y);
          ctx.rotate(node.pulse * 0.2);
          
          ctx.fillStyle = `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, 0.25)`;
          ctx.strokeStyle = `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, 0.8)`;
          ctx.lineWidth = 1.5;
          ctx.fillRect(-size / 2, -size / 2, size, size);
          ctx.strokeRect(-size / 2, -size / 2, size, size);
          ctx.restore();
        } else {
          // Circular synaptic node with glow
          ctx.beginPath();
          ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, 0.9)`;
          ctx.shadowColor = `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, 0.8)`;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-45 dark:opacity-40"
    />
  );
};

export default BlockchainBackground;
