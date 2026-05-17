import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-custom py-40 text-center">
      <h1 className="text-8xl font-display font-bold text-gray-100 dark:text-gray-800 mb-4">
        404
      </h1>
      <h2 className="text-2xl font-medium mb-4">Page Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn-primary inline-block">
        Go Home
      </Link>
    </div>
  );
}
