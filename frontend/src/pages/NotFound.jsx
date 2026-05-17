import { useNavigate } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="w-20 h-20 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-2">404</h1>
        <p className="text-lg font-semibold text-gray-700 mb-1">Page Not Found</p>
        <p className="text-sm text-muted mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => navigate('/dashboard')} className="mx-auto" id="go-dashboard-btn">
          <Home className="w-4 h-4" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
