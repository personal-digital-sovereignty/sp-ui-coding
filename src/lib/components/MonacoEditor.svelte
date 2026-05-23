<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import loader from '@monaco-editor/loader';
	import type * as Monaco from 'monaco-editor';

	let {
		value = $bindable(
			'// Welcome to Sovereign Code\n\nfunction helloWorld() {\n  console.log("Hello Cibrid!");\n}\n',
		),
		language = 'javascript',
		theme = 'vs-dark',
	} = $props();

	let editorContainer: HTMLDivElement;
	let editor: Monaco.editor.IStandaloneCodeEditor | undefined = $state();
	let monacoInstance: typeof Monaco | undefined = $state();

	onMount(async () => {
		monacoInstance = await loader.init();

		editor = monacoInstance!.editor.create(editorContainer, {
			value,
			language,
			theme,
			automaticLayout: true,
			minimap: { enabled: false },
			fontSize: 14,
			fontFamily: '"JetBrains Mono", "Fira Code", monospace',
			padding: { top: 16, bottom: 16 },
			scrollBeyondLastLine: false,
			roundedSelection: false,
			smoothScrolling: true,
			cursorBlinking: 'smooth',
			cursorSmoothCaretAnimation: 'on',
		});

		editor.onDidChangeModelContent(() => {
			value = editor!.getValue();
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.dispose();
		}
	});

	$effect(() => {
		if (editor && monacoInstance) {
			const model = editor.getModel();
			if (model) {
				monacoInstance.editor.setModelLanguage(model, language);
			}
			monacoInstance.editor.setTheme(theme);
		}
	});
</script>

<div
	class="w-full h-full relative overflow-hidden bg-[#1e1e1e] rounded-xl border border-slate-700/50 shadow-inner"
>
	<div bind:this={editorContainer} class="absolute inset-0"></div>
</div>
