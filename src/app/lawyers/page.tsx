import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Users } from "lucide-react";

const lawyers = [
  {
    name: "Ananya Sharma",
    specialty: "Criminal Law",
    experience: "12 years",
    avatar: "AS",
    image: "https://placehold.co/100x100.png",
    hint: "woman lawyer",
  },
  {
    name: "Rohan Verma",
    specialty: "Corporate Law",
    experience: "8 years",
    avatar: "RV",
    image: "https://placehold.co/100x100.png",
    hint: "man lawyer",
  },
  {
    name: "Priya Singh",
    specialty: "Family Law",
    experience: "15 years",
    avatar: "PS",
    image: "https://placehold.co/100x100.png",
    hint: "woman professional",
  },
  {
    name: "Vikram Reddy",
    specialty: "Cyber Law",
    experience: "7 years",
    avatar: "VR",
    image: "https://placehold.co/100x100.png",
    hint: "man professional",
  },
];

export default function LawyersPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center">
        <Users className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold mt-4 font-headline">Connect with a Lawyer</h1>
        <p className="mt-2 text-muted-foreground">
          Find experienced legal professionals for personalized consultation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {lawyers.map((lawyer) => (
          <Card key={lawyer.name} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
               <Avatar className="h-16 w-16">
                <AvatarImage src={lawyer.image} alt={lawyer.name} data-ai-hint={lawyer.hint} />
                <AvatarFallback>{lawyer.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{lawyer.name}</CardTitle>
                <CardDescription>{lawyer.specialty}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                With {lawyer.experience} of experience, {lawyer.name.split(' ')[0]} is a trusted expert in {lawyer.specialty.toLowerCase()}.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Mail className="mr-2 h-4 w-4" /> Email
                </Button>
                <Button size="sm">
                  <Phone className="mr-2 h-4 w-4" /> Call Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
