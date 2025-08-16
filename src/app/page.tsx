import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, FileText, Users } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Droplets className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">CollabDrop</span>
          </Link>
          <div className="space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-32">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight">
            CollabDrop: The Serendipity Engine
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Discover documents, connect with brilliant minds, and let serendipity spark your next big idea. Share your work and explore a universe of knowledge.
          </p>
          <div className="mt-10">
            <Button size="lg" asChild>
              <Link href="/signup">Start Collaborating Now</Link>
            </Button>
          </div>
        </section>

        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-foreground">Features</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-secondary rounded-full">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">Persona Prism</h3>
                  <p className="mt-2 text-muted-foreground">
                    Craft your unique digital identity and connect with others based on shared interests and expertise.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-secondary rounded-full">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">Document Alchemist</h3>
                  <p className="mt-2 text-muted-foreground">
                    Seamlessly upload and share your documents. Your knowledge deserves to be discovered.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-secondary rounded-full">
                      <Droplets className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">Discovery Dynamo</h3>
                  <p className="mt-2 text-muted-foreground">
                    Unleash the power of search to find relevant documents and inspiring collaborators.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CollabDrop. All rights reserved.</p>
      </footer>
    </div>
  );
}
