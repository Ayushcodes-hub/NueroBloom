import React, { useState } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';

interface ResourceItem {
  org: string;
  category: string;
  title: string;
  description: string;
  takeaways: string[];
  url: string;
}

const RESOURCES: ResourceItem[] = [
  {
    org: 'CDC',
    category: 'Child Development',
    title: 'CDC — Developmental Milestones & Act Early',
    description:
      'Evidence-based milestone checklists, free family tools, and practical guidance on celebrating everyday progress.',
    takeaways: [
      'Age-by-age play, communication, and movement checklists',
      'Guidance on partnering smoothly with pediatricians and teachers',
    ],
    url: 'https://www.cdc.gov/ncbddd/actearly/',
  },
  {
    org: 'NICHD',
    category: 'Research & Learning',
    title: 'NICHD — Learning & Developmental Differences',
    description:
      'National Institute of Child Health and Human Development guides explaining dyslexia, speech support, and learning styles.',
    takeaways: [
      'Plain-language overviews of reading, speech, and processing support',
      'Family-oriented intervention and school accommodation tips',
    ],
    url: 'https://www.nichd.nih.gov/health/topics/learning',
  },
  {
    org: 'Understood.org',
    category: 'Home & School Strategies',
    title: 'Understood.org — Practical Support for ADHD & Dyslexia',
    description:
      'Parent-friendly articles, assistive technology ideas, and classroom collaboration guides for learning and thinking differences.',
    takeaways: [
      'Step-by-step homework calm routines and visual schedules',
      'How to advocate for individualized accommodations at school',
    ],
    url: 'https://www.understood.org/',
  },
  {
    org: 'CHADD',
    category: 'Attention & Focus',
    title: 'CHADD — Attention & Executive Function Support',
    description:
      'Children and Adults with Attention-Deficit/Hyperactivity Disorder resource center with parent training and daily structure tips.',
    takeaways: [
      'Positive reinforcement habits for building focus without pressure',
      'Parent support networks and educator fact sheets',
    ],
    url: 'https://chadd.org/',
  },
  {
    org: 'Autism Speaks',
    category: 'Autism Family Toolkits',
    title: 'Autism Speaks — Sensory & Communication Toolkits',
    description:
      'Downloadable family toolkits covering visual supports, sensory-friendly environments, and communication strategies.',
    takeaways: [
      'Creating calm sensory corners at home and in classrooms',
      'Supporting transitions and predictable daily visual routines',
    ],
    url: 'https://www.autismspeaks.org/tool-kit',
  },
];

export const ResourcesPage: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const categories = ['All', ...Array.from(new Set(RESOURCES.map((r) => r.category)))];
  const visible = filter === 'All' ? RESOURCES : RESOURCES.filter((r) => r.category === filter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-[var(--nb-border)] pb-6">
        <p className="text-xs font-semibold text-[#047857]">
          External Educational Library · Clearly Separate from NeuroBloom Gameplay Data
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-[var(--nb-text)]">
          Trusted Resource Portal
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--nb-text-muted)]">
          Curated external references from established pediatric and educational organizations to help families and special educators explore supportive practices.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold min-h-[38px] ${
              filter === cat
                ? 'bg-[var(--nb-text)] text-white'
                : 'border border-[var(--nb-border)] bg-[var(--nb-surface)] text-[var(--nb-text-muted)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {visible.map((res) => (
          <article
            key={res.org}
            className="flex flex-col justify-between rounded-2xl border border-[var(--nb-border)] bg-[var(--nb-surface)] p-6"
          >
            <div>
              <div className="flex items-center gap-2 text-xs text-[var(--nb-text-muted)]">
                <span className="font-bold text-[var(--nb-primary)]">{res.org}</span>
                <span aria-hidden="true">·</span>
                <span>{res.category}</span>
                <span aria-hidden="true">·</span>
                <span>External Reference</span>
              </div>
              <h2 className="mt-2 font-display text-xl font-bold text-[var(--nb-text)]">
                {res.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--nb-text-muted)]">
                {res.description}
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-[var(--nb-text)]">
                {res.takeaways.map((pt) => (
                  <li key={pt} className="flex items-start gap-2">
                    <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#047857]" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 border-t border-[var(--nb-border)] pt-4">
              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--nb-primary)] hover:underline"
              >
                <span>Visit {res.org} Resource</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
