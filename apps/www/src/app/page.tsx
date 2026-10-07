import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="font-heading font-semibold text-xl">MsgSync</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/dashboard" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Dashboard</Link>
              <Link href="/campaigns" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Campaigns</Link>
              <Link href="/analytics" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Analytics</Link>
              <Link href="/contacts" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Contacts</Link>
              <Link href="/billing" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Billing</Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Sign In</Link>
              <Link 
                href="/login" 
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand/5 to-transparent py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading font-medium tracking-tight text-5xl md:text-7xl mb-6">
            Power Your Messaging
            <br />
            <span className="text-brand">Enterprise Solutions</span>
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto mb-8">
            Complete SMS, voice, and WhatsApp marketing platform with real-time analytics,
            A2P messaging compliance, and carrier-grade reliability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard" 
              className="rounded-lg bg-brand px-8 py-4 text-base font-medium text-white hover:bg-brand/90 transition-colors"
            >
              View Dashboard
            </Link>
            <Link 
              href="/campaigns" 
              className="rounded-lg border border-border bg-background px-8 py-4 text-base font-medium text-foreground hover:bg-accent transition-colors"
            >
              Explore Campaigns
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-medium tracking-tight text-3xl md:text-4xl text-center mb-12">
            Everything You Need to Scale
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Cards */}
            <div className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-brand/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h8a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Multi-Protocol</h3>
              <p className="text-sm text-foreground/70">SMPP, SS7, HTTP/HTTPS support for maximum flexibility</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-brand/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0v-6a2 2 0 002-2h2a2 2 0 002-2V9a2 2 0 00-2-2h-2a2 2 0 00-2 2v10z" />
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Analytics</h3>
              <p className="text-sm text-foreground/70">Real-time dashboards with conversion tracking</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-brand/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a2 2 0 00-2-2H6a2 2 0 00-2 2v4h12z" />
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Campaigns</h3>
              <p className="text-sm text-foreground/70">Advanced scheduling and targeting</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-brand/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.318l-7.07-7.07a2 2 0 10-2.828l2.828 2.828a2 2 0 112.829-2.829l7.07 7.07a2 2 0 10-2.828l-2.829-2.828z" />
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Security</h3>
              <p className="text-sm text-foreground/70">Carrier-grade security and anti-fraud</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading font-medium tracking-tight text-3xl md:text-4xl mb-4">
            Ready to Start Messaging?
          </h2>
          <p className="text-lg text-foreground/70 mb-8">
            Join thousands of businesses using MsgSync for their communication needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className="rounded-lg bg-brand px-8 py-4 text-base font-medium text-white hover:bg-brand/90 transition-colors"
            >
              Sign In to Dashboard
            </Link>
            <Link 
              href="#" 
              className="rounded-lg border border-brand bg-background px-8 py-4 text-base font-medium text-brand hover:bg-brand/5 transition-colors"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <span className="font-heading font-semibold text-xl">MsgSync</span>
              </div>
              <p className="text-sm text-foreground/70">
                Enterprise messaging platform for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-foreground/70 hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground">Security</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-foreground/70 hover:text-foreground">About</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground">Careers</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground">Contact</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-foreground/70 hover:text-foreground">Documentation</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground">API Reference</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground">SDKs</Link></li>
                <li><Link href="#" className="text-foreground/70 hover:text-foreground">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 text-center">
            <p className="text-sm text-foreground/60">
              © 2025 MsgSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}