import React, { useEffect, useRef, useContext, useMemo } from 'react';
import * as d3 from 'd3';
import { AnalysisContext } from '../context/AnalysisContext';

// Helper to generate a realistic looking mock network for the Hackathon demo
const generateMockData = () => {
  const nodes = Array.from({ length: 40 }, (_, i) => {
    const riskScore = Math.floor(Math.random() * 100);
    return {
      id: `ACC_${String(i).padStart(3, '0')}`,
      riskScore: riskScore,
      isShell: Math.random() > 0.8,
      patterns: riskScore > 80 ? ['Structuring (Smurfing)', 'High Velocity Transfers'] : 
                riskScore > 50 ? ['High Velocity Transfers'] : [],
      ringId: (i % 10 === 0 && riskScore > 70) ? `RING_${String(Math.floor(i / 10)).padStart(3, '0')}` : null
    };
  });
  
  const links = Array.from({ length: 60 }, () => {
    const sourceIdx = Math.floor(Math.random() * 40);
    let targetIdx = Math.floor(Math.random() * 40);
    // Avoid self-loops
    while (targetIdx === sourceIdx) {
      targetIdx = Math.floor(Math.random() * 40);
    }
    return {
      source: `ACC_${String(sourceIdx).padStart(3, '0')}`,
      target: `ACC_${String(targetIdx).padStart(3, '0')}`,
      value: Math.floor(Math.random() * 10) + 1,
    };
  });

  return { nodes, links };
};

