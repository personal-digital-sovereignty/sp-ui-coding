<script lang="ts">
	import { logger } from '@sp/ui-core/logger';

    import FileTreeItem from "$lib/components/FileTreeItem.svelte";
    import MonacoEditor from "$lib/components/MonacoEditor.svelte";
    import { API_BASE_URL } from "@sp/ui-core/config";
    import { globalState, toggleSidebar } from "@sp/ui-core/state";
    import { Terminal as XTerm } from "@xterm/xterm";
    import { FitAddon } from "@xterm/addon-fit";
    import "@xterm/xterm/css/xterm.css";
    import {
        Code2,
        FolderTree,
        Terminal,
        Play,
        Save,
        Settings,
        FileCode,
        Braces,
        ChevronRight,
        ChevronDown,
        X,
        Zap,
        BrainCircuit,
        FilePlus,
        Trash2,
        Pencil,
    } from "lucide-svelte";
    import { onMount, onDestroy } from "svelte";

    // ========================================================================
    // Types
    // ========================================================================
    interface FileNode {
        name: string;
        path: string;
        kind: "file" | "directory";
        size?: number;
        children?: FileNode[];
    }

    // ========================================================================
    // State
    // ========================================================================
    let activeFile = $state<string | null>(null);
    let code = $state("");
    let isTerminalOpen = $state(true);
    let isSaving = $state(false);
    let fileTree = $state<FileNode[]>([]);
    let expandedDirs = $state<Set<string>>(new Set());
    let terminalWs: WebSocket | null = null;

    const CODING_API = `${API_BASE_URL}/v1/coding`;

    // ========================================================================
    // File Tree — fetch from backend
    // ========================================================================
    async function loadFileTree() {
        try {
            const res = await fetch(`${CODING_API}/fs/tree`);
            if (res.ok) {
                fileTree = await res.json();
            }
        } catch (err) {
            logger.error("Failed to load file tree:", err);
        }
    }

    async function openFile(node: FileNode) {
        if (node.kind === "directory") {
            if (expandedDirs.has(node.path)) {
                expandedDirs.delete(node.path);
            } else {
                expandedDirs.add(node.path);
            }
            expandedDirs = new Set(expandedDirs);
            return;
        }

        try {
            const res = await fetch(
                `${CODING_API}/fs/read?path=${encodeURIComponent(node.path)}`,
            );
            if (res.ok) {
                const data = await res.json();
                activeFile = node.path;
                code = data.content;
            }
        } catch (err) {
            logger.error("Failed to read file:", err);
        }
    }

    // ========================================================================
    // File Operations
    // ========================================================================
    async function saveFile() {
        if (!activeFile) return;
        isSaving = true;
        try {
            const res = await fetch(`${CODING_API}/fs/write`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: activeFile, content: code }),
            });
        } catch (err) {
            logger.error(`✘ Save error: ${err}`);
        } finally {
            isSaving = false;
        }
    }

    async function deleteFile(path: string) {
        try {
            const res = await fetch(
                `${CODING_API}/fs/delete?path=${encodeURIComponent(path)}`,
            );
            if (res.ok) {
                if (activeFile === path) {
                    activeFile = null;
                    code = "";
                }
                await loadFileTree();
            }
        } catch (err) {
            logger.error("Failed to delete file:", err);
        }
    }

    async function createFile() {
        const name = prompt("File name (e.g., src/main.ts):");
        if (!name) return;
        try {
            const res = await fetch(`${CODING_API}/fs/write`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: name, content: "" }),
            });
            if (res.ok) {
                await loadFileTree();
            }
        } catch (err) {
            logger.error("Failed to create file:", err);
        }
    }

    // ========================================================================
    // Language detection from file extension
    // ========================================================================
    function detectLanguage(filename: string): string {
        const ext = filename.split(".").pop()?.toLowerCase();
        const map: Record<string, string> = {
            js: "javascript",
            ts: "typescript",
            jsx: "javascript",
            tsx: "typescript",
            py: "python",
            rs: "rust",
            go: "go",
            rb: "ruby",
            css: "css",
            scss: "scss",
            html: "html",
            json: "json",
            yaml: "yaml",
            yml: "yaml",
            toml: "toml",
            xml: "xml",
            md: "markdown",
            sh: "shell",
            bash: "shell",
            sql: "sql",
            c: "c",
            cpp: "cpp",
            h: "c",
            hpp: "cpp",
        };
        return map[ext || ""] || "plaintext";
    }

    // ========================================================================
    // Terminal — xterm.js + WebSocket
    // ========================================================================
    function initTerminal(node: HTMLElement) {
        const xterm = new XTerm({
            theme: {
                background: "#0d1117",
                foreground: "#c9d1d9",
                cursor: "#58a6ff"
            },
            fontFamily: 'monospace',
            fontSize: 13,
        });
        const fitAddon = new FitAddon();
        xterm.loadAddon(fitAddon);
        xterm.open(node);
        
        setTimeout(() => fitAddon.fit(), 10);
        
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = window.location.host;
        terminalWs = new WebSocket(`${wsProtocol}//${wsHost}/v1/coding/terminal/ws`);
        
        terminalWs.onopen = () => {
            fitAddon.fit();
            terminalWs?.send(JSON.stringify({ type: "resize", cols: xterm.cols, rows: xterm.rows }));
        };
        
        terminalWs.onmessage = (event) => {
            xterm.write(event.data);
        };
        
        xterm.onData((data) => {
            if (terminalWs?.readyState === WebSocket.OPEN) {
                terminalWs.send(JSON.stringify({ type: "input", data }));
            }
        });

        const resizeObserver = new ResizeObserver(() => {
            try {
                fitAddon.fit();
                if (terminalWs?.readyState === WebSocket.OPEN) {
                    terminalWs.send(JSON.stringify({ type: "resize", cols: xterm.cols, rows: xterm.rows }));
                }
            } catch (e) {}
        });
        resizeObserver.observe(node);

        return {
            destroy() {
                resizeObserver.disconnect();
                xterm.dispose();
                terminalWs?.close();
            }
        };
    }

    // ========================================================================
    // Render file tree recursively
    // ========================================================================
    function renderNode(node: FileNode, depth: number): string {
        const indent = "  ".repeat(depth);
        const isExpanded = expandedDirs.has(node.path);
        const isActive = activeFile === node.path;

        if (node.kind === "directory") {
            return `${indent}<div class="flex items-center gap-1 px-2 py-1 text-sm text-slate-400 hover:bg-white/5 rounded cursor-pointer transition-colors"
                onclick={() => openFile(JSON.parse('__NODE__'))}">
                ${isExpanded ? "<ChevronDown size={14} />" : "<ChevronRight size={14} />"}
                <FolderTree size={14} class="text-slate-500" />
                <span class="truncate font-bold">${node.name}</span>
            </div>
            ${isExpanded && node.children ? node.children.map((c) => renderNode(c, depth + 1)).join("\n") : ""}`;
        }

        return `${indent}<div class="flex items-center gap-2 px-6 py-1.5 text-sm transition-colors ${isActive ? "bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}"
            onclick={() => openFile(JSON.parse('__NODE__'))}">
            <FileCode size={14} class="${isActive ? "text-indigo-400" : "text-slate-500"}" />
            <span class="truncate">${node.name}</span>
        </div>`;
    }

    // ========================================================================
    // Lifecycle
    // ========================================================================
    onMount(() => {
        loadFileTree();
    });

    onDestroy(() => {
        terminalWs?.close();
    });
