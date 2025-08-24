import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, AlertTriangle, CheckCircle } from "lucide-react";

interface FileUploadStatusProps {
  fileUploadSupported: boolean | null;
  backendMode: 'convex' | 'working';
}

export function FileUploadStatus({ fileUploadSupported, backendMode }: FileUploadStatusProps) {
  if (backendMode === 'working') {
    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Using fallback backend - file uploads not supported. 
          <Badge variant="secondary" className="ml-2">Text Only</Badge>
        </AlertDescription>
      </Alert>
    );
  }

  if (fileUploadSupported === false) {
    return (
      <Alert className="mb-4">
        <Upload className="h-4 w-4" />
        <AlertDescription>
          File uploads unavailable - Convex file storage functions not deployed on this backend.
          <Badge variant="outline" className="ml-2">Text Only</Badge>
        </AlertDescription>
      </Alert>
    );
  }

  if (fileUploadSupported === true) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          File uploads enabled via Convex native storage.
          <Badge variant="default" className="ml-2 bg-green-100 text-green-800">Files Supported</Badge>
        </AlertDescription>
      </Alert>
    );
  }

  // fileUploadSupported === null (not tested yet)
  return null;
}