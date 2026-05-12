<script lang="ts">
    import MonacoEditor from '$lib/components/MonacoEditor.svelte';
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
        X,
        Zap,
        BrainCircuit
    } from 'lucide-svelte';
    import { onMount } from 'svelte';

    let activeFile = $state('main.js');
    let code = $state(`// Sovereign Cibrid Editor v1.5
// Phase 1: MVP Instance

import { agent } from "@sp/core";

async function executeDeepCode() {
  console.log("Initializing Agentic Workspace...");
  
  const result = await agent.solve({
    task: "Implement a quantum-safe encryption layer",
    priority: "High"
  });

  return result;
}

executeDeepCode();`);

    let isSidebarOpen = $state(true);
    let isTerminalOpen = $state(true);

    const files = [
        { name: 'main.js', type: 'js', icon: FileCode },
        { name: 'styles.css', type: 'css', icon: Braces },
        { name: 'config.json', type: 'json', icon: Settings },
        { name: 'agent.py', type: 'python', icon: BrainCircuit }
    ];

    onMount(() => {
        // Initial setup if needed
    });
</script>

<div class="flex h-screen w-full bg-[#0d1117] text-slate-300 font-sans overflow-hidden">
    <!-- Activity Bar (Ultra-slim sidebar) -->
    <aside class="w-14 flex flex-col items-center py-4 gap-6 bg-[#090c10] border-r border-slate-800/50 z-20">
        <div class="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 mb-4">
            <Zap size={24} />
        </div>
        <button class="text-slate-500 hover:text-white transition-colors cursor-pointer" title="Explorer">
            <FolderTree size={22} />
        </button>
        <button class="text-slate-500 hover:text-white transition-colors cursor-pointer" title="Code Search">
            <Code2 size={22} />
        </button>
        <button class="text-slate-500 hover:text-white transition-colors cursor-pointer" title="Agentic Debugger">
            <BrainCircuit size={22} />
        </button>
        <div class="mt-auto">
            <button class="text-slate-500 hover:text-white transition-colors cursor-pointer" title="Settings">
                <Settings size={22} />
            </button>
        </div>
    </aside>

    <!-- Side Panel (File Explorer) -->
    {#if isSidebarOpen}
        <aside class="w-64 bg-[#0d1117] border-r border-slate-800/50 flex flex-col animate-in slide-in-from-left duration-300">
            <div class="h-12 flex items-center px-4 border-b border-slate-800/30">
                <span class="text-xs font-bold uppercase tracking-widest text-slate-500">Explorer</span>
            </div>
            <div class="flex-1 overflow-y-auto py-2">
                <div class="px-2 mb-2">
                    <div class="flex items-center gap-1 text-slate-400 px-2 py-1 hover:bg-white/5 rounded cursor-pointer transition-colors">
                        <ChevronRight size={14} />
                        <span class="text-sm font-bold truncate">SOVEREIGN-PLATFORM</span>
                    </div>
                </div>
                <div class="space-y-0.5">
                    {#each files as file}
                        <button 
                            onclick={() => activeFile = file.name}
                            class="w-full flex items-center gap-2 px-6 py-1.5 text-sm transition-colors group {activeFile === file.name ? 'bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}"
                        >
                            <file.icon size={16} class="shrink-0 {activeFile === file.name ? 'text-indigo-400' : 'text-slate-500'}" />
                            <span class="truncate">{file.name}</span>
                        </button>
                    {/each}
                </div>
            </div>
        </aside>
    {/if}

    <!-- Main Editor Area -->
    <main class="flex-1 flex flex-col min-w-0 bg-[#161b22]">
        <!-- Tabs Header -->
        <header class="h-10 bg-[#0d1117] flex items-center overflow-x-auto no-scrollbar border-b border-slate-800/50 shrink-0">
            <div class="flex h-full">
                <div class="flex items-center gap-2 px-4 h-full bg-[#161b22] border-r border-slate-800/50 text-xs font-medium text-slate-200 border-t-2 border-t-indigo-500">
                    <FileCode size={14} class="text-indigo-400" />
                    <span>{activeFile}</span>
                    <button class="hover:bg-white/10 rounded p-0.5 ml-2">
                        <X size={12} />
                    </button>
                </div>
            </div>
            
            <div class="ml-auto flex items-center px-4 gap-4">
                <button class="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-all active:scale-95">
                    <Play size={12} />
                    <span>Run</span>
                </button>
                <button class="text-slate-500 hover:text-white transition-colors">
                    <Save size={16} />
                </button>
            </div>
        </header>

        <!-- Editor Content -->
        <div class="flex-1 relative min-h-0">
            <MonacoEditor bind:value={code} language="javascript" theme="vs-dark" />
        </div>

        <!-- Terminal / Logs Area -->
        {#if isTerminalOpen}
            <div class="h-1/3 bg-[#0d1117] border-t border-slate-800/50 flex flex-col animate-in slide-in-from-bottom duration-300">
                <header class="h-9 flex items-center px-4 bg-[#090c10] border-b border-slate-800/30 justify-between shrink-0">
                    <div class="flex items-center gap-4">
                        <button class="text-xs font-bold text-slate-200 border-b-2 border-indigo-500 h-9 flex items-center px-2">Terminal</button>
                        <button class="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors h-9 flex items-center px-2">Output</button>
                        <button class="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors h-9 flex items-center px-2">Debug Console</button>
                    </div>
                    <button onclick={() => isTerminalOpen = false} class="text-slate-500 hover:text-white">
                        <X size={14} />
                    </button>
                </header>
                <div class="flex-1 p-4 font-mono text-[13px] overflow-y-auto custom-scrollbar">
                    <div class="flex gap-2 mb-1">
                        <span class="text-emerald-500">➜</span>
                        <span class="text-indigo-400">sovereign-platform</span>
                        <span class="text-slate-500">git:(</span><span class="text-rose-400">main</span><span class="text-slate-500">)</span>
                        <span class="text-white">npm run dev</span>
                    </div>
                    <div class="text-slate-400 mb-1">Building Sovereign UI Core...</div>
                    <div class="text-slate-400 mb-1">Modules built: chat, vault, projects, rag, coding.</div>
                    <div class="text-emerald-400 mb-1 font-bold">✔ Compilation success. Local server running at http://localhost:5173</div>
                    <div class="text-slate-500 mt-2 flex gap-2">
                        <span class="animate-pulse">_</span>
                    </div>
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
