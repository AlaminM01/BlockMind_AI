import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Sparkles,
  BookOpen,
  Send,
  Info,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getKnowledgeGraph } from '../../services/api';

const KnowledgeGraphView = () => {
  const { setActiveTab, setPendingQuery } = useApp();
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], categories: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Position nodes nicely on circular or force layout
  const [nodePositions, setNodePositions] = useState([]);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const data = await getKnowledgeGraph();
        setGraphData(data);
        if (data.nodes && data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      } catch (err) {
        console.error('Failed to load knowledge graph:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  // Initialize node layout positions
  useEffect(() => {
    if (!graphData.nodes || graphData.nodes.length === 0) return;

    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 180;

    const positions = graphData.nodes.map((node, i) => {
      const angle = (i / graphData.nodes.length) * 2 * Math.PI;
      // Add minor jitter for organic network feel
      const dist = radius + (i % 2 === 0 ? 30 : -20);
      return {
        ...node,
        x: centerX + dist * Math.cos(angle),
        y: centerY + dist * Math.sin(angle),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      };
    });

    setNodePositions(positions);
  }, [graphData]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodePositions.length === 0) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Edges
      graphData.edges.forEach((edge) => {
        const sourceNode = nodePositions.find((n) => n.id === edge.source);
        const targetNode = nodePositions.find((n) => n.id === edge.target);

        if (sourceNode && targetNode) {
          const isHighlighted =
            selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

          ctx.beginPath();
          ctx.moveTo(sourceNode.x * zoom, sourceNode.y * zoom);
          ctx.lineTo(targetNode.x * zoom, targetNode.y * zoom);
          ctx.strokeStyle = isHighlighted ? 'rgba(0, 229, 255, 0.7)' : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = isHighlighted ? 2 : 1;
          ctx.stroke();

          // Draw edge label if highlighted
          if (isHighlighted && edge.label) {
            const midX = ((sourceNode.x + targetNode.x) / 2) * zoom;
            const midY = ((sourceNode.y + targetNode.y) / 2) * zoom;
            ctx.fillStyle = '#00E5FF';
            ctx.font = '10px monospace';
            ctx.fillText(edge.label, midX + 4, midY - 4);
          }
        }
      });

      // Draw Nodes
      nodePositions.forEach((node) => {
        const isSelected = selectedNode && selectedNode.id === node.id;
        const matchesCategory = activeCategory === 'ALL' || node.category === activeCategory;
        const radius = (node.size || 24) * (isSelected ? 1.3 : 1) * 0.6 * zoom;

        // Glow ring if selected
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x * zoom, node.y * zoom, radius + 8, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
          ctx.fill();
        }

        // Main node circle
        ctx.beginPath();
        ctx.arc(node.x * zoom, node.y * zoom, radius, 0, 2 * Math.PI);
        ctx.fillStyle = matchesCategory ? node.color || '#00E5FF' : '#334155';
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.4)';
        ctx.stroke();

        // Node Label
        ctx.fillStyle = matchesCategory ? '#FFFFFF' : '#64748B';
        ctx.font = `${isSelected ? 'bold 12px' : '10px'} sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x * zoom, node.y * zoom + radius + 14);
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [nodePositions, selectedNode, activeCategory, zoom, graphData]);

  // Handle canvas click to select node
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    const clicked = nodePositions.find((n) => {
      const dist = Math.hypot(n.x - clickX, n.y - clickY);
      return dist <= (n.size || 24);
    });

    if (clicked) {
      setSelectedNode(clicked);
    }
  };

  const handleAskAI = (node) => {
    if (!node) return;
    const query = `Explain the concept of ${node.label} in blockchain architecture, its core mechanics, and how it is detailed in the book "${node.book}".`;
    if (setPendingQuery) {
      setPendingQuery(query);
    }
    setActiveTab('chat');
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-950/40">
      {/* Main Canvas View */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Blockchain Concept Knowledge Map
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Interactive Network
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cross-book entity map linking concepts across all 5 indexed books. Click any node to explore.
              </p>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-slate-400 font-semibold mr-1">Domain:</span>
          {['ALL', 'L1', 'Consensus', 'Architecture', 'Cryptography', 'DeFi', 'Scaling', 'Security'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                    : 'bg-slate-900/60 text-slate-400 border border-white/5 hover:text-white'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>

        {/* Interactive Canvas */}
        <div className="flex-1 relative rounded-2xl bg-slate-900/60 border border-cyan-500/20 overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={850}
            height={550}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-pointer"
          />
        </div>
      </div>

      {/* Right Details Panel */}
      <div className="w-full lg:w-96 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-white/10 bg-slate-900/70 backdrop-blur-md flex flex-col justify-between overflow-y-auto">
        {selectedNode ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedNode.color || '#00E5FF' }}
              />
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                  {selectedNode.category}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedNode.label}</h3>
              </div>
            </div>

            {/* Description */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>Concept Overview</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.desc}</p>
            </div>

            {/* Source Book Reference */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Primary Book Source</span>
              </div>
              <p className="text-xs text-slate-200 font-medium">{selectedNode.book}</p>
            </div>

            {/* Connected Concepts */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-semibold">Connected Network Nodes:</span>
              <div className="flex flex-wrap gap-1.5">
                {graphData.edges
                  ?.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                  .map((e, idx) => {
                    const otherId = e.source === selectedNode.id ? e.target : e.source;
                    const otherNode = graphData.nodes?.find((n) => n.id === otherId);
                    if (!otherNode) return null;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedNode(otherNode)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10 hover:border-cyan-500/40 text-[11px] text-slate-300 transition-colors flex items-center gap-1"
                      >
                        <span>{otherNode.label}</span>
                        <span className="text-[9px] text-cyan-400">({e.label})</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Ask AI Button */}
            <button
              onClick={() => handleAskAI(selectedNode)}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold shadow-glow-cyan flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask BlockMind AI about {selectedNode.label}</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            Select any node on the graph to inspect relationships and ask questions.
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraphView;
