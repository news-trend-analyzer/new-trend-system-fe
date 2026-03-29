import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LegalDocumentViewProps {
  markdown: string;
}

export default function LegalDocumentView({ markdown }: LegalDocumentViewProps) {
  return (
    <article className="text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-6">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 pb-2 border-b border-slate-200 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-slate-900 mt-8 mb-3">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-4 leading-relaxed text-slate-700">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-slate-700">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 underline underline-offset-2 hover:text-teal-700"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
          hr: () => <hr className="my-10 border-slate-200" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-slate-300 pl-4 my-4 text-slate-600">{children}</blockquote>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[0.9em]">{children}</code>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
