'use client';

import { Download } from 'lucide-react';
import { generateMarkdownExport } from '@/actions/export';

export default function ExportSummaryButton({ week }: { week?: string }) {
    const handleExport = async () => {
        try {
            const date = week ? new Date(week) : new Date();
            const markdown = await generateMarkdownExport(date);

            // Trigger download
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `taskdaily-report-${week || 'current'}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export failed', e);
            alert('Failed to export summary.');
        }
    };

    return (
        <button
            onClick={handleExport}
            className="btn bg-neutral-100 text-sm hover:bg-neutral-200 flex items-center gap-2"
        >
            <Download size={16} /> Export
        </button>
    );
}
