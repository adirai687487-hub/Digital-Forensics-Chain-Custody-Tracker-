import React, { useState, useMemo } from 'react';
import {
  FolderTree,
  Folder,
  FolderOpen,
  File,
  Archive,
  HardDrive,
  Laptop,
  Layers,
  ChevronRight,
  ChevronDown,
  Play,
  RotateCcw,
  PlusCircle,
  Hash,
  Terminal,
  Cpu,
  Info,
} from 'lucide-react';
import { useForensics } from '../../context/ForensicsContext';
import { EvidenceTreeNode, TreeTraversalStep } from '../../types/forensics';
import { EvidenceTreeManager } from '../../dsa/EvidenceTree';
import { truncateHash, formatBytes } from '../../utils/crypto';

interface EvidenceTreeViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const EvidenceTreeView: React.FC<EvidenceTreeViewProps> = ({ onNavigate }) => {
  const { evidenceTree, addTreeNode } = useForensics();

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'node-root-device': true,
    'node-disk-101': true,
    'node-part-system': true,
    'node-dir-users': true,
    'node-dir-downloads': true,
    'node-arch-suspicious': true,
  });

  const [selectedNode, setSelectedNode] = useState<EvidenceTreeNode>(evidenceTree);

  // Recursive traversal visualization state
  const [traversalMode, setTraversalMode] = useState<'PRE_ORDER' | 'POST_ORDER'>('PRE_ORDER');
  const [isTraversing, setIsTraversing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [traversalSteps, setTraversalSteps] = useState<TreeTraversalStep[]>([]);
  const [activeStep, setActiveStep] = useState<TreeTraversalStep | null>(null);

  // Add child node modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildType, setNewChildType] = useState<'folder' | 'archive' | 'file'>('file');
  const [newChildSize, setNewChildSize] = useState<number>(1024);
  const [newChildHash, setNewChildHash] = useState('');

  // Calculate metrics recursively
  const metrics = useMemo(() => {
    return EvidenceTreeManager.calculateMetrics(evidenceTree);
  }, [evidenceTree]);

  // Ascii tree lines
  const asciiTreeLines = useMemo(() => {
    return EvidenceTreeManager.generateAsciiTree(evidenceTree);
  }, [evidenceTree]);

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleSelectNode = (node: EvidenceTreeNode) => {
    setSelectedNode(node);
  };

  // Start Recursive Step-Through Simulation
  const handleStartTraversal = () => {
    const steps = EvidenceTreeManager.traceRecursiveTraversal(evidenceTree, traversalMode);
    setTraversalSteps(steps);
    setCurrentStepIndex(0);
    setActiveStep(steps[0]);
    setIsTraversing(true);

    // Expand all nodes so they are visible during traversal
    const expandAll: Record<string, boolean> = {};
    const recurseExpand = (n: EvidenceTreeNode) => {
      expandAll[n.id] = true;
      n.children.forEach(recurseExpand);
    };
    recurseExpand(evidenceTree);
    setExpandedNodes(expandAll);
  };

  const handleNextStep = () => {
    if (currentStepIndex < traversalSteps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setActiveStep(traversalSteps[nextIdx]);
    } else {
      setIsTraversing(false);
    }
  };

  const handleResetTraversal = () => {
    setIsTraversing(false);
    setCurrentStepIndex(-1);
    setActiveStep(null);
  };

  const handleAddChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim() || !selectedNode) return;

    addTreeNode(selectedNode.id, {
      name: newChildName.trim(),
      type: newChildType,
      sizeBytes: newChildSize,
      hash: newChildHash.trim() || undefined,
    });

    setShowAddModal(false);
    setNewChildName('');
    setNewChildHash('');
    // Ensure parent is expanded
    setExpandedNodes(prev => ({ ...prev, [selectedNode.id]: true }));
  };

  // Node Icon Helper
  const getNodeIcon = (type: string, isExpanded: boolean) => {
    switch (type) {
      case 'device':
        return <Laptop className="w-4 h-4 text-cyan-400" />;
      case 'disk_image':
        return <HardDrive className="w-4 h-4 text-indigo-400" />;
      case 'partition':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-amber-400" />;
      case 'folder':
        return isExpanded ? (
          <FolderOpen className="w-4 h-4 text-yellow-400" />
        ) : (
          <Folder className="w-4 h-4 text-yellow-400" />
        );
      default:
        return <File className="w-4 h-4 text-slate-300" />;
    }
  };

  // Recursive Tree Component
  const renderTreeNode = (node: EvidenceTreeNode, depth = 0) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;
    const isHighlightedInTraversal = activeStep?.nodeId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => handleSelectNode(node)}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          className={`flex items-center gap-2 py-1.5 pr-3 text-xs rounded cursor-pointer transition-colors ${
            isHighlightedInTraversal
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 font-bold shadow-sm'
              : isSelected
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          {/* Chevron for expandable nodes */}
          <div
            onClick={e => hasChildren && toggleExpand(node.id, e)}
            className="w-4 h-4 flex items-center justify-center shrink-0 text-slate-400 hover:text-white"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mx-auto" />
            )}
          </div>

          {/* Node Icon */}
          <div className="shrink-0">{getNodeIcon(node.type, isExpanded)}</div>

          {/* Name & Badge */}
          <span className="truncate max-w-[280px] font-mono text-[11px]">{node.name}</span>

          {node.evidenceId && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 rounded shrink-0">
              {node.evidenceId}
            </span>
          )}

          {node.sizeBytes && (
            <span className="text-[10px] text-slate-500 font-mono ml-auto shrink-0">
              {formatBytes(node.sizeBytes)}
            </span>
          )}
        </div>

        {/* Children (Recursion) */}
        {hasChildren && isExpanded && (
          <div className="border-l border-slate-800/80 ml-4">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wide">
            Hierarchical Artifact Representation
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Recursive Evidence Tree</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Slide 8 Implementation: Arbitrary nested devices, disk images, partitions, archives, and extracted artifacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Child Node</span>
          </button>
        </div>
      </div>

      {/* Recursive Subtree Metrics Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Total Nodes</div>
          <div className="text-xl font-bold text-white font-mono mt-0.5">{metrics.totalNodes}</div>
        </div>
        <div className="p-3 rounded bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Files</div>
          <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">{metrics.totalFiles}</div>
        </div>
        <div className="p-3 rounded bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Folders</div>
          <div className="text-xl font-bold text-yellow-400 font-mono mt-0.5">{metrics.totalFolders}</div>
        </div>
        <div className="p-3 rounded bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Archives (.zip)</div>
          <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">{metrics.totalArchives}</div>
        </div>
        <div className="p-3 rounded bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Max Depth (h)</div>
          <div className="text-xl font-bold text-indigo-400 font-mono mt-0.5">{metrics.maxDepth}</div>
        </div>
        <div className="p-3 rounded bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Total Subtree Vol</div>
          <div className="text-sm font-bold text-white font-mono mt-1.5 truncate">
            {formatBytes(metrics.totalSizeBytes)}
          </div>
        </div>
      </div>

      {/* Traversal Simulation Bar */}
      <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <div>
            <span className="text-xs font-semibold text-white">
              Recursive Traversal Simulation (Slide 8 void displayTree(Node* root))
            </span>
            <div className="text-[11px] text-slate-400">
              Complexity: Time O(n) · Space O(h) recursion stack frames
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={traversalMode}
            onChange={e => setTraversalMode(e.target.value as any)}
            disabled={isTraversing}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
          >
            <option value="PRE_ORDER">Pre-Order Traversal (Root → Children)</option>
            <option value="POST_ORDER">Post-Order Traversal (Children → Root)</option>
          </select>

          {!isTraversing ? (
            <button
              onClick={handleStartTraversal}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
            >
              <Play className="w-3 h-3" />
              <span>Simulate Recursion</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleNextStep}
                className="px-3 py-1 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
              >
                Next Step ({currentStepIndex + 1}/{traversalSteps.length})
              </button>
              <button
                onClick={handleResetTraversal}
                className="p-1 text-slate-400 hover:text-white"
                title="Reset simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Call Stack Visualizer Banner (When Simulation Active) */}
      {isTraversing && activeStep && (
        <div className="p-4 rounded-lg bg-cyan-950/40 border border-cyan-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-cyan-300 font-mono">
              Call Stack Depth: {activeStep.depth} (Memory O(h) Auxiliary Frame Stack)
            </span>
            <span className="text-slate-400 font-mono">
              Visiting Node: {activeStep.nodeName} [{activeStep.nodeType}]
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] pt-1">
            <span className="text-slate-400">Stack:</span>
            {activeStep.callStack.map((frame, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded border ${
                  i === activeStep.callStack.length - 1
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {frame}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Split: Tree Viewer & Selected Node Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Tree View (7 cols) */}
        <div className="lg:col-span-7 p-4 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Filesystem & Archive Hierarchy
            </h3>
            <span className="text-[11px] text-slate-400">Click node to inspect</span>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto space-y-0.5 pr-2">
            {renderTreeNode(evidenceTree)}
          </div>
        </div>

        {/* Right: Selected Node Properties & ASCII Tree (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Node Properties Card */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Selected Artifact Details
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-cyan-400 rounded">
                {selectedNode.type}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Node Name:</span>
                <div className="font-semibold text-white font-mono break-all mt-0.5">
                  {selectedNode.name}
                </div>
              </div>

              <div>
                <span className="text-slate-400">Node Identifier:</span>
                <div className="font-mono text-cyan-300 text-[11px] mt-0.5">{selectedNode.id}</div>
              </div>

              {selectedNode.sizeBytes && (
                <div>
                  <span className="text-slate-400">Allocated Size:</span>
                  <div className="font-mono text-slate-200 mt-0.5">
                    {formatBytes(selectedNode.sizeBytes)} ({selectedNode.sizeBytes.toLocaleString()} bytes)
                  </div>
                </div>
              )}

              {selectedNode.hash && (
                <div>
                  <span className="text-slate-400">Cryptographic SHA-256 Hash:</span>
                  <div className="font-mono text-[11px] text-cyan-300 break-all p-2 bg-slate-950 rounded border border-slate-800 mt-0.5">
                    {selectedNode.hash}
                  </div>
                </div>
              )}

              {selectedNode.notes && (
                <div>
                  <span className="text-slate-400">Forensic Notes:</span>
                  <p className="text-slate-300 italic text-[11px] mt-0.5 leading-relaxed">
                    {selectedNode.notes}
                  </p>
                </div>
              )}

              {selectedNode.evidenceId && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Linked to Evidence #{selectedNode.evidenceId}
                  </span>
                  <button
                    onClick={() => onNavigate('custody', selectedNode.evidenceId)}
                    className="text-cyan-400 hover:underline text-[11px]"
                  >
                    View custody chain
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ASCII Tree Terminal View (Slide 11/12 Console Preview) */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 h-64 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-slate-500 pb-2 border-b border-slate-800/80 mb-2">
              <Terminal className="w-3.5 h-3.5" />
              <span>Hierarchical Recursive Display (ASCII Tree)</span>
            </div>
            <pre className="text-[10px] leading-relaxed select-all">
              {asciiTreeLines.join('\n')}
            </pre>
          </div>
        </div>
      </div>

      {/* Add Child Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">
                Add Child Node to "{selectedNode.name}"
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddChildSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Node Name / File Name</label>
                <input
                  type="text"
                  value={newChildName}
                  onChange={e => setNewChildName(e.target.value)}
                  placeholder="e.g. suspicious_script.ps1 or extracted_tar/"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Artifact Type</label>
                <select
                  value={newChildType}
                  onChange={e => setNewChildType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="file">File (leaf node)</option>
                  <option value="folder">Directory / Folder</option>
                  <option value="archive">Compressed Archive (.zip, .tar.gz)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">File Size (bytes)</label>
                <input
                  type="number"
                  value={newChildSize}
                  onChange={e => setNewChildSize(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">SHA-256 Hash (Optional)</label>
                <input
                  type="text"
                  value={newChildHash}
                  onChange={e => setNewChildHash(e.target.value)}
                  placeholder="64-character SHA-256 string"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded"
                >
                  Add Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
