import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageCircle, Edit, FileText } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ProfileHeader() {
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-background ring-2 ring-primary">
            <AvatarImage src="https://placehold.co/200x200.png" data-ai-hint="person portrait"/>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">Jane Doe</h1>
            <p className="text-muted-foreground">Quantum Researcher & Tech Ethicist</p>
          </div>
          <div className="flex gap-2">
            <Button><MessageCircle className="mr-2 h-4 w-4"/>Send Message</Button>
            <Button variant="outline"><Edit className="mr-2 h-4 w-4"/>Edit Profile</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentGrid() {
    const documents = [
        { title: "Project Phoenix Brief", image: "https://placehold.co/400x300.png", hint: "document presentation" },
        { title: "Market Analysis Q3", image: "https://placehold.co/400x300.png", hint: "charts graphs" },
        { title: "Ethical AI Framework", image: "https://placehold.co/400x300.png", hint: "technology code" },
        { title: "Quantum Entanglement... ", image: "https://placehold.co/400x300.png", hint: "science abstract" },
    ];
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {documents.map(doc => (
            <Card key={doc.title} className="overflow-hidden">
                <Image src={doc.image} data-ai-hint={doc.hint} alt={doc.title} width={400} height={300} className="w-full h-40 object-cover" />
                <CardHeader>
                    <CardTitle className="text-base truncate">{doc.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button variant="secondary" className="w-full">
                        <FileText className="mr-2 h-4 w-4"/> View Document
                    </Button>
                </CardContent>
            </Card>
            ))}
        </div>
    )
}

function AboutTab() {
    const categories = ["Quantum Computing", "AI Ethics", "Decentralized Systems", "UX Research"];
    const hashtags = ["#innovation", "#deeptech", "#HCI", "#philosophy", "#sustainability"];

    return (
        <Card>
            <CardContent className="p-6 grid gap-6">
                <div>
                    <h3 className="font-semibold mb-2">About Me</h3>
                    <p className="text-muted-foreground">
                        I am a passionate researcher exploring the intersections of deep technology and human-computer interaction. My goal is to build ethical, human-centric systems that solve meaningful problems. I believe in the power of serendipitous collaboration to spark groundbreaking ideas.
                    </p>
                </div>
                 <div>
                    <h3 className="font-semibold mb-3">Preferred Categories</h3>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold mb-3">Hashtags</h3>
                    <div className="flex flex-wrap gap-2">
                        {hashtags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <ProfileHeader />
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents (12)</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        <TabsContent value="documents" className="mt-6">
            <DocumentGrid />
        </TabsContent>
        <TabsContent value="about" className="mt-6">
            <AboutTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
