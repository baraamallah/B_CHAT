import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, UploadCloud } from 'lucide-react';
import Image from 'next/image';

function DocumentUploadCard() {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Document Alchemist</CardTitle>
        <CardDescription>Share your brilliance! Upload docs in PDF, DOCX, or TXT (max 50MB).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT (MAX. 50MB)</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" />
            </label>
        </div> 
      </CardContent>
    </Card>
  )
}

function WelcomeCard() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Welcome to CollabDrop!</CardTitle>
        <CardDescription>Start by uploading your first document or discover what others are sharing.</CardDescription>
      </CardHeader>
      <CardContent>
        <Image src="https://placehold.co/600x400.png" width={600} height={400} alt="Collaboration" className="rounded-md" data-ai-hint="collaboration abstract"/>
      </CardContent>
    </Card>
  )
}

function RecentDocumentItem() {
    return (
        <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50">
            <div className="bg-secondary p-3 rounded-md">
                <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="grid gap-1 text-sm">
                <div className="font-medium">Quantum_Computing_Principles.pdf</div>
                <div className="text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4"/>
                    <span>Ada Lovelace</span>
                </div>
            </div>
        </div>
    )
}

function RecentDropsCard() {
    return (
        <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle>Recent Drops</CardTitle>
                <CardDescription>See what&apos;s new on the platform.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <RecentDocumentItem/>
                <RecentDocumentItem/>
                <RecentDocumentItem/>
                <RecentDocumentItem/>
            </CardContent>
        </Card>
    )
}

export default function DashboardPage() {
  return (
    <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-3">
        <DocumentUploadCard />
        <WelcomeCard />
        <RecentDropsCard />
    </div>
  );
}
