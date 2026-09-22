import { Link } from 'next-view-transitions';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Network, FileText, ArrowRight } from 'lucide-react';

export default function Home() {
  const pipelineSteps = [
    { step: '01', title: 'Evidence Ingestion', desc: 'CSV, EML, JSON, TXT & Logs' },
    { step: '02', title: 'SHA-256 Custody', desc: 'Cryptographic Integrity' },
    { step: '03', title: 'Normalization', desc: 'Standardized Identifiers' },
    { step: '04', title: 'Correlation Engine', desc: 'Multi-Hop Graph Linking' },
    { step: '05', title: 'Explainable Risk', desc: 'Evidence-Backed Scoring' },
    { step: '06', title: 'AI & Legal Dossier', desc: 'Grounded Forensic Reports' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Forensic-Grade Digital Investigation Platform
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
          Evidence First.<br />
          Intelligence Second.
        </h1>
        
        <p className="text-lg text-muted-foreground leading-relaxed">
          Ingest fragmented digital evidence, preserve its integrity, extract structured information, correlate entities, calculate explainable risk, and generate forensic-grade investigation reports.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Button size="lg" asChild>
            <Link href="/cases">
              Open Investigation Console
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="https://github.com/rohit/cybertrace" target="_blank">
              Documentation
            </Link>
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-24">
        <div className="p-6 rounded-xl border bg-card text-card-foreground">
          <ShieldAlert className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Cryptographic Custody</h3>
          <p className="text-sm text-muted-foreground">
            Original evidence is never modified. SHA-256 validation guarantees file integrity throughout the entire parsing pipeline.
          </p>
        </div>
        <div className="p-6 rounded-xl border bg-card text-card-foreground">
          <Network className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Deterministic Correlation</h3>
          <p className="text-sm text-muted-foreground">
            Connect multi-hop mule networks using hard evidence rules, extracting IPDR, CDR, and Bank statements automatically.
          </p>
        </div>
        <div className="p-6 rounded-xl border bg-card text-card-foreground">
          <FileText className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Grounded AI Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Our Intelligence layer operates strictly downstream of structured data. AI cannot hallucinate facts or forge relationships.
          </p>
        </div>
      </section>

      {/* Pipeline */}
      <section className="w-full max-w-5xl mt-24 border-t pt-16 text-center">
        <h2 className="text-2xl font-bold mb-10">Data Processing Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {pipelineSteps.map((step, idx) => (
            <div key={step.step} className="flex flex-col items-center relative">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground mb-4 relative z-10 border">
                {step.step}
              </div>
              <h4 className="text-sm font-semibold mb-1">{step.title}</h4>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
              
              {/* Connector line */}
              {idx < pipelineSteps.length - 1 && (
                <div className="hidden md:block absolute top-5 left-[50%] w-full h-[1px] bg-border -z-0" />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