</script>

<div
    class="flex h-screen w-full bg-[#0d1117] text-slate-300 font-sans overflow-hidden"
>
    <!-- Activity Bar -->
    <aside
        class="w-14 flex flex-col items-center py-4 gap-6 bg-[#090c10] border-r border-slate-800/50 z-20"
    >
        <div class="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 mb-4">
            <Zap size={24} />
        </div>
        <button
            onclick={toggleSidebar}
            class="text-slate-500 hover:text-white transition-colors cursor-pointer"
            title="Explorer"
        >
            <FolderTree size={22} />
        </button>
        <button
            class="text-slate-500 hover:text-white transition-colors cursor-pointer"
            title="Code Search"
        >
            <Code2 size={22} />
        </button>
        <button
            class="text-slate-500 hover:text-white transition-colors cursor-pointer"
            title="Agentic Debugger"
        >
            <BrainCircuit size={22} />
        </button>
        <div class="mt-auto">
            <button
                class="text-slate-500 hover:text-white transition-colors cursor-pointer"
                title="Settings"
            >
                <Settings size={22} />
            </button>
        </div>
    </aside>

    <!-- Side Panel (Real File Explorer) -->
    {#if globalState.isSidebarOpen}
        <aside
            class="w-64 bg-[#0d1117] border-r border-slate-800/50 flex flex-col animate-in slide-in-from-left duration-300"
        >
            <div
                class="h-12 flex items-center justify-between px-4 border-b border-slate-800/30"
            >
                <span
                    class="text-xs font-bold uppercase tracking-widest text-slate-500"
                    >Explorer</span
                >
                <button
                    onclick={createFile}
                    class="text-slate-500 hover:text-white transition-colors"
                    title="New file"
                >
                    <FilePlus size={16} />
                </button>
            </div>
            <div class="flex-1 overflow-y-auto py-2">
                {#each fileTree as node}
                    <FileTreeItem
                        {node}
                        {expandedDirs}
                        {activeFile}
                        onopen={openFile}
                    />
                {/each}
            </div>
        </aside>
    {/if}

    <!-- Main Editor Area -->
    <main class="flex-1 flex flex-col min-w-0 bg-[#161b22]">
        <!-- Tabs Header -->
        <header
            class="h-10 bg-[#0d1117] flex items-center overflow-x-auto no-scrollbar border-b border-slate-800/50 shrink-0"
        >
            <div class="flex h-full">
                {#if activeFile}
                    <div
                        class="flex items-center gap-2 px-4 h-full bg-[#161b22] border-r border-slate-800/50 text-xs font-medium text-slate-200 border-t-2 border-t-indigo-500"
                    >
                        <FileCode size={14} class="text-indigo-400" />
                        <span>{activeFile.split("/").pop()}</span>
                    </div>
                {/if}
            </div>

            <div class="ml-auto flex items-center px-4 gap-4">
                <button
                    onclick={() => {
                        if (terminalWs?.readyState === WebSocket.OPEN) {
                            terminalWs.send(JSON.stringify({ type: "input", data: "npm run dev\r" }));
                        }
                    }}
                    class="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-all active:scale-95"
                >
                    <Play size={12} />
                    <span>Run</span>
                </button>
                <button
                    onclick={saveFile}
                    disabled={isSaving || !activeFile}
                    class="text-slate-500 hover:text-white transition-colors disabled:opacity-30"
                >
                    <Save size={16} />
                </button>
            </div>
        </header>

        <!-- Editor Content -->
        <div class="flex-1 relative min-h-0">
            {#if activeFile}
                <MonacoEditor
                    bind:value={code}
                    language={detectLanguage(activeFile)}
                    theme="vs-dark"
                />
            {:else}
                <div
                    class="flex items-center justify-center h-full text-slate-500"
                >
                    <div class="text-center">
                        <FileCode size={48} class="mx-auto mb-4 opacity-30" />
                        <p class="text-sm">Select a file from the explorer</p>
                        <p class="text-xs mt-1">or create a new one</p>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Terminal -->
        {#if isTerminalOpen}
            <div
                class="h-1/3 bg-[#0d1117] border-t border-slate-800/50 flex flex-col animate-in slide-in-from-bottom duration-300"
            >
                <header
                    class="h-9 flex items-center px-4 bg-[#090c10] border-b border-slate-800/30 justify-between shrink-0"
                >
                    <div class="flex items-center gap-4">
                        <button
                            class="text-xs font-bold text-slate-200 border-b-2 border-indigo-500 h-9 flex items-center px-2"
                            >Terminal</button
                        >
                    </div>
                    <button
                        onclick={() => (isTerminalOpen = false)}
                        class="text-slate-500 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                </header>
                <div class="flex-1 w-full h-full p-2 relative">
                    <div use:initTerminal class="absolute inset-0 p-2"></div>
                </div>
            </div>
        {/if}
    </main>
</div>

<style>
    :global(.no-scrollbar::-webkit-scrollbar) {
        display: none;
    }
    :global(.no-scrollbar) {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    :global(.custom-scrollbar::-webkit-scrollbar) {
        width: 8px;
        height: 8px;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-track) {
        background: transparent;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) {
        background: #30363d;
        border-radius: 10px;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
        background: #484f58;
    }
</style>
