
import { Suspense } from 'react';
import MessagesClientPage from './MessagesClientPage';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import Header from '@/components/layout/Header';

function MessagesLoading() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-theme(spacing.24))]">
            <div className="md:col-span-1 lg:col-span-1 hidden md:block">
               <Card className="h-full" />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
               <Card className="h-full flex flex-col items-center justify-center">
                    <CardContent>
                        <div className="text-center text-muted-foreground">
                            <MessageSquare size={48} className="mx-auto mb-4" />
                            <h2 className="text-xl font-semibold">Loading Conversations...</h2>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function MessagesPageContent() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Suspense fallback={<MessagesLoading />}>
                <MessagesClientPage />
            </Suspense>
        </div>
    )
}


export default function MessagesPage() {
  return (
    <div className="flex flex-col min-h-screen">
        <Header/>
        <main className="flex-1">
            <MessagesPageContent />
        </main>
    </div>
  );
}
