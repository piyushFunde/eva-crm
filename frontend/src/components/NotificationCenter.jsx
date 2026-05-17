import { X, Bell, Trash2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useNotificationStore from '@/store/notificationStore';
import { formatTime } from '@/utils/formatters';

export default function NotificationCenter({ isOpen, onClose }) {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                <p className="text-xs text-muted">Stay updated with live operations</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={clearAll}
                  className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">Real-time alerts will appear here</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      n.read ? 'bg-white border-gray-100 opacity-70' : 'bg-primary-light/30 border-primary/10 shadow-sm'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        n.type === 'success' ? 'bg-success-light text-success' : 
                        n.type === 'warning' ? 'bg-warning-light text-warning' : 'bg-primary-light text-primary'
                      }`}>
                        {n.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 
                         n.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted">
                          <Clock className="w-3 h-3" />
                          {formatTime(n.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-border bg-gray-50">
                <button 
                  onClick={markAllAsRead}
                  className="w-full py-2.5 text-xs font-bold text-primary hover:bg-primary-light rounded-lg transition-all"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
