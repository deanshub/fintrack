export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">You are offline</h1>
      <p className="text-muted-foreground text-center">
        It looks like you lost your internet connection. Please check your network and try again.
      </p>
    </div>
  );
}
