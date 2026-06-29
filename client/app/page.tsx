'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, MessageSquare, Users, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">SlackClone</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
              Where work happens
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect your team, collaborate seamlessly, and get work done faster. A minimalist Slack clone built for modern teams.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Powerful Features</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="Instant Messaging"
              description="Send messages in real-time across channels and direct messages"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Team Collaboration"
              description="Organize conversations with channels and keep teams aligned"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Fast & Reliable"
              description="Lightning-fast performance with a clean, minimalist interface"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-primary text-primary-foreground rounded-lg p-12 sm:p-16 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to get started?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Join thousands of teams using SlackClone to collaborate better.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Create Your Workspace <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              <span className="font-semibold">SlackClone</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with React, Next.js, and TanStack Query
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-8 rounded-lg border border-border/40 bg-card hover:border-border/80 transition-colors">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
