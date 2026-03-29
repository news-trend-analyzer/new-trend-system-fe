import { Link } from 'react-router-dom';
import LegalDocumentView from '@/components/legal/LegalDocumentView';
import { getLegalMarkdown } from '@/content/legal/registry';

interface LegalMarkdownPageProps {
  slug: string;
  documentLabel: string;
}

export default function LegalMarkdownPage({ slug, documentLabel }: LegalMarkdownPageProps) {
  const markdown = getLegalMarkdown(slug);

  if (!markdown) {
    return (
      <div className="flex-1">
        <main className="max-w-3xl mx-auto px-4 py-16">
          <p className="text-slate-600 mb-6">
            {documentLabel} 문서를 불러올 수 없습니다.{' '}
            <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded">src/content/legal/{slug}.md</code> 파일을 확인해 주세요.
          </p>
          <Link to="/" className="text-teal-600 hover:text-teal-700 font-medium">
            홈으로
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50/80">
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium mb-8"
        >
          <i className="ri-arrow-left-line text-lg"></i>
          홈으로
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 p-6 md:p-10">
          <LegalDocumentView markdown={markdown} />
        </div>
      </main>
    </div>
  );
}
