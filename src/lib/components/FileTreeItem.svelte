<script lang="ts">
    import { FileCode, FolderTree, ChevronRight, ChevronDown } from "lucide-svelte";

    interface FileNode {
        name: string;
        path: string;
        kind: "file" | "directory";
        size?: number;
        children?: FileNode[];
    }

    let {
        node,
        expandedDirs = new Set<string>(),
        activeFile = null,
    }: {
        node: FileNode;
        expandedDirs: Set<string>;
        activeFile: string | null;
    } = $props();

    let dispatch = createEventDispatcher();

    function handleClick() {
        if (node.kind === "directory") {
            dispatch("open", node);
        } else {
            dispatch("open", node);
        }
    }
</script>

{#if node.kind === "directory"}
    <div
        class="flex items-center gap-1 px-2 py-1 text-sm text-slate-400 hover:bg-white/5 rounded cursor-pointer transition-colors"
        onclick={handleClick}
    >
        {#if $expandedDirs.has(node.path)}
            <ChevronDown size={14} />
        {:else}
            <ChevronRight size={14} />
        {/if}
        <FolderTree size={14} class="text-slate-500 shrink-0" />
        <span class="truncate font-bold">{node.name}</span>
    </div>
    {#if $expandedDirs.has(node.path) && node.children}
        <div class="ml-2">
            {#each node.children as child}
                <FileTreeItem
                    {child}
                    expandedDirs={$expandedDirs}
                    activeFile={$activeFile}
                    on:open={(e) => dispatch("open", e.detail)}
                />
            {/each}
        </div>
    {/if}
{:else}
    <div
        class="flex items-center gap-2 px-6 py-1.5 text-sm transition-colors cursor-pointer {$activeFile === node.path
            ? 'bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}"
        onclick={handleClick}
    >
        <FileCode
            size={14}
            class="shrink-0 {$activeFile === node.path ? 'text-indigo-400' : 'text-slate-500'}"
        />
        <span class="truncate">{node.name}</span>
    </div>
{/if}
