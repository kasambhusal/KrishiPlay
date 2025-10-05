"use client"

export default function NotificationToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-4 right-4 bg-card border-2 border-primary text-card-foreground px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-right z-50">
      <p className="font-medium">{message}</p>
    </div>
  )
}
