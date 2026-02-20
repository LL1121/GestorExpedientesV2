import { Bell, AlertCircle } from "lucide-react";

interface NotificationBellIconProps {
  count: number;
  className?: string;
}

export default function NotificationBellIcon({ count, className = "h-5 w-5" }: NotificationBellIconProps) {
  if (count === 0) {
    // Campana normal cuando no hay notificaciones
    return <Bell className={className} />;
  }

  // Cuando hay notificaciones, mostrar icono de alerta con número
  return (
    <div className="relative inline-flex">
      <AlertCircle className={className + " text-red-500"} />
      <span className="absolute -top-2 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold leading-none">
        {count > 9 ? "9" : count}
      </span>
    </div>
  );
}
