import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function SummarizePage() {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="items-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <CardTitle className="mt-4">Feature Not Available</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>This feature has been removed to focus on the live video consultation experience.</p>
        </CardContent>
      </Card>
    </div>
  );
}
