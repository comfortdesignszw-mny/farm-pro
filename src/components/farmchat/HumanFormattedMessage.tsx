import React from 'react';

interface HumanFormattedMessageProps {
  content: string;
  isUser: boolean;
}

/**
 * Strips raw markdown syntax characters (like **, ##, __, `, [1], ***)
 * while preserving clean, readable text.
 */
export function sanitizeRawMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[\d+\]/g, '') // strip citation numbers [1], [2]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip markdown links [title](url) -> title
    .replace(/^#{1,6}\s+/gm, '') // strip header hashes
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1') // bold italic ***
    .replace(/\*\*([^*]+)\*\*/g, '$1') // strip bold asterisks **
    .replace(/\*([^*]+)\*/g, '$1') // strip italic asterisks *
    .replace(/___([^_]+)___/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .trim();
}

/**
 * Parses inline text and renders emphasized sections / key phrases cleanly
 */
function renderInlineText(rawText: string, isUser: boolean): React.ReactNode {
  // If the line has bold-like leadin or colon (e.g. "**Immediate Action:** ..." or "Dosage: ...")
  const cleanedLine = sanitizeRawMarkdown(rawText);
  const colonMatch = cleanedLine.match(/^([A-Za-z0-9\s/&—–\-]+:)\s*(.*)$/);
  if (colonMatch && colonMatch[1].length < 35 && !cleanedLine.startsWith('http')) {
    const label = colonMatch[1];
    const rest = colonMatch[2];
    return (
      <>
        <span className={isUser ? 'font-bold text-white' : 'font-extrabold text-slate-950'}>
          {label}
        </span>{' '}
        <span className={isUser ? 'text-white/95' : 'text-slate-800'}>{rest}</span>
      </>
    );
  }

  return cleanedLine;
}

/**
 * HumanFormattedMessage renders AI advisory conversations in a natural,
 * human-like format with bold headings, stylized bullets, and clear steps,
 * free of markdown symbols (no **, ##, ###, *, etc.).
 */
export const HumanFormattedMessage: React.FC<HumanFormattedMessageProps> = ({
  content,
  isUser,
}) => {
  if (!content) return null;

  if (isUser) {
    return (
      <div className="text-[15px] sm:text-base leading-relaxed text-white font-medium whitespace-pre-wrap drop-shadow-xs">
        {sanitizeRawMarkdown(content)}
      </div>
    );
  }

  // Split into logical lines
  const rawLines = content.split('\n');
  const blocks: {
    type: 'heading' | 'bullet' | 'numbered' | 'paragraph' | 'divider';
    text: string;
    number?: string;
  }[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    // Check for divider line
    if (/^(\-\-\-|\*\*\*|___)$/.test(line)) {
      continue;
    }

    // Check for Heading / Subheading patterns:
    // 1. Starts with # or ## in raw input
    // 2. Short line (< 50 chars) ending with a colon or capitalized title
    // 3. Known key sections like "Diagnosis:", "Immediate Steps:", "Treatment:", "Prevention:", "Zano reKurima:", "Iseluleko:"
    const isExplicitHeading = /^#{1,4}\s+/.test(rawLines[i]);
    const isSectionTitle =
      !line.startsWith('•') &&
      !line.startsWith('-') &&
      !line.startsWith('*') &&
      !/^\d+[\.\)]\s/.test(line) &&
      line.length < 55 &&
      (line.endsWith(':') ||
        /^(Observation|Diagnosis|Immediate Action|Recommended Treatment|Dosage|Prevention|Vaccination Schedule|Key Recommendations|Zvirwere|Mushonga|Nhomba|Ukugula|Ukwelapha|Summary)/i.test(
          line
        ));

    if (isExplicitHeading || isSectionTitle) {
      blocks.push({
        type: 'heading',
        text: sanitizeRawMarkdown(line.replace(/^#{1,4}\s+/, '')),
      });
      continue;
    }

    // Check for Bullet points (•, -, *, +)
    const bulletMatch = line.match(/^([•\-\*\+])\s+(.*)$/);
    if (bulletMatch) {
      blocks.push({
        type: 'bullet',
        text: bulletMatch[2],
      });
      continue;
    }

    // Check for Numbered items (1., 2), Step 1:)
    const numberedMatch = line.match(/^(\d+)[\.\)]\s+(.*)$/);
    if (numberedMatch) {
      blocks.push({
        type: 'numbered',
        number: numberedMatch[1],
        text: numberedMatch[2],
      });
      continue;
    }

    const stepMatch = line.match(/^(Step\s+\d+:?)\s+(.*)$/i);
    if (stepMatch) {
      blocks.push({
        type: 'numbered',
        number: stepMatch[1].replace(/[^0-9]/g, '') || '•',
        text: stepMatch[2],
      });
      continue;
    }

    // Otherwise standard conversational paragraph
    blocks.push({
      type: 'paragraph',
      text: line,
    });
  }

  return (
    <div className="space-y-2.5 text-[15px] sm:text-base leading-relaxed text-slate-900">
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          return (
            <div
              key={idx}
              className="font-extrabold text-slate-900 text-sm sm:text-[15px] tracking-tight pt-2 pb-0.5 flex items-center gap-2 border-b border-slate-100/80"
            >
              <span className="w-1.5 h-4 bg-emerald-600 rounded-full inline-block shrink-0" />
              <span>{block.text}</span>
            </div>
          );
        }

        if (block.type === 'bullet') {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 mt-2 shrink-0 shadow-xs" />
              <div className="flex-1 text-slate-800 font-medium">
                {renderInlineText(block.text, isUser)}
              </div>
            </div>
          );
        }

        if (block.type === 'numbered') {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-0.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-emerald-300">
                {block.number}
              </span>
              <div className="flex-1 text-slate-800 font-medium">
                {renderInlineText(block.text, isUser)}
              </div>
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-800 font-medium leading-relaxed">
            {renderInlineText(block.text, isUser)}
          </p>
        );
      })}
    </div>
  );
};
