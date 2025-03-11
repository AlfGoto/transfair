import Link from "next/link";
import { FileX2, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="w-full flex items-center justify-center p-4">
      <Card className="mx-auto max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <FileX2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Download Link Not Found</CardTitle>
          <CardDescription className="mt-2 text-base">
            {
              "The download link you're looking for doesn't exist or has expired."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>
            {
              "Please check the URL return to our homepage."
            }
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button asChild size="lg">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Homepage
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
