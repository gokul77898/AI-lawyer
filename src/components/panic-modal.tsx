import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Phone, Shield, ExternalLink } from "lucide-react";
import type { DialogProps } from "@radix-ui/react-dialog";
import { Button } from "./ui/button";

export function PanicModal(props: DialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-destructive">
            <Shield className="h-8 w-8" />
            Panic Mode
          </DialogTitle>
          <DialogDescription className="pt-2 text-left">
            If you are in immediate danger, please contact the authorities. Here are some quick resources for assistance in India.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">National Emergency Number</p>
                <p className="text-muted-foreground text-sm">Police, Fire, Ambulance</p>
              </div>
            </div>
            <p className="text-xl font-bold">112</p>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Women Helpline</p>
                <p className="text-muted-foreground text-sm">For women in distress</p>
              </div>
            </div>
            <p className="text-xl font-bold">1091</p>
          </div>
           <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Cyber Crime Helpline</p>
                <p className="text-muted-foreground text-sm">Report online crimes</p>
              </div>
            </div>
            <p className="text-xl font-bold">1930</p>
          </div>
        </div>
        <DialogFooter>
          <Button asChild className="w-full">
            <a href="https://www.nalsa.gov.in/lsams/nlsas/new-application" target="_blank" rel="noopener noreferrer">
              Find Free Legal Aid <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
