"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useIntegrationsStore } from '@/stores/integrations-store';
import { useDialogStore } from '@/stores/dialog-store';
import { useTranslation } from 'react-i18next';

/** Quick prompt suggestions for users */
const QUICK_PROMPTS = [
	{ key: "sunset", prompt: "A beautiful sunset over the ocean with gentle waves" },
	{ key: "cityTimelapse", prompt: "City timelapse at night with cars and lights" },
	{ key: "natureWalk", prompt: "Peaceful nature walk through a green forest" },
];

export function AIGenerationView() {
	const { t } = useTranslation();
	const [prompt, setPrompt] = useState('');
	const [isGenerating, setIsGenerating] = useState(false);
	const { openaiApiKey, anthropicApiKey, aiVideoProvider } = useIntegrationsStore();
	const { openIntegrationsDialog } = useDialogStore();

	const hasApiKey = aiVideoProvider === 'openai'
		? !!openaiApiKey
		: aiVideoProvider === 'anthropic'
			? !!anthropicApiKey
			: false;

	const handleGenerate = async () => {
		if (!hasApiKey || !prompt.trim()) return;

		setIsGenerating(true);
		try {
			// TODO: Implement AI generation logic
			// This will be implemented in a future phase
			console.log('AI Generation prompt:', prompt);
			
			// Simulate generation for now
			await new Promise(resolve => setTimeout(resolve, 2000));
		} catch (error) {
			console.error('AI Generation error:', error);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleQuickPrompt = (promptText: string) => {
		setPrompt(promptText);
	};

	const handleOpenSettings = () => {
		openIntegrationsDialog('ai');
	};

	return (
		<div className="flex flex-col h-full">
			<div className="p-3 space-y-3 flex-1 overflow-y-auto">
				{/* Compact Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5">
						<Sparkles className="w-4 h-4 text-primary" />
						<span className="text-sm font-medium">{t('aiGeneration.title')}</span>
					</div>
					<Badge variant="secondary" className="text-[10px] px-1.5 py-0">
						{t('common.comingSoon')}
					</Badge>
				</div>

				{/* Prompt Input - Compact */}
				<Textarea
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder={t('aiGeneration.promptPlaceholder')}
					rows={3}
					className="resize-none text-sm"
				/>

				{/* Quick Prompts - Compact */}
				<div className="flex flex-wrap gap-1.5">
					{QUICK_PROMPTS.map((quickPrompt) => (
						<Button
							key={quickPrompt.key}
							variant="outline"
							size="sm"
							onClick={() => handleQuickPrompt(quickPrompt.prompt)}
							className="text-[11px] h-6 px-2"
						>
							{t(`aiGeneration.quickPrompts.${quickPrompt.key}`)}
						</Button>
					))}
				</div>

				{/* API Key Warning - Compact with clickable link */}
				{!hasApiKey && (
					<div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
						<AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
						<span className="text-[11px] text-yellow-600 dark:text-yellow-400">
							{t('aiGeneration.noApiKey')} <button
								onClick={handleOpenSettings}
								className="underline hover:no-underline font-medium cursor-pointer"
							>
								{t('aiGeneration.openSettings')}
							</button>
						</span>
					</div>
				)}

				{/* Generate Button */}
				<Button
					onClick={handleGenerate}
					disabled={!prompt.trim() || !hasApiKey || isGenerating}
					size="sm"
					className="w-full gap-1.5 h-8"
				>
					{isGenerating ? (
						<>
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
							{t('aiGeneration.generating')}
						</>
					) : (
						<>
							<Sparkles className="w-3.5 h-3.5" />
							{t('aiGeneration.generateButton')}
						</>
					)}
				</Button>

				{/* Feature Preview - Compact */}
				<div className="pt-2 border-t">
					<span className="text-[11px] font-medium text-muted-foreground">Upcoming:</span>
					<div className="flex flex-wrap gap-1 mt-1.5">
						<Badge variant="outline" className="text-[10px]">Text-to-video</Badge>
						<Badge variant="outline" className="text-[10px]">Auto-captions</Badge>
						<Badge variant="outline" className="text-[10px]">Style transfer</Badge>
						<Badge variant="outline" className="text-[10px]">Templates</Badge>
					</div>
				</div>
			</div>
		</div>
	);
}