export default function GraphVisualization() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const zoomRef = useRef(null);
  const { state, dispatch } = useContext(AnalysisContext);
  
  // Use real results if available, otherwise use mock data
  const data = useMemo(() => {
    if (state.results?.graph_data) {
      // Transform backend data to D3 format
      const nodes = state.results.graph_data.nodes.map(nodeId => {
        const suspiciousAccount = state.results.suspicious_accounts?.find(acc => acc.account_id === nodeId);
        return {
          id: nodeId,
          riskScore: suspiciousAccount?.suspicion_score || 0,
          isShell: suspiciousAccount?.detected_patterns?.includes('shell') || false,
          patterns: suspiciousAccount?.detected_patterns || [],
          ringId: suspiciousAccount?.ring_id || null
        };
      });

      const links = state.results.graph_data.edges.map(edge => ({
        source: edge.sender_id,
        target: edge.receiver_id,
        value: edge.amount / 1000, // Scale down for visualization
        transactionId: edge.transaction_id
      }));

      return { nodes, links };
    }
    return generateMockData();
  }, [state.results]);

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Filter nodes based on the Risk Threshold slider
    const filteredNodes = data.nodes.filter(n => n.riskScore >= state.threshold || n.riskScore < 20); // Keep very safe nodes and nodes above threshold
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = data.links.filter(l => nodeIds.has(l.source.id || l.source) && nodeIds.has(l.target.id || l.target));

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    // Add Glow Filter for high-risk nodes
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Add arrow marker for directed edges
    defs.append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#6B7280");

    // Add arrow markers for each ring color
    const ringColors = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#F97316'];
    ringColors.forEach((color, idx) => {
      defs.append("marker")
        .attr("id", `arrowhead-ring-${idx}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", color);
    });

    // Container for zooming/panning
    const g = svg.append("g");

    // Setup Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);
    zoomRef.current = zoom;

    // Force Simulation Physics
    const simulation = d3.forceSimulation(filteredNodes)
      .force("link", d3.forceLink(filteredLinks).id(d => d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => (d.riskScore > 80 ? 12 : 8) + 2));

    // Draw Links (Transactions) with arrows
    const link = g.append("g")
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke", d => {
        // Check if both nodes are in a ring
        const sourceNode = filteredNodes.find(n => (n.id === d.source.id || n.id === d.source));
        const targetNode = filteredNodes.find(n => (n.id === d.target.id || n.id === d.target));
        if (sourceNode?.ringId && targetNode?.ringId && sourceNode.ringId === targetNode.ringId) {
          // Color by ring
          const ringColors = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#F97316'];
          const ringIndex = parseInt(sourceNode.ringId.replace(/\D/g, '')) || 0;
          return ringColors[ringIndex % ringColors.length];
        }
        return "#6B7280"; // Gray for normal transactions
      })
      .attr("stroke-width", d => {
        const sourceNode = filteredNodes.find(n => (n.id === d.source.id || n.id === d.source));
        const targetNode = filteredNodes.find(n => (n.id === d.target.id || n.id === d.target));
        if (sourceNode?.ringId && targetNode?.ringId && sourceNode.ringId === targetNode.ringId) {
          return 3; // Thicker for ring edges
        }
        return Math.max(1, Math.sqrt(d.value || 1));
      })
      .attr("stroke-opacity", d => {
        const sourceNode = filteredNodes.find(n => (n.id === d.source.id || n.id === d.source));
        const targetNode = filteredNodes.find(n => (n.id === d.target.id || n.id === d.target));
        if (sourceNode?.ringId && targetNode?.ringId && sourceNode.ringId === targetNode.ringId) {
          return 0.9; // More visible for ring edges
        }
        return 0.4;
      })
      .attr("marker-end", d => {
        // Use different arrow for ring edges
        const sourceNode = filteredNodes.find(n => (n.id === d.source.id || n.id === d.source));
        const targetNode = filteredNodes.find(n => (n.id === d.target.id || n.id === d.target));
        if (sourceNode?.ringId && targetNode?.ringId && sourceNode.ringId === targetNode.ringId) {
          const ringIndex = parseInt(sourceNode.ringId.replace(/\D/g, '')) || 0;
          return `url(#arrowhead-ring-${ringIndex % 5})`;
        }
        return "url(#arrowhead)";
      });

    // Draw Nodes (Accounts)
    const node = g.append("g")
      .selectAll("g")
      .data(filteredNodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        // Find full account details from results
        const accountDetails = state.results?.suspicious_accounts?.find(
          acc => acc.account_id === d.id
        );
        
        // Pass the complete node data with account details
        const nodeData = {
          id: d.id,
          riskScore: d.riskScore,
          patterns: d.patterns || [],
          ringId: d.ringId,
          isShell: d.isShell,
          accountDetails: accountDetails ? {
            total_transactions: accountDetails.total_transactions,
            total_sent: accountDetails.total_sent,
            total_received: accountDetails.total_received,
            detected_patterns: accountDetails.detected_patterns,
            suspicion_score: accountDetails.suspicion_score
          } : null
        };
        dispatch({ type: 'SET_SELECTED_NODE', payload: nodeData });
        
        // Visual feedback on click
        d3.selectAll(".node circle")
          .attr("stroke", d => d.ringId ? "#FFFFFF" : "#0D1B2A")
          .attr("stroke-width", d => d.ringId ? 3 : 2);
        d3.select(event.currentTarget).select("circle")
          .attr("stroke", "#00FFFF")
          .attr("stroke-width", 5);
      })
      .on("mouseover", function(event, d) {
        // Highlight on hover
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", d => {
            if (d.ringId) return 16;
            if (d.riskScore > 80) return 14;
            return 10;
          });
      })
      .on("mouseout", function(event, d) {
        // Reset on mouse out
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", d => {
            if (d.ringId) return 12;
            if (d.riskScore > 80) return 10;
            return 6;
          });
      });

    // Add circles to nodes
    node.append("circle")
      .attr("r", d => {
        // Larger nodes for ring members and high risk
        if (d.ringId) return 12;
        if (d.riskScore > 80) return 10;
        return 6;
      })
      .attr("fill", d => {
        // Color by ring membership or risk score
        if (d.ringId) {
          // Hash ring ID to consistent color
          const ringColors = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#F97316'];
          const ringIndex = parseInt(d.ringId.replace(/\D/g, '')) || 0;
          return ringColors[ringIndex % ringColors.length];
        }
        if (d.riskScore > 80) return "#EF4444"; // Red (High Risk)
        if (d.riskScore > 50) return "#F59E0B"; // Yellow (Medium Risk)
        return "#2BC48A"; // Green (Safe)
      })
      .attr("stroke", d => {
        // Special border for ring members
        if (d.ringId) return "#FFFFFF";
        return "#0D1B2A";
      })
      .attr("stroke-width", d => d.ringId ? 3 : 2)
      .style("filter", d => (d.riskScore > 80 || d.ringId) ? "url(#glow)" : "none");

    // Add labels for ring members and high-risk nodes
    node.append("text")
      .attr("dy", d => d.ringId ? 20 : 16)
      .attr("text-anchor", "middle")
      .attr("fill", "#E0E1DD")
      .attr("font-size", "10px")
      .attr("font-weight", d => d.ringId ? "bold" : "normal")
      .attr("pointer-events", "none")
      .text(d => {
        if (d.ringId || d.riskScore > 80) {
          return d.id;
        }
        return "";
      });

    // Tooltip titles
    node.append("title")
      .text(d => {
        let text = `Account: ${d.id}\nRisk Score: ${d.riskScore}%`;
        if (d.ringId) text += `\nFraud Ring: ${d.ringId}`;
        if (d.patterns && d.patterns.length > 0) text += `\nPatterns: ${d.patterns.join(', ')}`;
        return text;
      });

    // Simulation Tick Updates
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Cleanup on unmount
    return () => simulation.stop();
  }, [data, state.threshold, dispatch]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-navy-light/30 relative">
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-navy/90 backdrop-blur-md rounded-lg p-3 border border-white/10 text-xs">
        <div className="font-semibold text-gray-soft mb-2">Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red border-2 border-white"></div>
            <span className="text-gray-medium">Fraud Ring Member</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red"></div>
            <span className="text-gray-medium">High Risk (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow"></div>
            <span className="text-gray-medium">Medium Risk (50-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green"></div>
            <span className="text-gray-medium">Low Risk (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <div className="flex items-center">
              <div className="w-4 h-0.5 bg-red"></div>
              <div className="w-0 h-0 border-l-4 border-l-red border-y-2 border-y-transparent"></div>
            </div>
            <span className="text-gray-medium">Ring Transaction</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-4 h-0.5 bg-gray-medium"></div>
              <div className="w-0 h-0 border-l-4 border-l-gray-medium border-y-2 border-y-transparent"></div>
            </div>
            <span className="text-gray-medium">Normal Transaction</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 bg-navy/90 backdrop-blur-md rounded-lg p-2 border border-white/10 text-xs flex gap-2">
        <button 
          onClick={() => {
            if (svgRef.current && zoomRef.current) {
              const svg = d3.select(svgRef.current);
              svg.transition().duration(750).call(
                zoomRef.current.transform,
                d3.zoomIdentity
              );
            }
          }}
          className="px-3 py-1.5 bg-blue/20 hover:bg-blue/30 text-blue rounded transition-colors"
        >
          Reset Zoom
        </button>
      </div>
    </div>
  );
}